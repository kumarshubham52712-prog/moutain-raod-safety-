// ============================================================
// MOUNTAIN LANDSLIDE & SLOPE STABILITY MONITORING SYSTEM
// Core TypeScript Type Definitions
// ============================================================

// ── Enumerations ─────────────────────────────────────────────

export type SensorType = 'IPI' | 'VWP' | 'GEOPHONE' | 'EXTENSOMETER';

export type RiskLevel = 'NORMAL' | 'WATCH' | 'WARNING' | 'HIGH_RISK' | 'CRITICAL';

export type CommunicationStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNKNOWN';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'FAULTY' | 'MAINTENANCE';

export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH_RISK' | 'CRITICAL';

export type SimulationScenario = 'A' | 'B' | 'C' | 'D' | 'E';

// ── Core Sensor Data ─────────────────────────────────────────

export interface SensorReading {
  value: number;
  unit: string;
  timestamp: string; // ISO 8601
}

export interface SensorHistory {
  readings: SensorReading[];
  maxPoints: number; // sliding window size
}

export interface Sensor {
  id: string;                         // e.g. "IPI-001"
  type: SensorType;
  name: string;                       // human-readable
  substationId: string;
  masterStationId: string;
  latitude: number;
  longitude: number;

  // Current state
  currentValue: number;
  unit: string;
  timestamp: string;

  // Hardware health
  batteryLevel: number;               // 0–100
  signalStrength: number;             // 0–100 dBm mapped
  communicationStatus: CommunicationStatus;
  healthStatus: HealthStatus;

  // Thresholds
  normalMin: number;
  normalMax: number;
  warningThreshold: number;
  criticalThreshold: number;

  // Computed
  riskLevel: RiskLevel;
  isAbnormal: boolean;

  // Historical readings (time-series)
  history: SensorReading[];
}

// ── Substation / Edge Station ────────────────────────────────

export interface Substation {
  id: string;                         // e.g. "SUB-01"
  name: string;
  masterStationId: string;
  latitude: number;
  longitude: number;

  // Connected sensors
  sensorIds: string[];

  // Communication
  loraSignal: number;                 // 0–100
  loraFrequency: string;              // e.g. "868 MHz"
  communicationStatus: CommunicationStatus;
  lastSync: string;

  // Health
  batteryLevel: number;
  solarCharging: boolean;
  powerStatus: 'MAINS' | 'SOLAR' | 'BATTERY' | 'OFFLINE';

  // Telemetry
  packetsReceived: number;
  packetsLost: number;
  dataRate: number;                   // kbps

  // Computed risk
  riskLevel: RiskLevel;
  riskScore: number;

  // Edge processing info
  processorLoad: number;              // 0–100
  storageUsed: number;               // MB
}

// ── Master Station ───────────────────────────────────────────

export interface MasterStation {
  id: string;                         // e.g. "MASTER-01"
  name: string;
  location: string;
  latitude: number;
  longitude: number;

  // Connected substations
  substationIds: string[];

  // Aggregated stats
  totalSensors: number;
  onlineSensors: number;
  offlineSensors: number;
  warningSensors: number;
  criticalSensors: number;

  // Communication
  communicationStatus: CommunicationStatus;
  lastSync: string;
  dataRate: number;                   // Mbps to cloud
  uptime: number;                     // percentage

  // Risk aggregation
  aggregatedRiskScore: number;
  riskLevel: RiskLevel;

  // Network health
  loraNetworkHealth: number;          // 0–100
  packetsProcessed: number;
  packetsDropped: number;
}

// ── Danger Zones ─────────────────────────────────────────────

export interface DangerZone {
  id: string;                         // e.g. "DZ-01"
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  radius: number;                     // meters

  // Risk state
  riskScore: number;
  riskLevel: RiskLevel;
  status: 'ACTIVE' | 'RESOLVED' | 'MONITORING';

  // Triggering information
  triggeringSensorIds: string[];
  abnormalSensorCount: number;
  timeDetected: string;
  lastUpdated: string;

  // Actions
  recommendedAction: string;
  evacuationRadius: number;           // meters

  // Boundary polygon (for map overlay)
  boundary?: [number, number][];      // [lat, lon] pairs
}

// ── Alerts ───────────────────────────────────────────────────

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;

  // Source
  sensorId?: string;
  substationId?: string;
  masterStationId?: string;
  dangerZoneId?: string;
  location: string;

  // State
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolved: boolean;
  resolvedAt?: string;
}

// ── Risk Score Explanation ────────────────────────────────────

export type ContributionLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface RiskContributor {
  sensorId: string;
  sensorType: SensorType;
  contributionLevel: ContributionLevel;
  contributionPoints: number;
  currentValue: number;
  unit: string;
  reason: string;
}

export interface RiskAssessment {
  zoneId: string;
  timestamp: string;
  overallScore: number;
  riskLevel: RiskLevel;
  contributors: RiskContributor[];
  summary: string;
}

// ── Event Log (Pipeline Events) ──────────────────────────────

export type EventType =
  | 'SENSOR_READING'
  | 'SENSOR_ALERT'
  | 'SUBSTATION_PACKET'
  | 'LORA_TRANSMISSION'
  | 'MASTER_RECEIVE'
  | 'EDGE_PROCESS'
  | 'RISK_UPDATE'
  | 'ZONE_STATUS_CHANGE'
  | 'ALERT_GENERATED'
  | 'SIMULATION_EVENT';

export interface EventLog {
  id: string;
  timestamp: string;
  eventType: EventType;
  source: string;           // e.g. "IPI-004", "SUB-02", "MASTER-01"
  destination?: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  metadata?: Record<string, unknown>;
}

// ── Simulation State ─────────────────────────────────────────

export interface SimulationState {
  isRunning: boolean;
  scenario: SimulationScenario;
  speed: number;                      // 1x, 2x, 5x
  tick: number;
  rainfallIntensity: number;          // 0–100 hidden driver
  startedAt?: string;
}

// ── Aggregated System Status ──────────────────────────────────

export interface SystemStatus {
  totalSensors: number;
  onlineSensors: number;
  offlineSensors: number;
  degradedSensors: number;
  totalSubstations: number;
  onlineSubstations: number;
  totalMasterStations: number;
  activeWarnings: number;
  criticalAlerts: number;
  overallRiskLevel: RiskLevel;
  overallRiskScore: number;
  lastUpdated: string;
}

// ── Data Import ───────────────────────────────────────────────

export interface ImportedSensorRecord {
  sensor_id: string;
  sensor_type: SensorType;
  substation_id: string;
  master_station_id: string;
  timestamp: string;
  value: number;
  unit: string;
  battery?: number;
  signal?: number;
  latitude?: number;
  longitude?: number;
}

export interface ImportResult {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: string[];
  preview: ImportedSensorRecord[];
}

// ── Sensor Type Metadata ──────────────────────────────────────

export interface SensorTypeConfig {
  type: SensorType;
  label: string;
  description: string;
  unit: string;
  normalMin: number;
  normalMax: number;
  warningThreshold: number;
  criticalThreshold: number;
  color: string;
  icon: string;
  measurementDescription: string;
}
