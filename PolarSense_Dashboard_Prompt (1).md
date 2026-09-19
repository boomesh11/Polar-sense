# PolarSense Dashboard — Build Prompt

**A multi-page web application modelled on how real ocean-float data portals actually work.**

---

## First: how the real ones are built

Before the prompt, here is what we are copying. These are the tools oceanographers actually use every day.

| Tool | Who runs it | What it does |
|---|---|---|
| **Argovis** | University of Colorado / Scripps | Opens on a **world map** showing the last three days of profiles. Click a marker or type a float's WMO number. Draw a box to select a region, depth range and time window. Classic three-tier design: front end, back end, database. |
| **Argo Float Data Explorer** | Community | Find a float by WMO, CTD serial number, model or region. Then **six tabbed views** on one float: Overview · Trajectory · Profile & Trend · Overlay · T-S · Raw. |
| **OceanOPS** | JCOMM / WMO | Fleet-level view of the **whole global array** — which instruments are alive, which have gone quiet, deployment status. Operator's view, not scientist's view. |
| **Euro-Argo Data Selection** | Coriolis | A pure **query-and-export** tool. Filter by date, location, real-time or delayed mode, parameter, mission, deployment date, float ID and data quality. Export as Argo NetCDF, Copernicus NetCDF or CSV. |

### The five patterns worth stealing

1. **The map is the front door.** You do not land on a summary. You land on a map of where the instruments are, and you drill down from there.
2. **Fleet view and single-instrument view are separate pages.** Never mixed.
3. **One float, many tabs.** A single instrument has six or so views of the same data, not one crowded screen.
4. **Data mode is always visible.** Real-time versus delayed-mode quality-controlled is shown on every profile, because scientists will not trust data without knowing which it is.
5. **Export is a first-class page**, not a button hidden in a corner. Getting the NetCDF out is the whole point of the system.

---
---

# THE PROMPT

> Copy everything below into your AI coding tool.

---

## BUILD THIS

A **multi-page web application** for a research ocean float programme called **PolarSense**. It is a ground station and data portal for autonomous instruments that dive to 500 m, drift for ten days, then surface and transmit by satellite.

Model it on real oceanographic data portals — **Argovis**, the **Argo Float Data Explorer**, **OceanOPS** and the **Euro-Argo data selection tool**. This is a working scientific instrument panel, not a product landing page.

**Stack**
- React + Vite, **React Router** for real routing (not tab-switching in one component)
- **Leaflet** for maps, light basemap (CartoDB Positron)
- **Recharts** for charts
- Plain CSS or Tailwind. No component library.
- No backend. Read from local JSON fixtures; simulate live updates with `setInterval`.
- **Must work fully offline** — no CDN fonts, no external API calls.

---

## VISUAL DIRECTION — follow exactly

### Absolutely do not use
- ❌ Dark mode, black or near-black backgrounds
- ❌ Purple, violet, indigo, or purple-to-blue gradients
- ❌ Neon accents, glow effects, text shadows
- ❌ Glassmorphism, frosted panels, blur, translucency
- ❌ Hero sections, marketing copy, emoji in the interface
- ❌ Heavy drop shadows, pill-shaped everything
- ❌ Animated gradient backgrounds or floating blobs

### Do use

**Colour**

| Role | Value |
|---|---|
| Page background | Warm off-white `#FBFAF8` |
| Card / panel surface | Pure white `#FFFFFF`, 1 px border `#E4E7EA`, **no shadow** |
| Primary text | `#1A2733` |
| Secondary text | `#5A6B78` |
| Accent (headings, links, primary data) | Teal `#0E7C8B` |
| Alert (ice abort, warnings only) | Amber `#D97706` |
| Error / dead instrument | `#B3261E` |
| Good / delayed-mode QC passed | `#1E7A4D` |
| Chart: temperature | Teal `#0E7C8B` |
| Chart: salinity | Slate `#516B84` |
| Chart: oxygen (optional) | `#7A6A3F` |

**Typography**
- System font stack, or Inter
- **`font-variant-numeric: tabular-nums` on every number** so digits do not jitter as values update
- Section headings: 13 px, uppercase, letter-spacing 0.06em, teal, semibold
- Page titles: 20 px, semibold, near-black
- Large readouts: 30 px, medium
- Body / table: 13 px, line-height 1.5
- Monospace only for float IDs, WMO numbers and raw packet hex

