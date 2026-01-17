// Chunk Manager - orchestrates chunk loading/unloading around player

import { TILES, type NPC } from '../gameEngine';
import { generateChunk } from './chunkGenerator';
import { RegionRegistry } from './regionRegistry';
import { NPCManager } from './npcManager';
import {
  worldToChunk,
  worldToLocal,
  getChunkKey,
  getChunksInRadius,
  chunkDistance,
  chunkToWorld,
} from './coordinateUtils';
import { CHUNK_SIZE, type Chunk, type ChunkCoord, type ChunkManagerConfig } from './types';

const DEFAULT_CONFIG: ChunkManagerConfig = {
  loadRadius: 3,
  unloadRadius: 5,
  maxLoadedChunks: 100,
};

export class ChunkManager {
  private loadedChunks: Map<string, Chunk> = new Map();
  private regionRegistry: RegionRegistry;
  private npcManager: NPCManager;
  private worldSeed: number;
  private config: ChunkManagerConfig;

  constructor(worldSeed: number, config: Partial<ChunkManagerConfig> = {}) {
    this.worldSeed = worldSeed;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.regionRegistry = new RegionRegistry();
    this.npcManager = new NPCManager(this, this.regionRegistry);
  }

  // Called every frame with player position
  update(playerWorldX: number, playerWorldY: number): void {
    const playerChunk = worldToChunk(playerWorldX, playerWorldY);

    // Load chunks in radius
    const chunksToLoad = getChunksInRadius(playerChunk, this.config.loadRadius);
    for (const coord of chunksToLoad) {
      this.ensureChunkLoaded(coord.chunkX, coord.chunkY);
    }

    // Unload distant chunks
    this.unloadDistantChunks(playerChunk);

    // Update NPCs
    this.npcManager.update(playerChunk);
  }

  ensureChunkLoaded(chunkX: number, chunkY: number): Chunk {
    const key = getChunkKey(chunkX, chunkY);

    if (!this.loadedChunks.has(key)) {
      const chunk = generateChunk(chunkX, chunkY, this.worldSeed, this.regionRegistry);

      // Spawn NPCs for farms in this chunk
      this.npcManager.spawnNPCsForChunk(chunk);

      this.loadedChunks.set(key, chunk);
    }

    const chunk = this.loadedChunks.get(key)!;
    chunk.lastAccessed = Date.now();
    return chunk;
  }

  private unloadDistantChunks(playerChunk: ChunkCoord): void {
    const maxDistance = this.config.unloadRadius;
    const toRemove: string[] = [];

    this.loadedChunks.forEach((chunk, key) => {
      const dx = Math.abs(chunk.coord.chunkX - playerChunk.chunkX);
      const dy = Math.abs(chunk.coord.chunkY - playerChunk.chunkY);

      if (dx > maxDistance || dy > maxDistance) {
        // Save NPC states before unloading
        this.npcManager.saveNPCsForChunk(chunk);
        toRemove.push(key);
      }
    });

    for (const key of toRemove) {
      this.loadedChunks.delete(key);
    }

    // Also enforce max loaded chunks
    if (this.loadedChunks.size > this.config.maxLoadedChunks) {
      this.evictOldestChunks(playerChunk);
    }
  }

  private evictOldestChunks(playerChunk: ChunkCoord): void {
    // Sort by last accessed and distance, evict oldest/furthest
    const entries = Array.from(this.loadedChunks.entries())
      .map(([key, chunk]) => ({
        key,
        chunk,
        distance: chunkDistance(chunk.coord, playerChunk),
        lastAccessed: chunk.lastAccessed,
      }))
      .sort((a, b) => {
        // Prioritize distance, then age
        if (a.distance !== b.distance) return b.distance - a.distance;
        return a.lastAccessed - b.lastAccessed;
      });

    const toEvict = entries.slice(0, entries.length - this.config.maxLoadedChunks);
    for (const { key, chunk } of toEvict) {
      this.npcManager.saveNPCsForChunk(chunk);
      this.loadedChunks.delete(key);
    }
  }

