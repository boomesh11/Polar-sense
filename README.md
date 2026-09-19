# 🧊 PolarSense Ground Station

[![SIH 2026](https://img.shields.io/badge/SIH%202026-PS%2026065-f97316?style=for-the-badge)](https://github.com/boomesh11/Polar-sense)
[![MoES](https://img.shields.io/badge/Ministry-Earth%20Sciences-10b981?style=for-the-badge)](#)
[![Team](https://img.shields.io/badge/Team-AQUA%20LEAGUE-6366f1?style=for-the-badge)](#)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](#)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=for-the-badge&logo=vite)](#)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](./LICENSE)

**Real-time Web Ground Station for PolarSense Autonomous Polar Ice-Aware Profiling Float**

*Smart India Hackathon 2026 · Problem Statement 26065 · Ministry of Earth Sciences / NCPOR*

---

## Overview

PolarSense is an autonomous **Argo-compatible profiling float** purpose-built for polar ocean monitoring beneath sea-ice. The float performs 10-day park-and-profile cycles in the Southern Ocean and Arctic, transmitting 340-byte Iridium SBD messages to this ground station in near-real-time.

This web application — the **PolarSense Ground Station** — provides mission operators at NCPOR/MoES with:

| Feature | Description |
|---|---|
| 🗺️ **Fleet Map** | Live Leaflet map of all floats with status overlays, bbox region selection, and filter rail |
| 🔬 **Float Detail** | Per-float 7-tab detail panel: Overview, Trajectory, T-S diagram, Profile trends, Overlay, Raw telemetry, QC |
| 📊 **Profile Explorer** | Multi-float comparison in depth or sigma-theta (isopycnal) mode |
| 📤 **Export** | NetCDF-ASCII, CSV, JSON export with MoES/NCPOR institutional metadata |
| 📡 **Network** | Iridium SBD link health, uplink history, satellite-arc simulation |
| 🔌 **API** | Live REST-style endpoint explorer for downstream integration |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0
- **npm** >= 9.0

### Local Development

```bash
# Clone the repo
git clone https://github.com/boomesh11/Polar-sense.git
cd Polar-sense

# Install dependencies
npm install

# Start dev server (hot-reload on http://localhost:5173)
npm run dev
```

### Production Build

```bash
npm run build
# Output: dist/ (~897 kB JS bundle, tree-shaken)

# Preview production build locally
npm run preview
```

---

## Project Structure

```
POLAR SENSE/
├── index.html                       # Vite entry point
├── vite.config.js                   # Vite configuration
├── package.json
├── src/
│   ├── main.jsx                     # Root: mounts FleetProvider + BrowserRouter
│   ├── App.jsx                      # Route definitions
│   ├── index.css                    # Global styles + Tailwind
│   ├── context/
│   │   └── FleetContext.jsx         # Global simulation state (15 s tick)
│   ├── components/
│   │   ├── TopBar.jsx               # Navigation + Spec v3.0 modal trigger
│   │   ├── FloatSidePanel.jsx       # Slide-in panel for fleet map selection
│   │   ├── SpecModal.jsx            # Interactive 6-tab v3.0 spec viewer
│   │   ├── FleetSummaryCards.jsx    # KPI cards (active / under-ice / silent)
│   │   ├── StatusPill.jsx           # Colour-coded mission state badge
│   │   ├── QCBadge.jsx              # Argo QC flag badge (0-4)
│   │   └── Sparkline.jsx            # Mini trend chart
│   ├── data/
│   │   ├── fleet.json               # Simulated fleet of 6 floats
│   │   ├── regionFromCoords.js      # Lat/lon -> region classifier
│   │   └── oceanography.js          # NetCDF-ASCII generator
│   └── pages/
│       ├── Fleet/
│       │   ├── FleetPage.jsx        # Main map + bbox draw + filter rail
│       │   └── FleetFilterRail.jsx
│       ├── Float/
│       │   ├── FloatPage.jsx        # Float detail shell (7 tabs)
│       │   ├── TabOverview.jsx      # Health strip + battery + ice state
│       │   ├── TabTrajectory.jsx    # Leaflet trajectory + uncertainty ring
│       │   ├── TabTSDiagram.jsx     # T-S diagram (Recharts scatter)
│       │   ├── TabProfileTrend.jsx  # Time-series of surface T and S
│       │   ├── TabOverlay.jsx       # Bathymetry overlay
│       │   └── TabRaw.jsx           # 340-byte SBD frame visualiser
│       ├── Profiles/ProfilesPage.jsx    # Multi-float profile comparison
│       ├── Export/ExportPage.jsx
│       ├── Network/NetworkPage.jsx
│       └── Api/ApiPage.jsx
```

---

## v3.0 Controlled Baseline

> Engineering parameters locked for SIH 2026 submission. All values traceable to
> internal PolarSense Design Document v3.0 (sections 07-35).

### Section 07 — Mass & Geometry Budget

| Parameter | Value | Notes |
|---|---|---|
| Total float mass | 14.50 kg | Titanium pressure housing |
| Displaced volume | 14.13 L | At surface |
| Net buoyancy (surface) | -0.37 kg | Slightly negative — pump required |
| Buoyancy stroke | **650 ml** | Hydraulic oil displacement |
| Pressure rating | 2000 dbar | Full Southern Ocean depth |
| Housing OD | 130 mm | Standard Argo form factor |
| Housing length | 910 mm | Incl. antennas |

### Sections 09-11 — Hydraulic & Buoyancy System

| Parameter | Value |
|---|---|
| Hydraulic pump type | Brushless DC gear pump |
| Oil reservoir | 750 ml bladder (external) |
| Descent rate | ~10 cm/s (passive sink) |
| Ascent rate | ~10 cm/s (pump-driven) |
| Normal park depth | **450 m** |
| Profile bottom depth | **520 dbar** |
| Profile ascent sampling | 2 dbar bins |

### Sections 15-16 — 3-State Ice-Risk Decision Engine

The float implements a deterministic 3-state ice classifier before every surface attempt:

```
            ICE-RISK DECISION ENGINE
            ─────────────────────────────────
            CLEAR         UNKNOWN       BLOCKED
         (surface OK)  (abort+repark)  (abort+park)
            │              │               │
       SST > 1.5 C    SST in [-2,1.5]  SST < -2 C
       AND acoustic   OR no acoustic   OR acoustic
       > 250m clear   OR ambiguous      < 50m clear
```

| State | Action | Telemetry Flag |
|---|---|---|
| `CLEAR` | Surface, transmit, GPS fix | `ice_state = 0` |
| `UNKNOWN` | Abort to 450 m, re-park 10 days | `ice_state = 1` |
| `BLOCKED` | Abort to 450 m, park until next window | `ice_state = 2` |

**Error metrics (Section 16.3):**
- Under-ice repositioning uncertainty: ±2.0 km (dead reckoning, no GPS)
- Max ice-abort count before recovery flag: 4 consecutive aborts

### Sections 19-20 — Power Architecture

| Parameter | Value |
|---|---|
| Cell chemistry | Li-SOCl2 (Lithium Thionyl Chloride) |
| Pack configuration | **24-cell 3S8P** |
| Nominal pack voltage | 10.8 V |
| Pack capacity | **1123 Wh** |
| Per-cycle energy | **5.30 Wh/cycle** (10-day profile) |
| Design endurance | **3.5 years / ~127 profiles** |
| Pump power draw | 8.2 W peak |
| CTD + sensors idle | 0.55 W |
| Iridium SBD burst | 2.1 W peak, 47 s burst |

### Section 23 — Iridium SBD 340-Byte Frame

```
 Offset   Size   Field
 ------   ----   -----------------------------------------------
  0x00     2 B   Magic: 0xA7F3
  0x02     1 B   Frame version (currently 0x03)
  0x03     1 B   Float ID (1-255)
  0x04     4 B   Mission cycle number (uint32, big-endian)
  0x08     4 B   Unix timestamp (uint32)
  0x0C     2 B   Flags (ice_state[2], qc_ok, gps_fix, ...)
  0x0E     6 B   GPS fix: lat/lon (3B each, 0.0001 deg LSB)
  0x14     4 B   [reserved]
  --- Header: 24 B -------------------------------------------
  0x18   300 B   Payload: 60x profile sample (5 B each)
                   depth   : uint16 (0.5 dbar LSB)
                   temp    : int16  (0.001 C LSB)
                   salinity: uint16 (0.001 PSU LSB)
  --- Payload: 300 B -----------------------------------------
  0x144    4 B   CRC-32 (IEEE 802.3 polynomial)
  --- CRC: 4 B -----------------------------------------------
  0x148   12 B   HMAC-SHA256 (truncated to 96 bits)
  --- HMAC: 12 B ---------------------------------------------
            340 B TOTAL
```

### Section 35 — Sensor Suite

| Sensor | Parameter | Range | Accuracy |
|---|---|---|---|
| SBE 41CP CTD | Temperature | -2 to 35 C | ±0.002 C |
| SBE 41CP CTD | Salinity | 0-42 PSU | ±0.002 PSU |
| SBE 41CP CTD | Pressure | 0-2000 dbar | ±2 dbar |
| Nortek AquaDopp 1 MHz | Ice proximity | 0-50 m | ±0.5 m |
| Keller 1 MHz upward | Ice thickness | 2-150 m | ±0.5 m |
| Sensirion SHT45 | Humidity (housing) | 0-100 %RH | ±1.5 %RH |
| u-blox ZED-F9P | GPS | — | ±0.01 m CEP |
| Iridium 9603N | SBD modem | — | 340 B/burst |

---

## Dashboard Pages

### Fleet Map (`/fleet`)
- Interactive Leaflet map centred on polar regions
- Click-drag **bounding box selection** to filter floats by region
- Filter rail: status checkboxes + region dropdown (`Arctic`, `Southern Ocean`, `Coastal trials`)
- Float markers colour-coded by mission state
- Side panel shows: float identity, last uplink, battery %, ice state, recent profiles

### Float Detail (`/float/:id`)
Seven tabs per float:

| Tab | Description |
|---|---|
| **Overview** | Health strip (6 cards), battery arc gauge (24-cell Wh), ice 3-state engine, uplink history |
| **Trajectory** | Leaflet path with under-ice uncertainty rings (±2 km), park depth markers |
| **T-S Diagram** | Recharts scatter of all profiles on temperature-salinity space |
| **Profile Trend** | Time-series of surface temperature and salinity across profiles |
| **Overlay** | ETOPO1 bathymetric overlay |
| **Raw** | 340-byte SBD frame visualiser + hex dump + decoded fields |
| **QC** | Argo RTQC flag table per profile |

### Profile Explorer (`/profiles`)
- Select up to 3 floats for side-by-side comparison
- **Depth mode**: 0-520 dbar pressure axis
- **Density mode**: sigma-theta isopycnal axis (25.0-28.5 kg/m3) — toggleable

### Export (`/export`)
Downloads in three formats:
- **NetCDF-ASCII** — with full MoES/NCPOR institutional metadata + SIH PS 26065 reference
- **CSV** — flat profile table
- **JSON** — structured mission data

### Network (`/network`)
- Per-float Iridium SBD uplink history
- Satellite arc simulation (Iridium NEXT constellation)
- Uplink success/failure rate gauge

### API (`/api`)
Live REST endpoint explorer — query floats, profiles, and telemetry frames.

---

## Technology Stack

| Layer | Library / Tool |
|---|---|
| Frontend framework | React 18 |
| Build tool | Vite 6.4.3 |
| Routing | React Router v6 |
| Map | Leaflet 1.9 + react-leaflet |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Icons | Lucide React |

---

## Team AQUA LEAGUE

> **Smart India Hackathon 2026 — Problem Statement 26065**
> Ministry of Earth Sciences (MoES) / National Centre for Polar and Ocean Research (NCPOR)

Designing the next generation of autonomous ice-capable ocean profiling infrastructure for India's polar research programme.

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

*Built for SIH 2026 · PS 26065 · MoES/NCPOR · Team AQUA LEAGUE*