**Layout**
- 24 px page padding, 20 px gap between panels
- **Border radius 4 px everywhere.** Restrained.
- 12-column grid
- Generous whitespace — do not fill space for its own sake

---

## APPLICATION SHELL

**Top bar**, 52 px, white, 1 px bottom border, spans every page:
- Left: `PolarSense` semibold, then a thin vertical rule, then `Ground Station` in secondary text
- Centre: nav links — **Fleet · Float · Profiles · Export · Network · API**
  Active link is teal with a 2 px teal underline; the rest are secondary text
- Right: a small status cluster — `6 active` · `1 under ice` · `Last uplink 4 min ago`

**No sidebar on the shell.** Individual pages may have their own filter rail.

---

## PAGE 1 — `/fleet` — Fleet Map (the landing page)

This is the front door, exactly like Argovis.

**Left rail, 280 px wide, white panel** — filters:
- Date range picker, defaulting to last 30 days
- Region: dropdown — All · Arctic · Southern Ocean · Coastal trials
- Status checkboxes: Active · Under ice · Silent · Recovered
- Data mode radio: All · Real-time · Delayed-mode
- Depth range: dual slider, 0–500 m
- A `Draw region on map` button that lets the user drag a bounding box
- `Reset filters` as a plain text link at the bottom

**Main area — full-height Leaflet map:**
- Circular markers at each float's last known position, coloured by status (teal active, amber under ice, grey silent, red fault)
- Faint polyline trajectory for each float; **the under-ice portion is dashed**
- Clicking a marker opens a small popup card: float ID, last profile time, depth reached, a sparkline of the last profile, and a `View float →` link
- Bottom-left overlay: a small legend
- Bottom-right overlay: `Showing 6 floats · 412 profiles`

**Below the map**, a compact table of all floats matching the filters:
`Float ID · WMO · Status · Last contact · Cycles · Last depth · Region · Data mode`
Rows clickable, taking you to `/float/:id`.

---

## PAGE 2 — `/float/:id` — Single Float

Copy the Argo Float Data Explorer pattern: **one instrument, six tabbed views.**

**Header block** (white panel, spans full width):
- Left: float ID large, WMO number in monospace beneath
- Centre: four stat readouts — Cycles completed · Last depth · Battery · Days deployed
- Right: a status pill and a `Deployed 14 Mar 2026 · Southern Ocean` line

**Tab bar** — six tabs, underline style, not boxed:

**`Overview`**
- Depth-versus-time chart across all cycles, **Y axis inverted** so deeper is lower on screen
- Mission state timeline: a horizontal band, one coloured segment per state, amber for every ice-abort
- Cards: last profile summary, battery trend, ice-abort count
- Health strip: internal humidity, pack voltage, pump cycles, flash used

**`Trajectory`**
- Leaflet map for this float alone
- Solid teal line for GPS-fixed positions, **dashed grey** for the dead-reckoned under-ice segments
- Translucent circles showing position uncertainty
- Caption: *"Dashed segments are estimated. Under-ice positions carry a 2.6 km median uncertainty."*
- Table of surfacing events: cycle, timestamp, latitude, longitude, fix quality

**`Profile & Trend`**
- Left: temperature and salinity plotted against depth for the selected cycle, depth on the inverted Y, shared axis
- Right: a trend chart of surface and 500 m values across all cycles
- A cycle selector above — a horizontal strip of numbered chips, amber for aborted cycles

**`Overlay`**
- Every profile from this float drawn on one axis, faded, with the selected one highlighted
- A colour ramp legend by cycle number so drift over the mission is visible

**`T-S Diagram`**
- Classic temperature–salinity scatter, salinity on X, temperature on Y
- Points coloured by depth, with a colour bar
- Faint density contour lines in the background
- *This one plot tells an oceanographer more than any other. Get it right.*

**`Raw`**
- The decoded packet table: cycle, timestamp, every measured level
- A monospace panel showing the raw 340-byte hex payload
- QC flag column with coloured chips
- `Download CSV` and `Download NetCDF` buttons

---

## PAGE 3 — `/profiles` — Profile Explorer

A cross-float comparison view.

