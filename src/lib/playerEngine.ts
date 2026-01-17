// Player Engine - Shared player and movement logic for tile-based games

import { isSolidTile } from './gameEngine';
import type { GameMap, NPC } from './gameEngine';

// ===== PLAYER INTERFACE =====

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  sprite: string;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  animFrame: number;
  speed: number;
  // Grid movement
  gridX: number;
  gridY: number;
  targetX: number;
  targetY: number;
  moveProgress: number;
  queuedMoveX?: number;
  queuedMoveY?: number;
}

export const DEFAULT_MOVE_SPEED = 8; // Tiles per second

export function createPlayer(
  x: number,
  y: number,
  sprite: string = 'captain',
  speed: number = DEFAULT_MOVE_SPEED
): Player {
  return {
    x,
    y,
    width: 1,
    height: 1,
    sprite,
    direction: 'down',
    isMoving: false,
    animFrame: 0,
    speed,
    gridX: x,
    gridY: y,
    targetX: x,
    targetY: y,
    moveProgress: 1,
  };
}

// ===== MOVEMENT =====

export function canMoveTo(map: GameMap, x: number, y: number, checkNPCs: boolean = true): boolean {
  // Check bounds
  if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
    return false;
  }
  // Check tile
  const tile = map.tiles[y][x];
  if (isSolidTile(tile)) {
    return false;
  }
  // Check NPCs
  if (checkNPCs) {
    for (const npc of map.npcs) {
      if (Math.floor(npc.x) === x && Math.floor(npc.y) === y) {
        return false;
      }
    }
  }
  return true;
}

export function getDirectionFromDelta(dx: number, dy: number): 'up' | 'down' | 'left' | 'right' {
  if (dx === -1) return 'left';
  if (dx === 1) return 'right';
  if (dy === -1) return 'up';
  return 'down';
}

export function updatePlayerMovement(
  player: Player,
  map: GameMap,
  keys: Set<string>,
  deltaTime: number
): void {
  // Check if currently moving (not at destination)
  const isCurrentlyMoving = player.moveProgress < 1;

  if (isCurrentlyMoving) {
    // Continue moving towards target
    const moveAmount = player.speed * (deltaTime / 1000);
    player.moveProgress = Math.min(1, player.moveProgress + moveAmount);

    // Interpolate position
    player.x = player.gridX + (player.targetX - player.gridX) * player.moveProgress;
    player.y = player.gridY + (player.targetY - player.gridY) * player.moveProgress;

    // Check if reached destination
    if (player.moveProgress >= 1) {
      player.gridX = player.targetX;
      player.gridY = player.targetY;
      player.x = player.gridX;
      player.y = player.gridY;
      player.isMoving = false;
    }
  }

  // Check for new movement input
  const canAcceptInput = !isCurrentlyMoving || player.moveProgress >= 0.85;

  if (canAcceptInput) {
    let dx = 0;
    let dy = 0;

    if (keys.has('w') || keys.has('arrowup')) dy = -1;
    else if (keys.has('s') || keys.has('arrowdown')) dy = 1;
    else if (keys.has('a') || keys.has('arrowleft')) dx = -1;
    else if (keys.has('d') || keys.has('arrowright')) dx = 1;

    if (dx !== 0 || dy !== 0) {
      // Update direction
      player.direction = getDirectionFromDelta(dx, dy);

      // Calculate new position from current target
      const baseX = player.targetX;
      const baseY = player.targetY;
      const newX = baseX + dx;
      const newY = baseY + dy;

      // Only queue a new movement if it's different from current target
      const isDifferentTarget = newX !== player.targetX || newY !== player.targetY;

      // If not moving, use gridX/gridY as base instead
      if (!isCurrentlyMoving && (dx !== 0 || dy !== 0)) {
        const newX = player.gridX + dx;
        const newY = player.gridY + dy;

        if (canMoveTo(map, newX, newY)) {
          player.targetX = newX;
          player.targetY = newY;
          player.moveProgress = 0;
          player.isMoving = true;
        }
      } else if (isCurrentlyMoving && isDifferentTarget && canMoveTo(map, newX, newY)) {
        // Queue next movement
        player.queuedMoveX = dx;
        player.queuedMoveY = dy;
      }
    }
  }

  // Apply queued movement when current movement completes
  if (!isCurrentlyMoving && player.queuedMoveX !== undefined && player.queuedMoveY !== undefined) {
    const newX = player.gridX + player.queuedMoveX;
    const newY = player.gridY + player.queuedMoveY;

    if (canMoveTo(map, newX, newY)) {
      player.targetX = newX;
      player.targetY = newY;
      player.moveProgress = 0;
      player.isMoving = true;
    }

    player.queuedMoveX = undefined;
    player.queuedMoveY = undefined;
  }
}

