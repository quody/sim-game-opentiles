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
  FIELD_EMPTY: 4,
  FIELD_DEAD: 5,
  // Overlay tiles (drawn on top of base)
  WALL: 10,
  DOOR: 11,
  TABLE: 12,
  WATER: 13,
  BRIDGE: 14,
  CAULDRON: 15,
  // Agriculture tiles
  FIELD_PLANTED: 16,
  FIELD_GROWING: 17,
  FIELD_MATURE: 18,
  FARMHOUSE: 20,
  BARN: 21,
  SILO: 22,
  STORAGE_SHED: 23,
  MILL: 24,
  WELL: 25,
  FENCE: 26,
  IRRIGATION: 27,
  ORCHARD_TREE: 28,
} as const;

// Map tile type to sprite name
export const TILE_SPRITES: Record<number, string> = {
  [TILES.GRASS]: 'dusk grass floor c',
  [TILES.DIRT]: 'dusk dirt floor c',
  [TILES.FLOOR]: 'day brick floor c',
  [TILES.PLOWED]: 'dusk plowed field c',
  [TILES.FIELD_EMPTY]: 'dusk dirt floor c',
  [TILES.FIELD_DEAD]: 'dusk dirt floor c',
  [TILES.WALL]: 'lit orange wall center',
  [TILES.DOOR]: 'closed wooden door front',
  [TILES.TABLE]: 'wooden table',
  [TILES.WATER]: 'lit fort wall center',
  [TILES.BRIDGE]: 'bridge n s',
  [TILES.CAULDRON]: 'can of grease',
  // Agriculture sprites
  [TILES.FIELD_PLANTED]: 'dusk plowed field c',
  [TILES.FIELD_GROWING]: 'young leafy vegetable',
  [TILES.FIELD_MATURE]: 'ripe leafy vegetable',
  [TILES.FARMHOUSE]: 'lit orange wall center',
  [TILES.BARN]: 'lit fort wall center',
  [TILES.SILO]: 'closed barrel',
  [TILES.STORAGE_SHED]: 'closed big chest',
  [TILES.MILL]: 'wooden table',
  [TILES.WELL]: 'stone table',
  [TILES.FENCE]: 'stone fence up down',
  [TILES.IRRIGATION]: 'bridge e w',
  [TILES.ORCHARD_TREE]: 'cactus nw ne sw se',
};

