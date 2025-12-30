import { parseAtlas, getRegionsByName, getUniqueSpriteNames } from './atlasParser';
import type { AtlasData, SpriteRegion } from './atlasParser';

export const TILE_SIZE = 32;
export const ORIGINAL_SPRITE_SIZE = 64;
export const SCALE = TILE_SIZE / ORIGINAL_SPRITE_SIZE;

export interface GameSprite {
  name: string;
  frames: SpriteRegion[];
  currentFrame: number;
}

export interface SpriteAtlas {
  data: AtlasData;
  image: HTMLImageElement;
  sprites: Map<string, GameSprite>;
}

export async function loadGameAtlas(atlasPath: string, imagePath: string): Promise<SpriteAtlas> {
  const [atlasResponse, image] = await Promise.all([
    fetch(atlasPath).then(r => r.text()),
    loadImage(imagePath),
  ]);

  const data = parseAtlas(atlasResponse);
  const spriteNames = getUniqueSpriteNames(data.regions);
  const sprites = new Map<string, GameSprite>();

  for (const name of spriteNames) {
    const frames = getRegionsByName(data.regions, name);
    sprites.set(name, { name, frames, currentFrame: 0 });
  }

  return { data, image, sprites };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  atlas: SpriteAtlas,
  spriteName: string,
  x: number,
  y: number,
  frame: number = 0
) {
  const sprite = atlas.sprites.get(spriteName);
  if (!sprite) return;

  const region = sprite.frames[frame % sprite.frames.length];
  const { bounds } = region;

  ctx.drawImage(
    atlas.image,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    x,
    y,
    TILE_SIZE,
    TILE_SIZE
  );
}

// Tile types
export const TILES = {
  // Base tiles (ground layer)
  GRASS: 0,
  DIRT: 1,
  FLOOR: 2,
  PLOWED: 3,
  // Overlay tiles (drawn on top of base)
  WALL: 10,
  DOOR: 11,
  TABLE: 12,
  WATER: 13,
  BRIDGE: 14,
} as const;

// Map tile type to sprite name
export const TILE_SPRITES: Record<number, string> = {
  [TILES.GRASS]: 'dusk grass floor c',
  [TILES.DIRT]: 'dusk dirt floor c',
  [TILES.FLOOR]: 'day brick floor c',
  [TILES.PLOWED]: 'dusk plowed field c',
  [TILES.WALL]: 'lit orange wall center',
  [TILES.DOOR]: 'closed wooden door front',
  [TILES.TABLE]: 'wooden table',
  [TILES.WATER]: 'lit fort wall center',
  [TILES.BRIDGE]: 'bridge n s',
};

// Base tile to use under overlay tiles
export const OVERLAY_BASE: Record<number, number> = {
  [TILES.WALL]: TILES.GRASS,   // Walls on grass by default
  [TILES.DOOR]: TILES.FLOOR,   // Doors on floor
  [TILES.TABLE]: TILES.FLOOR,  // Tables on floor
  [TILES.WATER]: TILES.GRASS,  // Water on grass
  [TILES.BRIDGE]: TILES.DIRT,  // Bridge on dirt
};

// Check if a tile is an overlay (needs base tile drawn first)
export function isOverlayTile(tile: number): boolean {
  return tile >= 10;
}

// Get the base tile for an overlay, or the tile itself if it's already a base
export function getBaseTile(tile: number): number {
  if (isOverlayTile(tile)) {
    return OVERLAY_BASE[tile] ?? TILES.GRASS;
  }
  return tile;
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  sprite: string;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  animFrame: number;
}

export interface NPC extends Entity {
  name: string;
  dialogue: string[];
}

export interface GameMap {
  width: number;
  height: number;
  tiles: number[][];
  npcs: NPC[];
  spawn: { x: number; y: number };
}

