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
    color: '#15803d',
    bgColor: 'rgba(21, 128, 61, 0.05)',
    borderColor: 'rgba(21, 128, 61, 0.2)',
    textColor: '#15803d',
    glowClass: '',
    description: 'All parameters within normal range. No action required.',
    action: 'Continue routine monitoring',
  },
  {
    level: 'WATCH',
    label: 'Watch',
    minScore: 31,
    maxScore: 50,
    color: '#2563eb',
    bgColor: 'rgba(37, 99, 235, 0.05)',
    borderColor: 'rgba(37, 99, 235, 0.2)',
    textColor: '#2563eb',
    glowClass: '',
    description: 'Minor deviations detected. Increased monitoring recommended.',
    action: 'Increase monitoring frequency',
  },
  {
    level: 'WARNING',
    label: 'Warning',
    minScore: 51,
    maxScore: 70,
    color: '#d97706',
    bgColor: 'rgba(217, 119, 6, 0.05)',
    borderColor: 'rgba(217, 119, 6, 0.2)',
    textColor: '#d97706',
    glowClass: '',
    description: 'Significant parameter deviations. Immediate inspection required.',
    action: 'Inspect affected area; alert local authorities',
  },
  {
    level: 'HIGH_RISK',
    label: 'High Risk',
    minScore: 71,
    maxScore: 85,
    color: '#ea580c',
    bgColor: 'rgba(234, 88, 12, 0.05)',
    borderColor: 'rgba(234, 88, 12, 0.2)',
    textColor: '#ea580c',
    glowClass: '',
    description: 'Multiple anomalies detected. High probability of slope instability.',
    action: 'Restrict access; prepare evacuation plan',
  },
  {
    level: 'CRITICAL',
    label: 'Critical',
    minScore: 86,
    maxScore: 100,
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.05)',
    borderColor: 'rgba(220, 38, 38, 0.2)',
    textColor: '#dc2626',
    glowClass: '',
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
