// Geographic configuration for Dehradun, Uttarakhand monitoring region

export const REGION_CENTER: [number, number] = [30.3165, 78.0322];

export const MAP_BOUNDS: [[number, number], [number, number]] = [
  [30.15, 77.80],
  [30.55, 78.30],
];

export const DEHRADUN_ZONE = {
  name: 'Dehradun Monitoring Region',
  state: 'Uttarakhand',
  country: 'India',
  area: '90 km² mountainous terrain',
  altitude: { min: 640, max: 2200, unit: 'meters above sea level' },
};

// Substation geographic positions (lat, lon) in the Dehradun mountainous region
export const SUBSTATION_POSITIONS: Record<string, { lat: number; lon: number; elevation: number; area: string }> = {
  'SUB-01': { lat: 30.3800, lon: 77.9500, elevation: 1420, area: 'Mussoorie Foothills West' },
  'SUB-02': { lat: 30.4100, lon: 77.9800, elevation: 1680, area: 'Kempty Falls Ridge' },
  'SUB-03': { lat: 30.4350, lon: 78.0200, elevation: 1950, area: 'Cloud End Escarpment' },
  'SUB-04': { lat: 30.4050, lon: 78.0600, elevation: 1720, area: 'Lal Tibba Slope' },
  'SUB-05': { lat: 30.3750, lon: 78.1000, elevation: 1340, area: 'Rajpur Road Cut' },
  'SUB-06': { lat: 30.3400, lon: 78.0900, elevation: 980,  area: 'Sahasradhara Valley' },
  'SUB-07': { lat: 30.3200, lon: 78.0500, elevation: 820,  area: 'Rispana River Bank' },
  'SUB-08': { lat: 30.2900, lon: 78.0200, elevation: 760,  area: 'Dhalipur Slope' },
  'SUB-09': { lat: 30.3100, lon: 77.9700, elevation: 890,  area: 'Doiwala Embankment' },
  'SUB-10': { lat: 30.3600, lon: 77.9300, elevation: 1150, area: 'Lachhiwala Bluff' },
};

// Master Station position
export const MASTER_STATION_POSITION = {
  lat: 30.3500,
  lon: 78.0100,
  elevation: 720,
  location: 'NDMA Field Office, Dehradun',
};

// Danger zone definitions
export const DANGER_ZONE_BOUNDARIES = [
  { id: 'DZ-01', center: [30.4100, 77.9800], radius: 800 },
  { id: 'DZ-02', center: [30.4350, 78.0200], radius: 600 },
  { id: 'DZ-03', center: [30.4050, 78.0600], radius: 700 },
  { id: 'DZ-04', center: [30.3750, 78.1000], radius: 500 },
  { id: 'DZ-05', center: [30.3400, 78.0900], radius: 600 },
  { id: 'DZ-06', center: [30.3200, 78.0500], radius: 450 },
  { id: 'DZ-07', center: [30.2900, 78.0200], radius: 900 },
];