// Base tile to use under overlay tiles
export const OVERLAY_BASE: Record<number, number> = {
  [TILES.WALL]: TILES.GRASS,   // Walls on grass by default
  [TILES.DOOR]: TILES.FLOOR,   // Doors on floor
  [TILES.TABLE]: TILES.FLOOR,  // Tables on floor
  [TILES.WATER]: TILES.GRASS,  // Water on grass
  [TILES.BRIDGE]: TILES.DIRT,  // Bridge on dirt
  [TILES.CAULDRON]: TILES.FLOOR, // Cauldron on floor
  // Agriculture overlays
  [TILES.FARMHOUSE]: TILES.GRASS,
  [TILES.BARN]: TILES.GRASS,
  [TILES.SILO]: TILES.GRASS,
  [TILES.STORAGE_SHED]: TILES.GRASS,
  [TILES.MILL]: TILES.GRASS,
  [TILES.WELL]: TILES.GRASS,
  [TILES.FENCE]: TILES.GRASS,
  [TILES.IRRIGATION]: TILES.DIRT,
  [TILES.ORCHARD_TREE]: TILES.GRASS,
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

// ===== PLAYER STATS =====

export interface PlayerStats {
  charisma: number; // 0-10
}

export function createPlayerStats(): PlayerStats {
  return { charisma: 0 };
}

export function getCharismaModifier(charisma: number): number {
  return Math.floor(charisma / 2); // 0->0, 2->1, 4->2, 6->3, 8->4, 10->5
}

export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export interface NPCTrouble {
  name: string;
  description: string;
  severity: number;
  statModifiers: Record<string, number>;
  grantsFeature: string | null;
  color: string;
}

export interface NPC extends Entity {
  name: string;
  dialogue: string[];
  trouble?: NPCTrouble;
}

export interface GameMap {
  width: number;
  height: number;
  tiles: number[][];
  npcs: NPC[];
  spawn: { x: number; y: number };
}

// ===== INVENTORY TYPES =====

export interface Trouble {
  id: string;
  type: 'trouble';
  name: string;
  description: string;
  severity: number;
  statModifiers: Record<string, number>;
  grantsFeature: string | null;
  color: string;
  count: number;
}

export interface RealItem {
  id: string;
  type: 'seed';
  name: string;
  description: string;
  stats: { yield: number; hardiness: number; speed: number; efficiency: number };
  feature: string | null;
  color: string;
  count: number;
}

export interface Inventory {
  troubles: Trouble[];
  realItems: RealItem[];
  gold: number;
}

export function createInventory(): Inventory {
  return {
    troubles: [],
    realItems: [],
    gold: 50,
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function addTrouble(inventory: Inventory, trouble: Omit<Trouble, 'id' | 'type' | 'count'>): Trouble {
  const existing = inventory.troubles.find(t => t.name === trouble.name);
  if (existing) {
    existing.count++;
    return existing;
  }
  const newTrouble: Trouble = {
    ...trouble,
    id: generateId(),
    type: 'trouble',
    count: 1,
  };
  inventory.troubles.push(newTrouble);
  return newTrouble;
}

export function addRealItem(inventory: Inventory, item: Omit<RealItem, 'id' | 'type' | 'count'>): RealItem {
  const existing = inventory.realItems.find(i => i.name === item.name);
  if (existing) {
    existing.count++;
    return existing;
  }
  const newItem: RealItem = {
    ...item,
    id: generateId(),
    type: 'seed',
    count: 1,
  };
  inventory.realItems.push(newItem);
  return newItem;
}

export function removeTrouble(inventory: Inventory, troubleId: string): boolean {
  const trouble = inventory.troubles.find(t => t.id === troubleId);
  if (!trouble) return false;
  trouble.count--;
  if (trouble.count <= 0) {
    inventory.troubles = inventory.troubles.filter(t => t.id !== troubleId);
  }
  return true;
}

export function removeRealItem(inventory: Inventory, itemId: string): boolean {
  const item = inventory.realItems.find(i => i.id === itemId);
  if (!item) return false;
  item.count--;
  if (item.count <= 0) {
    inventory.realItems = inventory.realItems.filter(i => i.id !== itemId);
  }
  return true;
}

export function getCauldronItems(inventory: Inventory): (Trouble | RealItem)[] {
  const items: (Trouble | RealItem)[] = [];
  for (const trouble of inventory.troubles) {
    if (trouble.count > 0) items.push(trouble);
  }
  for (const item of inventory.realItems) {
    if (item.count > 0) items.push(item);
  }
  return items;
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

  // Add tables and cauldron inside (the magic bench!)
  tiles[4][5] = TILES.TABLE;
  tiles[5][4] = TILES.TABLE;
  tiles[5][6] = TILES.CAULDRON;  // The magic cauldron

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

  // Hobbs Farm area (right side) - dead and empty fields
  for (let y = 13; y < 18; y++) {
    for (let x = 17; x < 23; x++) {
      // Mix of dead fields and empty plantable fields
      if (y === 13 || y === 17) {
        tiles[y][x] = TILES.FIELD_EMPTY;  // Empty fields for planting
      } else {
        tiles[y][x] = TILES.FIELD_DEAD;   // Dead fields from drought
      }
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
      dialogue: ['Greetings, friend!', 'The land needs your help.', 'You know the art of magic. Go make something of it.'],
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
        "Unless... you really think your 'essence magic' can make something that survives",
        "this clay and drought?",
        'That row there. Give me one row. One season.',
        "Don't expect payment if it fails like everything else.",
      ],
      trouble: {
        name: 'Seeds dry out',
        description: 'The drought plaguing these eastern hills. Seeds must be hardy to survive.',
        severity: 2,
        statModifiers: { hardiness: 2 },
        grantsFeature: 'Drought Resistant',
        color: '#d4a574',
      },
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
  return tile === TILES.WALL || tile === TILES.TABLE || tile === TILES.WATER || tile === TILES.CAULDRON;
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
