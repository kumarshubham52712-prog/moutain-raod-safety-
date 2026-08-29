import { Sensor, SensorReading } from '../../types';
import { SENSOR_TYPE_CONFIGS } from '../../config/sensorTypes';
import { SUBSTATION_POSITIONS } from '../../config/geography';

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
    v = clamp(v + (Math.random() - 0.5) * variance, baseValue * 0.3, baseValue * 2.5);
    history.push({
      value: parseFloat(v.toFixed(3)),
      unit,
      timestamp: new Date(Date.now() - i * 60_000).toISOString(),
    });
  }
  return history;
}

function makeSensor(
  id: string,
  type: 'IPI' | 'VWP' | 'GEOPHONE' | 'EXTENSOMETER',
  substationId: string,
  latOffset: number,
  lonOffset: number,
  initValue: number,
  battery: number,
  signal: number,
): Sensor {
  const cfg = SENSOR_TYPE_CONFIGS[type];
  const pos = SUBSTATION_POSITIONS[substationId];
  const isAbnormal = initValue > cfg.warningThreshold;
  const riskLevel = initValue >= cfg.criticalThreshold
    ? 'CRITICAL'
    : initValue >= cfg.warningThreshold
      ? (initValue > cfg.warningThreshold * 0.7 ? 'HIGH_RISK' : 'WARNING')
      : initValue > cfg.normalMax * 0.8
        ? 'WATCH'
        : 'NORMAL';

  return {
    id,
    type,
    name: `${cfg.label} ${id}`,
    substationId,
    masterStationId: 'MASTER-01',
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

// ── 30 Sensors across 10 Substations ─────────────────────────
// Distribution: ~3 sensors per substation
// Types: 8 IPI, 8 VWP, 7 GEOPHONE, 7 EXTENSOMETER

export const INITIAL_SENSORS: Sensor[] = [
  // ─── SUB-01 (Mussoorie Foothills West) ──────
  makeSensor('IPI-001', 'IPI',         'SUB-01', 0.002, -0.001, 1.2,  92, 87),
  makeSensor('VWP-001', 'VWP',         'SUB-01', 0.001,  0.002, 32.5, 88, 83),
  makeSensor('GEO-001', 'GEOPHONE',    'SUB-01',-0.001,  0.001, 0.18, 95, 90),

  // ─── SUB-02 (Kempty Falls Ridge) ────────────
  makeSensor('IPI-002', 'IPI',         'SUB-02', 0.002, -0.002, 1.8,  85, 79),
  makeSensor('VWP-002', 'VWP',         'SUB-02',-0.001,  0.002, 41.0, 81, 75),
  makeSensor('EXT-001', 'EXTENSOMETER','SUB-02', 0.001, -0.001, 1.9,  90, 84),

  // ─── SUB-03 (Cloud End Escarpment) ──────────
  makeSensor('IPI-003', 'IPI',         'SUB-03', 0.003,  0.002, 4.6,  73, 68),
  makeSensor('VWP-003', 'VWP',         'SUB-03',-0.002, -0.001, 64.5, 78, 71),
  makeSensor('GEO-002', 'GEOPHONE',    'SUB-03', 0.001,  0.003, 0.95, 82, 77),

  // ─── SUB-04 (Lal Tibba Slope) ───────────────
  makeSensor('IPI-004', 'IPI',         'SUB-04', 0.002,  0.001, 6.8,  68, 63),
  makeSensor('VWP-004', 'VWP',         'SUB-04',-0.001, -0.002, 88.0, 71, 66),
  makeSensor('EXT-002', 'EXTENSOMETER','SUB-04', 0.003, -0.001, 9.2,  65, 60),

  // ─── SUB-05 (Rajpur Road Cut) ───────────────
  makeSensor('IPI-005', 'IPI',         'SUB-05',-0.002,  0.002, 2.1,  87, 81),
  makeSensor('VWP-005', 'VWP',         'SUB-05', 0.001, -0.001, 44.0, 83, 78),
  makeSensor('GEO-003', 'GEOPHONE',    'SUB-05',-0.001,  0.001, 0.32, 91, 86),

  // ─── SUB-06 (Sahasradhara Valley) ───────────
  makeSensor('IPI-006', 'IPI',         'SUB-06', 0.001,  0.002, 1.5,  93, 88),
  makeSensor('VWP-006', 'VWP',         'SUB-06',-0.002,  0.001, 28.0, 89, 85),
  makeSensor('EXT-003', 'EXTENSOMETER','SUB-06', 0.002, -0.002, 2.4,  86, 82),

  // ─── SUB-07 (Rispana River Bank) ────────────
  makeSensor('GEO-004', 'GEOPHONE',    'SUB-07',-0.001, -0.001, 1.78, 61, 55),
  makeSensor('VWP-007', 'VWP',         'SUB-07', 0.002,  0.002, 96.0, 58, 52),
  makeSensor('EXT-004', 'EXTENSOMETER','SUB-07',-0.002,  0.001, 11.5, 55, 48),

  // ─── SUB-08 (Dhalipur Slope) ────────────────
  makeSensor('IPI-007', 'IPI',         'SUB-08', 0.001, -0.001, 3.2,  76, 70),
  makeSensor('GEO-005', 'GEOPHONE',    'SUB-08',-0.001,  0.002, 0.60, 80, 75),
  makeSensor('EXT-005', 'EXTENSOMETER','SUB-08', 0.002,  0.001, 4.1,  78, 72),

  // ─── SUB-09 (Doiwala Embankment) ────────────
  makeSensor('IPI-008', 'IPI',         'SUB-09',-0.002,  0.001, 2.8,  84, 79),
  makeSensor('VWP-008', 'VWP',         'SUB-09', 0.001,  0.002, 55.0, 80, 74),
  makeSensor('GEO-006', 'GEOPHONE',    'SUB-09',-0.001, -0.002, 0.72, 88, 83),

  // ─── SUB-10 (Lachhiwala Bluff) ──────────────
  makeSensor('GEO-007', 'GEOPHONE',    'SUB-10', 0.002,  0.001, 0.28, 90, 85),
  makeSensor('VWP-009', 'VWP',         'SUB-10',-0.001, -0.001, 36.0, 86, 81),
  makeSensor('EXT-006', 'EXTENSOMETER','SUB-10', 0.001,  0.002, 1.7,  92, 87),
  makeSensor('EXT-007', 'EXTENSOMETER','SUB-10',-0.002,  0.001, 2.2,  88, 84),
];

export const getSensorById = (id: string): Sensor | undefined =>
  INITIAL_SENSORS.find(s => s.id === id);

export const getSensorsBySubstation = (substationId: string): Sensor[] =>
  INITIAL_SENSORS.filter(s => s.substationId === substationId);
