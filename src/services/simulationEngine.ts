/**
 * CORRELATED SIMULATION ENGINE
 *
 * Drives realistic, physically correlated sensor behaviour.
 * Hidden environmental state (rainfallIntensity) propagates through the sensor chain.
 * Added support for Keyframe-based sequences and target interpolation for smooth video-like progression.
 */

import { Sensor, Substation, MasterStation, DangerZone, EventLog, Alert } from '../types';
import { calculateZoneRiskScore } from './riskEngine';
import { generateSensorAlert, generateZoneAlert, deduplicateAlerts } from './alertService';
import { getRiskLevelFromScore } from '../config/thresholds';
import { SENSOR_TYPE_CONFIGS } from '../config/sensorTypes';

// ── Sequence & Keyframes ──────────────────────────────────────

interface Keyframe {
  tickOffset: number; // Ticks after scenario start
  rainfallIntensity?: number;
  sensorTargets: Record<string, number>;
  description?: string;
}

interface ScenarioSequence {
  name: string;
  keyframes: Keyframe[];
}

// 8 Scenarios mapped to sequence timelines
export const SCENARIO_SEQUENCES: Record<string, ScenarioSequence> = {
  NORMAL: {
    name: 'Normal Conditions',
    keyframes: [
      { tickOffset: 0, rainfallIntensity: 5, sensorTargets: {}, description: 'All systems normal.' },
    ],
  },
  HEAVY_RAINFALL: {
    name: 'Heavy Rainfall',
    keyframes: [
      { tickOffset: 0,  rainfallIntensity: 30, sensorTargets: {}, description: 'Rainfall begins.' },
      { tickOffset: 15, rainfallIntensity: 70, sensorTargets: { 'VWP-003': 60, 'VWP-004': 75 }, description: 'Heavy rain. VWP rising.' },
      { tickOffset: 30, rainfallIntensity: 85, sensorTargets: { 'VWP-003': 85, 'VWP-004': 95 }, description: 'VWP reaching warning levels.' },
    ],
  },
  PORE_PRESSURE: {
    name: 'Increasing Pore Pressure',
    keyframes: [
      { tickOffset: 0, rainfallIntensity: 40, sensorTargets: { 'VWP-011': 65, 'VWP-012': 70 } },
      { tickOffset: 10, rainfallIntensity: 50, sensorTargets: { 'VWP-011': 85, 'VWP-012': 90 }, description: 'Pore pressure rapidly building.' },
      { tickOffset: 25, rainfallIntensity: 60, sensorTargets: { 'VWP-011': 110, 'VWP-012': 115 }, description: 'Critical pore pressure levels.' },
    ],
  },
  SLOPE_MOVEMENT: {
    name: 'Slope Movement',
    keyframes: [
      { tickOffset: 0, rainfallIntensity: 20, sensorTargets: { 'IPI-007': 5, 'EXT-007': 3 } },
      { tickOffset: 10, rainfallIntensity: 25, sensorTargets: { 'IPI-007': 8.5, 'EXT-007': 8 }, description: 'Inclinometers detecting initial tilt.' },
      { tickOffset: 25, rainfallIntensity: 30, sensorTargets: { 'IPI-007': 14.5, 'EXT-007': 16 }, description: 'Significant displacement confirmed.' },
    ],
  },
  MICRO_SEISMIC: {
    name: 'Micro-Seismic Activity',
    keyframes: [
      { tickOffset: 0, rainfallIntensity: 10, sensorTargets: { 'GEO-022': 0.8, 'GEO-023': 0.7 } },
      { tickOffset: 15, rainfallIntensity: 10, sensorTargets: { 'GEO-022': 2.5, 'GEO-023': 2.2 }, description: 'Rumbling detected by geophones.' },
      { tickOffset: 30, rainfallIntensity: 10, sensorTargets: { 'GEO-022': 5.5, 'GEO-023': 4.8 }, description: 'High seismic energy.' },
    ],
  },
  SURFACE_DEFORMATION: {
    name: 'Surface Deformation',
    keyframes: [
      { tickOffset: 0, rainfallIntensity: 15, sensorTargets: { 'EXT-001': 5, 'EXT-002': 4 } },
      { tickOffset: 10, rainfallIntensity: 15, sensorTargets: { 'EXT-001': 9, 'EXT-002': 8.5 }, description: 'Extensometers show surface cracking.' },
      { tickOffset: 25, rainfallIntensity: 15, sensorTargets: { 'EXT-001': 17, 'EXT-002': 15 }, description: 'Critical surface deformation.' },
    ],
  },
  MULTI_SENSOR: {
    name: 'Multi-Sensor Instability',
    keyframes: [
      { tickOffset: 0, rainfallIntensity: 60, sensorTargets: { 'VWP-015': 70 } },
      { tickOffset: 10, rainfallIntensity: 75, sensorTargets: { 'VWP-015': 90, 'IPI-015': 6 }, description: 'VWP rising, triggering IPI movement.' },
      { tickOffset: 20, rainfallIntensity: 85, sensorTargets: { 'VWP-015': 110, 'IPI-015': 12, 'GEO-015': 1.5 }, description: 'Geophone activity starting.' },
      { tickOffset: 35, rainfallIntensity: 90, sensorTargets: { 'VWP-015': 125, 'IPI-015': 16, 'GEO-015': 3.5, 'EXT-015': 12 }, description: 'All sensors in zone detecting instability.' },
    ],
  },
  CRITICAL_LANDSLIDE: {
    name: 'Critical Landslide Warning (DEMO)',
    keyframes: [
      { tickOffset: 0, rainfallIntensity: 10, sensorTargets: {}, description: 'All systems normal.' },
      { tickOffset: 5, rainfallIntensity: 85, sensorTargets: {}, description: 'Heavy rainfall event begins suddenly.' },
      { tickOffset: 15, rainfallIntensity: 95, sensorTargets: { 'VWP-003': 90 }, description: 'VWP-003 shows rapid pore pressure buildup.' },
      { tickOffset: 25, rainfallIntensity: 95, sensorTargets: { 'VWP-003': 110, 'IPI-003': 10 }, description: 'IPI-003 tilting in response to pressure.' },
      { tickOffset: 35, rainfallIntensity: 95, sensorTargets: { 'VWP-003': 130, 'IPI-003': 15, 'GEO-003': 3 }, description: 'Micro-seismic activity detected (GEO-003).' },
      { tickOffset: 45, rainfallIntensity: 95, sensorTargets: { 'VWP-003': 140, 'IPI-003': 18, 'GEO-003': 5, 'EXT-003': 16 }, description: 'Extensometer extending. Slope failure imminent.' },
    ],
  },
};