export function createDefaultMap(): GameMap {
  const width = 25;
  const height = 20;
  const tiles: number[][] = [];

  // Fill with grass
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = TILES.GRASS;
    }
  }

  // Create walls around the map
  for (let x = 0; x < width; x++) {
    tiles[0][x] = TILES.WALL;
    tiles[height - 1][x] = TILES.WALL;
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0] = TILES.WALL;
    tiles[y][width - 1] = TILES.WALL;
  }

  // Create dirt paths
  for (let x = 5; x < 20; x++) {
    tiles[10][x] = TILES.DIRT;
  }
  for (let y = 5; y < 15; y++) {
    tiles[y][12] = TILES.DIRT;
  }

  // Create a building
  for (let y = 3; y < 8; y++) {
    for (let x = 3; x < 8; x++) {
      if (y === 3 || y === 7 || x === 3 || x === 7) {
        tiles[y][x] = TILES.WALL;
      } else {
        tiles[y][x] = TILES.FLOOR;
      }
    }
  }
  tiles[7][5] = TILES.DOOR;

  // Add some tables inside
  tiles[4][5] = TILES.TABLE;
  tiles[5][4] = TILES.TABLE;

  // Create another building
  for (let y = 3; y < 8; y++) {
    for (let x = 17; x < 23; x++) {
      if (y === 3 || y === 7 || x === 17 || x === 22) {
        tiles[y][x] = TILES.WALL;
      } else {
        tiles[y][x] = TILES.FLOOR;
      }
    }
  }
  tiles[7][20] = TILES.DOOR;

  // Add bridge
  tiles[10][12] = TILES.BRIDGE;

  // Hobbs Farm area (right side) - plowed fields
  for (let y = 13; y < 18; y++) {
    for (let x = 17; x < 23; x++) {
      tiles[y][x] = TILES.PLOWED;
    }
  }

  const npcs: NPC[] = [
    {
      x: 15,
      y: 8,
      width: 1,
      height: 1,
      sprite: 'aligned priest',
      direction: 'down',
      isMoving: false,
      animFrame: 0,
      name: 'Elder Sage',
      dialogue: ['Welcome, traveler!', 'The land needs your help.', 'Seek the ancient seeds.'],
    },
    {
      x: 8,
      y: 12,
      width: 1,
      height: 1,
      sprite: 'barbarian',
      direction: 'down',
      isMoving: false,
      animFrame: 0,
      name: 'Guard',
      dialogue: ['Halt! Who goes there?', 'Oh, it\'s you. Carry on.'],
    },
    {
      x: 20,
      y: 5,
      width: 1,
      height: 1,
      sprite: 'archaeologist',
      direction: 'down',
      isMoving: false,
      animFrame: 0,
      name: 'Merchant',
      dialogue: ['Fine wares for sale!', 'Looking to trade?'],
    },
    {
      x: 19,
      y: 12,
      width: 1,
      height: 1,
      sprite: 'bandit',
      direction: 'down',
      isMoving: false,
      animFrame: 0,
      name: 'Hobbs',
      dialogue: [
        'Third year. Third failure.',
        "OldGrowth's seeds just... die here. I'm done.",
        "Unless... you really think your 'essence magic' can make something that survives this clay and drought?",
        'That row there. Give me one row. One season.',
        "Don't expect payment if it fails like everything else.",
      ],
    },
  ];

  return {
    width,
    height,
    tiles,
    npcs,
    spawn: { x: 12, y: 12 },
  };
}

export function isSolidTile(tile: number): boolean {
  return tile === TILES.WALL || tile === TILES.TABLE || tile === TILES.WATER;
}

export function getTile(map: GameMap, x: number, y: number): number {
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);
  if (tileX < 0 || tileX >= map.width || tileY < 0 || tileY >= map.height) {
    return TILES.WALL;
  }
  return map.tiles[tileY][tileX];
}

export function isColliding(map: GameMap, x: number, y: number, width: number, height: number): boolean {
  const checkPoints = [
    { x: x + 0.1, y: y + 0.1 },
    { x: x + width - 0.1, y: y + 0.1 },
    { x: x + 0.1, y: y + height - 0.1 },
    { x: x + width - 0.1, y: y + height - 0.1 },
  ];

  for (const point of checkPoints) {
    const tile = getTile(map, point.x, point.y);
    if (isSolidTile(tile)) {
      return true;
    }
  }

  // Check NPC collisions
  for (const npc of map.npcs) {
    if (
      x < npc.x + npc.width &&
      x + width > npc.x &&
      y < npc.y + npc.height &&
      y + height > npc.y
    ) {
      return true;
    }
  }

  return false;
}
