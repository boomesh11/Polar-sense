/*
 * main_host.c — PC Host runner for PolarSense mission FSM with simulated sensor inputs.
 */
#include <stdio.h>
#include "../src/mission_fsm.h"
#include "../src/hal_stubs.h"

int main(void) {
    printf("============================================================\n");
    printf("PolarSense Flight Controller — Host PC Simulation\n");
    printf("TRL 4 — Simulated sensor inputs (No physical hardware)\n");
    printf("============================================================\n\n");

    fsm_ctx_t ctx;
    fsm_init(&ctx);

    /* Scenario 1: Nominal Open Water Ascent (Clear) */
    printf("--- SCENARIO 1: Nominal Open Water ---\n");
    sonar_reading_t sonar_clear = { .valid = true, .range_m = 75.0f };
    ctd_reading_t ctd_nominal   = { .pressure_dbar = 450.0f, .temperature_c = 2.1f, .salinity_psu = 34.2f };
    float sst_clear = 2.4f;

    for (int i = 0; i < 7; i++) {
        fsm_step(&ctx, sonar_clear, ctd_nominal, sst_clear);
    }

    /* Scenario 2: Ice Detected Under Ice Shelf (Blocked / Sonar Ambiguous) */
    printf("\n--- SCENARIO 2: Ice Proximity Detected ---\n");
    sonar_reading_t sonar_ice = { .valid = true, .range_m = 3.5f };
    float sst_freezing = -2.1f;

    for (int i = 0; i < 4; i++) {
        fsm_step(&ctx, sonar_ice, ctd_nominal, sst_freezing);
    }

    /* Scenario 3: Unclear Sonar Echo (Counts as UNKNOWN -> Abort) */
    printf("\n--- SCENARIO 3: Sonar Echo Loss / Unclear (Counts as UNKNOWN) ---\n");
    sonar_reading_t sonar_unclear = { .valid = false, .range_m = 0.0f };
    for (int i = 0; i < 4; i++) {
        fsm_step(&ctx, sonar_unclear, ctd_nominal, 0.5f);
    }

    printf("\nSimulation finished cleanly.\n");
    return 0;
}
