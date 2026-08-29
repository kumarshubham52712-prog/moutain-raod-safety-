import { RiskLevel } from '../types';

export interface RiskLevelConfig {
  level: RiskLevel;
  label: string;
  minScore: number;
  maxScore: number;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  glowClass: string;
  description: string;
  action: string;
}

export const RISK_LEVEL_CONFIGS: RiskLevelConfig[] = [
  {
    level: 'NORMAL',
    label: 'Normal',
    minScore: 0,
    maxScore: 30,
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    textColor: '#22c55e',
    glowClass: 'shadow-glow-green',
    description: 'All parameters within normal range. No action required.',
    action: 'Continue routine monitoring',
  },
  {
    level: 'WATCH',
    label: 'Watch',
    minScore: 31,
    maxScore: 50,
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    textColor: '#3b82f6',
    glowClass: 'shadow-glow-blue',
    description: 'Minor deviations detected. Increased monitoring recommended.',
    action: 'Increase monitoring frequency',
  },
  {
    level: 'WARNING',
    label: 'Warning',
    minScore: 51,
    maxScore: 70,
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.1)',
    borderColor: 'rgba(234, 179, 8, 0.4)',
    textColor: '#eab308',
    glowClass: 'shadow-glow-yellow',
    description: 'Significant parameter deviations. Immediate inspection required.',
    action: 'Inspect affected area; alert local authorities',
  },
  {
    level: 'HIGH_RISK',
    label: 'High Risk',
    minScore: 71,
    maxScore: 85,
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    textColor: '#f97316',
    glowClass: 'shadow-glow-orange',
    description: 'Multiple anomalies detected. High probability of slope instability.',
    action: 'Restrict access; prepare evacuation plan',
  },
  {
    level: 'CRITICAL',
    label: 'Critical',
    minScore: 86,
    maxScore: 100,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    textColor: '#ef4444',
    glowClass: 'shadow-glow-red',
    description: 'Imminent landslide risk. Critical multi-sensor anomalies confirmed.',
    action: 'EVACUATE immediately; notify emergency services',
  },
];

export const getRiskLevelConfig = (level: RiskLevel): RiskLevelConfig => {
  return RISK_LEVEL_CONFIGS.find(c => c.level === level) ?? RISK_LEVEL_CONFIGS[0];
};

export const getRiskLevelFromScore = (score: number): RiskLevel => {
  for (const cfg of RISK_LEVEL_CONFIGS) {
    if (score >= cfg.minScore && score <= cfg.maxScore) return cfg.level;
  }
  return 'NORMAL';
};
