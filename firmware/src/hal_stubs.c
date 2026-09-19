/*
 * hal_stubs.c — PC host stub implementations for PolarSense HAL.
 */
#include "hal_stubs.h"
#include <stdio.h>
#include <stdarg.h>

void hal_pump_extend(uint32_t volume_ml) {
    hal_log("[HAL] pump_extend(%u ml) — buoyancy engine active\n", volume_ml);
}

void hal_pump_retract(uint32_t volume_ml) {
    hal_log("[HAL] pump_retract(%u ml) — latching valve open\n", volume_ml);
}

void hal_valve_latch(void) {
    hal_log("[HAL] valve_latch() — zero power hold at park depth (450m)\n");
}

void hal_ctd_sample(float *pres, float *temp, float *sal) {
    *pres = 450.0f;
    *temp = 1.55f;
    *sal  = 34.76f;
    hal_log("[HAL] ctd_sample() -> p=%.1f dbar, T=%.2f C, S=%.2f PSU\n", *pres, *temp, *sal);
}

bool hal_sonar_read(float *range_m) {
    *range_m = 50.0f;
    hal_log("[HAL] sonar_read() -> %.1f m echo\n", *range_m);
    return true;
}

float hal_baro_read_hpa(void) {
    return 1013.25f;
}

float hal_air_temp_read_c(void) {
    return -1.5f;
}

bool hal_iridium_send(const uint8_t *frame, uint16_t len) {
    hal_log("[HAL] iridium_send(%u bytes) -> uplink transmitted\n", len);
    (void)frame;
    return true;
}

void hal_flash_write(const uint8_t *data, uint16_t len) {
    hal_log("[HAL] flash_write(%u bytes) -> saved to 2x64 MiB NOR flash\n", len);
    (void)data;
}

void hal_flash_erase_confirmed(uint32_t cycle) {
    hal_log("[HAL] flash_erase_confirmed() -> cycle %u deleted after ACK\n", cycle);
}

void hal_watchdog_pat(void) {
    /* TPL5010 watchdog pet (35 nA standby) */
}

void hal_sleep_ms(uint32_t ms) {
    (void)ms;
}

uint32_t hal_tick_ms(void) {
    static uint32_t t = 0;
    return t += 1000;
}

void hal_log(const char *fmt, ...) {
    va_list args;
    va_start(args, fmt);
    vprintf(fmt, args);
    va_end(args);
}
