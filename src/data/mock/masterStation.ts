import { MasterStation } from '../../types';
import { MASTER_STATION_POSITIONS, MASTER_SUBSTATION_MAP } from '../../config/geography';

function makeMaster(
  id: string,
  name: string,
  totalSensors: number,
  aggRisk: number,
): MasterStation {
  const pos = MASTER_STATION_POSITIONS[id];
  const riskLevel = aggRisk >= 86 ? 'CRITICAL'
    : aggRisk >= 71 ? 'HIGH_RISK'
    : aggRisk >= 51 ? 'WARNING'
    : aggRisk >= 31 ? 'WATCH'
    : 'NORMAL';

  return {
    id,
    name,
    location: pos.location,
    latitude: pos.lat,
    longitude: pos.lon,
    substationIds: MASTER_SUBSTATION_MAP[id],
    totalSensors,
    onlineSensors: totalSensors - 1,
    offlineSensors: 0,
    warningSensors: Math.round(totalSensors * 0.15),
    criticalSensors: Math.round(totalSensors * 0.05),
    communicationStatus: 'ONLINE',
    edgeConnectionStatus: 'ONLINE',
    lastSync: new Date().toISOString(),
    dataRate: 8.4,
    uptime: 99.7,
    aggregatedRiskScore: aggRisk,
    riskLevel,
    loraNetworkHealth: 82,
    packetsProcessed: 183670,
    packetsDropped: 412,
  };
}

// Each Master manages 9 Substations × 4 sensors = 36 sensors
// The Master itself (IDs 1, 11, 21) also performs local monitoring
export const INITIAL_MASTER_STATIONS: MasterStation[] = [
  makeMaster('MASTER-01', 'Dehradun Central Command', 36, 48),
  makeMaster('MASTER-02', 'Mussoorie Ridge Station',  36, 35),
  makeMaster('MASTER-03', 'Rishikesh Valley Station', 36, 28),
];

export const getMasterStationById = (id: string): MasterStation | undefined =>
  INITIAL_MASTER_STATIONS.find(m => m.id === id);
