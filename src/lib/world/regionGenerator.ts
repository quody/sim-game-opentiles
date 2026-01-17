// Region-level generation (128x128 tiles)
// Handles farm placement, water bodies, and major features

import { createSeededRNG, getRegionSeed, type RNG } from './seedUtils';
import { regionToWorld, calculateAffectedChunks } from './coordinateUtils';
import { REGION_TILE_SIZE, type Region, type RegionFarm, type WaterBody } from './types';
import { generateFarm } from '../agriculture/farmGenerator';
import type { FarmZone, BiomeType } from '../agriculture/types';

// ===== MAIN REGION GENERATION =====

export function generateRegion(regionX: number, regionY: number, worldSeed: number): Region {
  const regionSeed = getRegionSeed(regionX, regionY, worldSeed);
  const random = createSeededRNG(regionSeed);
  const worldOrigin = regionToWorld(regionX, regionY);

  // Step 1: Generate water bodies
  const waterBodies = generateWaterBodies(worldOrigin.worldX, worldOrigin.worldY, random);

  // Step 2: Generate farm zones in a grid pattern (simpler, more reliable)
  const farmZones = generateFarmZones(worldOrigin.worldX, worldOrigin.worldY, waterBodies, random);

  // Step 3: Separate villages from homesteads (already marked in generateFarmZones)
  const villages = farmZones.filter(z => z.isVillage);
  const homesteads = farmZones.filter(z => !z.isVillage);

  // Step 5: Generate farms with world coordinates
  const farms: RegionFarm[] = [];
  let farmIndex = 0;

  for (const zone of [...villages, ...homesteads]) {
    const farm = generateFarm(zone, random);
    const farmWorldX = worldOrigin.worldX + zone.x;
    const farmWorldY = worldOrigin.worldY + zone.y;

    const regionFarm: RegionFarm = {
      id: `farm_${regionX}_${regionY}_${farmIndex++}`,
      worldX: farmWorldX,
      worldY: farmWorldY,
      width: zone.width,
      height: zone.height,
      farm,
      affectedChunks: calculateAffectedChunks(farmWorldX, farmWorldY, zone.width, zone.height),
    };

    farms.push(regionFarm);
  }

  console.log(`[Region ${regionX},${regionY}] Generated ${farms.length} farms:`,
    farms.map(f => `${f.id} at (${f.worldX},${f.worldY})`));

  return {
    coord: { regionX, regionY },
    seed: regionSeed,
    farms,
    waterBodies,
    generated: true,
  };
}

// ===== WATER BODY GENERATION =====

function generateWaterBodies(worldX: number, worldY: number, random: RNG): WaterBody[] {
  const waterBodies: WaterBody[] = [];
  const numPonds = Math.floor(random() * 3) + 1;

  for (let i = 0; i < numPonds; i++) {
    const px = worldX + Math.floor(random() * (REGION_TILE_SIZE - 16)) + 8;
    const py = worldY + Math.floor(random() * (REGION_TILE_SIZE - 16)) + 8;
    const radius = Math.floor(random() * 4) + 2;

    waterBodies.push({
      id: `water_${px}_${py}`,
      worldX: px,
      worldY: py,
      radius,
      type: radius > 4 ? 'lake' : 'pond',
    });
  }

  return waterBodies;
}

// ===== FARM ZONE GENERATION =====

function generateFarmZones(
  worldOriginX: number,
  worldOriginY: number,
  waterBodies: WaterBody[],
  random: RNG
): FarmZone[] {
  const zones: FarmZone[] = [];

  // Place farms in a grid pattern - guaranteed placement
  // Grid: 3x3 farms per region (region is 128x128, each farm area is ~40x40)
  const gridCells = 3;
  const cellSize = Math.floor(REGION_TILE_SIZE / gridCells); // ~42 tiles
  const farmSize = 16;
  const padding = Math.floor((cellSize - farmSize) / 2); // Center farm in cell

  for (let gridY = 0; gridY < gridCells; gridY++) {
    for (let gridX = 0; gridX < gridCells; gridX++) {
      // Random chance to skip some cells for variety (70% chance to place)
      if (random() < 0.3) {
        continue;
      }

      const baseX = gridX * cellSize + padding;
      const baseY = gridY * cellSize + padding;

      // Calculate water proximity for biome determination
      const waterProximity = calculateWaterProximitySimple(
        baseX, baseY, farmSize, farmSize,
        waterBodies, worldOriginX, worldOriginY
      );

      const biomeType = determineBiome(waterProximity, false, random);
      const isVillage = gridX === 1 && gridY === 1; // Center farm is a village

      zones.push({
        x: baseX,
        y: baseY,
        width: farmSize,
        height: farmSize,
        biomeType,
        waterProximity,
        suitabilityScore: 50 + waterProximity * 30,
        isVillage,
      });
    }
  }

  return zones;
}

function calculateWaterProximitySimple(
  x: number,
  y: number,
  width: number,
  height: number,
  waterBodies: WaterBody[],
  worldOriginX: number,
  worldOriginY: number
): number {
  if (waterBodies.length === 0) return 0;

  const centerX = worldOriginX + x + width / 2;
  const centerY = worldOriginY + y + height / 2;

  let minDistance = Infinity;
  for (const water of waterBodies) {
    const distance = Math.sqrt(
      Math.pow(water.worldX - centerX, 2) + Math.pow(water.worldY - centerY, 2)
    );
    minDistance = Math.min(minDistance, distance);
  }

  return Math.max(0, 1 - minDistance / 60);
}

function determineBiome(waterProximity: number, isHilly: boolean, random: RNG): BiomeType {
  if (isHilly) return 'orchard';

  if (waterProximity > 0.6) {
    return random() > 0.3 ? 'vegetable' : 'grain';
  }

  if (waterProximity > 0.3) {
    const roll = random();
    if (roll > 0.4) return 'grain';
    if (roll > 0.1) return 'vegetable';
    return 'mixed';
  }

  const roll = random();
  if (roll > 0.6) return 'grain';
  if (roll > 0.3) return 'mixed';
  return 'vegetable';
}
