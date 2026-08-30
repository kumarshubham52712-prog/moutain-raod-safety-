import { Sensor, SensorReading, SensorType } from '../../types';
import { SENSOR_TYPE_CONFIGS } from '../../config/sensorTypes';
import { SUBSTATION_POSITIONS, SUBSTATION_MASTER_MAP } from '../../config/geography';

// ── Helper utilities ──────────────────────────────────────────

const now = () => new Date().toISOString();

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function generateHistory(
  baseValue: number,
  variance: number,
  points: number = 60,
  unit: string
): SensorReading[] {
  const history: SensorReading[] = [];
  let v = baseValue;
  for (let i = points; i >= 0; i--) {
    v = clamp(v + (Math.random() - 0.5) * variance, Math.max(0, baseValue * 0.3), baseValue * 2.5);
    history.push({
      value: parseFloat(v.toFixed(3)),
      unit,
      timestamp: new Date(Date.now() - i * 60_000).toISOString(),
    });
  }
  return history;
}

function getSensorRiskLevel(value: number, cfg: typeof SENSOR_TYPE_CONFIGS['IPI']): Sensor['riskLevel'] {
  if (value >= cfg.criticalThreshold) return 'CRITICAL';
  if (value >= cfg.highRiskThreshold) return 'HIGH_RISK';
  if (value >= cfg.warningThreshold)  return 'WARNING';
  if (value >= cfg.normalMax * 0.8)   return 'WATCH';
  return 'NORMAL';
}

function makeSensor(
  id: string,
  type: SensorType,
  substationId: string,
  latOffset: number,
  lonOffset: number,
  initValue: number,
  battery: number,
  signal: number,
): Sensor {
  const cfg = SENSOR_TYPE_CONFIGS[type];
  const pos = SUBSTATION_POSITIONS[substationId];
  if (!pos) {
    throw new Error(`No position found for substation ${substationId}`);
  }
  const masterId = SUBSTATION_MASTER_MAP[substationId] ?? 'MASTER-01';
  const isAbnormal = initValue > cfg.warningThreshold;
  const riskLevel = getSensorRiskLevel(initValue, cfg);

  return {
    id,
    type,
    name: `${cfg.label} ${id}`,
    substationId,
    masterStationId: masterId,
    latitude:  pos.lat + latOffset,
    longitude: pos.lon + lonOffset,
    currentValue: initValue,
    unit: cfg.unit,
    timestamp: now(),
    batteryLevel: battery,
    signalStrength: signal,
    communicationStatus: signal > 20 ? 'ONLINE' : signal > 10 ? 'DEGRADED' : 'OFFLINE',
    healthStatus: battery > 20 ? 'HEALTHY' : battery > 10 ? 'DEGRADED' : 'FAULTY',
    normalMin: cfg.normalMin,
    normalMax: cfg.normalMax,
    warningThreshold: cfg.warningThreshold,
    highRiskThreshold: cfg.highRiskThreshold,
    criticalThreshold: cfg.criticalThreshold,
    riskLevel,
    isAbnormal,
    history: generateHistory(
      Math.max(0.1, initValue * 0.7),
      Math.abs(cfg.normalMax * 0.15),
      60,
      cfg.unit,
    ),
  };
}

// ── Seed values for each substation ──────────────────────────
// Each substation gets 4 sensors: IPI, VWP, GEOPHONE, EXTENSOMETER
// Values are chosen to create interesting initial states

interface SeedSet {
  ipi: { val: number; bat: number; sig: number };
  vwp: { val: number; bat: number; sig: number };
  geo: { val: number; bat: number; sig: number };
  ext: { val: number; bat: number; sig: number };
}