// ── Environmental State ───────────────────────────────────────

export interface EnvState {
  rainfallIntensity: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  groundSaturation: number;
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

function getSensorRiskLevel(val: number, cfg: typeof SENSOR_TYPE_CONFIGS['IPI']): Sensor['riskLevel'] {
  if (val >= cfg.criticalThreshold)  return 'CRITICAL';
  if (val >= cfg.highRiskThreshold)  return 'HIGH_RISK';
  if (val >= cfg.warningThreshold)   return 'WARNING';
  if (val >= cfg.normalMax * 0.8)    return 'WATCH';
  return 'NORMAL';
}

function updateSensorValue(sensor: Sensor, envState: EnvState, activeScenario: string): number {
  const cfg  = SENSOR_TYPE_CONFIGS[sensor.type];
  let   val  = sensor.currentValue;

  if (sensor.targetValue !== undefined) {
    // Snap to target immediately if in manual mode to prevent confusing drift
    val = sensor.targetValue;
  } else {
    // Only apply physics/drift if we are in an active simulation scenario
    if (activeScenario !== 'NORMAL') {
      // Standard environmental physics
      switch (sensor.type) {
        case 'VWP': {
          const saturationEffect = (envState.groundSaturation / 100) * cfg.criticalThreshold * 0.8;
          const target = cfg.normalMax * 0.4 + saturationEffect;
          val = val + (target - val) * 0.08 + noise(cfg.normalMax * 0.03);
          break;
        }
        case 'IPI': {
          const pressureEffect = (envState.groundSaturation / 100) * cfg.criticalThreshold * 0.6;
          const target = cfg.normalMax * 0.2 + pressureEffect;
          val = val + (target - val) * 0.05 + noise(cfg.normalMax * 0.04);
          break;
        }
        case 'GEOPHONE': {
          const movementEffect = (envState.groundSaturation / 100) * cfg.criticalThreshold * 0.5;
          const randomEvent    = Math.random() < 0.05 ? cfg.warningThreshold * 0.4 * Math.random() : 0;
          const target = cfg.normalMax * 0.1 + movementEffect;
          val = val + (target - val) * 0.1 + noise(cfg.normalMax * 0.05) + randomEvent;
          break;
        }
        case 'EXTENSOMETER': {
          const displacementEffect = (envState.groundSaturation / 100) * cfg.criticalThreshold * 0.5;
          const target = cfg.normalMax * 0.15 + displacementEffect;
          val = val + (target - val) * 0.04 + noise(cfg.normalMax * 0.02);
          break;
        }
      }
    }
  }

  return clamp(val, Math.max(0, cfg.normalMin), cfg.criticalThreshold * 1.5);
}

// ── Main Simulation Tick ──────────────────────────────────────

export interface SimulationTickResult {
  updatedSensors:        Sensor[];
  updatedSubstations:    Substation[];
  updatedMasterStations: MasterStation[];
  updatedDangerZones:    DangerZone[];
  newAlerts:             Alert[];
  newEvents:             EventLog[];
  envState:              EnvState;
}

let eventCounter = 1000;
const genEventId = () => `EVT-${++eventCounter}`;

export function simulationTick(
  sensors:        Sensor[],
  substations:    Substation[],
  masterStations: MasterStation[],
  dangerZones:    DangerZone[],
  existingAlerts: Alert[],
  speed: number = 1,
  activeScenario: string = 'NORMAL',
  scenarioTick: number = 0
): SimulationTickResult {
  const newEvents: EventLog[] = [];
  const newAlerts: Alert[]    = [];
  const ts = new Date().toISOString();

  // ── Apply Scenario Keyframes ────────────────────────────────
  const sequence = SCENARIO_SEQUENCES[activeScenario];
  if (sequence) {
    // Find keyframes that trigger exactly on this tick
    const keyframes = sequence.keyframes.filter(k => k.tickOffset === scenarioTick);
    for (const frame of keyframes) {
      if (frame.rainfallIntensity !== undefined) {
        env.rainfallIntensity = frame.rainfallIntensity;
      }
      if (frame.description) {
        newEvents.push({
          id: genEventId(),
          timestamp: ts,
          eventType: 'SIMULATION_EVENT',
          source: 'SYSTEM',
          message: frame.description,
          severity: 'INFO',
        });
      }
      // Apply new targets to sensors
      for (const [sId, target] of Object.entries(frame.sensorTargets)) {
        const s = sensors.find(x => x.id === sId);
        if (s) s.targetValue = target;
      }
    }
  }

  // ── Step 1: Evolve environmental state ──────────────────────
  env.groundSaturation  = clamp(
    env.groundSaturation + (env.rainfallIntensity - env.groundSaturation) * 0.05,
    0, 100
  );
  env.humidity    = clamp(60 + env.rainfallIntensity * 0.35 + noise(5), 40, 100);
  env.temperature = clamp(22 - env.rainfallIntensity * 0.05 + noise(1), 10, 35);
  env.windSpeed   = clamp(8 + env.rainfallIntensity * 0.2 + noise(4), 0, 80);

  // ── Step 2: Update each sensor ──────────────────────────────
  const updatedSensors: Sensor[] = sensors.map(sensor => {
    if (sensor.communicationStatus === 'OFFLINE') return sensor;

    const cfg    = SENSOR_TYPE_CONFIGS[sensor.type];
    const oldRisk = sensor.riskLevel;
    const newVal = updateSensorValue(sensor, env, activeScenario);
    const riskLevel = getSensorRiskLevel(newVal, cfg);
    const isAbnormal = newVal > cfg.warningThreshold;

    const newBattery = clamp(sensor.batteryLevel - (0.001 * speed), 5, 100);
    const newSignal = clamp(sensor.signalStrength + noise(3), 10, 100);

    const newReading = { value: parseFloat(newVal.toFixed(3)), unit: sensor.unit, timestamp: ts };
    const history = [...sensor.history.slice(-119), newReading];

    // Important event generation: Generate log when crossing thresholds, not just random polling
    if (oldRisk !== riskLevel) {
      newEvents.push({
        id:        genEventId(),
        timestamp: ts,
        eventType: 'SENSOR_ALERT',
        source:    sensor.id,
        destination: sensor.substationId,
        message:   `${sensor.id} state changed: ${oldRisk} → ${riskLevel} (${newVal.toFixed(2)} ${sensor.unit})`,
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
      communicationStatus: newSignal > 20 ? 'ONLINE' as const : newSignal > 10 ? 'DEGRADED' as const : 'OFFLINE' as const,
      healthStatus: newBattery > 20 ? 'HEALTHY' as const : newBattery > 10 ? 'DEGRADED' as const : 'FAULTY' as const,
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
        eventType: 'ALERT_GENERATED',
        source:    sensor.id,
        message:   `ALERT generated: ${alert.title}`,
        severity:  alert.severity === 'CRITICAL' ? 'ERROR' : 'WARNING',
      });
    }
  });

  // ── Step 4: Update substations ──────────────────────────────
  const sensorMap = new Map(updatedSensors.map(s => [s.id, s]));

  const updatedSubstations: Substation[] = substations.map(sub => {
    if (sub.communicationStatus === 'OFFLINE') return { ...sub, lastSync: ts };

    const oldRisk     = sub.riskLevel;
    const subSensors  = sub.sensorIds.map(id => sensorMap.get(id)).filter(Boolean) as Sensor[];
    const riskScore   = calculateZoneRiskScore(subSensors);
    const riskLevel   = getRiskLevelFromScore(riskScore);
    const loraSignal  = clamp(sub.loraSignal + noise(5), 10, 100);
    
    // Check if any sensors are currently transmitting critical changes
    const hasAbnormal = subSensors.some(s => s.isAbnormal);
    
    const newPackets  = sub.packetsReceived + subSensors.length;
    const lostDelta   = Math.random() < 0.02 ? 1 : 0;

    // Emit packet event if risk changes or randomly if abnormal
    if (oldRisk !== riskLevel) {
      newEvents.push({
        id:        genEventId(),
        timestamp: ts,
        eventType: 'ZONE_STATUS_CHANGE',
        source:    sub.id,
        message:   `${sub.id} risk changed: ${oldRisk} → ${riskLevel}`,
        severity:  riskLevel === 'CRITICAL' ? 'ERROR' : riskLevel === 'HIGH_RISK' ? 'WARNING' : 'INFO',
      });
    }
    
    if (hasAbnormal && Math.random() < 0.2) {
      newEvents.push({
        id:        genEventId(),
        timestamp: ts,
        eventType: 'LORA_TRANSMISSION',
        source:    sub.id,
        destination: sub.masterStationId,
        message:   `LoRa Packet: ${sub.id} transmitting abnormal telemetry`,
        severity:  'WARNING',
      });
    }

    return {
      ...sub,
      loraSignal: Math.round(loraSignal),
      communicationStatus: loraSignal > 30 ? 'ONLINE' as const : loraSignal > 15 ? 'DEGRADED' as const : 'OFFLINE' as const,
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

    const updatedZone: DangerZone = {
      ...zone,
      riskScore,
      riskLevel,
      abnormalSensorCount: abnormalCount,
      lastUpdated: ts,
      status: riskLevel === 'NORMAL' ? 'MONITORING' : 'ACTIVE',
    };

    const zoneAlert = generateZoneAlert(updatedZone);
    if (zoneAlert && !deduplicateAlerts([...existingAlerts, ...newAlerts], zoneAlert)) {
      newAlerts.push(zoneAlert);
    }

    return updatedZone;
  });

  // ── Step 6: Update ALL master stations ─────────────────────
  const updatedMasterStations: MasterStation[] = masterStations.map(master => {
    if (master.communicationStatus === 'OFFLINE') return { ...master, lastSync: ts };

    const masterSubs = updatedSubstations.filter(s => master.substationIds.includes(s.id));
    const masterSensors = updatedSensors.filter(s => masterSubs.some(sub => sub.sensorIds.includes(s.id)));

    const online   = masterSensors.filter(s => s.communicationStatus === 'ONLINE').length;
    const offline  = masterSensors.filter(s => s.communicationStatus === 'OFFLINE').length;
    const warnings = masterSensors.filter(s => s.riskLevel === 'WARNING' || s.riskLevel === 'HIGH_RISK').length;
    const critical = masterSensors.filter(s => s.riskLevel === 'CRITICAL').length;
    
    const allScores = masterSubs.map(s => s.riskScore);
    const avgScore  = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
    const maxScore  = allScores.length ? Math.max(...allScores) : 0;
    const aggScore  = Math.round(avgScore * 0.4 + maxScore * 0.6);

    const oldRisk = master.riskLevel;
    const newRisk = getRiskLevelFromScore(aggScore);

    if (oldRisk !== newRisk) {
      newEvents.push({
        id:        genEventId(),
        timestamp: ts,
        eventType: 'EDGE_PROCESS',
        source:    master.id,
        destination: 'RISK-ENGINE',
        message:   `Aggregated Risk for ${master.id} updated: ${oldRisk} → ${newRisk} (Score: ${aggScore})`,
        severity:  newRisk === 'CRITICAL' ? 'ERROR' : newRisk === 'HIGH_RISK' ? 'WARNING' : 'INFO',
      });
    }

    return {
      ...master,
      totalSensors:          masterSensors.length,
      onlineSensors:         online,
      offlineSensors:        offline,
      warningSensors:        warnings,
      criticalSensors:       critical,
      aggregatedRiskScore:   aggScore,
      riskLevel:             newRisk,
      packetsProcessed:      master.packetsProcessed + masterSensors.length,
      lastSync:              ts,
      loraNetworkHealth:     masterSubs.length > 0
        ? Math.round(masterSubs.reduce((a, b) => a + b.loraSignal, 0) / masterSubs.length)
        : 0,
    };
  });

  return {
    updatedSensors,
    updatedSubstations,
    updatedMasterStations,
    updatedDangerZones,
    newAlerts,
    newEvents: newEvents,
    envState: { ...env },
  };
}

export function getEnvState(): EnvState { return { ...env }; }
export function setRainfallIntensity(val: number) { env.rainfallIntensity = clamp(val, 0, 100); }
