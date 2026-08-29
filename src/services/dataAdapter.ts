/**
 * DATA ADAPTER
 *
 * Central access point for all data.
 * Currently wired to mock/simulation data.
 *
 * TO SWITCH TO REAL API:
 * 1. Set DATA_SOURCE = 'api'
 * 2. Fill in the API_BASE_URL and WS_URL
 * 3. The rest of the app requires no changes.
 */

import { INITIAL_SENSORS }          from '../data/mock/sensors';
import { INITIAL_SUBSTATIONS }      from '../data/mock/substations';
import { INITIAL_MASTER_STATION }   from '../data/mock/masterStation';
import { INITIAL_DANGER_ZONES }     from '../data/mock/dangerZones';
import { INITIAL_ALERTS }           from '../data/mock/alerts';
import type { ImportedSensorRecord, Sensor, ImportResult } from '../types';
import { SENSOR_TYPE_CONFIGS }      from '../config/sensorTypes';

export type DataSource = 'mock' | 'api' | 'websocket';

export const DATA_SOURCE: DataSource = 'mock';

// Fill these when connecting to real hardware:
// export const API_BASE_URL = 'https://your-edge-server/api/v1';
// export const WS_URL       = 'wss://your-edge-server/ws/live';

export const dataAdapter = {
  getSensors:       () => structuredClone(INITIAL_SENSORS),
  getSubstations:   () => structuredClone(INITIAL_SUBSTATIONS),
  getMasterStation: () => structuredClone(INITIAL_MASTER_STATION),
  getDangerZones:   () => structuredClone(INITIAL_DANGER_ZONES),
  getAlerts:        () => structuredClone(INITIAL_ALERTS),

  // Validate and parse imported sensor records
  validateImport(records: unknown[]): ImportResult {
    const valid:   ImportedSensorRecord[] = [];
    const errors:  string[] = [];

    records.forEach((rec, i) => {
      const r = rec as Record<string, unknown>;
      const missing: string[] = [];

      if (!r.sensor_id)      missing.push('sensor_id');
      if (!r.sensor_type)    missing.push('sensor_type');
      if (!r.substation_id)  missing.push('substation_id');
      if (!r.timestamp)      missing.push('timestamp');
      if (r.value === undefined) missing.push('value');

      if (missing.length > 0) {
        errors.push(`Row ${i + 1}: missing fields: ${missing.join(', ')}`);
        return;
      }

      const type = String(r.sensor_type).toUpperCase();
      if (!['IPI', 'VWP', 'GEOPHONE', 'EXTENSOMETER'].includes(type)) {
        errors.push(`Row ${i + 1}: unknown sensor_type "${r.sensor_type}"`);
        return;
      }

      const cfg = SENSOR_TYPE_CONFIGS[type];
      valid.push({
        sensor_id:         String(r.sensor_id),
        sensor_type:       type as ImportedSensorRecord['sensor_type'],
        substation_id:     String(r.substation_id),
        master_station_id: String(r.master_station_id ?? 'MASTER-01'),
        timestamp:         String(r.timestamp),
        value:             Number(r.value),
        unit:              String(r.unit ?? cfg.unit),
        battery:           r.battery !== undefined ? Number(r.battery) : undefined,
        signal:            r.signal  !== undefined ? Number(r.signal)  : undefined,
        latitude:          r.latitude  !== undefined ? Number(r.latitude)  : undefined,
        longitude:         r.longitude !== undefined ? Number(r.longitude) : undefined,
      });
    });

    return {
      totalRecords:   records.length,
      validRecords:   valid.length,
      invalidRecords: errors.length,
      errors,
      preview:        valid.slice(0, 20),
    };
  },

  // Apply imported records to existing sensor list
  applyImport(sensors: Sensor[], records: ImportedSensorRecord[]): Sensor[] {
    const updated = [...sensors];
    records.forEach(rec => {
      const idx = updated.findIndex(s => s.id === rec.sensor_id);
      if (idx >= 0) {
        const cfg = SENSOR_TYPE_CONFIGS[rec.sensor_type];
        updated[idx] = {
          ...updated[idx],
          currentValue: rec.value,
          timestamp:    rec.timestamp,
          batteryLevel: rec.battery ?? updated[idx].batteryLevel,
          signalStrength: rec.signal ?? updated[idx].signalStrength,
          riskLevel: rec.value >= cfg.criticalThreshold ? 'CRITICAL'
            : rec.value >= cfg.warningThreshold ? 'HIGH_RISK'
            : rec.value >= cfg.normalMax * 0.8  ? 'WATCH'
            : 'NORMAL',
          isAbnormal: rec.value > cfg.warningThreshold,
        };
      }
    });
    return updated;
  },
};
