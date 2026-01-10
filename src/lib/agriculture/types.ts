// Agriculture system type definitions

export type BiomeType = 'grain' | 'orchard' | 'vegetable' | 'mixed';
export type FarmerRole = 'planter' | 'harvester' | 'miller' | 'irrigator' | 'generalist';
export type BuildingType = 'farmhouse' | 'barn' | 'silo' | 'storage' | 'mill' | 'well' | 'shed';
export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';

export interface FarmZone {
  x: number;
  y: number;
  width: number;
  height: number;
  biomeType: BiomeType;
  waterProximity: number;
  suitabilityScore: number;
  isVillage: boolean;
}

export interface Building {
  type: BuildingType;
  x: number;
  y: number;
  width: number;
  height: number;
  tile: number;
}

export interface Field {
  x: number;
  y: number;
  width: number;
  height: number;
  cropType: string;
  tile: number;
}

export interface Infrastructure {
  type: 'fence' | 'irrigation' | 'path' | 'orchard';
  x: number;
  y: number;
  tile: number;
}

export interface Waypoint {
  x: number;
  y: number;
  action?: string;
}

export interface ScheduleEntry {
  time: TimeOfDay;
  action: string;
  target: string;
}

export interface Farm {
  id: string;
  zone: FarmZone;
  buildings: Building[];
  fields: Field[];
  infrastructure: Infrastructure[];
  paths: Waypoint[];
}

export interface Farmer {
  x: number;
  y: number;
  width: number;
  height: number;
  sprite: string;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  animFrame: number;
  name: string;
  role: FarmerRole;
  farmId: string;
  waypoints: Waypoint[];
  schedule: ScheduleEntry[];
  dialogue: string[];
  trouble?: {
    name: string;
    description: string;
    severity: number;
    statModifiers: Record<string, number>;
    grantsFeature: string | null;
    color: string;
  };
}

export interface CropType {
  name: string;
  growthStages: number[]; // TILES for planted, growing, mature
  biome: BiomeType;
  graphMdRef: string;
}

export interface TerrainAnalysis {
  flatAreas: { x: number; y: number; width: number; height: number }[];
  waterTiles: { x: number; y: number }[];
  hillAreas: { x: number; y: number; width: number; height: number }[];
}
