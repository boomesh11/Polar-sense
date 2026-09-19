# PolarSense — Technical Brief

**Smart India Hackathon 2026 · Problem Statement 26065 · Team AQUA LEAGUE**  
**Technology Readiness Level: TRL 4 (Benchtop validation and simulated physics twin; no pressure, cold-chamber, or field qualification performed).**

---

## 1. Executive Summary & Problem Context

Current global polar ocean monitoring relies on profiling floats that infer sea-ice presence indirectly via water temperature thresholds (e.g. freezing point detection). In the Southern Ocean and seasonal marginal ice zones (MIZ), warm surface lenses, supercooling, and leads create catastrophic failure modes:
1. **False Positives**: Floats abort unnecessarily in open leads due to localized sub-zero surface layers.
2. **False Negatives**: Floats attempt to surface beneath fresh congelation ice, crushing their Iridium antennas, shearing GNSS receivers, and permanently bricking the instrument.

Furthermore, India currently has no domestic manufacturing capability for ice-capable autonomous floats, relying on foreign imports costing **Rs 22 Lakh** per float.

PolarSense directly solves this through:
- **Active Direct Ice Measurement**: A dual-range 200 kHz upward-looking acoustic echo sounder paired with high-accuracy thermistors.
- **Fail-Safe Ice Logic**: Float surfaces **ONLY** when both acoustic clearance and temperature conditions are confirmed. Unclear echoes count conservatively as `UNKNOWN` and cause an immediate abort.
- **Domestic Indigenous Platform**: Target unit allowance of **Rs 8.25 Lakh** (projected funding band Rs 8.25 - 16.5 Lakh).

---

## 2. Core Subsystems

### 2.1 Mechanical & Buoyancy Engine
- **Hull**: 6061-T6 aluminium alloy, 160 mm outer diameter, 1300 mm length, 25.75 kg neutral mass.
- **Depth**: Rated to 500 m with a nominal parking depth of 450 m. Hoop stress is 53.05 MPa (5.2× yield safety factor) and critical elastic buckling pressure is 19.33 MPa (3.8× operating pressure safety factor).
- **Buoyancy Displacement**: 650 ml positive-displacement hydraulic oil pump paired with a latching solenoid valve, providing 0.668 kg net positive lift unpowered.

### 2.2 Energy & Endurance
- **Battery Pack**: 24 Saft Li-SOCl2 D cells arranged in a 3S8P architecture (10.8 V nominal, 104 Ah capacity).
- **Usable Energy**: 919 Wh after derating for polar ocean temperatures (-2 °C) and passivation.
- **Per-Cycle Consumption**: 5.30 Wh across a 10-day park-and-profile cycle.
- **Endurance**: 173 available cycles giving ~4.7 years in open water and 3.95 years in severe ice regimes. Claimed mission design life is **3.5 years** (~128 completed profiles).

### 2.3 Sensor Suite & Ice Logic Engine
- **CTD**: RBRlegato4-class inductive conductivity, temperature, and pressure sensor profiling at 1 Hz during ascent.
- **Upward Sonar**: 200 kHz narrow-beam transducer with two functional ranges:
  - 2.0 to 60.0 m (far-field ice detection during ascent)
  - 0.05 to 5.0 m (proximity detection near the surface)
- **Surface Pod**: BMP390 precision barometer and TMP117 air temperature sensor housed in a sealed pod to measure atmospheric air-sea boundary conditions upon surfacing.
- **Attitude & Safety**: ISM330DHCX 6-axis IMU, u-blox NEO-M9N GNSS receiver, internal conductive leak sensor, and a TPL5010 nano-power watchdog supervisor (35 nA).
- **Ice State Machine**:
  - `SURFACE`: Permitted ONLY if Sonar > 60 m AND SST > 1.5 °C.
  - `UNKNOWN`: If no acoustic echo, ambiguous echo (5-60 m), or SST in [-2.0, 1.5] °C, the float immediately aborts and returns to 450 m park depth. Data is preserved in dual 64 MiB NOR flash ring buffers.
  - `BLOCKED & BACKOFF`: If ice < 5 m or SST < -2.0 °C, abort is immediate. After 3 consecutive blocked attempts, the float enforces a **30-day dormant backoff** at park depth to drift away from ice convergence zones.

### 2.4 Telemetry & Ground Processing
- **Transceiver**: Iridium 9603N Short Burst Data (SBD) sending 340-byte binary packets.
- **Packet Integrity**: IEEE 802.3 CRC-32 checksum and 96-bit truncated HMAC-SHA-256 cryptographic signature.
- **Flash Retention Policy**: Frames are deleted from on-board flash memory **only** after two-way satellite delivery confirmation is received.
- **Ground Service**: High-throughput FastAPI ingest service, Argo real-time QC flagging (Flags 1-4), TimescaleDB hypertable storage, and export to standard Argo NetCDF formats.
