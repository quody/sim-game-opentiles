// NPC Manager - handles NPC spawning, state persistence, and chunk transitions

import type { NPC } from '../gameEngine';
import type { ChunkManager } from './chunkManager';
import type { RegionRegistry } from './regionRegistry';
import { createSeededRNG } from './seedUtils';
import { worldToChunk, getChunkKey } from './coordinateUtils';
import type { Chunk, ChunkCoord, NPCState, RegionFarm } from './types';
import { generateFarmersForFarm } from '../agriculture/farmerGenerator';

export class NPCManager {
  private activeNPCs: Map<string, NPCState> = new Map();
  private dormantNPCs: Map<string, NPCState> = new Map();
  private chunkManager: ChunkManager;
  private regionRegistry: RegionRegistry;

  constructor(chunkManager: ChunkManager, regionRegistry: RegionRegistry) {
    this.chunkManager = chunkManager;
    this.regionRegistry = regionRegistry;
  }

  spawnNPCsForChunk(chunk: Chunk): void {
    // For each farm that affects this chunk, check if this chunk is the "home" chunk
    console.log(`[Chunk ${chunk.coord.chunkX},${chunk.coord.chunkY}] Checking ${chunk.farmIds.length} farms for NPC spawn`);

    for (const farmId of chunk.farmIds) {
      const regionFarm = this.regionRegistry.getFarmById(farmId);
      if (!regionFarm) {
        console.log(`  Farm ${farmId} not found in registry`);
        continue;
      }

      // Check if this chunk contains the farmhouse (home chunk)
      const farmhouse = regionFarm.farm.buildings.find(b => b.type === 'farmhouse');
      if (!farmhouse) {
        console.log(`  Farm ${farmId} has no farmhouse`);
        continue;
      }

      // Calculate farmhouse world position
      const zone = regionFarm.farm.zone;
      const farmhouseWorldX = regionFarm.worldX + (farmhouse.x - zone.x);
      const farmhouseWorldY = regionFarm.worldY + (farmhouse.y - zone.y);
      const farmhouseChunk = worldToChunk(farmhouseWorldX, farmhouseWorldY);

      console.log(`  Farm ${farmId}: farmhouse at world (${farmhouseWorldX},${farmhouseWorldY}) = chunk (${farmhouseChunk.chunkX},${farmhouseChunk.chunkY})`);

      // Only spawn NPCs if this is the home chunk
      if (farmhouseChunk.chunkX !== chunk.coord.chunkX ||
          farmhouseChunk.chunkY !== chunk.coord.chunkY) {
        console.log(`    -> Not home chunk, skipping`);
        continue;
      }

      console.log(`    -> This IS the home chunk, spawning NPCs!`);

      // Check if we have dormant NPCs for this farm
      const dormantKey = this.getDormantKey(farmId);
      const dormantStates = this.getDormantNPCsForFarm(farmId);

      if (dormantStates.length > 0) {
        // Restore dormant NPCs
        this.restoreDormantNPCs(dormantStates, chunk);
      } else if (!this.hasActiveNPCsForFarm(farmId)) {
        // Generate new NPCs
        this.generateNPCsForFarm(regionFarm, chunk);
      }
    }
  }

  private generateNPCsForFarm(regionFarm: RegionFarm, chunk: Chunk): void {
    const farm = regionFarm.farm;
    const zone = farm.zone;

    // Create a seeded RNG for this farm
    const farmSeed = hashCoords(regionFarm.worldX, regionFarm.worldY);
    const random = createSeededRNG(farmSeed);

    // Generate farmers using existing generator
    const farmers = generateFarmersForFarm(farm, random);

    for (let i = 0; i < farmers.length; i++) {
      const farmer = farmers[i];

      // Convert farmer local position to world position
      const worldX = regionFarm.worldX + (farmer.x - zone.x);
      const worldY = regionFarm.worldY + (farmer.y - zone.y);

      const npc: NPC = {
        x: worldX,
        y: worldY,
        width: farmer.width,
        height: farmer.height,
        sprite: farmer.sprite,
        direction: farmer.direction,
        isMoving: farmer.isMoving,
        animFrame: farmer.animFrame,
        name: farmer.name,
        dialogue: farmer.dialogue,
        trouble: farmer.trouble,
      };

      const npcId = `${regionFarm.id}_${farmer.name}_${i}`;
      const npcState: NPCState = {
        npc,
        homeChunk: chunk.coord,
        homeFarmId: regionFarm.id,
        currentChunk: worldToChunk(worldX, worldY),
      };

      this.activeNPCs.set(npcId, npcState);
      chunk.npcs.push(npc);
    }
  }

