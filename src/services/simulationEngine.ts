/**
 * CORRELATED SIMULATION ENGINE
 *
 * Drives realistic, physically correlated sensor behaviour.
 * Hidden environmental state (rainfallIntensity) propagates through the sensor chain:
 *
 *   Rainfall ──(lag)──> VWP rises ──(lag)──> IPI displacement rises
 *                            └──────────────> GEOPHONE events spike
 *                                              └────────> EXTENSOMETER displacement rises
 *
 * This creates multi-sensor correlation visible across the dashboard.
 */

import { Sensor, Substation, MasterStation, DangerZone, EventLog, Alert } from '../types';
import { calculateZoneRiskScore } from './riskEngine';
import { generateSensorAlert, generateZoneAlert, deduplicateAlerts } from './alertService';
import { getRiskLevelFromScore } from '../config/thresholds';
import { getNextAlertId } from '../data/mock/alerts';
import { SENSOR_TYPE_CONFIGS } from '../config/sensorTypes';

// ── Scenario Patches ──────────────────────────────────────────

interface ScenarioPatch {
  rainfallIntensity: number;
  sensorOverrides: Record<string, Partial<Pick<Sensor, 'currentValue' | 'batteryLevel' | 'signalStrength'>>>;
  description: string;
}

export const SCENARIOS: Record<string, ScenarioPatch> = {
  A: {
    rainfallIntensity: 5,
    sensorOverrides: {},
    description: 'Normal — All sensors nominal, minimal rainfall.',
  },
  B: {
    rainfallIntensity: 65,
    sensorOverrides: {
      'VWP-001': { currentValue: 42 },
      'VWP-002': { currentValue: 55 },
      'VWP-003': { currentValue: 74 },
      'VWP-004': { currentValue: 91 },
      'VWP-005': { currentValue: 61 },
      'VWP-006': { currentValue: 38 },
      'VWP-007': { currentValue: 108 },
      'VWP-008': { currentValue: 67 },
      'VWP-009': { currentValue: 49 },
    },
    description: 'Scenario B — Heavy rainfall. VWP pore-water pressure rising across multiple substations.',
  },
  C: {
    rainfallIntensity: 45,
    sensorOverrides: {
      'IPI-003': { currentValue: 7.2 },
      'IPI-004': { currentValue: 11.8 },
      'IPI-007': { currentValue: 6.4 },
      'IPI-008': { currentValue: 5.9 },
      'VWP-003': { currentValue: 72 },
      'VWP-004': { currentValue: 86 },
    },
    description: 'Scenario C — Ground movement. IPI displacement increasing; correlated VWP rise.',
  },
  D: {
    rainfallIntensity: 80,
    sensorOverrides: {
      'IPI-003': { currentValue: 9.1 },
      'IPI-004': { currentValue: 13.5 },
      'VWP-003': { currentValue: 88 },
      'VWP-004': { currentValue: 105 },
      'VWP-007': { currentValue: 112 },
      'GEO-002': { currentValue: 2.1 },
      'GEO-004': { currentValue: 3.4 },
      'EXT-002': { currentValue: 14.8 },
      'EXT-004': { currentValue: 16.2 },
    },
    description: 'Scenario D — Multiple anomalies. IPI + VWP + Geophone all abnormal. High rainfall driver.',
  },
  E: {
    rainfallIntensity: 95,
    sensorOverrides: {
      'IPI-003': { currentValue: 12.8 },
      'IPI-004': { currentValue: 16.9 },
      'VWP-003': { currentValue: 108 },
      'VWP-004': { currentValue: 127 },
      'VWP-007': { currentValue: 138 },
      'GEO-002': { currentValue: 3.8 },
      'GEO-004': { currentValue: 5.8 },
      'GEO-005': { currentValue: 2.4 },
      'EXT-002': { currentValue: 18.4 },
      'EXT-004': { currentValue: 22.1 },
      'EXT-005': { currentValue: 12.6 },
      'IPI-007': { currentValue: 14.2 },
    },
    description: 'Scenario E — CRITICAL. Multi-sensor critical anomalies. DZ-07 and DZ-04 in immediate danger.',
  },
};

// ── Environmental State ───────────────────────────────────────

export interface EnvState {
  rainfallIntensity: number;   // 0–100
  temperature: number;         // °C
  humidity: number;            // %
  windSpeed: number;           // km/h
  groundSaturation: number;    // 0–100 (lags rainfall)
}

