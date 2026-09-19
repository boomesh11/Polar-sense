/*
 * test_ice_logic.c — Unit tests for PolarSense ice decision engine and retry/backoff rules.
 *
 * Rules:
 *   1. Surface only when BOTH sonar (>60m) and temperature (>1.5 C) say clear.
 *   2. Any unknown / unclear echo -> counts as UNKNOWN -> abort.
 *   3. 3 blocked/aborted attempts -> 30 days backoff.
 */
#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include "../src/mission_fsm.h"
#include "../src/hal_stubs.h"

static int tests_run = 0;
static int tests_passed = 0;

#define TEST_ASSERT(expr, msg) do { \
    tests_run++; \
    if (expr) { \
        tests_passed++; \
        printf("  [PASS] %s\n", msg); \
    } else { \
        printf("  [FAIL] %s (Line %d)\n", msg, __LINE__); \
    } \
} while (0)

void test_ice_decision_rules(void) {
    printf("1. Testing Ice Decision Logic:\n");

    /* Rule 1: BOTH clear -> CLEAR */
    sonar_reading_t sonar_clear = { .valid = true, .range_m = 70.0f };
    float sst_clear = 2.0f;
    TEST_ASSERT(ice_check(sonar_clear, sst_clear) == ICE_CLEAR,
                "Both clear (sonar >60m and SST >1.5C) -> ICE_CLEAR");

    /* Rule 2: Sonar clear, but temperature cold/freezing -> UNKNOWN or BLOCKED (not CLEAR) */
    float sst_cold = 0.5f;
    TEST_ASSERT(ice_check(sonar_clear, sst_cold) == ICE_UNKNOWN,
                "Sonar clear but SST unclear (0.5C) -> ICE_UNKNOWN");

    float sst_freezing = -2.2f;
    TEST_ASSERT(ice_check(sonar_clear, sst_freezing) == ICE_BLOCKED,
                "Sonar clear but SST freezing (-2.2C) -> ICE_BLOCKED");

    /* Rule 3: Temperature warm, but sonar unclear / no echo -> UNKNOWN */
    sonar_reading_t sonar_no_echo = { .valid = false, .range_m = 0.0f };
    TEST_ASSERT(ice_check(sonar_no_echo, sst_clear) == ICE_UNKNOWN,
                "SST clear but no sonar echo -> ICE_UNKNOWN");

    /* Rule 4: Sonar range in ambiguous band (e.g. 20m) -> UNKNOWN */
    sonar_reading_t sonar_ambiguous = { .valid = true, .range_m = 20.0f };
    TEST_ASSERT(ice_check(sonar_ambiguous, sst_clear) == ICE_UNKNOWN,
                "Sonar echo ambiguous (20m) -> ICE_UNKNOWN");

    /* Rule 5: Sonar detects surface ice (<5m) -> BLOCKED */
    sonar_reading_t sonar_close = { .valid = true, .range_m = 2.5f };
    TEST_ASSERT(ice_check(sonar_close, sst_clear) == ICE_BLOCKED,
                "Sonar detected ice <5m -> ICE_BLOCKED");
}

void test_retry_and_backoff_rule(void) {
    printf("\n2. Testing Retry & Backoff State Logic:\n");

    fsm_ctx_t ctx;
    fsm_init(&ctx);

    sonar_reading_t sonar_ice = { .valid = true, .range_m = 3.0f };
    ctd_reading_t ctd = { .pressure_dbar = 450.0f, .temperature_c = -2.1f, .salinity_psu = 34.2f };
    float sst_ice = -2.1f;

    /* Cycle 1: Abort 1 */
    fsm_step(&ctx, sonar_ice, ctd, sst_ice); /* BOOT -> DESCENT */
    fsm_step(&ctx, sonar_ice, ctd, sst_ice); /* DESCENT -> PARK */
    fsm_step(&ctx, sonar_ice, ctd, sst_ice); /* PARK -> ICE_CHECK */
    fsm_step(&ctx, sonar_ice, ctd, sst_ice); /* ICE_CHECK -> abort 1, back to PARK */
    TEST_ASSERT(ctx.ice_abort_count == 1, "Ice abort count is 1 after first blocked attempt");
    TEST_ASSERT(ctx.profile_stored == true, "Profile stored in flash on abort");
    TEST_ASSERT(ctx.backoff_days_remain == 0, "No backoff yet on 1st abort");

    /* Cycle 2: Abort 2 */
    fsm_step(&ctx, sonar_ice, ctd, sst_ice); /* PARK -> ICE_CHECK */
    fsm_step(&ctx, sonar_ice, ctd, sst_ice); /* ICE_CHECK -> abort 2, back to PARK */
    TEST_ASSERT(ctx.ice_abort_count == 2, "Ice abort count is 2 after second blocked attempt");
    TEST_ASSERT(ctx.backoff_days_remain == 0, "No backoff yet on 2nd abort");

    /* Cycle 3: Abort 3 -> Triggers 30-day backoff */
    fsm_step(&ctx, sonar_ice, ctd, sst_ice); /* PARK -> ICE_CHECK */
    fsm_step(&ctx, sonar_ice, ctd, sst_ice); /* ICE_CHECK -> abort 3 -> backoff triggered */
    TEST_ASSERT(ctx.backoff_days_remain == 30, "3 blocked attempts triggers 30-day backoff");
    TEST_ASSERT(ctx.ice_abort_count == 0, "Ice abort counter reset upon entering backoff");
}

int main(void) {
    printf("PolarSense Firmware Unit Tests (Host Harness)\n");
    printf("============================================================\n");
    test_ice_decision_rules();
    test_retry_and_backoff_rule();
    printf("============================================================\n");
    printf("Results: %d of %d tests passed.\n", tests_passed, tests_run);

    if (tests_passed == tests_run) {
        printf("ALL FIRMWARE TESTS PASSED.\n");
        return 0;
    } else {
        printf("SOME TESTS FAILED.\n");
        return 1;
    }
}
