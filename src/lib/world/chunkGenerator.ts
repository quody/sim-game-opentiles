// Chunk generation (32x32 tiles)
// Generates terrain and applies farm portions from regions

import { TILES } from '../gameEngine';
import { createSeededRNG, getChunkSeed, valueNoise2D, type RNG } from './seedUtils';
import { chunkToWorld, worldToLocal } from './coordinateUtils';
import { CHUNK_SIZE, type Chunk, type ChunkCoord, type RegionFarm } from './types';
import { RegionRegistry } from './regionRegistry';

// ===== MAIN CHUNK GENERATION =====

export function generateChunk(
  chunkX: number,
  chunkY: number,
  worldSeed: number,
  regionRegistry: RegionRegistry
): Chunk {
  const chunkSeed = getChunkSeed(chunkX, chunkY, worldSeed);
  const random = createSeededRNG(chunkSeed);
  const worldOrigin = chunkToWorld(chunkX, chunkY);

  // Step 1: Generate base terrain
  const tiles = generateBaseTerrain(chunkX, chunkY, worldSeed, random);

  // Step 2: Apply water bodies from regions
  const waterBodies = regionRegistry.getWaterBodiesAffectingChunk(
    chunkX, chunkY,
    worldOrigin.worldX, worldOrigin.worldY,
    CHUNK_SIZE,
    worldSeed
  );
  applyWaterBodies(tiles, worldOrigin.worldX, worldOrigin.worldY, waterBodies);

  // Step 3: Get farms affecting this chunk and apply them
  const farmIds: string[] = [];
  const farms = regionRegistry.getFarmsAffectingChunk(chunkX, chunkY, worldSeed);

  for (const regionFarm of farms) {
    applyFarmPortionToChunk(tiles, worldOrigin.worldX, worldOrigin.worldY, regionFarm);
    farmIds.push(regionFarm.id);
  }

  return {
    coord: { chunkX, chunkY },
    tiles,
    npcs: [],
    farmIds,
    generated: true,
    lastAccessed: Date.now(),
  };
}

// ===== BASE TERRAIN GENERATION =====

function generateBaseTerrain(
  chunkX: number,
  chunkY: number,
  worldSeed: number,
  random: RNG
): number[][] {
  const tiles: number[][] = [];
  const worldOrigin = chunkToWorld(chunkX, chunkY);

  // Fill with grass base
  for (let y = 0; y < CHUNK_SIZE; y++) {
    tiles[y] = [];
    for (let x = 0; x < CHUNK_SIZE; x++) {
      tiles[y][x] = TILES.GRASS;
    }
  }

  // Use noise to add dirt patches for more natural terrain
  for (let y = 0; y < CHUNK_SIZE; y++) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
      const worldX = worldOrigin.worldX + x;
      const worldY = worldOrigin.worldY + y;

      // Sample noise at different scales
      const noise = valueNoise2D(worldX * 0.1, worldY * 0.1, worldSeed);
      if (noise > 0.65) {
        tiles[y][x] = TILES.DIRT;
      }
    }
  }

  // Add some random dirt paths
  const numPaths = Math.floor(random() * 3) + 1;
  for (let i = 0; i < numPaths; i++) {
    addDirtPath(tiles, random);
  }

  // Add occasional wall clusters (small ruins/rocks)
  if (random() > 0.7) {
    addWallCluster(tiles, random);
  }

  return tiles;
}

function addDirtPath(tiles: number[][], random: RNG): void {
  const x = Math.floor(random() * (CHUNK_SIZE - 4)) + 2;
  const y = Math.floor(random() * (CHUNK_SIZE - 4)) + 2;
  const length = Math.floor(random() * 8) + 3;
  const horizontal = random() > 0.5;

  for (let j = 0; j < length; j++) {
    const tx = horizontal ? x + j : x;
    const ty = horizontal ? y : y + j;
    if (tx >= 0 && tx < CHUNK_SIZE && ty >= 0 && ty < CHUNK_SIZE) {
      tiles[ty][tx] = TILES.DIRT;
    }
  }
}

