/*
 * mission_fsm.h — PolarSense seven-state mission state machine
 * STM32L4 / host-build compatible
 * Team AQUA LEAGUE · SIH 2026 · PS 26065
 *
 * TRL 4 — host build and bench simulation only. Not pressure- or cold-qualified.
 */
#ifndef MISSION_FSM_H
#define MISSION_FSM_H

#include <stdint.h>
#include <stdbool.h>

/* ── Mission states (Seven-State Machine) ────────────────────────────── */
typedef enum {
    STATE_BOOT       = 0,
    STATE_DESCENT    = 1,
    STATE_PARK       = 2,
    STATE_ICE_CHECK  = 3,
    STATE_ASCENT     = 4,
    STATE_SURFACE    = 5,
    STATE_TRANSMIT   = 6,
    STATE_COUNT
} mission_state_t;

/* ── Ice decision outcomes ──────────────────────────────────────────── */
typedef enum {
    ICE_CLEAR    = 0,   /* BOTH sonar and temperature test say clear -> surface */
    ICE_UNKNOWN  = 1,   /* No echo or unclear echo -> UNKNOWN -> float turns back */
    ICE_BLOCKED  = 2    /* Echo detects ice (<5 m) -> abort */
} ice_decision_t;

/* ── Sensor reading structs ─────────────────────────────────────────── */
typedef struct {
    bool   valid;           /* true if echo received and valid */
    float  range_m;         /* range to reflector in metres (0.05-60 m) */
} sonar_reading_t;

typedef struct {
    float  pressure_dbar;   /* hydrostatic pressure (dbar) */
    float  temperature_c;   /* seawater temperature (°C) */
    float  salinity_psu;    /* practical salinity (PSU) */
} ctd_reading_t;

/* ── FSM Context ────────────────────────────────────────────────────── */
typedef struct {
    mission_state_t state;
    uint32_t        mission_cycle;
    uint32_t        ice_abort_count;      /* consecutive abort counter */
    uint32_t        backoff_days_remain;  /* 30-day backoff counter */
    bool            profile_stored;       /* flag: profile retained in NOR flash */
    uint32_t        tick_count;
} fsm_ctx_t;

/* ── Public API ─────────────────────────────────────────────────────── */

/**
 * ice_check() — evaluate ice status.
 * Requirement: Surface only when BOTH the sonar and the temperature test say clear;
 * no echo, or an unclear echo, counts as UNKNOWN and float turns back.
 */
ice_decision_t ice_check(sonar_reading_t sonar, float sst_c);

/** Initialize FSM context */
void fsm_init(fsm_ctx_t *ctx);

/** Advance FSM by one tick */
mission_state_t fsm_step(fsm_ctx_t *ctx,
                         sonar_reading_t sonar,
                         ctd_reading_t ctd,
                         float sst_c);

/** State name string */
const char *fsm_state_name(mission_state_t state);

#endif /* MISSION_FSM_H */
