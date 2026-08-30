import { create } from 'zustand';
import {
  Sensor, Substation, MasterStation, DangerZone,
  Alert, EventLog, SimulationState, SystemStatus, SimulationScenario, EventType
} from '../types';
import { dataAdapter }                 from '../services/dataAdapter';
import { simulationTick, getEnvState } from '../services/simulationEngine';
import { acknowledgeAlert, resolveAlert } from '../services/alertService';
import { getRiskLevelFromScore }        from '../config/thresholds';
import { calculateZoneRiskScore }       from '../services/riskEngine';
import type { EnvState }               from '../services/simulationEngine';

// ── Store State Interface ─────────────────────────────────────

interface MonitoringState {
  sensors:        Sensor[];
  substations:    Substation[];
  masterStations: MasterStation[];
  dangerZones:    DangerZone[];
  alerts:         Alert[];
  eventLog:       EventLog[];
  simulation:     SimulationState & { scenarioTick: number; isDemoMode: boolean };
  envState:       EnvState;
  systemStatus:   SystemStatus;

  // Simulation control
  startSimulation:  () => void;
  pauseSimulation:  () => void;
  resetSimulation:  () => void;
  setScenario:      (scenario: SimulationScenario) => void;
  setSimSpeed:      (speed: number) => void;
  startDemoMode:    () => void;
  tick:             () => void;

  // Manual sensor controls
  setSensorValue:       (sensorId: string, value: number) => void;
  setSensorTargetValue: (sensorId: string, targetValue: number) => void;
  setSensorBattery:     (sensorId: string, value: number) => void;
  setSensorSignal:      (sensorId: string, value: number) => void;
  setSensorOnline:      (sensorId: string, online: boolean) => void;
  setSubstationOnline:  (subId: string, online: boolean) => void;
  setMasterOnline:      (masterId: string, online: boolean) => void;

  // Alert management
  acknowledgeAlert:       (id: string) => void;
  resolveAlert:           (id: string) => void;
  clearAlertHistory:      () => void;
  clearDangerZoneHistory: () => void;

  // User-driven simulation
  playScenario:           () => void;

  // Data Import
  applySensorImport: (sensors: Sensor[]) => void;
}

// ── Helpers ───────────────────────────────────────────────────

let eventCounter = 5000;
const genEventId = () => `EVT-${++eventCounter}`;

function computeSystemStatus(
  sensors: Sensor[],
  substations: Substation[],
  masterStations: MasterStation[],
  alerts: Alert[]
): SystemStatus {
  const online    = sensors.filter(s => s.communicationStatus === 'ONLINE').length;
  const offline   = sensors.filter(s => s.communicationStatus === 'OFFLINE').length;
  const degraded  = sensors.filter(s => s.communicationStatus === 'DEGRADED').length;
  const warnings  = alerts.filter(a => !a.resolved && (a.severity === 'WARNING' || a.severity === 'HIGH_RISK')).length;
  const criticals = alerts.filter(a => !a.resolved && a.severity === 'CRITICAL').length;

  const maxRisk = masterStations.length > 0
    ? Math.max(...masterStations.map(m => m.aggregatedRiskScore))
    : 0;

  return {
    totalSensors:         sensors.length,
    onlineSensors:        online,
    offlineSensors:       offline,
    degradedSensors:      degraded,
    totalSubstations:     substations.length,
    onlineSubstations:    substations.filter(s => s.communicationStatus === 'ONLINE').length,
    totalMasterStations:  masterStations.length,
    onlineMasterStations: masterStations.filter(m => m.communicationStatus === 'ONLINE').length,
    activeWarnings:       warnings,
    criticalAlerts:       criticals,
    overallRiskLevel:     getRiskLevelFromScore(maxRisk),
    overallRiskScore:     maxRisk,
    lastUpdated:          new Date().toISOString(),
  };
}

