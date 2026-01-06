// Render Engine - Shared rendering utilities for tile-based games

import { drawSprite, TILE_SIZE, TILE_SPRITES, isOverlayTile, getBaseTile, TILES } from './gameEngine';
import type { SpriteAtlas, GameMap, Entity, NPC } from './gameEngine';

// ===== CAMERA =====

export interface Camera {
  x: number;
  y: number;
}

export function createCamera(x: number, y: number): Camera {
  return { x, y };
}

export function updateCamera(camera: Camera, targetX: number, targetY: number, smoothing: number = 0.15): void {
  camera.x += (targetX - camera.x) * smoothing;
  camera.y += (targetY - camera.y) * smoothing;
}

export function getCameraOffset(
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number,
  tileSize: number = TILE_SIZE
): { offsetX: number; offsetY: number } {
  return {
    offsetX: Math.round(canvasWidth / 2 - camera.x * tileSize - tileSize / 2),
    offsetY: Math.round(canvasHeight / 2 - camera.y * tileSize - tileSize / 2),
  };
}

// ===== TILE RENDERING =====

export function getTileColor(tile: number): string {
  switch (tile) {
    case TILES.GRASS: return '#4a7c59';
    case TILES.DIRT: return '#8b7355';
    case TILES.FLOOR: return '#9a8a7a';
    case TILES.PLOWED: return '#5a4a3a';
    case TILES.FIELD_EMPTY: return '#7a6a55';
    case TILES.FIELD_DEAD: return '#5a4a3a';
    case TILES.WALL: return '#6b5b4f';
    case TILES.DOOR: return '#8b4513';
    case TILES.TABLE: return '#daa520';
    case TILES.WATER: return '#4a90a4';
    case TILES.BRIDGE: return '#8b7355';
    case TILES.CAULDRON: return '#2a2a4a';
    default: return '#4a7c59';
  }
}

export function renderTiles(
  ctx: CanvasRenderingContext2D,
  atlas: SpriteAtlas,
  map: GameMap,
  offsetX: number,
  offsetY: number,
  canvasWidth: number,
  canvasHeight: number,
  tileSize: number = TILE_SIZE
): void {
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const screenX = x * tileSize + offsetX;
      const screenY = y * tileSize + offsetY;

      // Cull off-screen tiles
      if (screenX < -tileSize || screenX > canvasWidth ||
          screenY < -tileSize || screenY > canvasHeight) {
        continue;
      }

      const tile = map.tiles[y][x];

      // Always draw base tile first
      const baseTile = getBaseTile(tile);
      const baseSpriteName = TILE_SPRITES[baseTile];
      if (baseSpriteName && atlas.sprites.has(baseSpriteName)) {
        drawSprite(ctx, atlas, baseSpriteName, screenX, screenY, 0);
      } else {
        ctx.fillStyle = getTileColor(baseTile);
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
      }

      // Draw overlay tile on top
      if (isOverlayTile(tile)) {
        const overlaySpriteName = TILE_SPRITES[tile];
        if (overlaySpriteName && atlas.sprites.has(overlaySpriteName)) {
          drawSprite(ctx, atlas, overlaySpriteName, screenX, screenY, 0);
        }
      }
    }
  }
}

// ===== ENTITY RENDERING =====

export function renderEntity(
  ctx: CanvasRenderingContext2D,
  atlas: SpriteAtlas,
  entity: Entity,
  offsetX: number,
  offsetY: number,
  tileSize: number = TILE_SIZE,
  animFrame: number = 0
): void {
  const screenX = entity.x * tileSize + offsetX;
  const screenY = entity.y * tileSize + offsetY;

  if (atlas.sprites.has(entity.sprite)) {
    const frame = entity.isMoving ? animFrame : 0;
    drawSprite(ctx, atlas, entity.sprite, screenX, screenY, frame);
  } else {
    // Fallback: draw colored rectangle
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(
      screenX + tileSize / 2,
      screenY + tileSize / 2,
      tileSize / 2 - 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

// ===== NPC RENDERING =====

export function renderNPC(
  ctx: CanvasRenderingContext2D,
  atlas: SpriteAtlas,
  npc: NPC,
  offsetX: number,
  offsetY: number,
  tileSize: number = TILE_SIZE,
  animFrame: number = 0
): void {
  const screenX = npc.x * tileSize + offsetX;
  const screenY = npc.y * tileSize + offsetY;

  if (atlas.sprites.has(npc.sprite)) {
    drawSprite(ctx, atlas, npc.sprite, screenX, screenY, animFrame);
  } else {
    // Fallback: orange rectangle
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(screenX + 4, screenY + 4, tileSize - 8, tileSize - 8);
  }

  // Draw NPC name label
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(npc.name, screenX + tileSize / 2, screenY - 4);
}

// ===== CANVAS UTILITIES =====

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  backgroundColor: string = '#1a1a1a'
): void {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
}
