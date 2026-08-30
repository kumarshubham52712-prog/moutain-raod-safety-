import { SensorTypeConfig } from '../types';

// ────────────────────────────────────────────────────────────────
// DEMO THRESHOLDS — configurable for prototype simulation
// These are NOT scientifically validated Dehradun landslide thresholds.
// Real deployment values depend on instrument, installation, slope
// geology, baseline behaviour, and site-specific conditions.
// ────────────────────────────────────────────────────────────────

export const SENSOR_TYPE_CONFIGS: Record<string, SensorTypeConfig> = {
  IPI: {
    type: 'IPI',
    label: 'In-Place Inclinometer',
    description: 'Measures deep ground/slope movement, tilt, and displacement along a borehole.',
    unit: 'mm',
    normalMin: -2,
    normalMax: 2,
    warningThreshold: 5,
    highRiskThreshold: 10,
    criticalThreshold: 15,
    color: '#8b5cf6',
    icon: 'Activity',
    measurementDescription: 'Ground Displacement',
  },
  VWP: {
    type: 'VWP',
    label: 'Vibrating Wire Piezometer',
    description: 'Measures pore-water pressure inside the ground/slope.',
    unit: 'kPa',
    normalMin: 0,
    normalMax: 50,
    warningThreshold: 80,
    highRiskThreshold: 100,
    criticalThreshold: 120,
    color: '#06b6d4',
    icon: 'Droplets',
    measurementDescription: 'Pore-Water Pressure',
  },
  GEOPHONE: {
    type: 'GEOPHONE',
    label: 'Micro-Seismic Geophone',
    description: 'Detects micro-seismic activity, rock cracking, and ground vibration events.',
    unit: 'mm/s',
    normalMin: 0,
    normalMax: 0.5,
    warningThreshold: 1.5,
    highRiskThreshold: 3.0,
    criticalThreshold: 5.0,
    color: '#f59e0b',
    icon: 'Radio',
    measurementDescription: 'Peak Ground Velocity',
  },
  EXTENSOMETER: {
    type: 'EXTENSOMETER',
    label: 'Wireline Extensometer',
    description: 'Measures surface displacement, crack opening, and slope deformation.',
    unit: 'mm',
    normalMin: 0,
    normalMax: 3,
    warningThreshold: 8,
    highRiskThreshold: 14,
    criticalThreshold: 20,
    color: '#ec4899',
    icon: 'Ruler',
    measurementDescription: 'Surface Displacement',
  },
};

export const getSensorTypeConfig = (type: string): SensorTypeConfig => {
  return SENSOR_TYPE_CONFIGS[type] ?? SENSOR_TYPE_CONFIGS['IPI'];
};
