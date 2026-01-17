// Deterministic seeding utilities for infinite world generation

// ===== SEEDED RANDOM NUMBER GENERATOR =====

export type RNG = () => number;

export function createSeededRNG(seed: number): RNG {
  // Linear Congruential Generator (LCG)
  let state = seed >>> 0; // Ensure unsigned

  return () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state / 4294967296;
  };
}

// ===== COORDINATE HASHING =====

export function hashCoords(x: number, y: number, worldSeed: number): number {
  // FNV-1a-like hash for combining coordinates with world seed
  let hash = (worldSeed ^ 2166136261) >>> 0;
  hash = Math.imul(hash ^ x, 16777619) >>> 0;
  hash = Math.imul(hash ^ y, 16777619) >>> 0;
  hash = Math.imul(hash ^ (x * 31 + y * 17), 16777619) >>> 0;
  return hash;
}

// ===== SEEDING FOR DIFFERENT SCALES =====

export function getRegionSeed(regionX: number, regionY: number, worldSeed: number): number {
  return hashCoords(regionX, regionY, worldSeed);
}

export function getChunkSeed(chunkX: number, chunkY: number, worldSeed: number): number {
  // Use different multipliers to avoid seed collisions between regions and chunks
  return hashCoords(chunkX * 7, chunkY * 13, worldSeed ^ 0x5f3759df);
}

export function getFeatureSeed(worldX: number, worldY: number, featureType: string, worldSeed: number): number {
  // Create a unique seed for a specific feature at a location
  const typeHash = stringHash(featureType);
  return hashCoords(worldX, worldY, worldSeed ^ typeHash);
}

// ===== STRING HASHING =====

function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(hash ^ str.charCodeAt(i), 16777619) >>> 0;
  }
  return hash;
}

// ===== NOISE FUNCTIONS =====

// Simple 2D value noise using seeded coordinates
export function valueNoise2D(x: number, y: number, worldSeed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  // Get corner values
  const v00 = seededRandom(ix, iy, worldSeed);
  const v10 = seededRandom(ix + 1, iy, worldSeed);
  const v01 = seededRandom(ix, iy + 1, worldSeed);
  const v11 = seededRandom(ix + 1, iy + 1, worldSeed);

  // Smooth interpolation
  const sx = smoothstep(fx);
  const sy = smoothstep(fy);

  // Bilinear interpolation
  const v0 = lerp(v00, v10, sx);
  const v1 = lerp(v01, v11, sx);
  return lerp(v0, v1, sy);
}

function seededRandom(x: number, y: number, seed: number): number {
  const n = hashCoords(x, y, seed);
  return n / 4294967296;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ===== FRACTAL NOISE =====

export function fractalNoise2D(
  x: number,
  y: number,
  worldSeed: number,
  octaves: number = 4,
  persistence: number = 0.5,
  scale: number = 1
): number {
  let total = 0;
  let amplitude = 1;
  let maxAmplitude = 0;
  let frequency = scale;

  for (let i = 0; i < octaves; i++) {
    total += valueNoise2D(x * frequency, y * frequency, worldSeed + i * 1000) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return total / maxAmplitude;
}
