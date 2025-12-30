'use client';

import { useEffect, useRef, useState } from 'react';
import {
  loadGameAtlas,
  drawSprite,
  createDefaultMap,
  isSolidTile,
  getTile,
  TILE_SIZE,
  TILES,
  TILE_SPRITES,
  isOverlayTile,
  getBaseTile,
  type SpriteAtlas,
  type GameMap,
  type Entity,
  type NPC,
} from '@/lib/gameEngine';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MOVE_SPEED = 8; // Tiles per second for grid movement

interface Player extends Entity {
  speed: number;
  // Grid movement
  gridX: number;
  gridY: number;
  targetX: number;
  targetY: number;
  moveProgress: number;
}

interface Camera {
  x: number;
  y: number;
}

interface GameState {
  player: Player;
  camera: Camera;
  map: GameMap;
  dialogueNPC: NPC | null;
  dialogueIndex: number;
  notification: string | null;
  notificationTimer: number;
}

function createPlayer(x: number, y: number): Player {
  return {
    x,
    y,
    width: 1,
    height: 1,
    sprite: 'captain',
    direction: 'down',
    isMoving: false,
    animFrame: 0,
    speed: MOVE_SPEED,
    gridX: x,
    gridY: y,
    targetX: x,
    targetY: y,
    moveProgress: 1, // 1 = at destination, 0 = just started
  };
}