function addWallCluster(tiles: number[][], random: RNG): void {
  const cx = Math.floor(random() * (CHUNK_SIZE - 8)) + 4;
  const cy = Math.floor(random() * (CHUNK_SIZE - 8)) + 4;
  const cw = Math.floor(random() * 3) + 2;
  const ch = Math.floor(random() * 3) + 2;

  for (let y = cy; y < cy + ch && y < CHUNK_SIZE; y++) {
    for (let x = cx; x < cx + cw && x < CHUNK_SIZE; x++) {
      if (y === cy || y === cy + ch - 1 || x === cx || x === cx + cw - 1) {
        tiles[y][x] = TILES.WALL;
      } else {
        tiles[y][x] = TILES.FLOOR;
      }
    }
  }

  // Add a door
  const doorSide = Math.floor(random() * 4);
  if (doorSide === 0 && cy + ch - 1 < CHUNK_SIZE) {
    tiles[cy + ch - 1][cx + Math.floor(cw / 2)] = TILES.DOOR;
  } else if (doorSide === 1 && cy > 0) {
    tiles[cy][cx + Math.floor(cw / 2)] = TILES.DOOR;
  } else if (doorSide === 2 && cx + cw - 1 < CHUNK_SIZE) {
    tiles[cy + Math.floor(ch / 2)][cx + cw - 1] = TILES.DOOR;
  } else if (cx > 0) {
    tiles[cy + Math.floor(ch / 2)][cx] = TILES.DOOR;
  }
}

// ===== WATER BODY APPLICATION =====

function applyWaterBodies(
  tiles: number[][],
  chunkWorldX: number,
  chunkWorldY: number,
  waterBodies: { worldX: number; worldY: number; radius: number }[]
): void {
  for (const water of waterBodies) {
    for (let dy = -water.radius; dy <= water.radius; dy++) {
      for (let dx = -water.radius; dx <= water.radius; dx++) {
        if (dx * dx + dy * dy <= water.radius * water.radius) {
          const worldX = water.worldX + dx;
          const worldY = water.worldY + dy;

          // Check if this point is in our chunk
          const localX = worldX - chunkWorldX;
          const localY = worldY - chunkWorldY;

          if (localX >= 0 && localX < CHUNK_SIZE && localY >= 0 && localY < CHUNK_SIZE) {
            if (tiles[localY][localX] === TILES.GRASS || tiles[localY][localX] === TILES.DIRT) {
              tiles[localY][localX] = TILES.WATER;
            }
          }
        }
      }
    }
  }
}

// ===== FARM APPLICATION =====

function applyFarmPortionToChunk(
  tiles: number[][],
  chunkWorldX: number,
  chunkWorldY: number,
  regionFarm: RegionFarm
): void {
  const farm = regionFarm.farm;
  const zone = farm.zone;

  // Apply buildings
  for (const building of farm.buildings) {
    // Building positions are relative to zone, convert to world
    const buildingWorldX = regionFarm.worldX + (building.x - zone.x);
    const buildingWorldY = regionFarm.worldY + (building.y - zone.y);

    for (let dy = 0; dy < building.height; dy++) {
      for (let dx = 0; dx < building.width; dx++) {
        const worldX = buildingWorldX + dx;
        const worldY = buildingWorldY + dy;
        const localX = worldX - chunkWorldX;
        const localY = worldY - chunkWorldY;

        if (localX >= 0 && localX < CHUNK_SIZE && localY >= 0 && localY < CHUNK_SIZE) {
          tiles[localY][localX] = building.tile;
        }
      }
    }
  }

  // Apply fields
  for (const field of farm.fields) {
    const fieldWorldX = regionFarm.worldX + (field.x - zone.x);
    const fieldWorldY = regionFarm.worldY + (field.y - zone.y);
    const localX = fieldWorldX - chunkWorldX;
    const localY = fieldWorldY - chunkWorldY;

    if (localX >= 0 && localX < CHUNK_SIZE && localY >= 0 && localY < CHUNK_SIZE) {
      tiles[localY][localX] = field.tile;
    }
  }

  // Apply infrastructure (fences, etc.)
  for (const infra of farm.infrastructure) {
    const infraWorldX = regionFarm.worldX + (infra.x - zone.x);
    const infraWorldY = regionFarm.worldY + (infra.y - zone.y);
    const localX = infraWorldX - chunkWorldX;
    const localY = infraWorldY - chunkWorldY;

    if (localX >= 0 && localX < CHUNK_SIZE && localY >= 0 && localY < CHUNK_SIZE) {
      // Don't overwrite buildings
      if (tiles[localY][localX] !== TILES.WALL && tiles[localY][localX] !== TILES.TABLE) {
        tiles[localY][localX] = infra.tile;
      }
    }
  }
}

// ===== UTILITY FUNCTIONS =====

export function getTileAt(
  chunks: Map<string, Chunk>,
  worldX: number,
  worldY: number,
  chunkKeyFn: (cx: number, cy: number) => string
): number | null {
  const chunkX = Math.floor(worldX / CHUNK_SIZE);
  const chunkY = Math.floor(worldY / CHUNK_SIZE);
  const key = chunkKeyFn(chunkX, chunkY);

  const chunk = chunks.get(key);
  if (!chunk) return null;

  const local = worldToLocal(worldX, worldY);
  return chunk.tiles[local.localY][local.localX];
}
