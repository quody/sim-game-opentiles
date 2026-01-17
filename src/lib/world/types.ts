// Core types for infinite world generation

import type { NPC } from '../gameEngine';
import type { Farm, FarmZone, Farmer } from '../agriculture/types';

// ===== CONSTANTS =====

export const CHUNK_SIZE = 32;
export const REGION_SIZE = 4; // In chunks
export const REGION_TILE_SIZE = CHUNK_SIZE * REGION_SIZE; // 128 tiles

// ===== COORDINATE TYPES =====

export interface WorldCoord {
  worldX: number;
  worldY: number;
}

export interface ChunkCoord {
  chunkX: number;
  chunkY: number;
}

export interface RegionCoord {
  regionX: number;
  regionY: number;
}

// ===== CHUNK =====

export interface Chunk {
  coord: ChunkCoord;
  tiles: number[][];
  npcs: NPC[];
  farmIds: string[];
  generated: boolean;
  lastAccessed: number;
}

// ===== REGION =====

export interface Region {
  coord: RegionCoord;
  seed: number;
  farms: RegionFarm[];
  waterBodies: WaterBody[];
  generated: boolean;
}

export interface RegionFarm {
  id: string;
  worldX: number;
  worldY: number;
  width: number;
  height: number;
  farm: Farm;
  affectedChunks: ChunkCoord[];
}

export interface WaterBody {
  id: string;
  worldX: number;
  worldY: number;
  radius: number;
  type: 'pond' | 'lake';
}

// ===== CHUNK MANAGER CONFIG =====

export interface ChunkManagerConfig {
  loadRadius: number;
  unloadRadius: number;
  maxLoadedChunks: number;
}

// ===== NPC STATE =====

export interface NPCState {
  npc: NPC;
  homeChunk: ChunkCoord;
  homeFarmId: string;
  currentChunk: ChunkCoord;
  savedState?: {
    x: number;
    y: number;
    direction: string;
  };
}

// ===== TERRAIN GENERATION =====

export interface TerrainFeature {
  type: 'dirt_path' | 'wall_cluster' | 'water';
  worldX: number;
  worldY: number;
  width: number;
  height: number;
  data?: Record<string, unknown>;
}
