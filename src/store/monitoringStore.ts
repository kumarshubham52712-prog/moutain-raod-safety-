import { create } from 'zustand';
import {
  Sensor, Substation, MasterStation, DangerZone,
  Alert, EventLog, SimulationState, SystemStatus, SimulationScenario
} from '../types';
import { dataAdapter }                 from '../services/dataAdapter';
import { simulationTick, applyScenario, getEnvState } from '../services/simulationEngine';
import { acknowledgeAlert, resolveAlert } from '../services/alertService';
import { getRiskLevelFromScore }        from '../config/thresholds';
import type { EnvState }               from '../services/simulationEngine';

// ── Store State Interface ─────────────────────────────────────

interface MonitoringState {
  sensors:       Sensor[];
  substations:   Substation[];
  masterStation: MasterStation;
  dangerZones:   DangerZone[];
  alerts:        Alert[];
  eventLog:      EventLog[];
  simulation:    SimulationState;
  envState:      EnvState;
  systemStatus:  SystemStatus;

  // Simulation control
  startSimulation:  () => void;
  pauseSimulation:  () => void;
  resetSimulation:  () => void;
  setScenario:      (scenario: SimulationScenario) => void;
  setSimSpeed:      (speed: number) => void;
  tick:             () => void;

  // Alert management
  acknowledgeAlert: (id: string) => void;
  resolveAlert:     (id: string) => void;

  // Data import
  applySensorImport: (sensors: Sensor[]) => void;
}

// ── Helpers ───────────────────────────────────────────────────

function computeSystemStatus(
  sensors: Sensor[],
  substations: Substation[],
  masterStation: MasterStation,
  alerts: Alert[]
): SystemStatus {
  const online    = sensors.filter(s => s.communicationStatus === 'ONLINE').length;
  const offline   = sensors.filter(s => s.communicationStatus === 'OFFLINE').length;
  const degraded  = sensors.filter(s => s.communicationStatus === 'DEGRADED').length;
  const warnings  = alerts.filter(a => !a.resolved && (a.severity === 'WARNING' || a.severity === 'HIGH_RISK')).length;
  const criticals = alerts.filter(a => !a.resolved && a.severity === 'CRITICAL').length;

  return {
    totalSensors:         sensors.length,
    onlineSensors:        online,
    offlineSensors:       offline,
    degradedSensors:      degraded,
    totalSubstations:     substations.length,
    onlineSubstations:    substations.filter(s => s.communicationStatus === 'ONLINE').length,
    totalMasterStations:  1,
    activeWarnings:       warnings,
    criticalAlerts:       criticals,
    overallRiskLevel:     getRiskLevelFromScore(masterStation.aggregatedRiskScore),
    overallRiskScore:     masterStation.aggregatedRiskScore,
    lastUpdated:          new Date().toISOString(),
  };
}

// ── Store ─────────────────────────────────────────────────────

let simInterval: ReturnType<typeof setInterval> | null = null;

export const useMonitoringStore = create<MonitoringState>((set, get) => {
  const sensors       = dataAdapter.getSensors();
  const substations   = dataAdapter.getSubstations();
  const masterStation = dataAdapter.getMasterStation();
  const dangerZones   = dataAdapter.getDangerZones();
  const alerts        = dataAdapter.getAlerts();
  const envState      = getEnvState();

  const initialSimulation: SimulationState = {
    isRunning: false,
    scenario:  'A',
    speed:     1,
    tick:      0,
    rainfallIntensity: envState.rainfallIntensity,
  };

  return {
    sensors,
    substations,
    masterStation,
    dangerZones,
    alerts,
    eventLog:  [],
    simulation: initialSimulation,
    envState,
    systemStatus: computeSystemStatus(sensors, substations, masterStation, alerts),

    // ── Tick ──────────────────────────────────────────────────
    tick: () => {
      const state = get();
      const result = simulationTick(
        state.sensors,
        state.substations,
        state.masterStation,
        state.dangerZones,
        state.alerts,
        state.simulation.speed,
      );

      const allAlerts = [...state.alerts, ...result.newAlerts].slice(0, 500);
      const allEvents = [...result.newEvents, ...state.eventLog].slice(0, 200);

      set({
        sensors:       result.updatedSensors,
        substations:   result.updatedSubstations,
        masterStation: result.updatedMasterStation,
        dangerZones:   result.updatedDangerZones,
        alerts:        allAlerts,
        eventLog:      allEvents,
        envState:      result.envState,
        systemStatus:  computeSystemStatus(
          result.updatedSensors,
          result.updatedSubstations,
          result.updatedMasterStation,
          allAlerts,
        ),
        simulation: {
          ...state.simulation,
          tick: state.simulation.tick + 1,
        },
      });
    },

    // ── Simulation Controls ───────────────────────────────────
    startSimulation: () => {
      const state = get();
      if (simInterval) return;
      const intervalMs = Math.max(500, 3000 / state.simulation.speed);
      simInterval = setInterval(() => get().tick(), intervalMs);
      set({ simulation: { ...state.simulation, isRunning: true, startedAt: new Date().toISOString() } });
    },

    pauseSimulation: () => {
      if (simInterval) { clearInterval(simInterval); simInterval = null; }
      set(state => ({ simulation: { ...state.simulation, isRunning: false } }));
    },

    resetSimulation: () => {
      if (simInterval) { clearInterval(simInterval); simInterval = null; }
      const sensors       = dataAdapter.getSensors();
      const substations   = dataAdapter.getSubstations();
      const masterStation = dataAdapter.getMasterStation();
      const dangerZones   = dataAdapter.getDangerZones();
      const alerts        = dataAdapter.getAlerts();
      set({
        sensors,
        substations,
        masterStation,
        dangerZones,
        alerts,
        eventLog:  [],
        envState:  getEnvState(),
        simulation: { isRunning: false, scenario: 'A', speed: 1, tick: 0, rainfallIntensity: 15 },
        systemStatus: computeSystemStatus(sensors, substations, masterStation, alerts),
      });
    },

    setScenario: (scenario: SimulationScenario) => {
      const state    = get();
      const patched  = applyScenario(state.sensors, scenario);
      set({
        sensors: patched,
        simulation: { ...state.simulation, scenario },
      });
    },

    setSimSpeed: (speed: number) => {
      const state = get();
      if (simInterval) {
        clearInterval(simInterval);
        simInterval = null;
        const intervalMs = Math.max(500, 3000 / speed);
        simInterval = setInterval(() => get().tick(), intervalMs);
      }
      set({ simulation: { ...state.simulation, speed } });
    },

    // ── Alert Management ──────────────────────────────────────
    acknowledgeAlert: (id: string) => {
      set(state => ({
        alerts: acknowledgeAlert(state.alerts, id),
      }));
    },

    resolveAlert: (id: string) => {
      set(state => ({
        alerts: resolveAlert(state.alerts, id),
      }));
    },

    // ── Data Import ───────────────────────────────────────────
    applySensorImport: (updatedSensors: Sensor[]) => {
      const state = get();
      set({
        sensors: updatedSensors,
        systemStatus: computeSystemStatus(updatedSensors, state.substations, state.masterStation, state.alerts),
      });
    },
  };
});
