import { Substation } from '../../types';
import { SUBSTATION_POSITIONS, SUBSTATION_MASTER_MAP } from '../../config/geography';

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
  const masterId = SUBSTATION_MASTER_MAP[id] ?? 'MASTER-01';
  const riskLevel = riskScore >= 86 ? 'CRITICAL'
    : riskScore >= 71 ? 'HIGH_RISK'
    : riskScore >= 51 ? 'WARNING'
    : riskScore >= 31 ? 'WATCH'
    : 'NORMAL';

  return {
    id,
    name: `Substation ${id}`,
    masterStationId: masterId,
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

// Helper to generate sensor IDs for a substation (4 sensors each: IPI, VWP, GEO, EXT)
function sensorIdsForSub(subNum: number): string[] {
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    `IPI-${pad(subNum)}`,
    `VWP-${pad(subNum)}`,
    `GEO-${pad(subNum)}`,
    `EXT-${pad(subNum)}`,
  ];
}

export const INITIAL_SUBSTATIONS: Substation[] = [
  // ── MASTER-01 (SUB-02 to SUB-10) ── MASTER-01 itself handles local monitoring ──
  makeSubstation('SUB-02', sensorIdsForSub(2),  79, 85, 17350, 31),
  makeSubstation('SUB-03', sensorIdsForSub(3),  71, 78, 15800, 58),
  makeSubstation('SUB-04', sensorIdsForSub(4),  63, 68, 14200, 73),
  makeSubstation('SUB-05', sensorIdsForSub(5),  81, 87, 16500, 25),
  makeSubstation('SUB-06', sensorIdsForSub(6),  88, 93, 19100, 18),
  makeSubstation('SUB-07', sensorIdsForSub(7),  52, 58, 12400, 82),
  makeSubstation('SUB-08', sensorIdsForSub(8),  70, 76, 15200, 45),
  makeSubstation('SUB-09', sensorIdsForSub(9),  79, 84, 16800, 38),
  makeSubstation('SUB-10', sensorIdsForSub(10), 85, 90, 17900, 20),

  // ── MASTER-02 (SUB-12 to SUB-20) ── MASTER-02 itself handles local monitoring ──
  makeSubstation('SUB-12', sensorIdsForSub(12), 75, 80, 15100, 42),
  makeSubstation('SUB-13', sensorIdsForSub(13), 68, 73, 14500, 55),
  makeSubstation('SUB-14', sensorIdsForSub(14), 84, 91, 17800, 20),
  makeSubstation('SUB-15', sensorIdsForSub(15), 77, 82, 16000, 35),
  makeSubstation('SUB-16', sensorIdsForSub(16), 70, 75, 14800, 48),
  makeSubstation('SUB-17', sensorIdsForSub(17), 86, 94, 18200, 15),
  makeSubstation('SUB-18', sensorIdsForSub(18), 73, 78, 15500, 40),
  makeSubstation('SUB-19', sensorIdsForSub(19), 80, 86, 16700, 32),
  makeSubstation('SUB-20', sensorIdsForSub(20), 88, 92, 17400, 18),

  // ── MASTER-03 (SUB-22 to SUB-30) ── MASTER-03 itself handles local monitoring ──
  makeSubstation('SUB-22', sensorIdsForSub(22), 76, 81, 15600, 38),
  makeSubstation('SUB-23', sensorIdsForSub(23), 69, 74, 14400, 52),
  makeSubstation('SUB-24', sensorIdsForSub(24), 85, 88, 17200, 22),
  makeSubstation('SUB-25', sensorIdsForSub(25), 72, 77, 15000, 44),
  makeSubstation('SUB-26', sensorIdsForSub(26), 81, 85, 16500, 30),
  makeSubstation('SUB-27', sensorIdsForSub(27), 78, 83, 15800, 36),
  makeSubstation('SUB-28', sensorIdsForSub(28), 87, 91, 17600, 16),
  makeSubstation('SUB-29', sensorIdsForSub(29), 74, 79, 15300, 46),
  makeSubstation('SUB-30', sensorIdsForSub(30), 90, 95, 18800, 12),
];

export const getSubstationById = (id: string): Substation | undefined =>
  INITIAL_SUBSTATIONS.find(s => s.id === id);