  private restoreDormantNPCs(dormantStates: NPCState[], chunk: Chunk): void {
    for (const state of dormantStates) {
      // Restore saved position if available
      if (state.savedState) {
        state.npc.x = state.savedState.x;
        state.npc.y = state.savedState.y;
        state.npc.direction = state.savedState.direction as 'up' | 'down' | 'left' | 'right';
      }

      // Find the NPC ID
      const npcId = this.findNPCIdByState(state);
      if (npcId) {
        this.dormantNPCs.delete(npcId);
        this.activeNPCs.set(npcId, state);
      }

      chunk.npcs.push(state.npc);
    }
  }

  saveNPCsForChunk(chunk: Chunk): void {
    // Find all NPCs whose home chunk is this chunk
    const toMakeDormant: string[] = [];

    this.activeNPCs.forEach((state, npcId) => {
      if (state.homeChunk.chunkX === chunk.coord.chunkX &&
          state.homeChunk.chunkY === chunk.coord.chunkY) {

        // Save current state
        state.savedState = {
          x: state.npc.x,
          y: state.npc.y,
          direction: state.npc.direction,
        };

        this.dormantNPCs.set(npcId, state);
        toMakeDormant.push(npcId);
      }
    });

    for (const npcId of toMakeDormant) {
      this.activeNPCs.delete(npcId);
    }

    // Clear NPCs from chunk
    chunk.npcs = [];
  }

  update(playerChunk: ChunkCoord): void {
    // Update NPC positions, handle chunk transitions
    this.activeNPCs.forEach((state) => {
      const newChunk = worldToChunk(state.npc.x, state.npc.y);
      if (newChunk.chunkX !== state.currentChunk.chunkX ||
          newChunk.chunkY !== state.currentChunk.chunkY) {
        state.currentChunk = newChunk;
      }
    });
  }

  getAllLoadedNPCs(): NPC[] {
    return Array.from(this.activeNPCs.values()).map(state => state.npc);
  }

  getNPCCount(): number {
    return this.activeNPCs.size;
  }

  getDormantNPCCount(): number {
    return this.dormantNPCs.size;
  }

  // ===== HELPER METHODS =====

  private getDormantKey(farmId: string): string {
    return `dormant_${farmId}`;
  }

  private getDormantNPCsForFarm(farmId: string): NPCState[] {
    const states: NPCState[] = [];
    this.dormantNPCs.forEach((state) => {
      if (state.homeFarmId === farmId) {
        states.push(state);
      }
    });
    return states;
  }

  private hasActiveNPCsForFarm(farmId: string): boolean {
    let found = false;
    this.activeNPCs.forEach((state) => {
      if (state.homeFarmId === farmId) {
        found = true;
      }
    });
    return found;
  }

  private findNPCIdByState(targetState: NPCState): string | null {
    let foundId: string | null = null;
    this.dormantNPCs.forEach((state, npcId) => {
      if (state === targetState) {
        foundId = npcId;
      }
    });
    return foundId;
  }
}

// Simple hash function for coordinates
function hashCoords(x: number, y: number): number {
  let hash = 2166136261;
  hash = Math.imul(hash ^ x, 16777619) >>> 0;
  hash = Math.imul(hash ^ y, 16777619) >>> 0;
  return hash;
}