// ===== INTERACTION =====

export function getFacingTile(player: Player): { x: number; y: number } {
  const dirOffsets: Record<string, { x: number; y: number }> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const offset = dirOffsets[player.direction];
  return {
    x: player.gridX + offset.x,
    y: player.gridY + offset.y,
  };
}

export function getNPCAtPosition(npcs: NPC[], x: number, y: number): NPC | null {
  for (const npc of npcs) {
    if (Math.floor(npc.x) === x && Math.floor(npc.y) === y) {
      return npc;
    }
  }
  return null;
}

// ===== INFINITE WORLD MOVEMENT =====

import type { ChunkManager } from './world/chunkManager';

export function canMoveToWorld(
  chunkManager: ChunkManager,
  x: number,
  y: number
): boolean {
  return chunkManager.canMoveTo(x, y);
}

export function updatePlayerMovementWorld(
  player: Player,
  chunkManager: ChunkManager,
  keys: Set<string>,
  deltaTime: number
): void {
  // Check if currently moving (not at destination)
  const isCurrentlyMoving = player.moveProgress < 1;

  if (isCurrentlyMoving) {
    // Continue moving towards target
    const moveAmount = player.speed * (deltaTime / 1000);
    player.moveProgress = Math.min(1, player.moveProgress + moveAmount);

    // Interpolate position
    player.x = player.gridX + (player.targetX - player.gridX) * player.moveProgress;
    player.y = player.gridY + (player.targetY - player.gridY) * player.moveProgress;

    // Check if reached destination
    if (player.moveProgress >= 1) {
      player.gridX = player.targetX;
      player.gridY = player.targetY;
      player.x = player.gridX;
      player.y = player.gridY;
      player.isMoving = false;
    }
  }

  // Check for new movement input
  const canAcceptInput = !isCurrentlyMoving || player.moveProgress >= 0.85;

  if (canAcceptInput) {
    let dx = 0;
    let dy = 0;

    if (keys.has('w') || keys.has('arrowup')) dy = -1;
    else if (keys.has('s') || keys.has('arrowdown')) dy = 1;
    else if (keys.has('a') || keys.has('arrowleft')) dx = -1;
    else if (keys.has('d') || keys.has('arrowright')) dx = 1;

    if (dx !== 0 || dy !== 0) {
      // Update direction
      player.direction = getDirectionFromDelta(dx, dy);

      // Calculate new position from current target
      const baseX = player.targetX;
      const baseY = player.targetY;
      const newX = baseX + dx;
      const newY = baseY + dy;

      // Only queue a new movement if it's different from current target
      const isDifferentTarget = newX !== player.targetX || newY !== player.targetY;

      // If not moving, use gridX/gridY as base instead
      if (!isCurrentlyMoving && (dx !== 0 || dy !== 0)) {
        const newX = player.gridX + dx;
        const newY = player.gridY + dy;

        if (canMoveToWorld(chunkManager, newX, newY)) {
          player.targetX = newX;
          player.targetY = newY;
          player.moveProgress = 0;
          player.isMoving = true;
        }
      } else if (isCurrentlyMoving && isDifferentTarget && canMoveToWorld(chunkManager, newX, newY)) {
        // Queue next movement
        player.queuedMoveX = dx;
        player.queuedMoveY = dy;
      }
    }
  }

  // Apply queued movement when current movement completes
  if (!isCurrentlyMoving && player.queuedMoveX !== undefined && player.queuedMoveY !== undefined) {
    const newX = player.gridX + player.queuedMoveX;
    const newY = player.gridY + player.queuedMoveY;

    if (canMoveToWorld(chunkManager, newX, newY)) {
      player.targetX = newX;
      player.targetY = newY;
      player.moveProgress = 0;
      player.isMoving = true;
    }

    player.queuedMoveX = undefined;
    player.queuedMoveY = undefined;
  }
}
