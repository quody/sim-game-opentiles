// Farm structure generation

import { TILES } from '../gameEngine';
import { getRandomCropForBiome } from './cropSystem';
import { getVillageFacilities } from './villageGenerator';
import type { Farm, FarmZone, Building, Field, Infrastructure, Waypoint } from './types';

let farmIdCounter = 0;

export function generateFarm(zone: FarmZone, random: () => number): Farm {
  const farmId = `farm_${farmIdCounter++}`;
  const buildings: Building[] = [];
  const fields: Field[] = [];
  const infrastructure: Infrastructure[] = [];
  const paths: Waypoint[] = [];

  if (zone.isVillage) {
    generateVillageFarm(zone, buildings, fields, infrastructure, paths, random);
  } else {
    generateHomestead(zone, buildings, fields, infrastructure, paths, random);
  }

  return {
    id: farmId,
    zone,
    buildings,
    fields,
    infrastructure,
    paths,
  };
}

function generateVillageFarm(
  zone: FarmZone,
  buildings: Building[],
  fields: Field[],
  infrastructure: Infrastructure[],
  paths: Waypoint[],
  random: () => number
) {
  // Village farm layout: 8-12 tiles wide, shared facilities nearby
  const farmWidth = Math.min(12, zone.width - 2);
  const farmHeight = Math.min(12, zone.height - 2);
  const startX = zone.x + 1;
  const startY = zone.y + 1;

  // Farmhouse (2x2)
  buildings.push({
    type: 'farmhouse',
    x: startX,
    y: startY,
    width: 2,
    height: 2,
    tile: TILES.WALL, // Will use FARMHOUSE tile when added
  });

  // Barn (2x2) next to farmhouse
  buildings.push({
    type: 'barn',
    x: startX + 2,
    y: startY,
    width: 2,
    height: 2,
    tile: TILES.WALL, // Will use BARN tile when added
  });

  // Field plots (3x3 areas)
  const fieldY = startY + 2;
  const numFieldsWide = Math.min(3, Math.floor((farmWidth - 4) / 3));
  const numFieldsTall = Math.min(2, Math.floor((farmHeight - 3) / 3));

  for (let row = 0; row < numFieldsTall; row++) {
    for (let col = 0; col < numFieldsWide; col++) {
      const crop = getRandomCropForBiome(zone.biomeType, random);
      const fieldX = startX + col * 3;
      const fieldYPos = fieldY + row * 3;

      // Create 3x3 field
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          fields.push({
            x: fieldX + dx,
            y: fieldYPos + dy,
            width: 1,
            height: 1,
            cropType: crop.name,
            tile: TILES.PLOWED,
          });
        }
      }
    }
  }

  // Add fence around farm perimeter
  addFencePerimeter(zone, infrastructure, startX, startY, farmWidth, farmHeight);

  // Path from farmhouse to fields
  for (let i = 0; i < 4; i++) {
    paths.push({ x: startX + 1, y: startY + 2 + i });
  }

  // Village facilities (if this is the first farm in village)
  const facilities = getVillageFacilities(random);
  const facilityX = startX + farmWidth + 2;

  if (facilities.mill) {
    buildings.push({
      type: 'mill',
      x: facilityX,
      y: startY,
      width: 3,
      height: 3,
      tile: TILES.WALL,
    });
  }

  if (facilities.well) {
    buildings.push({
      type: 'well',
      x: facilityX,
      y: startY + 4,
      width: 1,
      height: 1,
      tile: TILES.TABLE, // Will use WELL tile when added
    });
  }
}

