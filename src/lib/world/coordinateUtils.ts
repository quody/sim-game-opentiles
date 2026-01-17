// Coordinate conversion utilities for infinite world

import {
  CHUNK_SIZE,
  REGION_SIZE,
  REGION_TILE_SIZE,
  type WorldCoord,
  type ChunkCoord,
  type RegionCoord,
} from './types';

// ===== WORLD TO OTHER COORDS =====

export function worldToChunk(worldX: number, worldY: number): ChunkCoord {
  return {
    chunkX: Math.floor(worldX / CHUNK_SIZE),
    chunkY: Math.floor(worldY / CHUNK_SIZE),
  };
}

export function worldToRegion(worldX: number, worldY: number): RegionCoord {
  return {
    regionX: Math.floor(worldX / REGION_TILE_SIZE),
    regionY: Math.floor(worldY / REGION_TILE_SIZE),
  };
}

export function worldToLocal(worldX: number, worldY: number): { localX: number; localY: number } {
  // Handle negative coordinates correctly
  return {
    localX: ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
    localY: ((worldY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
  };
}

// ===== CHUNK TO OTHER COORDS =====

export function chunkToWorld(chunkX: number, chunkY: number): WorldCoord {
  return {
    worldX: chunkX * CHUNK_SIZE,
    worldY: chunkY * CHUNK_SIZE,
  };
}

export function chunkToRegion(chunkX: number, chunkY: number): RegionCoord {
  return {
    regionX: Math.floor(chunkX / REGION_SIZE),
    regionY: Math.floor(chunkY / REGION_SIZE),
  };
}

// ===== REGION TO OTHER COORDS =====

export function regionToWorld(regionX: number, regionY: number): WorldCoord {
  return {
    worldX: regionX * REGION_TILE_SIZE,
    worldY: regionY * REGION_TILE_SIZE,
  };
}

export function regionToChunk(regionX: number, regionY: number): ChunkCoord {
  return {
    chunkX: regionX * REGION_SIZE,
    chunkY: regionY * REGION_SIZE,
  };
}

// ===== LOCAL TO WORLD =====

export function localToWorld(
  localX: number,
  localY: number,
  chunkX: number,
  chunkY: number
): WorldCoord {
  return {
    worldX: chunkX * CHUNK_SIZE + localX,
    worldY: chunkY * CHUNK_SIZE + localY,
  };
}

// ===== KEY GENERATION =====

export function getChunkKey(chunkX: number, chunkY: number): string {
  return `${chunkX},${chunkY}`;
}

export function getRegionKey(regionX: number, regionY: number): string {
  return `region_${regionX},${regionY}`;
}

export function parseChunkKey(key: string): ChunkCoord {
  const [x, y] = key.split(',').map(Number);
  return { chunkX: x, chunkY: y };
}

// ===== OVERLAP DETECTION =====

export function chunkOverlapsRect(
  chunkX: number,
  chunkY: number,
  rectWorldX: number,
  rectWorldY: number,
  rectWidth: number,
  rectHeight: number
): boolean {
  const chunkWorldX = chunkX * CHUNK_SIZE;
  const chunkWorldY = chunkY * CHUNK_SIZE;

  return (
    chunkWorldX < rectWorldX + rectWidth &&
    chunkWorldX + CHUNK_SIZE > rectWorldX &&
    chunkWorldY < rectWorldY + rectHeight &&
    chunkWorldY + CHUNK_SIZE > rectWorldY
  );
}

export function calculateAffectedChunks(
  worldX: number,
  worldY: number,
  width: number,
  height: number
): ChunkCoord[] {
  const chunks: ChunkCoord[] = [];
  const startChunk = worldToChunk(worldX, worldY);
  const endChunk = worldToChunk(worldX + width - 1, worldY + height - 1);

  for (let cx = startChunk.chunkX; cx <= endChunk.chunkX; cx++) {
    for (let cy = startChunk.chunkY; cy <= endChunk.chunkY; cy++) {
      chunks.push({ chunkX: cx, chunkY: cy });
    }
  }

  return chunks;
}

// ===== DISTANCE =====

export function chunkDistance(c1: ChunkCoord, c2: ChunkCoord): number {
  return Math.max(Math.abs(c1.chunkX - c2.chunkX), Math.abs(c1.chunkY - c2.chunkY));
}

export function getChunksInRadius(center: ChunkCoord, radius: number): ChunkCoord[] {
  const chunks: ChunkCoord[] = [];

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      chunks.push({
        chunkX: center.chunkX + dx,
        chunkY: center.chunkY + dy,
      });
    }
  }

  return chunks;
}
