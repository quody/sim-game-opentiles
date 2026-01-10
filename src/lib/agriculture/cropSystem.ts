// Crop type definitions based on graph.md Agriculture domain

import { TILES } from '../gameEngine';
import type { CropType } from './types';

export const CROP_TYPES: Record<string, CropType> = {
  // Grain crops (Valley/Flat + Water)
  wheat: {
    name: 'Wheat',
    growthStages: [TILES.FIELD_PLANTED, TILES.FIELD_GROWING, TILES.FIELD_MATURE],
    biome: 'grain',
    graphMdRef: 'Agriculture/Wheat',
  },
  barley: {
    name: 'Barley',
    growthStages: [TILES.FIELD_PLANTED, TILES.FIELD_GROWING, TILES.FIELD_MATURE],
    biome: 'grain',
    graphMdRef: 'Agriculture/Barley',
  },
  oats: {
    name: 'Oats',
    growthStages: [TILES.FIELD_PLANTED, TILES.FIELD_GROWING, TILES.FIELD_MATURE],
    biome: 'grain',
    graphMdRef: 'Agriculture/Oats',
  },

  // Orchard crops (Hills/Slopes)
  apples: {
    name: 'Apples',
    growthStages: [TILES.FIELD_PLANTED, TILES.FIELD_GROWING, TILES.FIELD_MATURE],
    biome: 'orchard',
    graphMdRef: 'Agriculture/Apples',
  },
  pears: {
    name: 'Pears',
    growthStages: [TILES.FIELD_PLANTED, TILES.FIELD_GROWING, TILES.FIELD_MATURE],
    biome: 'orchard',
    graphMdRef: 'Agriculture/Pears',
  },
  plums: {
    name: 'Plums',
    growthStages: [TILES.FIELD_PLANTED, TILES.FIELD_GROWING, TILES.FIELD_MATURE],
    biome: 'orchard',
    graphMdRef: 'Agriculture/Plums',
  },
  grapes: {
    name: 'Grapes',
    growthStages: [TILES.FIELD_PLANTED, TILES.FIELD_GROWING, TILES.FIELD_MATURE],
    biome: 'orchard',
    graphMdRef: 'Agriculture/Grapes',
  },

  // Vegetable crops (Near Water)
  potatoes: {
    name: 'Potatoes',
    growthStages: [TILES.FIELD_PLANTED, TILES.FIELD_GROWING, TILES.FIELD_MATURE],
    biome: 'vegetable',
    graphMdRef: 'Agriculture/Potatoes',
  },
  carrots: {
    name: 'Carrots',
    growthStages: [TILES.FIELD_PLANTED, TILES.FIELD_GROWING, TILES.FIELD_MATURE],
    biome: 'vegetable',
    graphMdRef: 'Agriculture/Carrots',
  },
  onions: {
    name: 'Onions',
    growthStages: [TILES.FIELD_PLANTED, TILES.FIELD_GROWING, TILES.FIELD_MATURE],
    biome: 'vegetable',
    graphMdRef: 'Agriculture/Onions',
  },
  cabbages: {
    name: 'Cabbages',
    growthStages: [TILES.FIELD_PLANTED, TILES.FIELD_GROWING, TILES.FIELD_MATURE],
    biome: 'vegetable',
    graphMdRef: 'Agriculture/Cabbages',
  },

  // Mixed/Specialty crops
  mushrooms: {
    name: 'Mushrooms',
    growthStages: [TILES.FIELD_PLANTED, TILES.FIELD_GROWING, TILES.FIELD_MATURE],
    biome: 'mixed',
    graphMdRef: 'Agriculture/Mushrooms',
  },
  herbs: {
    name: 'Garden Herbs',
    growthStages: [TILES.FIELD_PLANTED, TILES.FIELD_GROWING, TILES.FIELD_MATURE],
    biome: 'mixed',
    graphMdRef: 'Agriculture/HerbGarden',
  },
  pipeWeed: {
    name: 'Pipe-Weed',
    growthStages: [TILES.FIELD_PLANTED, TILES.FIELD_GROWING, TILES.FIELD_MATURE],
    biome: 'mixed',
    graphMdRef: 'Agriculture/PipeWeed',
  },
  hops: {
    name: 'Hops',
    growthStages: [TILES.FIELD_PLANTED, TILES.FIELD_GROWING, TILES.FIELD_MATURE],
    biome: 'mixed',
    graphMdRef: 'Agriculture/Hops',
  },
};

export function getCropsForBiome(biome: string): CropType[] {
  return Object.values(CROP_TYPES).filter(crop => crop.biome === biome);
}

export function getRandomCropForBiome(biome: string, random: () => number): CropType {
  const crops = getCropsForBiome(biome);
  if (crops.length === 0) {
    // Fallback to mixed crops
    const mixedCrops = getCropsForBiome('mixed');
    return mixedCrops[Math.floor(random() * mixedCrops.length)];
  }
  return crops[Math.floor(random() * crops.length)];
}
