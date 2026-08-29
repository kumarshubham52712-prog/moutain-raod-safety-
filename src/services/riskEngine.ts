/**
 * RULE-BASED RISK ENGINE
 *
 * Transparent scoring system. No black-box ML model.
 * Each sensor contributes a scored amount based on deviation from normal range.
 * Contributions are weighted by sensor type importance and summed to produce a zone score.
 *
 * Score bands:
 *   0–30:   NORMAL
 *   31–50:  WATCH
 *   51–70:  WARNING
 *   71–85:  HIGH_RISK
 *   86–100: CRITICAL
 */

import { Sensor, RiskAssessment, RiskContributor, RiskLevel, ContributionLevel } from '../types';
import { getRiskLevelFromScore } from '../config/thresholds';

// Sensor type risk weights (importance to slope instability)
const SENSOR_WEIGHTS: Record<string, number> = {
  IPI:         1.0,   // Ground displacement — primary indicator
  VWP:         0.85,  // Pore-water pressure — leading indicator
  GEOPHONE:    0.75,  // Micro-seismic — rapid event indicator
  EXTENSOMETER:0.9,   // Surface displacement — visible deformation
};

// Maximum points a single sensor can contribute
const MAX_SENSOR_POINTS = 30;

function getContributionLevel(normalizedDeviation: number): ContributionLevel {
  if (normalizedDeviation >= 2.0)  return 'CRITICAL';
  if (normalizedDeviation >= 1.0)  return 'HIGH';
  if (normalizedDeviation >= 0.4)  return 'MODERATE';
  return 'LOW';
}

function getContributionPoints(level: ContributionLevel): number {
  switch (level) {
    case 'CRITICAL':  return 30;
    case 'HIGH':      return 20;
    case 'MODERATE':  return 10;
    case 'LOW':       return 2;
  }
}

function getContributionReason(
  sensor: Sensor,
  deviation: number,
  level: ContributionLevel
): string {
  const typeLabels: Record<string, string> = {
    IPI:          'Ground displacement',
    VWP:          'Pore-water pressure',
    GEOPHONE:     'Peak ground velocity',
    EXTENSOMETER: 'Surface displacement',
  };
  const typeLabel = typeLabels[sensor.type] ?? sensor.type;
  const pct = Math.round(deviation * 100);

  switch (level) {
    case 'CRITICAL':
      return `${typeLabel} ${pct}% above critical threshold — immediate risk`;
    case 'HIGH':
      return `${typeLabel} ${pct}% above warning threshold — significant deviation`;
    case 'MODERATE':
      return `${typeLabel} elevated, approaching warning level`;
    case 'LOW':
      return `${typeLabel} within acceptable range`;
  }
}

export function calculateSensorRiskContribution(sensor: Sensor): RiskContributor {
  const range = sensor.criticalThreshold - sensor.normalMax;
  const deviation = range > 0
    ? Math.max(0, (sensor.currentValue - sensor.normalMax)) / range
    : 0;

  const level    = getContributionLevel(deviation);
  const rawPts   = getContributionPoints(level);
  const weighted = rawPts * (SENSOR_WEIGHTS[sensor.type] ?? 1.0);

  return {
    sensorId:          sensor.id,
    sensorType:        sensor.type,
    contributionLevel: level,
    contributionPoints: Math.round(weighted),
    currentValue:      sensor.currentValue,
    unit:              sensor.unit,
    reason:            getContributionReason(sensor, deviation, level),
  };
}

export function calculateZoneRiskScore(sensors: Sensor[]): number {
  if (sensors.length === 0) return 0;

  const contributors = sensors.map(calculateSensorRiskContribution);
  const totalPoints  = contributors.reduce((acc, c) => acc + c.contributionPoints, 0);
  const maxPossible  = sensors.length * MAX_SENSOR_POINTS;

  // Normalize to 0–100
  const raw = maxPossible > 0 ? (totalPoints / maxPossible) * 100 : 0;

  // Bonus: multi-sensor correlation (>2 HIGH/CRITICAL sensors = +10 pts)
  const highCount = contributors.filter(c => c.contributionLevel === 'HIGH' || c.contributionLevel === 'CRITICAL').length;
  const correlationBonus = highCount >= 3 ? 10 : highCount === 2 ? 5 : 0;

  return Math.min(100, Math.round(raw + correlationBonus));
}

export function buildRiskAssessment(zoneId: string, sensors: Sensor[]): RiskAssessment {
  const contributors = sensors.map(calculateSensorRiskContribution);
  const score        = calculateZoneRiskScore(sensors);
  const riskLevel: RiskLevel = getRiskLevelFromScore(score);

  const highCount    = contributors.filter(c => c.contributionLevel === 'HIGH' || c.contributionLevel === 'CRITICAL').length;
  const critCount    = contributors.filter(c => c.contributionLevel === 'CRITICAL').length;

  let summary = '';
  if (score <= 30) {
    summary = `Zone ${zoneId}: All ${sensors.length} sensors within normal parameters. No immediate risk.`;
  } else if (score <= 50) {
    summary = `Zone ${zoneId}: Minor deviations detected in ${highCount} sensor(s). Increased monitoring recommended.`;
  } else if (score <= 70) {
    summary = `Zone ${zoneId}: ${highCount} sensor(s) showing significant anomalies. Site inspection required.`;
  } else if (score <= 85) {
    summary = `Zone ${zoneId}: HIGH RISK — ${highCount} sensors abnormal. Restrict access; prepare contingency response.`;
  } else {
    summary = `Zone ${zoneId}: CRITICAL — ${critCount} sensors at critical levels, ${highCount} total abnormal. EVACUATE and notify emergency services immediately.`;
  }

  return {
    zoneId,
    timestamp:    new Date().toISOString(),
    overallScore: score,
    riskLevel,
    contributors: contributors.sort((a, b) => b.contributionPoints - a.contributionPoints),
    summary,
  };
}
