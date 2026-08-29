# MountainWatch — Landslide & Slope Stability Monitoring System

Real-time IoT sensor monitoring dashboard for the **Dehradun mountainous region, Uttarakhand, India**.  
Tracks slope instability, landslide risk, ground movement, pore-water pressure, micro-seismic activity, and surface displacement using distributed IoT sensors.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Open `http://localhost:5173` in your browser.

---

## Project Architecture

```
SENSORS ──> SUBSTATION / EDGE STATION ──LoRa──> MASTER STATION ──> EDGE/AI PROCESSING ──> RISK ASSESSMENT ──> ALERT
```

### Geographical Layout

| Scale | Substations | Master Stations |
|-------|-------------|-----------------|
| 30 km | 10 | 1 |
| 60 km | 20 | 2 |
| 90 km | 30 | 3 |

Each substation covers ~3 km and aggregates data from 3–5 sensors.  
Substations communicate with master stations via **LoRa** (868 MHz).

### Current Demo Configuration

- **30 sensors** (8× IPI, 8× VWP, 7× Geophone, 7× Extensometer)
- **10 substations** across the Dehradun mountainous region
- **1 master station** at NDMA Field Office, Dehradun

---

## Sensor Types

| Sensor | Measures | Unit | Warning | Critical |
|--------|----------|------|---------|----------|
| **IPI** (In-Place Inclinometer) | Ground displacement / tilt | mm | 5 | 15 |
| **VWP** (Vibrating Wire Piezometer) | Pore-water pressure | kPa | 80 | 120 |
| **Geophone** (Micro-Seismic) | Peak ground velocity | mm/s | 1.5 | 5.0 |
| **Extensometer** (Wireline) | Surface displacement | mm | 8 | 20 |

---

## Sensor Data Format

### JSON

```json
{
  "sensor_id": "IPI-001",
  "sensor_type": "IPI",
  "substation_id": "SUB-01",
  "master_station_id": "MASTER-01",
  "timestamp": "2026-08-29T18:30:00Z",
  "value": 12.4,
  "unit": "mm",
  "battery": 87,
  "signal": 91
}
```

### CSV

```csv
sensor_id,sensor_type,substation_id,master_station_id,timestamp,value,unit,battery,signal
IPI-001,IPI,SUB-01,MASTER-01,2026-08-29T18:30:00Z,12.4,mm,87,91
```

---

## Data Flow

```
1. Sensor reading captured
2. Transmitted to local Substation via wired/short-range link
3. Substation aggregates local sensor data
4. Substation transmits via LoRa to Master Station
5. Master Station forwards to Edge AI Processing
6. Risk Engine calculates composite risk score (0–100)
7. If thresholds breached → Danger Zone activated → Alert generated
8. Dashboard updates in real-time
```

---

## Risk Scoring Engine

Transparent, rule-based scoring — **not a black-box ML model**.

### Per-Sensor Contribution

```
deviation = (currentValue - normalMax) / (criticalThreshold - normalMax)

deviation >= 2.0  → CRITICAL  (30 pts)
deviation >= 1.0  → HIGH      (20 pts)
deviation >= 0.4  → MODERATE  (10 pts)
else              → LOW       ( 2 pts)
```

Points are weighted by sensor type importance:  
IPI: 1.0 | Extensometer: 0.9 | VWP: 0.85 | Geophone: 0.75

### Zone Score

```
rawScore = (totalWeightedPoints / maxPossiblePoints) × 100
correlationBonus = +10 if 3+ sensors HIGH/CRITICAL, +5 if 2
finalScore = min(100, rawScore + correlationBonus)
```

### Risk Bands

| Score | Level | Color | Action |
|-------|-------|-------|--------|
| 0–30 | NORMAL | 🟢 Green | Continue routine monitoring |
| 31–50 | WATCH | 🔵 Blue | Increase monitoring frequency |
| 51–70 | WARNING | 🟡 Yellow | Inspect affected area |
| 71–85 | HIGH RISK | 🟠 Orange | Restrict access; prepare evacuation |
| 86–100 | CRITICAL | 🔴 Red | EVACUATE immediately |

---

## Simulation Engine

The simulation uses **correlated, physically plausible** sensor behaviour:

```
Rainfall ↑ → Ground Saturation ↑ → VWP Pressure ↑ → IPI Displacement ↑
                                                    → Geophone Activity ↑
                                                         → Extensometer Displacement ↑
```

### Demo Scenarios

| ID | Name | Rainfall | Description |
|----|------|----------|-------------|
| A | Normal | 5% | All sensors nominal |
| B | Water Pressure | 65% | VWP rising across stations |
| C | Ground Movement | 45% | IPI displacement + VWP correlation |
| D | Multi-Anomaly | 80% | IPI + VWP + Geophone abnormal |
| E | Critical | 95% | Multiple sensors critical, DZ-07 danger |

---

## How to Replace Mock Data with Real API

### Step 1: Edit `src/services/dataAdapter.ts`

Change `DATA_SOURCE` from `'mock'` to `'api'`.

### Step 2: Edit `src/services/apiService.ts`

Fill in your real API endpoints:

```typescript
export const API_BASE_URL = 'https://your-edge-server/api/v1';
export const WS_URL       = 'wss://your-edge-server/ws/live';
```

Implement the fetch methods.

### Step 3: Update the Zustand store

In `src/store/monitoringStore.ts`, replace the `tick()` function with a WebSocket message handler that calls `set()` with new data.

**No UI components need to change.**

---

## How to Add a New Sensor

1. Add a new entry in `src/data/mock/sensors.ts` using the `makeSensor()` helper.
2. Add the sensor ID to the relevant substation's `sensorIds` array in `substations.ts`.
3. The dashboard auto-discovers new sensors from the data.

## How to Add a New Substation

1. Add geographic coordinates to `src/config/geography.ts` → `SUBSTATION_POSITIONS`.
2. Add a new entry in `src/data/mock/substations.ts`.
3. Add the substation ID to the master station's `substationIds` in `masterStation.ts`.

## How to Add a New Master Station

1. Add a new entry in `src/data/mock/masterStation.ts` (make it an array if needed).
2. Assign substations to it.
3. Update the store to handle multiple master stations.

## How to Add a New Sensor Type

1. Add the type to the `SensorType` union in `src/types/index.ts`.
2. Add configuration in `src/config/sensorTypes.ts` (thresholds, unit, color, icon).
3. Add simulation behaviour in `src/services/simulationEngine.ts` → `updateSensorValue()`.
4. Create mock sensors of the new type.

---

## Dashboard Pages

| # | Page | Route | Description |
|---|------|-------|-------------|
| 1 | Overview | `/` | KPIs, risk gauge, substation grid |
| 2 | Live Data Flow | `/dataflow` | Animated pipeline + event stream |
| 3 | Network Topology | `/topology` | Sensor → Sub → Master hierarchy |
| 4 | Live Map | `/map` | Leaflet map with markers & zones |
| 5 | Sensor Analytics | `/analytics` | Time-series charts per sensor |
| 6 | Substations | `/substations` | Edge station details + sensor table |
| 7 | Master Stations | `/master-stations` | Aggregation node overview |
| 8 | Danger Zones | `/danger-zones` | Risk assessment + AI explanation |
| 9 | Alerts | `/alerts` | Alert history + acknowledge/resolve |
| 10 | Data Import | `/import` | CSV/JSON upload + validation |
| 11 | Simulation | `/simulation` | Start/pause/reset + scenarios |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Map | Leaflet + react-leaflet |
| State | Zustand |
| Routing | React Router v6 |
| Icons | Lucide React |

---

## File Structure

```
src/
├── types/           # TypeScript interfaces
├── config/          # Sensor types, thresholds, geography
├── data/mock/       # Initial mock data (30 sensors, 10 subs, 1 master)
├── services/        # Data adapter, simulation, risk engine, alerts, API
├── store/           # Zustand global state
├── components/
│   ├── layout/      # Sidebar, TopBar, Layout
│   ├── common/      # KPICard, StatusBadge, Table, ProgressBar...
│   └── charts/      # TimeSeriesChart, RiskGauge, ContributionBar
└── pages/           # 11 dashboard pages
```

---

## License

This project is a prototype demonstration system.  
Not intended for production use without proper validation against real geotechnical data.