- Filter rail: region, date range, depth range, parameter, data mode
- Main: a grid of profile thumbnails, each a small T-versus-depth sketch labelled with float ID and cycle
- Selecting several enables `Compare selected` — overlays them on one axis
- A toggle for `Plot against depth` / `Plot against density`

---

## PAGE 4 — `/export` — Data Selection & Export

Model directly on the Euro-Argo selection tool. **A serious form, not a button.**

Filter fields laid out in a clean two-column form:
- Date range · Geographic bounding box (four numeric inputs, or draw on a small map)
- Float IDs — multi-select
- Parameters — checkboxes: Temperature · Salinity · Pressure · Oxygen · pH
- Data mode — Real-time · Delayed-mode · Both
- QC flags to include — 1 Good · 2 Probably good · 3 Probably bad · 4 Bad
- Depth range

**Right panel — a live summary that updates as filters change:**
```
Matching:  4 floats · 186 profiles · 22,400 levels
Estimated size:  2.4 MB
```

**Format selection** as radio buttons: **Argo NetCDF** · CSV · JSON

A prominent `Generate export` button, and beneath it a citation block in a bordered panel:

> *These data were collected and made freely available by the PolarSense programme. Argo-format files follow the Argo data management conventions.*

---

## PAGE 5 — `/network` — Network Status

The OceanOPS-style operator view. Nobody's favourite page, and the one that keeps the programme alive.

- Top row: four counters — Deployed · Active · Under ice · Silent > 30 days
- A fleet health table: float ID, last contact, battery, flash used, missed cycles, pump cycles, a small trend sparkline
- Rows with any warning get a left amber border; failures get red
- An uplink timeline: a horizontal chart of every satellite contact in the last 30 days, one tick per contact
- A panel listing open alerts: `PS-003 — no contact for 41 days`, `PS-005 — humidity rising, possible ingress`

---

## PAGE 6 — `/api` — API Documentation

Because every real ocean data portal has one, and judges notice.

- A short intro paragraph
- Endpoint list in a table: method, path, description
  - `GET /floats` · `GET /floats/:id` · `GET /floats/:id/profiles` · `GET /profiles?bbox=&start=&end=` · `GET /export`
- For each, a collapsible panel with parameters and a sample JSON response in a monospace block on a light grey background
- A short curl example
- A note: *"No API key required. No rate limit."*

---

## BEHAVIOUR

- `setInterval` every 3 s advances the simulation
- Floats move through their mission states independently
- On entering ICE CHECK there is a 30 % chance of ABORT: the float's marker turns amber, its stored-profile counter increments, and an entry appears in the Network alerts
- On SURFACE the counter drops to zero and several profiles appear at once
- All routing is real — the URL changes, back button works, `/float/PS-001` is directly linkable

---

## DATA MODEL

Provide `src/data/fleet.json` with six floats. Each has:

```json
{
  "id": "PS-001",
  "wmo": "2903881",
  "status": "active",
  "region": "Southern Ocean",
  "deployed": "2026-03-14",
  "lastContact": "2026-08-24T09:12:00Z",
  "battery": 84,
  "cyclesCompleted": 14,
  "iceAborts": 3,
  "position": { "lat": -58.42, "lon": 42.19, "fixQuality": "gps" },
  "trajectory": [ { "lat": .., "lon": .., "estimated": false, "uncertaintyKm": 0 } ],
  "profiles": [
    {
      "cycle": 14,
      "timestamp": "2026-08-24T08:40:00Z",
      "dataMode": "R",
      "aborted": false,
      "levels": [ { "pres": 4.2, "temp": 2.14, "psal": 33.92, "qc": 1 } ]
    }
  ],
  "health": { "humidity": 31, "packVoltage": 10.8, "flashUsedPct": 22 }
}
```

Make the profile data **physically plausible**: temperature falling with depth, a mixed layer near the surface, salinity between 33 and 35 PSU. One float should be under ice with a dashed estimated trajectory and several aborted cycles.

---

## CODE QUALITY

- One component per file, one folder per page
- Shared components in `src/components`
- Real data shapes throughout — **no lorem ipsum**
- Comments only where the *why* is non-obvious
- ❌ **No `localStorage` or `sessionStorage`** — keep all state in React

---

> **Build the `/float/:id` page first.** It is the one that will be on screen during the demo, and the T-S diagram is the plot that tells an oceanographer you know what you are doing.
