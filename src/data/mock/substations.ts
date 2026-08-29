import { Substation } from '../../types';
import { SUBSTATION_POSITIONS } from '../../config/geography';

const now = () => new Date().toISOString();

const makeSubstation = (
  id: string,
  sensorIds: string[],
  loraSignal: number,
  battery: number,
  packetsReceived: number,
  riskScore: number,
): Substation => {
  const pos = SUBSTATION_POSITIONS[id];
  const riskLevel = riskScore >= 86 ? 'CRITICAL'
    : riskScore >= 71 ? 'HIGH_RISK'
    : riskScore >= 51 ? 'WARNING'
    : riskScore >= 31 ? 'WATCH'
    : 'NORMAL';

  return {
    id,
    name: `Substation ${id}`,
    masterStationId: 'MASTER-01',
    latitude: pos.lat,
    longitude: pos.lon,
    sensorIds,
    loraSignal,
    loraFrequency: '868 MHz',
    communicationStatus: loraSignal > 30 ? 'ONLINE' : loraSignal > 15 ? 'DEGRADED' : 'OFFLINE',
    lastSync: now(),
    batteryLevel: battery,
    solarCharging: battery > 60,
    powerStatus: battery > 80 ? 'SOLAR' : battery > 40 ? 'BATTERY' : 'MAINS',
    packetsReceived,
    packetsLost: Math.round(packetsReceived * (1 - loraSignal / 100) * 0.05),
    dataRate: parseFloat((loraSignal / 100 * 5.2).toFixed(1)),
    riskLevel,
    riskScore,
    processorLoad: Math.round(20 + riskScore * 0.4),
    storageUsed: Math.round(150 + packetsReceived * 0.02),
  };
};

export const INITIAL_SUBSTATIONS: Substation[] = [
  makeSubstation('SUB-01', ['IPI-001', 'VWP-001', 'GEO-001'],             87, 92, 18420, 22),
  makeSubstation('SUB-02', ['IPI-002', 'VWP-002', 'EXT-001'],             79, 85, 17350, 31),
  makeSubstation('SUB-03', ['IPI-003', 'VWP-003', 'GEO-002'],             71, 78, 15800, 58),
  makeSubstation('SUB-04', ['IPI-004', 'VWP-004', 'EXT-002'],             63, 68, 14200, 73),
  makeSubstation('SUB-05', ['IPI-005', 'VWP-005', 'GEO-003'],             81, 87, 16500, 25),
  makeSubstation('SUB-06', ['IPI-006', 'VWP-006', 'EXT-003'],             88, 93, 19100, 18),
  makeSubstation('SUB-07', ['GEO-004', 'VWP-007', 'EXT-004'],             52, 58, 12400, 82),
  makeSubstation('SUB-08', ['IPI-007', 'GEO-005', 'EXT-005'],             70, 76, 15200, 45),
  makeSubstation('SUB-09', ['IPI-008', 'VWP-008', 'GEO-006'],             79, 84, 16800, 38),
  makeSubstation('SUB-10', ['GEO-007', 'VWP-009', 'EXT-006', 'EXT-007'], 85, 90, 17900, 20),
];

export const getSubstationById = (id: string): Substation | undefined =>
  INITIAL_SUBSTATIONS.find(s => s.id === id);
