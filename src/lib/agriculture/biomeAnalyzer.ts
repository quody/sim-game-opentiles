// Terrain analysis for farm placement and biome detection

import { TILES } from '../gameEngine';
import type { FarmZone, TerrainAnalysis, BiomeType } from './types';

export function analyzeTerrainForFarms(
  tiles: number[][],
  width: number,
  height: number,
  random: () => number
): FarmZone[] {
  const analysis = analyzeTerrain(tiles, width, height);
  const zones: FarmZone[] = [];

  // Find flat areas suitable for farms
  for (const area of analysis.flatAreas) {
    if (area.width < 8 || area.height < 8) continue; // Too small for a farm

    const waterProximity = calculateWaterProximity(area, analysis.waterTiles);
    const isHilly = isAreaHilly(area, analysis.hillAreas);
    const biomeType = determineBiome(waterProximity, isHilly, random);
    const suitabilityScore = calculateSuitability(area, waterProximity, isHilly);

    zones.push({
      x: area.x,
      y: area.y,
      width: area.width,
      height: area.height,
      biomeType,
      waterProximity,
      suitabilityScore,
      isVillage: false, // Will be set later by village generator
    });
  }

  // Sort by suitability score (best first)
  zones.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  return zones;
}

function analyzeTerrain(tiles: number[][], width: number, height: number): TerrainAnalysis {
  const flatAreas: { x: number; y: number; width: number; height: number }[] = [];
  const waterTiles: { x: number; y: number }[] = [];
  const hillAreas: { x: number; y: number; width: number; height: number }[] = [];

  // Find water tiles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (tiles[y][x] === TILES.WATER) {
        waterTiles.push({ x, y });
      }
    }
  }

  // Find flat areas (grass/dirt clusters)
  const visited = new Array(height).fill(0).map(() => new Array(width).fill(false));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (visited[y][x]) continue;
      if (!isFlatTile(tiles[y][x])) continue;

      // Flood fill to find contiguous flat area
      const area = floodFillFlatArea(tiles, visited, x, y, width, height);
      if (area.width >= 8 && area.height >= 8) {
        flatAreas.push(area);
      }
    }
  }

  // For now, we'll detect hills as areas surrounded by more elevation changes
  // This is a simplified approach - in a full implementation, you'd have elevation data
  // For this generator, we'll infer hills from the pattern of walls/obstacles
  for (const area of flatAreas) {
    if (hasElevationVariation(tiles, area, width, height)) {
      hillAreas.push(area);
    }
  }

  return { flatAreas, waterTiles, hillAreas };
}

function isFlatTile(tile: number): boolean {
  return tile === TILES.GRASS || tile === TILES.DIRT;
}

function floodFillFlatArea(
  tiles: number[][],
  visited: boolean[][],
  startX: number,
  startY: number,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } {
  const stack: { x: number; y: number }[] = [{ x: startX, y: startY }];
  let minX = startX, maxX = startX, minY = startY, maxY = startY;

  while (stack.length > 0) {
    const { x, y } = stack.pop()!;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[y][x]) continue;
    if (!isFlatTile(tiles[y][x])) continue;

    visited[y][x] = true;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    stack.push({ x: x + 1, y });
    stack.push({ x: x - 1, y });
    stack.push({ x, y: y + 1 });
    stack.push({ x, y: y - 1 });
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

function calculateWaterProximity(
  area: { x: number; y: number; width: number; height: number },
  waterTiles: { x: number; y: number }[]
): number {
  if (waterTiles.length === 0) return 0;

  const centerX = area.x + area.width / 2;
  const centerY = area.y + area.height / 2;

  // Find closest water tile
  let minDistance = Infinity;
  for (const water of waterTiles) {
    const distance = Math.sqrt(
      Math.pow(water.x - centerX, 2) + Math.pow(water.y - centerY, 2)
    );
    minDistance = Math.min(minDistance, distance);
  }

  // Convert to 0-1 score (closer = higher score)
  // Max distance of 20 tiles = 0, distance of 0 = 1
  return Math.max(0, 1 - minDistance / 20);
}

function isAreaHilly(
  area: { x: number; y: number; width: number; height: number },
  hillAreas: { x: number; y: number; width: number; height: number }[]
): boolean {
  for (const hill of hillAreas) {
    // Check if areas overlap
    if (
      area.x < hill.x + hill.width &&
      area.x + area.width > hill.x &&
      area.y < hill.y + hill.height &&
      area.y + area.height > hill.y
    ) {
      return true;
    }
  }
  return false;
}

function hasElevationVariation(
  tiles: number[][],
  area: { x: number; y: number; width: number; height: number },
  width: number,
  height: number
): boolean {
  // Check perimeter for walls/obstacles that suggest elevation
  let obstacleCount = 0;
  const perimeter = (area.width + area.height) * 2;

  for (let i = 0; i < area.width; i++) {
    if (area.y > 0 && tiles[area.y - 1][area.x + i] === TILES.WALL) obstacleCount++;
    if (area.y + area.height < height && tiles[area.y + area.height][area.x + i] === TILES.WALL) obstacleCount++;
  }
  for (let i = 0; i < area.height; i++) {
    if (area.x > 0 && tiles[area.y + i][area.x - 1] === TILES.WALL) obstacleCount++;
    if (area.x + area.width < width && tiles[area.y + i][area.x + area.width] === TILES.WALL) obstacleCount++;
  }

  // If more than 30% of perimeter has obstacles, consider it hilly
  return obstacleCount / perimeter > 0.3;
}

function determineBiome(waterProximity: number, isHilly: boolean, random: () => number): BiomeType {
  if (isHilly) {
    return 'orchard'; // Hills = orchards
  }

  if (waterProximity > 0.6) {
    // Close to water: 70% vegetable, 30% grain
    return random() > 0.3 ? 'vegetable' : 'grain';
  }

  if (waterProximity > 0.3) {
    // Medium water proximity: 60% grain, 30% vegetable, 10% mixed
    const roll = random();
    if (roll > 0.4) return 'grain';
    if (roll > 0.1) return 'vegetable';
    return 'mixed';
  }

  // Far from water: 40% grain, 30% mixed, 30% vegetable (hardy crops)
  const roll = random();
  if (roll > 0.6) return 'grain';
  if (roll > 0.3) return 'mixed';
  return 'vegetable';
}

function calculateSuitability(
  area: { x: number; y: number; width: number; height: number },
  waterProximity: number,
  isHilly: boolean
): number {
  let score = 0;

  // Size score (bigger is better, up to a point)
  const size = area.width * area.height;
  score += Math.min(size / 200, 1) * 40; // Max 40 points for size

  // Water proximity score
  score += waterProximity * 30; // Max 30 points for water

  // Hills are good for orchards but slightly less suitable overall
  if (isHilly) {
    score += 20;
  } else {
    score += 30; // Flat land is generally more suitable
  }

  return score;
}
