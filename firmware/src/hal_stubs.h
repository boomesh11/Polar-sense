/*
 * hal_stubs.h — Hardware Abstraction Layer interface for PolarSense firmware.
 * Compatible with STM32Cube HAL and PC host builds.
 */
#ifndef HAL_STUBS_H
#define HAL_STUBS_H

#include <stdint.h>
#include <stdbool.h>

/* Buoyancy engine controls */
void hal_pump_extend(uint32_t volume_ml);
void hal_pump_retract(uint32_t volume_ml);
void hal_valve_latch(void);

/* Sensors */
void hal_ctd_sample(float *pres, float *temp, float *sal);
bool hal_sonar_read(float *range_m);
float hal_baro_read_hpa(void);
float hal_air_temp_read_c(void);

/* Satellite communication */
bool hal_iridium_send(const uint8_t *frame, uint16_t len);

/* Storage (2 x 64 MiB NOR flash ring buffer) */
void hal_flash_write(const uint8_t *data, uint16_t len);
void hal_flash_erase_confirmed(uint32_t cycle);

/* Watchdog and power management */
void hal_watchdog_pat(void);
void hal_sleep_ms(uint32_t ms);
uint32_t hal_tick_ms(void);

/* Host logging */
void hal_log(const char *fmt, ...);

#endif /* HAL_STUBS_H */
