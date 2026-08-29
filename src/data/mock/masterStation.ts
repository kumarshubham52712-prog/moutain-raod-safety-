import { MasterStation } from '../../types';
import { MASTER_STATION_POSITION } from '../../config/geography';

export const INITIAL_MASTER_STATION: MasterStation = {
  id: 'MASTER-01',
  name: 'Master Station Dehradun Alpha',
  location: MASTER_STATION_POSITION.location,
  latitude: MASTER_STATION_POSITION.lat,
  longitude: MASTER_STATION_POSITION.lon,

  substationIds: [
    'SUB-01', 'SUB-02', 'SUB-03', 'SUB-04', 'SUB-05',
    'SUB-06', 'SUB-07', 'SUB-08', 'SUB-09', 'SUB-10',
  ],

  totalSensors: 30,
  onlineSensors: 27,
  offlineSensors: 0,
  warningSensors: 6,
  criticalSensors: 2,

  communicationStatus: 'ONLINE',
  lastSync: new Date().toISOString(),
  dataRate: 8.4,
  uptime: 99.7,

  aggregatedRiskScore: 48,
  riskLevel: 'WATCH',

  loraNetworkHealth: 82,
  packetsProcessed: 183670,
  packetsDropped: 412,
};
