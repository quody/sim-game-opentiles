// Region registry - caches generated regions and provides farm lookups

import { generateRegion } from './regionGenerator';
import { getRegionKey, chunkToRegion } from './coordinateUtils';
import type { Region, RegionFarm, ChunkCoord } from './types';

export class RegionRegistry {
  private regions: Map<string, Region> = new Map();
  private farmIndex: Map<string, { regionKey: string; farmIndex: number }> = new Map();

  getOrGenerateRegion(regionX: number, regionY: number, worldSeed: number): Region {
    const key = getRegionKey(regionX, regionY);

    if (!this.regions.has(key)) {
      const region = generateRegion(regionX, regionY, worldSeed);
      this.regions.set(key, region);

      // Index farms for quick lookup
      for (let i = 0; i < region.farms.length; i++) {
        this.farmIndex.set(region.farms[i].id, { regionKey: key, farmIndex: i });
      }
    }

    return this.regions.get(key)!;
  }

  getRegion(regionX: number, regionY: number): Region | null {
    const key = getRegionKey(regionX, regionY);
    return this.regions.get(key) || null;
  }

  getFarmById(farmId: string): RegionFarm | null {
    const index = this.farmIndex.get(farmId);
    if (!index) return null;

    const region = this.regions.get(index.regionKey);
    if (!region) return null;

    return region.farms[index.farmIndex];
  }

  getFarmsAffectingChunk(chunkX: number, chunkY: number, worldSeed: number): RegionFarm[] {
    const farms: RegionFarm[] = [];
    const regionCoord = chunkToRegion(chunkX, chunkY);

    // Check current region and adjacent regions
    for (let rx = regionCoord.regionX - 1; rx <= regionCoord.regionX + 1; rx++) {
      for (let ry = regionCoord.regionY - 1; ry <= regionCoord.regionY + 1; ry++) {
        const region = this.getOrGenerateRegion(rx, ry, worldSeed);

        for (const farm of region.farms) {
          const affectsChunk = farm.affectedChunks.some(
            c => c.chunkX === chunkX && c.chunkY === chunkY
          );
          if (affectsChunk && !farms.some(f => f.id === farm.id)) {
            farms.push(farm);
          }
        }
      }
    }

    return farms;
  }

  getWaterBodiesAffectingChunk(
    chunkX: number,
    chunkY: number,
    chunkWorldX: number,
    chunkWorldY: number,
    chunkSize: number,
    worldSeed: number
  ): { worldX: number; worldY: number; radius: number }[] {
    const waterBodies: { worldX: number; worldY: number; radius: number }[] = [];
    const regionCoord = chunkToRegion(chunkX, chunkY);

    // Check current region and adjacent regions
    for (let rx = regionCoord.regionX - 1; rx <= regionCoord.regionX + 1; rx++) {
      for (let ry = regionCoord.regionY - 1; ry <= regionCoord.regionY + 1; ry++) {
        const region = this.getOrGenerateRegion(rx, ry, worldSeed);

        for (const water of region.waterBodies) {
          // Check if water body intersects this chunk
          const extendedRadius = water.radius + chunkSize;
          const dx = Math.abs(water.worldX - (chunkWorldX + chunkSize / 2));
          const dy = Math.abs(water.worldY - (chunkWorldY + chunkSize / 2));

          if (dx <= extendedRadius && dy <= extendedRadius) {
            waterBodies.push({
              worldX: water.worldX,
              worldY: water.worldY,
              radius: water.radius,
            });
          }
        }
      }
    }

    return waterBodies;
  }

  clear(): void {
    this.regions.clear();
    this.farmIndex.clear();
  }

  getLoadedRegionCount(): number {
    return this.regions.size;
  }

  getLoadedFarmCount(): number {
    return this.farmIndex.size;
  }
}