  // ===== PUBLIC ACCESSORS =====

  getTile(worldX: number, worldY: number): number {
    const chunkCoord = worldToChunk(worldX, worldY);
    const chunk = this.ensureChunkLoaded(chunkCoord.chunkX, chunkCoord.chunkY);
    const local = worldToLocal(worldX, worldY);
    return chunk.tiles[local.localY][local.localX];
  }

  setTile(worldX: number, worldY: number, tile: number): void {
    const chunkCoord = worldToChunk(worldX, worldY);
    const key = getChunkKey(chunkCoord.chunkX, chunkCoord.chunkY);
    const chunk = this.loadedChunks.get(key);

    if (chunk) {
      const local = worldToLocal(worldX, worldY);
      chunk.tiles[local.localY][local.localX] = tile;
    }
  }

  getChunk(chunkX: number, chunkY: number): Chunk | null {
    const key = getChunkKey(chunkX, chunkY);
    return this.loadedChunks.get(key) || null;
  }

  getVisibleChunks(
    cameraWorldX: number,
    cameraWorldY: number,
    viewportTilesX: number,
    viewportTilesY: number
  ): Chunk[] {
    const startChunk = worldToChunk(
      cameraWorldX - viewportTilesX / 2,
      cameraWorldY - viewportTilesY / 2
    );
    const endChunk = worldToChunk(
      cameraWorldX + viewportTilesX / 2,
      cameraWorldY + viewportTilesY / 2
    );

    const chunks: Chunk[] = [];
    for (let cx = startChunk.chunkX; cx <= endChunk.chunkX; cx++) {
      for (let cy = startChunk.chunkY; cy <= endChunk.chunkY; cy++) {
        chunks.push(this.ensureChunkLoaded(cx, cy));
      }
    }

    return chunks;
  }

  getAllLoadedChunks(): Chunk[] {
    return Array.from(this.loadedChunks.values());
  }

  getAllLoadedNPCs(): NPC[] {
    return this.npcManager.getAllLoadedNPCs();
  }

  getNPCsInChunk(chunkX: number, chunkY: number): NPC[] {
    const key = getChunkKey(chunkX, chunkY);
    const chunk = this.loadedChunks.get(key);
    return chunk ? chunk.npcs : [];
  }

  // ===== STATS =====

  getLoadedChunkCount(): number {
    return this.loadedChunks.size;
  }

  getLoadedRegionCount(): number {
    return this.regionRegistry.getLoadedRegionCount();
  }

  getLoadedFarmCount(): number {
    return this.regionRegistry.getLoadedFarmCount();
  }

  getWorldSeed(): number {
    return this.worldSeed;
  }

  // ===== COLLISION HELPERS =====

  isSolidTile(worldX: number, worldY: number): boolean {
    const tile = this.getTile(worldX, worldY);
    // WALL, WATER, and TABLE are solid
    return tile === TILES.WALL || tile === TILES.WATER || tile === TILES.TABLE;
  }

  canMoveTo(worldX: number, worldY: number): boolean {
    if (this.isSolidTile(Math.floor(worldX), Math.floor(worldY))) {
      return false;
    }

    // Check NPC collision
    const npcs = this.getAllLoadedNPCs();
    for (const npc of npcs) {
      if (Math.floor(npc.x) === Math.floor(worldX) &&
          Math.floor(npc.y) === Math.floor(worldY)) {
        return false;
      }
    }

    return true;
  }

  // ===== SPAWN POINT =====

  findSpawnPoint(): { x: number; y: number } {
    // Start at world origin and find a walkable tile
    const searchRadius = 10;

    for (let r = 0; r <= searchRadius; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) === r || Math.abs(dy) === r) {
            if (this.canMoveTo(dx, dy)) {
              return { x: dx, y: dy };
            }
          }
        }
      }
    }

    // Fallback: just return origin
    return { x: 0, y: 0 };
  }
}