function propagateChanges(
  sensors: Sensor[],
  substations: Substation[],
  masterStations: MasterStation[],
  dangerZones: DangerZone[],
): { substations: Substation[]; masterStations: MasterStation[]; dangerZones: DangerZone[] } {
  const sensorMap = new Map(sensors.map(s => [s.id, s]));
  const ts = new Date().toISOString();

  const updatedSubs = substations.map(sub => {
    const subSensors = sub.sensorIds.map(id => sensorMap.get(id)).filter(Boolean) as Sensor[];
    const riskScore = calculateZoneRiskScore(subSensors);
    return { ...sub, riskScore, riskLevel: getRiskLevelFromScore(riskScore), lastSync: ts };
  });

  const updatedMasters = masterStations.map(master => {
    const masterSubs = updatedSubs.filter(s => master.substationIds.includes(s.id));
    const masterSensors = sensors.filter(s => masterSubs.some(sub => sub.sensorIds.includes(s.id)));
    const allScores = masterSubs.map(s => s.riskScore);
    const avgScore = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
    const maxScore = allScores.length ? Math.max(...allScores) : 0;
    const aggScore = Math.round(avgScore * 0.4 + maxScore * 0.6);

    return {
      ...master,
      totalSensors: masterSensors.length,
      onlineSensors: masterSensors.filter(s => s.communicationStatus === 'ONLINE').length,
      offlineSensors: masterSensors.filter(s => s.communicationStatus === 'OFFLINE').length,
      warningSensors: masterSensors.filter(s => s.riskLevel === 'WARNING' || s.riskLevel === 'HIGH_RISK').length,
      criticalSensors: masterSensors.filter(s => s.riskLevel === 'CRITICAL').length,
      aggregatedRiskScore: aggScore,
      riskLevel: getRiskLevelFromScore(aggScore),
      lastSync: ts,
      loraNetworkHealth: masterSubs.length > 0
        ? Math.round(masterSubs.reduce((a, b) => a + b.loraSignal, 0) / masterSubs.length)
        : 0,
    };
  });

  const updatedZones = dangerZones.map(zone => {
    const zoneSensors = sensors.filter(s => zone.triggeringSensorIds.includes(s.id));
    if (zoneSensors.length === 0) return { ...zone, lastUpdated: ts };
    const riskScore = calculateZoneRiskScore(zoneSensors);
    return {
      ...zone,
      riskScore,
      riskLevel: getRiskLevelFromScore(riskScore),
      abnormalSensorCount: zoneSensors.filter(s => s.isAbnormal).length,
      lastUpdated: ts,
      status: getRiskLevelFromScore(riskScore) === 'NORMAL' ? 'MONITORING' as const : 'ACTIVE' as const,
    };
  });

  return { substations: updatedSubs, masterStations: updatedMasters, dangerZones: updatedZones };
}

// ── Store ─────────────────────────────────────────────────────

let simInterval: ReturnType<typeof setInterval> | null = null;