let env: EnvState = {
  rainfallIntensity: 15,
  temperature: 22,
  humidity: 68,
  windSpeed: 12,
  groundSaturation: 20,
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const noise = (spread: number) => (Math.random() - 0.5) * spread;

// ── Sensor Update Logic ───────────────────────────────────────

function updateSensorValue(sensor: Sensor, envState: EnvState): number {
  const cfg  = SENSOR_TYPE_CONFIGS[sensor.type];
  let   val  = sensor.currentValue;

  switch (sensor.type) {
    case 'VWP': {
      // Pore-water pressure correlates directly with ground saturation (lagged rainfall)
      const saturationEffect = (envState.groundSaturation / 100) * cfg.criticalThreshold * 0.8;
      const target = cfg.normalMax * 0.4 + saturationEffect;
      val = val + (target - val) * 0.08 + noise(cfg.normalMax * 0.03);
      break;
    }
    case 'IPI': {
      // Ground displacement lags VWP — responds to sustained pore pressure
      const pressureEffect = (envState.groundSaturation / 100) * cfg.criticalThreshold * 0.6;
      const target = cfg.normalMax * 0.2 + pressureEffect;
      val = val + (target - val) * 0.05 + noise(cfg.normalMax * 0.04);
      break;
    }
    case 'GEOPHONE': {
      // Micro-seismic activity spikes with ground movement; random events
      const movementEffect = (envState.groundSaturation / 100) * cfg.criticalThreshold * 0.5;
      const randomEvent    = Math.random() < 0.05 ? cfg.warningThreshold * 0.4 * Math.random() : 0;
      const target = cfg.normalMax * 0.1 + movementEffect;
      val = val + (target - val) * 0.1 + noise(cfg.normalMax * 0.05) + randomEvent;
      break;
    }
    case 'EXTENSOMETER': {
      // Surface displacement lags IPI — responds to sustained displacement
      const displacementEffect = (envState.groundSaturation / 100) * cfg.criticalThreshold * 0.5;
      const target = cfg.normalMax * 0.15 + displacementEffect;
      val = val + (target - val) * 0.04 + noise(cfg.normalMax * 0.02);
      break;
    }
  }

  return clamp(val, Math.max(0, cfg.normalMin), cfg.criticalThreshold * 1.2);
}

function getSensorRiskLevel(val: number, cfg: typeof SENSOR_TYPE_CONFIGS['IPI']): Sensor['riskLevel'] {
  if (val >= cfg.criticalThreshold) return 'CRITICAL';
  if (val >= cfg.warningThreshold)  return 'HIGH_RISK';
  if (val >= cfg.normalMax * 0.8)   return 'WATCH';
  return 'NORMAL';
}

// ── Main Simulation Tick ──────────────────────────────────────

export interface SimulationTickResult {
  updatedSensors:      Sensor[];
  updatedSubstations:  Substation[];
  updatedMasterStation: MasterStation;
  updatedDangerZones:  DangerZone[];
  newAlerts:           Alert[];
  newEvents:           EventLog[];
  envState:            EnvState;
}

let eventCounter = 1000;
const genEventId = () => `EVT-${++eventCounter}`;

export function simulationTick(
  sensors:       Sensor[],
  substations:   Substation[],
  masterStation: MasterStation,
  dangerZones:   DangerZone[],
  existingAlerts: Alert[],
  speed: number = 1,
): SimulationTickResult {
  const newEvents: EventLog[] = [];
  const newAlerts: Alert[]    = [];
  const ts = new Date().toISOString();

  // ── Step 1: Evolve environmental state ──────────────────────
  env.rainfallIntensity = clamp(env.rainfallIntensity + noise(8), 0, 100);
  env.groundSaturation  = clamp(
    env.groundSaturation + (env.rainfallIntensity - env.groundSaturation) * 0.03,
    0, 100
  );
  env.humidity    = clamp(60 + env.rainfallIntensity * 0.35 + noise(5), 40, 100);
  env.temperature = clamp(22 - env.rainfallIntensity * 0.05 + noise(1), 10, 35);
  env.windSpeed   = clamp(8 + env.rainfallIntensity * 0.2 + noise(4), 0, 80);

  // ── Step 2: Update each sensor ──────────────────────────────
  const updatedSensors: Sensor[] = sensors.map(sensor => {
    const cfg    = SENSOR_TYPE_CONFIGS[sensor.type];
    const newVal = updateSensorValue(sensor, env);
    const riskLevel = getSensorRiskLevel(newVal, cfg);
    const isAbnormal = newVal > cfg.warningThreshold;

    // Battery drain (slow)
    const newBattery = clamp(sensor.batteryLevel - (0.001 * speed), 5, 100);

    // Signal fluctuation
    const newSignal = clamp(sensor.signalStrength + noise(3), 10, 100);

    // Add reading to history
    const newReading = { value: parseFloat(newVal.toFixed(3)), unit: sensor.unit, timestamp: ts };
    const history = [...sensor.history.slice(-119), newReading]; // keep last 120 points

    // Log sensor reading event (sample 20% to avoid log flood)
    if (Math.random() < 0.2) {
      newEvents.push({
        id:        genEventId(),
        timestamp: ts,
        eventType: 'SENSOR_READING',
        source:    sensor.id,
        destination: sensor.substationId,
        message:   `${sensor.id} → ${sensor.substationId}: ${sensor.type} = ${newVal.toFixed(2)} ${sensor.unit}`,
        severity:  riskLevel === 'CRITICAL' ? 'ERROR' : riskLevel === 'HIGH_RISK' ? 'WARNING' : 'INFO',
      });
    }

    return {
      ...sensor,
      currentValue: parseFloat(newVal.toFixed(3)),
      timestamp: ts,
      riskLevel,
      isAbnormal,
      batteryLevel: parseFloat(newBattery.toFixed(1)),
      signalStrength: Math.round(newSignal),
      communicationStatus: newSignal > 20 ? 'ONLINE' : newSignal > 10 ? 'DEGRADED' : 'OFFLINE',
      healthStatus: newBattery > 20 ? 'HEALTHY' : newBattery > 10 ? 'DEGRADED' : 'FAULTY',
      history,
    };
  });

  // ── Step 3: Generate sensor alerts ──────────────────────────
  updatedSensors.forEach(sensor => {
    const alert = generateSensorAlert(sensor);
    if (alert && !deduplicateAlerts([...existingAlerts, ...newAlerts], alert)) {
      newAlerts.push(alert);
      newEvents.push({
        id:        genEventId(),
        timestamp: ts,
        eventType: 'SENSOR_ALERT',
        source:    sensor.id,
        message:   `ALERT generated: ${alert.title}`,
        severity:  alert.severity === 'CRITICAL' ? 'ERROR' : 'WARNING',
      });
    }
  });

  // ── Step 4: Update substations ──────────────────────────────
  const sensorMap = new Map(updatedSensors.map(s => [s.id, s]));

  const updatedSubstations: Substation[] = substations.map(sub => {
    const subSensors  = sub.sensorIds.map(id => sensorMap.get(id)).filter(Boolean) as Sensor[];
    const riskScore   = calculateZoneRiskScore(subSensors);
    const riskLevel   = getRiskLevelFromScore(riskScore);
    const loraSignal  = clamp(sub.loraSignal + noise(5), 10, 100);
    const newPackets  = sub.packetsReceived + subSensors.length;
    const lostDelta   = Math.random() < 0.02 ? 1 : 0;

    newEvents.push({
      id:        genEventId(),
      timestamp: ts,
      eventType: 'SUBSTATION_PACKET',
      source:    sub.id,
      destination: 'MASTER-01',
      message:   `${sub.id} → MASTER-01: ${subSensors.length} sensor readings transmitted via LoRa`,
      severity:  'INFO',
    });

    return {
      ...sub,
      loraSignal: Math.round(loraSignal),
      communicationStatus: loraSignal > 30 ? 'ONLINE' : loraSignal > 15 ? 'DEGRADED' : 'OFFLINE',
      packetsReceived: newPackets,
      packetsLost: sub.packetsLost + lostDelta,
      dataRate: parseFloat((loraSignal / 100 * 5.2).toFixed(1)),
      riskScore,
      riskLevel,
      lastSync: ts,
      processorLoad: clamp(Math.round(20 + riskScore * 0.4 + noise(10)), 5, 99),
      batteryLevel: clamp(sub.batteryLevel - 0.0005 * speed, 5, 100),
    };
  });

  // ── Step 5: Update danger zones ─────────────────────────────
  const updatedDangerZones: DangerZone[] = dangerZones.map(zone => {
    const zoneSensors  = updatedSensors.filter(s => zone.triggeringSensorIds.includes(s.id));
    if (zoneSensors.length === 0) return { ...zone, lastUpdated: ts };

    const riskScore    = calculateZoneRiskScore(zoneSensors);
    const riskLevel    = getRiskLevelFromScore(riskScore);
    const abnormalCount = zoneSensors.filter(s => s.isAbnormal).length;

    // Log zone status change
    if (riskLevel !== zone.riskLevel) {
      newEvents.push({
        id:        genEventId(),
        timestamp: ts,
        eventType: 'ZONE_STATUS_CHANGE',
        source:    zone.id,
        message:   `${zone.id} status changed: ${zone.riskLevel} → ${riskLevel} (score: ${riskScore})`,
        severity:  riskLevel === 'CRITICAL' ? 'ERROR' : riskLevel === 'HIGH_RISK' ? 'WARNING' : 'INFO',
      });
    }

    const updatedZone: DangerZone = {
      ...zone,
      riskScore,
      riskLevel,
      abnormalSensorCount: abnormalCount,
      lastUpdated: ts,
      status: riskLevel === 'NORMAL' ? 'MONITORING' : 'ACTIVE',
    };

    // Generate zone alert
    const zoneAlert = generateZoneAlert(updatedZone);
    if (zoneAlert && !deduplicateAlerts([...existingAlerts, ...newAlerts], zoneAlert)) {
      newAlerts.push(zoneAlert);
    }

    return updatedZone;
  });

  // ── Step 6: Update master station ───────────────────────────
  const online   = updatedSensors.filter(s => s.communicationStatus === 'ONLINE').length;
  const offline  = updatedSensors.filter(s => s.communicationStatus === 'OFFLINE').length;
  const warnings = updatedSensors.filter(s => s.riskLevel === 'WARNING' || s.riskLevel === 'HIGH_RISK').length;
  const critical = updatedSensors.filter(s => s.riskLevel === 'CRITICAL').length;
  const allScores = updatedSubstations.map(s => s.riskScore);
  const avgScore  = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
  const maxScore  = allScores.length ? Math.max(...allScores) : 0;
  const aggScore  = Math.round(avgScore * 0.4 + maxScore * 0.6);

  newEvents.push({
    id:        genEventId(),
    timestamp: ts,
    eventType: 'EDGE_PROCESS',
    source:    'MASTER-01',
    destination: 'EDGE-PROCESSOR',
    message:   `MASTER-01 → Edge: ${updatedSensors.length} readings processed. Risk Engine updating...`,
    severity:  'INFO',
  });

  newEvents.push({
    id:        genEventId(),
    timestamp: ts,
    eventType: 'RISK_UPDATE',
    source:    'AI-RISK-ENGINE',
    message:   `Risk Engine: Overall score updated to ${aggScore}/100 [${getRiskLevelFromScore(aggScore)}]`,
    severity:  aggScore >= 71 ? 'WARNING' : 'INFO',
  });

  const updatedMasterStation: MasterStation = {
    ...masterStation,
    onlineSensors:         online,
    offlineSensors:        offline,
    warningSensors:        warnings,
    criticalSensors:       critical,
    aggregatedRiskScore:   aggScore,
    riskLevel:             getRiskLevelFromScore(aggScore),
    packetsProcessed:      masterStation.packetsProcessed + updatedSensors.length,
    lastSync:              ts,
    loraNetworkHealth:     Math.round(updatedSubstations.reduce((a, b) => a + b.loraSignal, 0) / updatedSubstations.length),
  };

  return {
    updatedSensors,
    updatedSubstations,
    updatedMasterStation,
    updatedDangerZones,
    newAlerts,
    newEvents: newEvents.slice(0, 20), // limit events per tick
    envState: { ...env },
  };
}

// Apply a scenario patch to current sensor list
export function applyScenario(sensors: Sensor[], scenario: string): Sensor[] {
  const patch = SCENARIOS[scenario];
  if (!patch) return sensors;

  // Reset env to scenario rainfall
  env.rainfallIntensity = patch.rainfallIntensity;
  env.groundSaturation  = patch.rainfallIntensity * 0.7;

  return sensors.map(sensor => {
    const override = patch.sensorOverrides[sensor.id];
    if (!override) return sensor;

    const cfg = SENSOR_TYPE_CONFIGS[sensor.type];
    const newVal = override.currentValue ?? sensor.currentValue;
    const riskLevel = newVal >= cfg.criticalThreshold ? 'CRITICAL'
      : newVal >= cfg.warningThreshold ? 'HIGH_RISK'
      : newVal >= cfg.normalMax * 0.8  ? 'WATCH'
      : 'NORMAL';

    return {
      ...sensor,
      ...override,
      currentValue: newVal,
      riskLevel,
      isAbnormal: newVal > cfg.warningThreshold,
    };
  });
}

export function getEnvState(): EnvState { return { ...env }; }
export function setRainfallIntensity(val: number) { env.rainfallIntensity = clamp(val, 0, 100); }
