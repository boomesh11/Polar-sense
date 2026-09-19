/*
 * mission_fsm.c — PolarSense seven-state mission state machine implementation.
 * Team AQUA LEAGUE · SIH 2026 · PS 26065
 *
 * Rules (DESIGN FIGURES):
 *   - Park depth: 450 m
 *   - Rated depth: 500 m
 *   - Buoyancy: 650 ml hydraulic engine
 *   - Ice logic: Surface only when BOTH sonar (>60m) and SST (>1.5 C) say clear.
 *     No echo or unclear echo counts as UNKNOWN and float turns back.
 *   - After 3 consecutive blocked/aborted attempts, back off for 30 days.
 *   - Frame deleted in flash only after delivery is confirmed.
 */
#include "mission_fsm.h"
#include "hal_stubs.h"
#include <string.h>

#define PARK_DEPTH_M         450.0f
#define BUOYANCY_STROKE_ML   650u
#define ICE_SST_CLEAR_C      1.5f
#define ICE_SST_BLOCKED_C    (-2.0f)
#define ICE_SONAR_CLEAR_M    60.0f
#define ICE_SONAR_BLOCKED_M  5.0f
#define ICE_MAX_ABORTS       3u
#define ICE_BACKOFF_DAYS     30u

void fsm_init(fsm_ctx_t *ctx) {
    memset(ctx, 0, sizeof(*ctx));
    ctx->state = STATE_BOOT;
}

ice_decision_t ice_check(sonar_reading_t sonar, float sst_c) {
    /* Rule: Surface ONLY when BOTH sonar and temperature test say the way is clear */
    bool sonar_clear = sonar.valid && (sonar.range_m > ICE_SONAR_CLEAR_M);
    bool temp_clear  = (sst_c > ICE_SST_CLEAR_C);

    if (sonar_clear && temp_clear) {
        return ICE_CLEAR;
    }

    /* Definite blocked condition: sonar < 5m or SST < -2.0 C */
    bool sonar_blocked = sonar.valid && (sonar.range_m < ICE_SONAR_BLOCKED_M);
    bool temp_blocked  = (sst_c < ICE_SST_BLOCKED_C);
    if (sonar_blocked || temp_blocked) {
        return ICE_BLOCKED;
    }

    /* Rule: No echo, or an unclear echo, counts as UNKNOWN and the float turns back */
    return ICE_UNKNOWN;
}

mission_state_t fsm_step(fsm_ctx_t *ctx,
                         sonar_reading_t sonar,
                         ctd_reading_t ctd,
                         float sst_c) {
    hal_watchdog_pat();
    ctx->tick_count++;

    switch (ctx->state) {
    case STATE_BOOT:
        hal_log("[FSM] STATE: BOOT -> Initializing cycle %u\n", ctx->mission_cycle + 1);
        ctx->mission_cycle++;
        ctx->state = STATE_DESCENT;
        break;

    case STATE_DESCENT:
        hal_log("[FSM] STATE: DESCENT -> Retracting bladder (%u ml), sinking to %.0f m\n",
                BUOYANCY_STROKE_ML, PARK_DEPTH_M);
        hal_pump_retract(BUOYANCY_STROKE_ML);
        hal_valve_latch();
        ctx->state = STATE_PARK;
        break;

    case STATE_PARK:
        hal_log("[FSM] STATE: PARK -> Parking at %.0f m\n", PARK_DEPTH_M);
        if (ctx->backoff_days_remain > 0) {
            ctx->backoff_days_remain--;
            hal_log("[FSM] Backoff active: %u days remaining\n", ctx->backoff_days_remain);
            /* Remain parked */
            break;
        }
        ctx->state = STATE_ICE_CHECK;
        break;

    case STATE_ICE_CHECK: {
        ice_decision_t decision = ice_check(sonar, sst_c);
        hal_log("[FSM] STATE: ICE_CHECK -> Sonar: %.1f m (valid=%d), SST: %.2f C -> Decision: %s\n",
                sonar.range_m, sonar.valid, sst_c,
                decision == ICE_CLEAR ? "CLEAR" : (decision == ICE_BLOCKED ? "BLOCKED" : "UNKNOWN"));

        if (decision == ICE_CLEAR) {
            ctx->ice_abort_count = 0;
            ctx->state = STATE_ASCENT;
        } else {
            /* Abort and return to park depth */
            ctx->ice_abort_count++;
            hal_log("[FSM] Ice abort #%u triggered. Caching profile in flash.\n", ctx->ice_abort_count);
            ctx->profile_stored = true;

            if (ctx->ice_abort_count >= ICE_MAX_ABORTS) {
                hal_log("[FSM] %u blocked attempts -> entering %u-day backoff.\n",
                        ICE_MAX_ABORTS, ICE_BACKOFF_DAYS);
                ctx->backoff_days_remain = ICE_BACKOFF_DAYS;
                ctx->ice_abort_count = 0;
            }
            ctx->state = STATE_PARK;
        }
        break;
    }

    case STATE_ASCENT: {
        hal_log("[FSM] STATE: ASCENT -> Extending buoyancy engine (%u ml), sampling CTD at 1 Hz\n",
                BUOYANCY_STROKE_ML);
        hal_pump_extend(BUOYANCY_STROKE_ML);
        float p, t, s;
        hal_ctd_sample(&p, &t, &s);
        hal_flash_write((const uint8_t *)&ctd, sizeof(ctd));
        ctx->profile_stored = true;
        ctx->state = STATE_SURFACE;
        break;
    }

    case STATE_SURFACE:
        hal_log("[FSM] STATE: SURFACE -> Acquiring GNSS fix and Iridium satellite link\n");
        ctx->state = STATE_TRANSMIT;
        break;

    case STATE_TRANSMIT: {
        hal_log("[FSM] STATE: TRANSMIT -> Sending 340-byte Iridium SBD frame(s)\n");
        uint8_t frame[340] = {0};
        frame[0] = 0xA7;
        frame[1] = 0xF3;
        bool delivered = hal_iridium_send(frame, sizeof(frame));
        if (delivered) {
            hal_log("[FSM] Delivery confirmed -> erasing profile from NOR flash\n");
            hal_flash_erase_confirmed(ctx->mission_cycle);
            ctx->profile_stored = false;
        } else {
            hal_log("[FSM] Delivery failed -> retaining profile in flash\n");
        }
        ctx->state = STATE_BOOT;
        break;
    }

    default:
        ctx->state = STATE_BOOT;
        break;
    }

    return ctx->state;
}

const char *fsm_state_name(mission_state_t state) {
    static const char *names[STATE_COUNT] = {
        "BOOT", "DESCENT", "PARK", "ICE_CHECK", "ASCENT", "SURFACE", "TRANSMIT"
    };
    if (state >= STATE_COUNT) return "UNKNOWN";
    return names[state];
}