const seeds: Record<number, SeedSet> = {
  1:  { ipi: { val: 1.2, bat: 92, sig: 87 }, vwp: { val: 32.5, bat: 88, sig: 83 }, geo: { val: 0.18, bat: 95, sig: 90 }, ext: { val: 1.5, bat: 90, sig: 85 } },
  2:  { ipi: { val: 1.8, bat: 85, sig: 79 }, vwp: { val: 41.0, bat: 81, sig: 75 }, geo: { val: 0.25, bat: 88, sig: 82 }, ext: { val: 1.9, bat: 90, sig: 84 } },
  3:  { ipi: { val: 4.6, bat: 73, sig: 68 }, vwp: { val: 64.5, bat: 78, sig: 71 }, geo: { val: 0.95, bat: 82, sig: 77 }, ext: { val: 4.2, bat: 80, sig: 74 } },
  4:  { ipi: { val: 6.8, bat: 68, sig: 63 }, vwp: { val: 88.0, bat: 71, sig: 66 }, geo: { val: 1.2, bat: 75, sig: 70 }, ext: { val: 9.2, bat: 65, sig: 60 } },
  5:  { ipi: { val: 2.1, bat: 87, sig: 81 }, vwp: { val: 44.0, bat: 83, sig: 78 }, geo: { val: 0.32, bat: 91, sig: 86 }, ext: { val: 2.0, bat: 89, sig: 83 } },
  6:  { ipi: { val: 1.5, bat: 93, sig: 88 }, vwp: { val: 28.0, bat: 89, sig: 85 }, geo: { val: 0.14, bat: 94, sig: 89 }, ext: { val: 2.4, bat: 86, sig: 82 } },
  7:  { ipi: { val: 3.8, bat: 61, sig: 55 }, vwp: { val: 96.0, bat: 58, sig: 52 }, geo: { val: 1.78, bat: 63, sig: 57 }, ext: { val: 11.5, bat: 55, sig: 48 } },
  8:  { ipi: { val: 3.2, bat: 76, sig: 70 }, vwp: { val: 52.0, bat: 78, sig: 73 }, geo: { val: 0.60, bat: 80, sig: 75 }, ext: { val: 4.1, bat: 78, sig: 72 } },
  9:  { ipi: { val: 2.8, bat: 84, sig: 79 }, vwp: { val: 55.0, bat: 80, sig: 74 }, geo: { val: 0.72, bat: 88, sig: 83 }, ext: { val: 3.5, bat: 82, sig: 76 } },
  10: { ipi: { val: 1.0, bat: 90, sig: 85 }, vwp: { val: 36.0, bat: 86, sig: 81 }, geo: { val: 0.28, bat: 92, sig: 87 }, ext: { val: 1.7, bat: 88, sig: 84 } },
  // MASTER-02 substations
  11: { ipi: { val: 1.6, bat: 89, sig: 84 }, vwp: { val: 38.0, bat: 85, sig: 80 }, geo: { val: 0.22, bat: 91, sig: 86 }, ext: { val: 2.1, bat: 87, sig: 82 } },
  12: { ipi: { val: 3.5, bat: 78, sig: 72 }, vwp: { val: 58.0, bat: 76, sig: 70 }, geo: { val: 0.85, bat: 80, sig: 74 }, ext: { val: 5.2, bat: 74, sig: 68 } },
  13: { ipi: { val: 4.2, bat: 72, sig: 66 }, vwp: { val: 68.0, bat: 74, sig: 68 }, geo: { val: 1.1, bat: 77, sig: 71 }, ext: { val: 6.8, bat: 70, sig: 64 } },
  14: { ipi: { val: 1.1, bat: 91, sig: 86 }, vwp: { val: 30.0, bat: 87, sig: 82 }, geo: { val: 0.16, bat: 93, sig: 88 }, ext: { val: 1.8, bat: 89, sig: 84 } },
  15: { ipi: { val: 2.5, bat: 82, sig: 76 }, vwp: { val: 48.0, bat: 80, sig: 74 }, geo: { val: 0.45, bat: 86, sig: 80 }, ext: { val: 3.0, bat: 83, sig: 78 } },
  16: { ipi: { val: 3.8, bat: 74, sig: 68 }, vwp: { val: 62.0, bat: 72, sig: 66 }, geo: { val: 0.92, bat: 78, sig: 72 }, ext: { val: 5.5, bat: 71, sig: 65 } },
  17: { ipi: { val: 0.8, bat: 94, sig: 89 }, vwp: { val: 25.0, bat: 92, sig: 87 }, geo: { val: 0.10, bat: 96, sig: 91 }, ext: { val: 1.2, bat: 93, sig: 88 } },
  18: { ipi: { val: 2.8, bat: 80, sig: 74 }, vwp: { val: 52.0, bat: 78, sig: 72 }, geo: { val: 0.55, bat: 83, sig: 77 }, ext: { val: 3.8, bat: 79, sig: 73 } },
  19: { ipi: { val: 1.9, bat: 86, sig: 80 }, vwp: { val: 42.0, bat: 84, sig: 78 }, geo: { val: 0.30, bat: 89, sig: 83 }, ext: { val: 2.3, bat: 85, sig: 80 } },
  20: { ipi: { val: 1.0, bat: 92, sig: 87 }, vwp: { val: 28.0, bat: 90, sig: 85 }, geo: { val: 0.12, bat: 94, sig: 89 }, ext: { val: 1.4, bat: 91, sig: 86 } },
  // MASTER-03 substations
  21: { ipi: { val: 1.4, bat: 88, sig: 83 }, vwp: { val: 35.0, bat: 86, sig: 81 }, geo: { val: 0.20, bat: 90, sig: 85 }, ext: { val: 1.9, bat: 87, sig: 82 } },
  22: { ipi: { val: 2.6, bat: 81, sig: 75 }, vwp: { val: 50.0, bat: 79, sig: 73 }, geo: { val: 0.52, bat: 84, sig: 78 }, ext: { val: 3.3, bat: 80, sig: 74 } },
  23: { ipi: { val: 4.0, bat: 70, sig: 64 }, vwp: { val: 66.0, bat: 73, sig: 67 }, geo: { val: 1.0, bat: 76, sig: 70 }, ext: { val: 6.5, bat: 69, sig: 63 } },
  24: { ipi: { val: 1.2, bat: 90, sig: 85 }, vwp: { val: 32.0, bat: 88, sig: 83 }, geo: { val: 0.17, bat: 92, sig: 87 }, ext: { val: 1.6, bat: 89, sig: 84 } },
  25: { ipi: { val: 3.3, bat: 76, sig: 70 }, vwp: { val: 56.0, bat: 75, sig: 69 }, geo: { val: 0.78, bat: 79, sig: 73 }, ext: { val: 4.8, bat: 73, sig: 67 } },
  26: { ipi: { val: 1.8, bat: 85, sig: 79 }, vwp: { val: 40.0, bat: 83, sig: 77 }, geo: { val: 0.28, bat: 88, sig: 82 }, ext: { val: 2.5, bat: 84, sig: 78 } },
  27: { ipi: { val: 2.2, bat: 83, sig: 77 }, vwp: { val: 46.0, bat: 81, sig: 75 }, geo: { val: 0.40, bat: 86, sig: 80 }, ext: { val: 2.8, bat: 82, sig: 76 } },
  28: { ipi: { val: 0.9, bat: 93, sig: 88 }, vwp: { val: 22.0, bat: 91, sig: 86 }, geo: { val: 0.08, bat: 95, sig: 90 }, ext: { val: 1.1, bat: 92, sig: 87 } },
  29: { ipi: { val: 3.6, bat: 75, sig: 69 }, vwp: { val: 60.0, bat: 77, sig: 71 }, geo: { val: 0.88, bat: 79, sig: 73 }, ext: { val: 5.0, bat: 74, sig: 68 } },
  30: { ipi: { val: 0.6, bat: 95, sig: 90 }, vwp: { val: 18.0, bat: 93, sig: 88 }, geo: { val: 0.05, bat: 97, sig: 92 }, ext: { val: 0.8, bat: 94, sig: 89 } },
};

