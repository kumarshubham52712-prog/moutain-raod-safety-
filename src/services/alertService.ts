/**
 * ALERT SERVICE
 * Automatically generates alerts when sensors or zones breach thresholds.
 * Also manages acknowledgement and resolution.
 */

import { Alert, Sensor, DangerZone, AlertSeverity } from '../types';
import { getNextAlertId } from '../data/mock/alerts';

function severityFromRiskLevel(riskLevel: string): AlertSeverity {
  switch (riskLevel) {
    case 'CRITICAL':  return 'CRITICAL';
    case 'HIGH_RISK': return 'HIGH_RISK';
    case 'WARNING':   return 'WARNING';
    default:          return 'INFO';
  }
}

export function generateSensorAlert(sensor: Sensor): Alert | null {
  if (sensor.riskLevel === 'NORMAL' || sensor.riskLevel === 'WATCH') return null;

  const typeLabels: Record<string, string> = {
    IPI:          'ground displacement',
    VWP:          'pore-water pressure',
    GEOPHONE:     'micro-seismic activity',
    EXTENSOMETER: 'surface displacement',
  };

  const typeLabel = typeLabels[sensor.type] ?? sensor.type;
  const severity  = severityFromRiskLevel(sensor.riskLevel);

  let title   = '';
  let message = '';

  switch (severity) {
    case 'CRITICAL':
      title   = `Critical ${sensor.type} Reading — ${sensor.id}`;
      message = `Sensor ${sensor.id} reports critical ${typeLabel} of ${sensor.currentValue.toFixed(2)} ${sensor.unit} (critical threshold: ${sensor.criticalThreshold} ${sensor.unit}). Immediate action required at ${sensor.substationId}.`;
      break;
    case 'HIGH_RISK':
      title   = `High Risk ${sensor.type} — ${sensor.id}`;
      message = `Sensor ${sensor.id} reports high ${typeLabel} of ${sensor.currentValue.toFixed(2)} ${sensor.unit} (warning threshold: ${sensor.warningThreshold} ${sensor.unit}). Inspect at ${sensor.substationId}.`;
      break;
    case 'WARNING':
    default:
      title   = `Warning: ${sensor.type} Anomaly — ${sensor.id}`;
      message = `Sensor ${sensor.id} reports elevated ${typeLabel} of ${sensor.currentValue.toFixed(2)} ${sensor.unit}. Monitoring closely at ${sensor.substationId}.`;
  }

  return {
    id:               getNextAlertId(),
    severity,
    title,
    message,
    timestamp:        new Date().toISOString(),
    sensorId:         sensor.id,
    substationId:     sensor.substationId,
    masterStationId:  sensor.masterStationId,
    location:         `${sensor.substationId}`,
    acknowledged:     false,
    resolved:         false,
  };
}

export function generateZoneAlert(zone: DangerZone): Alert | null {
  if (zone.riskLevel === 'NORMAL' || zone.riskLevel === 'WATCH') return null;

  const severity = severityFromRiskLevel(zone.riskLevel);
  let title   = '';
  let message = '';

  switch (severity) {
    case 'CRITICAL':
      title   = `CRITICAL: Danger Zone ${zone.id} — Immediate Evacuation`;
      message = `Zone ${zone.name} (${zone.id}) has reached CRITICAL risk score of ${zone.riskScore}/100. ${zone.abnormalSensorCount} sensors simultaneously abnormal. ${zone.recommendedAction}`;
      break;
    case 'HIGH_RISK':
      title   = `High Risk: Zone ${zone.id} — Access Restriction Required`;
      message = `Zone ${zone.name} (${zone.id}) risk score: ${zone.riskScore}/100. ${zone.abnormalSensorCount} abnormal sensors detected. ${zone.recommendedAction}`;
      break;
    default:
      title   = `Warning: Zone ${zone.id} — Increased Monitoring`;
      message = `Zone ${zone.name} (${zone.id}) shows elevated risk score of ${zone.riskScore}/100. ${zone.recommendedAction}`;
  }

  return {
    id:              getNextAlertId(),
    severity,
    title,
    message,
    timestamp:       new Date().toISOString(),
    dangerZoneId:    zone.id,
    masterStationId: zone.masterStationId,
    location:        zone.name,
    acknowledged:    false,
    resolved:        false,
  };
}

export function deduplicateAlerts(existing: Alert[], newAlert: Alert): boolean {
  // Don't add duplicate alerts for the same sensor/zone within 15 minutes
  const cutoff = Date.now() - 15 * 60_000;
  return existing.some(a =>
    !a.resolved &&
    a.sensorId === newAlert.sensorId &&
    a.dangerZoneId === newAlert.dangerZoneId &&
    a.severity === newAlert.severity &&
    new Date(a.timestamp).getTime() > cutoff
  );
}

export function acknowledgeAlert(alerts: Alert[], id: string, by = 'Operator'): Alert[] {
  return alerts.map(a =>
    a.id === id
      ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString(), acknowledgedBy: by }
      : a
  );
}

export function resolveAlert(alerts: Alert[], id: string): Alert[] {
  return alerts.map(a =>
    a.id === id ? { ...a, resolved: true, resolvedAt: new Date().toISOString() } : a
  );
}
