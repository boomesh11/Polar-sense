# PolarSense Firmware

Seven-state mission state machine in C for the STM32L4 flight controller. Includes host build capability for running the state machine on a PC with simulated sensor inputs.

**TRL 4 Status: Bench-tested on host simulation only. No pressure, cold, or field qualification has been performed.**

## Seven-State Mission Cycle

1. **BOOT**: Power-on initialization and cycle increment.
2. **DESCENT**: Retract 650 ml buoyancy engine, dive to 450 m park depth.
3. **PARK**: Drift at 450 m depth for 10 days.
4. **ICE_CHECK**: Ice evaluation before committing to surface.
5. **ASCENT**: Extend buoyancy engine, sample CTD at 1 Hz during ascent.
6. **SURFACE**: GNSS position fix and surface telemetry preparation.
7. **TRANSMIT**: Iridium 9603N SBD transmission. Profiles retained in 2 x 64 MiB NOR flash until transmission delivery is confirmed.

## Ice Decision Logic

- **Surface Rule**: Float surfaces ONLY when BOTH upward sonar (>60 m) and SST (>1.5 °C) indicate open water.
- **Unknown Rule**: No echo, weak echo, or temperature in ambiguous band counts as `UNKNOWN` — the float aborts and reparks for the next cycle.
- **Backoff Rule**: 3 consecutive blocked attempts trigger a 30-day dormant backoff at park depth before retrying.

## Compiling & Running Host Build

Requires CMake and any standard C compiler (GCC, Clang, or MSVC):

```bash
cd firmware
mkdir build && cd build
cmake ..
cmake --build .
```

Run host simulation:
```bash
./polarsense_host
```

Run unit tests:
```bash
./test_runner
```