// ── Generate all 120 sensors ────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0');

function buildSensors(): Sensor[] {
  const allSensors: Sensor[] = [];

  for (let subNum = 1; subNum <= 30; subNum++) {
    const subId = `SUB-${pad(subNum)}`;
    const seed = seeds[subNum];
    if (!seed) continue;

    allSensors.push(makeSensor(`IPI-${pad(subNum)}`, 'IPI',          subId,  0.002, -0.001, seed.ipi.val, seed.ipi.bat, seed.ipi.sig));
    allSensors.push(makeSensor(`VWP-${pad(subNum)}`, 'VWP',          subId, -0.001,  0.002, seed.vwp.val, seed.vwp.bat, seed.vwp.sig));
    allSensors.push(makeSensor(`GEO-${pad(subNum)}`, 'GEOPHONE',     subId,  0.001,  0.001, seed.geo.val, seed.geo.bat, seed.geo.sig));
    allSensors.push(makeSensor(`EXT-${pad(subNum)}`, 'EXTENSOMETER', subId, -0.002, -0.001, seed.ext.val, seed.ext.bat, seed.ext.sig));
  }

  return allSensors;
}

export const INITIAL_SENSORS: Sensor[] = buildSensors();

export const getSensorById = (id: string): Sensor | undefined =>
  INITIAL_SENSORS.find(s => s.id === id);

export const getSensorsBySubstation = (substationId: string): Sensor[] =>
  INITIAL_SENSORS.filter(s => s.substationId === substationId);
