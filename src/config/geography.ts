// Geographic configuration for Dehradun, Uttarakhand monitoring region
// NOTE: All coordinates are DEMO values for prototype simulation.

export const REGION_CENTER: [number, number] = [30.3165, 78.0322];

export const MAP_BOUNDS: [[number, number], [number, number]] = [
  [30.10, 77.70],
  [30.60, 78.40],
];

export const DEHRADUN_ZONE = {
  name: 'Dehradun Monitoring Region',
  state: 'Uttarakhand',
  country: 'India',
  area: '~250 km² mountainous terrain',
  altitude: { min: 640, max: 2200, unit: 'meters above sea level' },
};

// ── Master Station Positions ──────────────────────────────────────

export const MASTER_STATION_POSITIONS: Record<string, {
  lat: number; lon: number; elevation: number; location: string;
}> = {
  'MASTER-01': {
    lat: 30.3500, lon: 78.0100, elevation: 720,
    location: 'NDMA Field Office, Dehradun Central',
  },
  'MASTER-02': {
    lat: 30.4500, lon: 77.9400, elevation: 1450,
    location: 'Mussoorie Ridge Command Post',
  },
  'MASTER-03': {
    lat: 30.2600, lon: 78.1200, elevation: 680,
    location: 'Rishikesh Highway Station',
  },
};

// ── Substation Positions ──────────────────────────────────────────
// 27 substations, 9 per Master Station
// IDs 1, 11, 21 are the Master Stations themselves (local monitoring role)
// DEMO coordinates — not actual surveyed deployment positions

export const SUBSTATION_POSITIONS: Record<string, {
  lat: number; lon: number; elevation: number; area: string;
}> = {
  // ── MASTER-01 Substations (SUB-02 to SUB-10) ──────────
  'SUB-02': { lat: 30.4100, lon: 77.9800, elevation: 1680, area: 'Kempty Falls Ridge' },
  'SUB-03': { lat: 30.4350, lon: 78.0200, elevation: 1950, area: 'Cloud End Escarpment' },
  'SUB-04': { lat: 30.4050, lon: 78.0600, elevation: 1720, area: 'Lal Tibba Slope' },
  'SUB-05': { lat: 30.3750, lon: 78.1000, elevation: 1340, area: 'Rajpur Road Cut' },
  'SUB-06': { lat: 30.3400, lon: 78.0900, elevation: 980,  area: 'Sahasradhara Valley' },
  'SUB-07': { lat: 30.3200, lon: 78.0500, elevation: 820,  area: 'Rispana River Bank' },
  'SUB-08': { lat: 30.2900, lon: 78.0200, elevation: 760,  area: 'Dhalipur Slope' },
  'SUB-09': { lat: 30.3100, lon: 77.9700, elevation: 890,  area: 'Doiwala Embankment' },
  'SUB-10': { lat: 30.3600, lon: 77.9300, elevation: 1150, area: 'Lachhiwala Bluff' },

  // ── MASTER-02 Substations (SUB-12 to SUB-20) ──────────
  'SUB-12': { lat: 30.4800, lon: 77.9500, elevation: 2050, area: 'Jabarkhet Canopy Trail' },
  'SUB-13': { lat: 30.4700, lon: 77.9800, elevation: 1960, area: 'Park Estate Slope' },
  'SUB-14': { lat: 30.4400, lon: 77.9100, elevation: 1750, area: 'Company Garden Hillside' },
  'SUB-15': { lat: 30.4550, lon: 77.9600, elevation: 1880, area: 'George Everest Point' },
  'SUB-16': { lat: 30.4900, lon: 77.9300, elevation: 2100, area: 'Dhanaulti Road Cut' },
  'SUB-17': { lat: 30.4750, lon: 77.9000, elevation: 1920, area: 'Surkanda Devi Approach' },
  'SUB-18': { lat: 30.4350, lon: 77.8900, elevation: 1650, area: 'Jharipani Falls Edge' },
  'SUB-19': { lat: 30.4650, lon: 77.9700, elevation: 1990, area: 'Landour Bazaar Slope' },
  'SUB-20': { lat: 30.4200, lon: 77.8800, elevation: 1500, area: 'Bhatta Falls Valley' },

  // ── MASTER-03 Substations (SUB-22 to SUB-30) ──────────
  'SUB-22': { lat: 30.2400, lon: 78.1300, elevation: 650,  area: 'Rishikesh Bypass Cut' },
  'SUB-23': { lat: 30.2800, lon: 78.0800, elevation: 740,  area: 'Tapovan Cliff Face' },
  'SUB-24': { lat: 30.2500, lon: 78.1000, elevation: 690,  area: 'Ram Jhula Approach' },
  'SUB-25': { lat: 30.2300, lon: 78.1600, elevation: 620,  area: 'Neelkanth Road Slide' },
  'SUB-26': { lat: 30.2950, lon: 78.1400, elevation: 780,  area: 'Laxman Jhula Ridge' },
  'SUB-27': { lat: 30.2600, lon: 78.0600, elevation: 710,  area: 'Ganga Canal Bank' },
  'SUB-28': { lat: 30.2200, lon: 78.1100, elevation: 600,  area: 'Haridwar Foothill' },
  'SUB-29': { lat: 30.2850, lon: 78.1700, elevation: 760,  area: 'Byasi Valley Slope' },
  'SUB-30': { lat: 30.3000, lon: 78.1100, elevation: 800,  area: 'Raiwala Junction Bluff' },
};