function generateHomestead(
  zone: FarmZone,
  buildings: Building[],
  fields: Field[],
  infrastructure: Infrastructure[],
  paths: Waypoint[],
  random: () => number
) {
  // Homestead layout: 12x12 tiles, self-sufficient
  const farmWidth = Math.min(12, zone.width - 2);
  const farmHeight = Math.min(12, zone.height - 2);
  const startX = zone.x + 1;
  const startY = zone.y + 1;

  // Silo (1x2)
  buildings.push({
    type: 'silo',
    x: startX,
    y: startY,
    width: 1,
    height: 2,
    tile: TILES.WALL, // Will use SILO tile when added
  });

  // Farmhouse (2x2)
  buildings.push({
    type: 'farmhouse',
    x: startX + 1,
    y: startY,
    width: 2,
    height: 2,
    tile: TILES.WALL,
  });

  // Barn (2x2)
  buildings.push({
    type: 'barn',
    x: startX + 3,
    y: startY,
    width: 2,
    height: 2,
    tile: TILES.WALL,
  });

  // Field plots (larger for homestead)
  const fieldY = startY + 2;
  const fieldWidth = Math.min(9, farmWidth - 3);
  const numRows = Math.min(3, Math.floor((farmHeight - 4) / 3));

  for (let row = 0; row < numRows; row++) {
    for (let x = 0; x < fieldWidth; x++) {
      const crop = getRandomCropForBiome(zone.biomeType, random);
      fields.push({
        x: startX + x,
        y: fieldY + row * 3,
        width: 1,
        height: 1,
        cropType: crop.name,
        tile: TILES.PLOWED,
      });
    }
  }

  // Tool shed (1x1)
  buildings.push({
    type: 'shed',
    x: startX + farmWidth - 1,
    y: fieldY,
    width: 1,
    height: 1,
    tile: TILES.TABLE,
  });

  // Well (1x1)
  buildings.push({
    type: 'well',
    x: startX + farmWidth - 1,
    y: fieldY + 3,
    width: 1,
    height: 1,
    tile: TILES.TABLE,
  });

  // Orchard/livestock area for orchards and mixed farms
  if (zone.biomeType === 'orchard' || zone.biomeType === 'mixed') {
    const orchardY = fieldY + numRows * 3;
    for (let x = 0; x < Math.min(6, fieldWidth); x++) {
      infrastructure.push({
        type: 'orchard',
        x: startX + x,
        y: orchardY,
        tile: TILES.GRASS, // Will use ORCHARD_TREE when added
      });
    }
  }

  // Add fence around perimeter
  addFencePerimeter(zone, infrastructure, startX, startY, farmWidth, farmHeight);

  // Paths connecting buildings
  paths.push({ x: startX + 2, y: startY + 2 }); // Exit house
  paths.push({ x: startX + 2, y: fieldY }); // To fields
  paths.push({ x: startX + 4, y: startY + 2 }); // To barn
}

function addFencePerimeter(
  zone: FarmZone,
  infrastructure: Infrastructure[],
  startX: number,
  startY: number,
  width: number,
  height: number
) {
  // Top and bottom fences
  for (let x = startX; x < startX + width; x++) {
    infrastructure.push({
      type: 'fence',
      x,
      y: startY - 1,
      tile: TILES.GRASS, // Will use FENCE tile when added
    });
    infrastructure.push({
      type: 'fence',
      x,
      y: startY + height,
      tile: TILES.GRASS,
    });
  }

  // Left and right fences
  for (let y = startY; y < startY + height; y++) {
    infrastructure.push({
      type: 'fence',
      x: startX - 1,
      y,
      tile: TILES.GRASS,
    });
    infrastructure.push({
      type: 'fence',
      x: startX + width,
      y,
      tile: TILES.GRASS,
    });
  }
}

export function applyFarmToMap(farm: Farm, tiles: number[][], width: number, height: number) {
  // Apply buildings
  for (const building of farm.buildings) {
    for (let dy = 0; dy < building.height; dy++) {
      for (let dx = 0; dx < building.width; dx++) {
        const x = building.x + dx;
        const y = building.y + dy;
        if (x >= 0 && x < width && y >= 0 && y < height) {
          tiles[y][x] = building.tile;
        }
      }
    }
  }

  // Apply fields
  for (const field of farm.fields) {
    const x = field.x;
    const y = field.y;
    if (x >= 0 && x < width && y >= 0 && y < height) {
      tiles[y][x] = field.tile;
    }
  }

  // Apply infrastructure (fences, paths, etc.)
  for (const infra of farm.infrastructure) {
    const x = infra.x;
    const y = infra.y;
    if (x >= 0 && x < width && y >= 0 && y < height) {
      // Don't overwrite buildings
      if (tiles[y][x] !== TILES.WALL && tiles[y][x] !== TILES.TABLE) {
        tiles[y][x] = infra.tile;
      }
    }
  }
}
