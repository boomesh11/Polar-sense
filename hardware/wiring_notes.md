# PolarSense Electronics & System Wiring Notes

**TRL 4 Status: Benchtop prototyping schematics and wiring pinout definition. No flight-certified PCB or subsea harness manufactured.**

---

## 1. Flight Computer & Core Peripherals Interconnect

```
                              +-------------------------+
                              |   Saft 3S8P Li-SOCl2    |
                              |   10.8V 104Ah (919 Wh)  |
                              +------------+------------+
                                           |
                                 +---------v---------+
                                 | High-Side Switch  |
                                 | & DC-DC / LDO Reg |
                                 +----+----+----+----+
                                      |    |    |
                   +------------------+    |    +------------------+
                   | 3.3V Digital          | 3.3V Sensor           | 10.8V Switched
                   |                       |                       |
        +----------v----------+ +----------v----------+ +----------v----------+
        |   STM32L476RGT6     | |     RBRlegato4      | |   Hydraulic Pump    |
        |  Flight Controller  | |     CTD Sensor      | |    & Valve Driver   |
        +----+---+---+---+----+ +----------+----------+ +---------------------+
             |   |   |   |                 |
     UART1<--+   |   |   +--SPI1           +--UART2 (RS-232 level-shifted)
     (GNSS)      |   |      (2x64MB Flash)
                 |   |
         UART3<--+   +-->I2C1 (BMP390 Baro + TMP117 Temp)
      (Iridium)
```

---

## 2. Pin Mapping & Peripheral Allocations

| Subsystem | Component | Bus Interface | Microcontroller Pins | Operating Parameters |
|---|---|---|---|---|
| Flight Controller | STM32L476RGT6 | Core | — | Low-Power STOP2 mode, 58 µA system idle |
| Watchdog Timer | TPL5010 | GPIO | `PA0` (WAKE), `PA1` (DONE) | 35 nA quiescent current supervisor |
| Storage Ring Buffer | 2 x 64 MiB NOR Flash | SPI1 | `PA5` (SCK), `PA6` (MISO), `PA7` (MOSI), `PB0/PB1` (CS) | Dual ring buffer for non-volatile profile retention |
| Ocean CTD | RBRlegato4-class | UART2 | `PA2` (TX), `PA3` (RX) | 1 Hz continuous sampling during ascent |
| Upward Sonar | 200 kHz Transducer | UART4 | `PC10` (TX), `PC11` (RX) | Dual range: 2-60 m (far) & 0.05-5 m (proximity) |
| Surface Pod Baro | BMP390 | I2C1 | `PB6` (SCL), `PB7` (SDA) | Atmospheric sea surface pressure reference |
| Surface Pod Temp | TMP117 | I2C1 | `PB6` (SCL), `PB7` (SDA) | ±0.1 °C high-precision air temperature |
| Attitude / IMU | ISM330DHCX | SPI2 | `PB13` (SCK), `PB14` (MISO), `PB15` (MOSI), `PB12` (CS) | Tilt, ascent inclination, sea surface wave motion |
| GNSS Receiver | u-blox NEO-M9N | UART1 | `PA9` (TX), `PA10` (RX) | Concurrent multi-constellation surface positioning |
| Satellite Modem | Iridium 9603N SBD | UART3 | `PB10` (TX), `PB11` (RX), `PC4` (ON/OFF), `PC5` (NET_AVAIL) | 340-byte binary packet uplink |
| Leak Sensor | Conductive Probe | ADC1 | `PC0` (ANALOG_IN) | Threshold detection for internal moisture / breach |
| Hydraulic Actuator | Latching Valve & Pump | GPIO / PWM | `PB4` (PUMP_PWM), `PB5` (VALVE_SET), `PB8` (VALVE_RESET) | 650 ml stroke volume displacement |

---

## 3. Power Architecture & Consumption

- **Primary Pack**: 24 Li-SOCl2 D cells configured in **3S8P** (nominal voltage: 10.8 V, nominal capacity: 104 Ah).
- **Total Usable Energy**: **919 Wh** (accounting for passivation, low-temperature polar derating, and cut-off voltage).
- **Per-Cycle Energy Budget**: **5.30 Wh** per 10-day cycle:
  - 450 m Park Drift (10 days @ 58 µA idle): ~0.15 Wh
  - Buoyancy Engine Descent / Ascent Operations: ~3.60 Wh
  - CTD & Sonar Sampling Profile: ~0.95 Wh
  - Surface GNSS Fix & Iridium 9603N SBD Burst (340B): ~0.60 Wh
- **Mission Endurance**:
  - $919 \text{ Wh} / 5.30 \text{ Wh} = 173 \text{ cycles}$ (~4.7 years in open water, 3.95 years under severe ice).
  - Claimed operational design life: **3.5 years** (~128 profiles).