// Master → Substation mapping
// IDs 1, 11, 21 are the Master Stations themselves (local monitoring)
// Each Master manages 9 separate Substations
export const MASTER_SUBSTATION_MAP: Record<string, string[]> = {
  'MASTER-01': ['SUB-02','SUB-03','SUB-04','SUB-05','SUB-06','SUB-07','SUB-08','SUB-09','SUB-10'],
  'MASTER-02': ['SUB-12','SUB-13','SUB-14','SUB-15','SUB-16','SUB-17','SUB-18','SUB-19','SUB-20'],
  'MASTER-03': ['SUB-22','SUB-23','SUB-24','SUB-25','SUB-26','SUB-27','SUB-28','SUB-29','SUB-30'],
};

// Reverse lookup: substation → master
export const SUBSTATION_MASTER_MAP: Record<string, string> = {};
for (const [masterId, subs] of Object.entries(MASTER_SUBSTATION_MAP)) {
  for (const subId of subs) {
    SUBSTATION_MASTER_MAP[subId] = masterId;
  }
}

// Danger zone definitions
export const DANGER_ZONE_BOUNDARIES = [
  // MASTER-01 area
  { id: 'DZ-01', center: [30.4100, 77.9800], radius: 800 },
  { id: 'DZ-02', center: [30.4350, 78.0200], radius: 600 },
  { id: 'DZ-03', center: [30.4050, 78.0600], radius: 700 },
  { id: 'DZ-04', center: [30.3750, 78.1000], radius: 500 },
  { id: 'DZ-05', center: [30.3400, 78.0900], radius: 600 },
  { id: 'DZ-06', center: [30.3200, 78.0500], radius: 450 },
  { id: 'DZ-07', center: [30.2900, 78.0200], radius: 900 },
  // MASTER-02 area
  { id: 'DZ-08', center: [30.4700, 77.9500], radius: 700 },
  { id: 'DZ-09', center: [30.4550, 77.9200], radius: 600 },
  { id: 'DZ-10', center: [30.4850, 77.9400], radius: 550 },
  // MASTER-03 area
  { id: 'DZ-11', center: [30.2600, 78.1400], radius: 750 },
  { id: 'DZ-12', center: [30.2400, 78.1200], radius: 600 },
  { id: 'DZ-13', center: [30.2800, 78.0800], radius: 500 },
];