function canMoveTo(map: GameMap, x: number, y: number): boolean {
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
  for (const npc of map.npcs) {
    if (Math.floor(npc.x) === x && Math.floor(npc.y) === y) {
      return false;
    }
  }
  return true;
}

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const atlasRef = useRef<SpriteAtlas | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const animTimeRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize game
  useEffect(() => {
    async function init() {
      try {
        const atlas = await loadGameAtlas('/custom_sprites.atlas', '/Dawnlike4.png');
        atlasRef.current = atlas;

        const map = createDefaultMap();
        const player = createPlayer(map.spawn.x, map.spawn.y);

        gameStateRef.current = {
          player,
          camera: { x: player.x, y: player.y },
          map,
          dialogueNPC: null,
          dialogueIndex: 0,
          notification: 'Welcome to Seed Breeder! Use WASD to move, E to interact.',
          notificationTimer: 3000,
        };

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load game');
        setLoading(false);
      }
    }
    init();
  }, []);

  // Input handling
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      keysRef.current.add(e.key.toLowerCase());

      // Handle interaction
      if (e.key.toLowerCase() === 'e' || e.key === ' ') {
        const state = gameStateRef.current;
        if (!state) return;

        if (state.dialogueNPC) {
          // Advance dialogue
          state.dialogueIndex++;
          if (state.dialogueIndex >= state.dialogueNPC.dialogue.length) {
            state.dialogueNPC = null;
            state.dialogueIndex = 0;
          }
        } else {
          // Try to interact with nearby NPC
          tryInteract(state);
        }
      }

      // Close dialogue with Escape
      if (e.key === 'Escape') {
        const state = gameStateRef.current;
        if (state) {
          state.dialogueNPC = null;
          state.dialogueIndex = 0;
        }
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      keysRef.current.delete(e.key.toLowerCase());
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  function tryInteract(state: GameState) {
    const { player, map } = state;

    // Direction offsets
    const dirOffsets: Record<string, { x: number; y: number }> = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };

    const offset = dirOffsets[player.direction];
    const interactX = player.gridX + offset.x;
    const interactY = player.gridY + offset.y;

    // Check NPCs
    for (const npc of map.npcs) {
      if (Math.floor(npc.x) === interactX && Math.floor(npc.y) === interactY) {
        state.dialogueNPC = npc;
        state.dialogueIndex = 0;
        return;
      }
    }

    // Check tile interactions
    const tile = getTile(map, interactX, interactY);

    if (tile === TILES.DOOR) {
      state.notification = 'The door creaks open...';
      state.notificationTimer = 2000;
    } else if (tile === TILES.TABLE) {
      state.notification = 'A sturdy wooden table.';
      state.notificationTimer = 2000;
    }
  }

  // Game loop
  useEffect(() => {
    if (loading || error) return;

    let lastTime = performance.now();
    let animationId: number;

    function gameLoop() {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      update(deltaTime);
      render();

      animationId = requestAnimationFrame(gameLoop);
    }

    function update(deltaTime: number) {
      const state = gameStateRef.current;
      if (!state) return;

      // Update animation timer
      animTimeRef.current += deltaTime;

      // Update notification timer
      if (state.notificationTimer > 0) {
        state.notificationTimer -= deltaTime;
        if (state.notificationTimer <= 0) {
          state.notification = null;
        }
      }

      // Don't update player if in dialogue
      if (state.dialogueNPC) return;

      const { player, map } = state;
      const keys = keysRef.current;

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
      } else {
        // Not moving - check for new movement input
        let dx = 0;
        let dy = 0;

        if (keys.has('w') || keys.has('arrowup')) dy = -1;
        else if (keys.has('s') || keys.has('arrowdown')) dy = 1;
        else if (keys.has('a') || keys.has('arrowleft')) dx = -1;
        else if (keys.has('d') || keys.has('arrowright')) dx = 1;

        if (dx !== 0 || dy !== 0) {
          // Update direction
          if (dx === -1) player.direction = 'left';
          else if (dx === 1) player.direction = 'right';
          else if (dy === -1) player.direction = 'up';
          else if (dy === 1) player.direction = 'down';

          // Try to move to new tile
          const newX = player.gridX + dx;
          const newY = player.gridY + dy;

          if (canMoveTo(map, newX, newY)) {
            player.targetX = newX;
            player.targetY = newY;
            player.moveProgress = 0;
            player.isMoving = true;
          }
        }
      }

      // Update camera to follow player smoothly
      const targetCamX = player.x;
      const targetCamY = player.y;
      state.camera.x += (targetCamX - state.camera.x) * 0.15;
      state.camera.y += (targetCamY - state.camera.y) * 0.15;
    }

    function render() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const atlas = atlasRef.current;
      const state = gameStateRef.current;

      if (!canvas || !ctx || !atlas || !state) return;

      // Disable image smoothing for crisp pixel art
      ctx.imageSmoothingEnabled = false;

      // Clear
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Calculate camera offset - round to prevent subpixel gaps between tiles
      const offsetX = Math.round(CANVAS_WIDTH / 2 - state.camera.x * TILE_SIZE - TILE_SIZE / 2);
      const offsetY = Math.round(CANVAS_HEIGHT / 2 - state.camera.y * TILE_SIZE - TILE_SIZE / 2);

      // Draw tiles (layered: base first, then overlay)
      const { map } = state;
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const screenX = x * TILE_SIZE + offsetX;
          const screenY = y * TILE_SIZE + offsetY;

          // Cull off-screen tiles
          if (screenX < -TILE_SIZE || screenX > CANVAS_WIDTH ||
              screenY < -TILE_SIZE || screenY > CANVAS_HEIGHT) {
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
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          }

          // Draw overlay tile on top (with alpha transparency)
          if (isOverlayTile(tile)) {
            const overlaySpriteName = TILE_SPRITES[tile];
            if (overlaySpriteName && atlas.sprites.has(overlaySpriteName)) {
              drawSprite(ctx, atlas, overlaySpriteName, screenX, screenY, 0);
            }
          }
        }
      }

      // Draw NPCs
      const animFrame = Math.floor(animTimeRef.current / 300) % 2;
      for (const npc of map.npcs) {
        const screenX = npc.x * TILE_SIZE + offsetX;
        const screenY = npc.y * TILE_SIZE + offsetY;

        if (atlas.sprites.has(npc.sprite)) {
          drawSprite(ctx, atlas, npc.sprite, screenX, screenY, animFrame);
        } else {
          ctx.fillStyle = '#e67e22';
          ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        }

        // Draw NPC name
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, screenX + TILE_SIZE / 2, screenY - 4);
      }

      // Draw player
      const playerScreenX = state.player.x * TILE_SIZE + offsetX;
      const playerScreenY = state.player.y * TILE_SIZE + offsetY;
      const playerAnimFrame = state.player.isMoving ? animFrame : 0;

      if (atlas.sprites.has(state.player.sprite)) {
        drawSprite(ctx, atlas, state.player.sprite, playerScreenX, playerScreenY, playerAnimFrame);
      } else {
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(
          playerScreenX + TILE_SIZE / 2,
          playerScreenY + TILE_SIZE / 2,
          TILE_SIZE / 2 - 4,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Draw UI
      renderUI(ctx, state);
    }

    function getTileColor(tile: number): string {
      switch (tile) {
        case TILES.GRASS: return '#4a7c59';
        case TILES.DIRT: return '#8b7355';
        case TILES.FLOOR: return '#9a8a7a';
        case TILES.PLOWED: return '#5a4a3a';
        case TILES.WALL: return '#6b5b4f';
        case TILES.DOOR: return '#8b4513';
        case TILES.TABLE: return '#daa520';
        case TILES.WATER: return '#4a90a4';
        case TILES.BRIDGE: return '#8b7355';
        default: return '#4a7c59';
      }
    }

    function renderUI(ctx: CanvasRenderingContext2D, state: GameState) {
      // Draw notification
      if (state.notification) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, CANVAS_HEIGHT - 50, CANVAS_WIDTH - 20, 40);
        ctx.strokeStyle = '#4a7c59';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, CANVAS_HEIGHT - 50, CANVAS_WIDTH - 20, 40);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(state.notification, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 25);
      }

      // Draw dialogue
      if (state.dialogueNPC) {
        const dialogueHeight = 100;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(20, CANVAS_HEIGHT - dialogueHeight - 20, CANVAS_WIDTH - 40, dialogueHeight);
        ctx.strokeStyle = '#4a7c59';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, CANVAS_HEIGHT - dialogueHeight - 20, CANVAS_WIDTH - 40, dialogueHeight);

        // NPC name
        ctx.fillStyle = '#4a7c59';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(state.dialogueNPC.name, 40, CANVAS_HEIGHT - dialogueHeight + 5);

        // Dialogue text
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        const text = state.dialogueNPC.dialogue[state.dialogueIndex] || '';
        ctx.fillText(text, 40, CANVAS_HEIGHT - dialogueHeight + 35);

        // Continue prompt
        ctx.fillStyle = '#888888';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        const prompt = state.dialogueIndex < state.dialogueNPC.dialogue.length - 1
          ? '[E] Continue'
          : '[E] Close';
        ctx.fillText(prompt, CANVAS_WIDTH - 40, CANVAS_HEIGHT - 35);
      }

      // Draw controls hint
      if (!state.dialogueNPC && !state.notification) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('WASD: Move | E: Interact', 10, 20);
      }
    }

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [loading, error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-400">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
          Loading Seed Breeder...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-red-400">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-4">
      <h1 className="text-2xl font-bold text-green-500 mb-4 tracking-wider">SEED BREEDER</h1>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-green-700 rounded-lg"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="mt-4 text-zinc-500 text-sm text-center">
        <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-300">WASD</kbd> Move |{' '}
        <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-300">E</kbd> Interact |{' '}
        <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-300">ESC</kbd> Close Menu
      </div>
    </div>
  );
}