export const useMonitoringStore = create<MonitoringState>((set, get) => {
  const sensors        = dataAdapter.getSensors();
  const substations    = dataAdapter.getSubstations();
  const masterStations = dataAdapter.getMasterStations();
  const dangerZones    = dataAdapter.getDangerZones();
  const alerts         = dataAdapter.getAlerts();
  const envState       = getEnvState();

  return {
    sensors,
    substations,
    masterStations,
    dangerZones,
    alerts,
    eventLog:  [],
    envState,
    systemStatus: computeSystemStatus(sensors, substations, masterStations, alerts),
    simulation: {
      isRunning: false,
      scenario:  'NORMAL',
      speed:     1,
      tick:      0,
      scenarioTick: 0,
      isDemoMode: false,
      rainfallIntensity: envState.rainfallIntensity,
    },

    // ── Tick ──────────────────────────────────────────────────
    tick: () => {
      const state = get();
      const result = simulationTick(
        state.sensors,
        state.substations,
        state.masterStations,
        state.dangerZones,
        state.alerts,
        state.simulation.speed,
        state.simulation.scenario,
        state.simulation.scenarioTick
      );

      const allAlerts = [...state.alerts, ...result.newAlerts].slice(0, 500);
      const allEvents = [...result.newEvents, ...state.eventLog].slice(0, 300);

      // Auto-stop demo if it goes very long
      let isDemoMode = state.simulation.isDemoMode;
      let isRunning = state.simulation.isRunning;
      if (isDemoMode && state.simulation.scenarioTick > 60) {
         isDemoMode = false;
         isRunning = false;
         if (simInterval) { clearInterval(simInterval); simInterval = null; }
      }

      set({
        sensors:        result.updatedSensors,
        substations:    result.updatedSubstations,
        masterStations: result.updatedMasterStations,
        dangerZones:    result.updatedDangerZones,
        alerts:         allAlerts,
        eventLog:       allEvents,
        envState:       result.envState,
        systemStatus:   computeSystemStatus(
          result.updatedSensors,
          result.updatedSubstations,
          result.updatedMasterStations,
          allAlerts,
        ),
        simulation: {
          ...state.simulation,
          isRunning,
          isDemoMode,
          tick: state.simulation.tick + 1,
          scenarioTick: state.simulation.scenarioTick + 1,
        },
      });
    },

    // ── Simulation Controls ───────────────────────────────────
    startSimulation: () => {
      const state = get();
      if (simInterval) return;
      const intervalMs = Math.max(500, 2000 / state.simulation.speed);
      simInterval = setInterval(() => get().tick(), intervalMs);
      set({ simulation: { ...state.simulation, isRunning: true, startedAt: new Date().toISOString() } });
    },

    pauseSimulation: () => {
      if (simInterval) { clearInterval(simInterval); simInterval = null; }
      set(state => ({ simulation: { ...state.simulation, isRunning: false, isDemoMode: false } }));
    },

    resetSimulation: () => {
      if (simInterval) { clearInterval(simInterval); simInterval = null; }
      const initialSensors = dataAdapter.getSensors();
      set({
        sensors: initialSensors,
        eventLog:  [],
        simulation: { isRunning: false, scenario: 'NORMAL', speed: 1, tick: 0, scenarioTick: 0, isDemoMode: false, rainfallIntensity: 15 },
        envState: getEnvState(),
      });
      // Do a silent propagation to reset everything
      const propagated = propagateChanges(initialSensors, dataAdapter.getSubstations(), dataAdapter.getMasterStations(), dataAdapter.getDangerZones());
      set({
        substations: propagated.substations,
        masterStations: propagated.masterStations,
        dangerZones: propagated.dangerZones,
        alerts: dataAdapter.getAlerts(),
        systemStatus: computeSystemStatus(initialSensors, propagated.substations, propagated.masterStations, dataAdapter.getAlerts()),
      });
    },

    setScenario: (scenario: SimulationScenario) => {
      const state = get();
      set({
        simulation: { ...state.simulation, scenario, scenarioTick: 0 },
      });
    },

    startDemoMode: () => {
      const state = get();
      if (simInterval) { clearInterval(simInterval); simInterval = null; }
      const intervalMs = 1500; // Force specific speed for demo
      simInterval = setInterval(() => get().tick(), intervalMs);
      set({
        simulation: { ...state.simulation, isRunning: true, isDemoMode: true, scenario: 'CRITICAL_LANDSLIDE', scenarioTick: 0, speed: 1, startedAt: new Date().toISOString() },
        eventLog: [{ id: genEventId(), timestamp: new Date().toISOString(), eventType: 'SIMULATION_EVENT', source: 'SYSTEM', message: 'DEMO MODE INITIATED: Critical Landslide Sequence', severity: 'WARNING' } as EventLog, ...state.eventLog].slice(0, 300)
      });
    },

    setSimSpeed: (speed: number) => {
      const state = get();
      if (simInterval) {
        clearInterval(simInterval);
        simInterval = null;
        const intervalMs = Math.max(500, 2000 / speed);
        simInterval = setInterval(() => get().tick(), intervalMs);
      }
      set({ simulation: { ...state.simulation, speed } });
    },

    // ── Manual Sensor Controls ────────────────────────────────
    setSensorValue: (sensorId: string, value: number) => get().setSensorTargetValue(sensorId, value),

    setSensorTargetValue: (sensorId: string, targetValue: number) => {
      const state = get();
      const sensors = state.sensors.map(s => {
        if (s.id !== sensorId) return s;
        return { ...s, targetValue };
      });
      
      const event: EventLog = {
        id: genEventId(),
        timestamp: new Date().toISOString(),
        eventType: 'MANUAL_OVERRIDE',
        source: sensorId,
        message: `Manual Override: Target set to ${targetValue}`,
        severity: 'INFO',
      };

      set({
        sensors,
        eventLog: [event, ...state.eventLog].slice(0, 300)
      });
    },

    setSensorBattery: (sensorId: string, value: number) => {
      const state = get();
      const sensors = state.sensors.map(s =>
        s.id === sensorId ? {
          ...s,
          batteryLevel: Math.max(0, Math.min(100, value)),
          healthStatus: value > 20 ? 'HEALTHY' as const : value > 10 ? 'DEGRADED' as const : 'FAULTY' as const,
        } : s
      );
      set({ sensors, systemStatus: computeSystemStatus(sensors, state.substations, state.masterStations, state.alerts) });
    },

    setSensorSignal: (sensorId: string, value: number) => {
      const state = get();
      const sensors = state.sensors.map(s =>
        s.id === sensorId ? {
          ...s,
          signalStrength: Math.max(0, Math.min(100, Math.round(value))),
          communicationStatus: value > 20 ? 'ONLINE' as const : value > 10 ? 'DEGRADED' as const : 'OFFLINE' as const,
        } : s
      );
      const propagated = propagateChanges(sensors, state.substations, state.masterStations, state.dangerZones);
      set({
        sensors,
        substations: propagated.substations,
        masterStations: propagated.masterStations,
        systemStatus: computeSystemStatus(sensors, propagated.substations, propagated.masterStations, state.alerts),
      });
    },

    setSensorOnline: (sensorId: string, online: boolean) => {
      const state = get();
      const sensors = state.sensors.map(s =>
        s.id === sensorId ? {
          ...s,
          communicationStatus: online ? 'ONLINE' as const : 'OFFLINE' as const,
          signalStrength: online ? Math.max(s.signalStrength, 50) : 0,
        } : s
      );
      const propagated = propagateChanges(sensors, state.substations, state.masterStations, state.dangerZones);
      const event: EventLog = {
        id: genEventId(),
        timestamp: new Date().toISOString(),
        eventType: 'CONNECTIVITY_CHANGE',
        source: sensorId,
        message: `${sensorId} ${online ? 'came ONLINE' : 'went OFFLINE'}`,
        severity: online ? 'INFO' : 'WARNING',
      };
      set({
        sensors,
        substations: propagated.substations,
        masterStations: propagated.masterStations,
        eventLog: [event, ...state.eventLog].slice(0, 300),
        systemStatus: computeSystemStatus(sensors, propagated.substations, propagated.masterStations, state.alerts),
      });
    },

    setSubstationOnline: (subId: string, online: boolean) => {
      const state = get();
      const substations = state.substations.map(s =>
        s.id === subId ? {
          ...s,
          communicationStatus: online ? 'ONLINE' as const : 'OFFLINE' as const,
          loraSignal: online ? Math.max(s.loraSignal, 50) : 0,
        } : s
      );
      const sub = substations.find(s => s.id === subId);
      const sensors = state.sensors.map(s => {
        if (!sub || !sub.sensorIds.includes(s.id)) return s;
        return {
          ...s,
          communicationStatus: online ? 'ONLINE' as const : 'OFFLINE' as const,
          signalStrength: online ? Math.max(s.signalStrength, 50) : 0,
        };
      });
      const propagated = propagateChanges(sensors, substations, state.masterStations, state.dangerZones);
      const event: EventLog = {
        id: genEventId(),
        timestamp: new Date().toISOString(),
        eventType: 'CONNECTIVITY_CHANGE',
        source: subId,
        message: `${subId} ${online ? 'came ONLINE' : 'went OFFLINE'} — ${sub?.sensorIds.length ?? 0} sensors affected`,
        severity: online ? 'INFO' : 'ERROR',
      };
      set({
        sensors,
        substations,
        masterStations: propagated.masterStations,
        dangerZones: propagated.dangerZones,
        eventLog: [event, ...state.eventLog].slice(0, 300),
        systemStatus: computeSystemStatus(sensors, substations, propagated.masterStations, state.alerts),
      });
    },

    setMasterOnline: (masterId: string, online: boolean) => {
      const state = get();
      const masterStations = state.masterStations.map(m =>
        m.id === masterId ? {
          ...m,
          communicationStatus: online ? 'ONLINE' as const : 'OFFLINE' as const,
          edgeConnectionStatus: online ? 'ONLINE' as const : 'OFFLINE' as const,
        } : m
      );
      const event: EventLog = {
        id: genEventId(),
        timestamp: new Date().toISOString(),
        eventType: 'CONNECTIVITY_CHANGE',
        source: masterId,
        message: `${masterId} ${online ? 'came ONLINE' : 'LOST EDGE CONNECTION'}`,
        severity: online ? 'INFO' : 'ERROR',
      };
      set({
        masterStations,
        eventLog: [event, ...state.eventLog].slice(0, 300),
        systemStatus: computeSystemStatus(state.sensors, state.substations, masterStations, state.alerts),
      });
    },

    // ── Alert Management ──────────────────────────────────────
    acknowledgeAlert: (id: string) => {
      set(state => ({ alerts: acknowledgeAlert(state.alerts, id) }));
    },
    resolveAlert: (id: string) => {
      set(state => ({ alerts: resolveAlert(state.alerts, id) }));
    },

    applySensorImport: (updatedSensors: Sensor[]) => {
      set({ sensors: updatedSensors });
    },

    // ── Clear History ────────────────────────────────────────

    clearAlertHistory: () => {
      set(state => ({ alerts: state.alerts.filter(a => !a.resolved) }));
    },
    clearDangerZoneHistory: () => {
      set(state => ({
        dangerZones: state.dangerZones.map(dz => ({
          ...dz,
          riskScore: 0,
          riskLevel: 'NORMAL' as const,
          status: 'RESOLVED' as const,
          abnormalSensorCount: 0,
          triggeringSensorIds: [],
        })),
      }));
    },

    // ── User-Driven Simulation (PLAY button) ─────────────────
    playScenario: () => {
      const state = get();
      const ts = () => new Date().toISOString();
      const events: EventLog[] = [];

      // Stage 1: Lock in sensor readings
      events.push({ id: genEventId(), timestamp: ts(), eventType: 'SENSOR_READING' as EventType, source: 'SYSTEM', message: '▶ Stage 1: Sensor readings locked in — processing prepared values', severity: 'INFO' });

      // Stage 2: Substation risk computation
      const propagated = propagateChanges(state.sensors, state.substations, state.masterStations, state.dangerZones);
      events.push({ id: genEventId(), timestamp: ts(), eventType: 'SUBSTATION_PACKET' as EventType, source: 'SYSTEM', message: '▶ Stage 2: Substation risk scores recomputed from sensor data', severity: 'INFO' });

      // Stage 3: LoRa packet transmission
      events.push({ id: genEventId(), timestamp: ts(), eventType: 'LORA_TRANSMISSION' as EventType, source: 'SYSTEM', message: '▶ Stage 3: LoRa packets transmitted to Master Stations', severity: 'INFO' });

      // Stage 4: Master Station aggregation
      events.push({ id: genEventId(), timestamp: ts(), eventType: 'MASTER_RECEIVE' as EventType, source: 'SYSTEM', message: '▶ Stage 4: Master Stations aggregating substation data', severity: 'INFO' });

      // Stage 5: Edge processing
      events.push({ id: genEventId(), timestamp: ts(), eventType: 'EDGE_PROCESS' as EventType, source: 'SYSTEM', message: '▶ Stage 5: Edge processing and data validation complete', severity: 'INFO' });

      // Stage 6: Risk engine evaluation
      const abnormalSubs = propagated.substations.filter(s => s.riskLevel !== 'NORMAL' && s.riskLevel !== 'WATCH');
      const riskSeverity = abnormalSubs.some(s => s.riskLevel === 'CRITICAL') ? 'CRITICAL' : abnormalSubs.length > 0 ? 'WARNING' : 'INFO';
      events.push({ id: genEventId(), timestamp: ts(), eventType: 'RISK_UPDATE' as EventType, source: 'RISK_ENGINE', message: `▶ Stage 6: Risk engine evaluated — ${abnormalSubs.length} substations above normal threshold`, severity: riskSeverity });

      // Stage 7: Danger zone update
      events.push({ id: genEventId(), timestamp: ts(), eventType: 'ZONE_STATUS_CHANGE' as EventType, source: 'SYSTEM', message: `▶ Stage 7: Danger zone statuses updated`, severity: 'INFO' });

      // Stage 8: Alert generation for abnormal stations
      const newAlerts: Alert[] = [];
      for (const sub of abnormalSubs) {
        const severity = sub.riskLevel === 'CRITICAL' ? 'CRITICAL' : sub.riskLevel === 'HIGH_RISK' ? 'HIGH_RISK' : 'WARNING';
        newAlerts.push({
          id: `ALT-${Date.now()}-${sub.id}`,
          severity,
          title: `${sub.id} — ${sub.riskLevel.replace('_', ' ')}`,
          message: `Risk score ${sub.riskScore}/100. Sensors at ${sub.id} show elevated readings requiring attention.`,
          timestamp: ts(),
          substationId: sub.id,
          masterStationId: sub.masterStationId,
          location: sub.name,
          acknowledged: false,
          resolved: false,
        });
        events.push({ id: genEventId(), timestamp: ts(), eventType: 'ALERT_GENERATED' as EventType, source: sub.id, message: `▶ Stage 8: Alert generated for ${sub.id} — ${severity}`, severity: severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING' });
      }

      const updatedAlerts = [...newAlerts, ...state.alerts].slice(0, 200);
      const systemStatus = computeSystemStatus(state.sensors, propagated.substations, propagated.masterStations, updatedAlerts);

      set({
        substations: propagated.substations,
        masterStations: propagated.masterStations,
        dangerZones: propagated.dangerZones,
        alerts: updatedAlerts,
        eventLog: [...events.reverse(), ...state.eventLog].slice(0, 500),
        systemStatus,
      });
    },
  };
});
