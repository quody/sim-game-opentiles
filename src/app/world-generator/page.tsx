'use client';

import { useEffect, useRef, useState } from 'react';
import {
  loadGameAtlas,
  TILES,
  type SpriteAtlas,
  type GameMap,
} from '@/lib/gameEngine';
import {
  createCamera,
  updateCamera,
  getCameraOffset,
  renderTiles,
  renderEntity,
  clearCanvas,
  type Camera,
} from '@/lib/renderEngine';
import {
  createPlayer,
  updatePlayerMovement,
  type Player,
} from '@/lib/playerEngine';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// ===== MAP GENERATION =====

function generateRandomMap(width: number, height: number, seed?: number): GameMap {
  const tiles: number[][] = [];

  // Simple seeded random
  let rng = seed || Math.random() * 10000;
  const random = () => {
    rng = (rng * 1103515245 + 12345) % 2147483648;
    return rng / 2147483648;
  };

  // Fill with grass
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = TILES.GRASS;
    }
  }

  // Create walls around the edges
  for (let x = 0; x < width; x++) {
    tiles[0][x] = TILES.WALL;
    tiles[height - 1][x] = TILES.WALL;
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0] = TILES.WALL;
    tiles[y][width - 1] = TILES.WALL;
  }

  // Scatter some dirt paths
  for (let i = 0; i < width * 2; i++) {
    const x = Math.floor(random() * (width - 4)) + 2;
    const y = Math.floor(random() * (height - 4)) + 2;
    const length = Math.floor(random() * 8) + 3;
    const horizontal = random() > 0.5;

    for (let j = 0; j < length; j++) {
      const tx = horizontal ? x + j : x;
      const ty = horizontal ? y : y + j;
      if (tx > 0 && tx < width - 1 && ty > 0 && ty < height - 1) {
        tiles[ty][tx] = TILES.DIRT;
      }
    }
  }

  // Add some random wall clusters (buildings/obstacles)
  const numClusters = Math.floor(random() * 5) + 3;
  for (let i = 0; i < numClusters; i++) {
    const cx = Math.floor(random() * (width - 10)) + 5;
    const cy = Math.floor(random() * (height - 10)) + 5;
    const cw = Math.floor(random() * 4) + 3;
    const ch = Math.floor(random() * 4) + 3;

    for (let y = cy; y < cy + ch && y < height - 1; y++) {
      for (let x = cx; x < cx + cw && x < width - 1; x++) {
        if (y === cy || y === cy + ch - 1 || x === cx || x === cx + cw - 1) {
          tiles[y][x] = TILES.WALL;
        } else {
          tiles[y][x] = TILES.FLOOR;
        }
      }
    }
    // Add a door
    const doorSide = Math.floor(random() * 4);
    if (doorSide === 0 && cy + ch < height - 1) tiles[cy + ch - 1][cx + Math.floor(cw / 2)] = TILES.DOOR;
    else if (doorSide === 1 && cy > 1) tiles[cy][cx + Math.floor(cw / 2)] = TILES.DOOR;
    else if (doorSide === 2 && cx + cw < width - 1) tiles[cy + Math.floor(ch / 2)][cx + cw - 1] = TILES.DOOR;
    else if (cx > 1) tiles[cy + Math.floor(ch / 2)][cx] = TILES.DOOR;
  }

  // Add some water features
  const numPonds = Math.floor(random() * 3) + 1;
  for (let i = 0; i < numPonds; i++) {
    const px = Math.floor(random() * (width - 8)) + 4;
    const py = Math.floor(random() * (height - 8)) + 4;
    const size = Math.floor(random() * 3) + 2;

    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        if (dx * dx + dy * dy <= size * size) {
          const tx = px + dx;
          const ty = py + dy;
          if (tx > 1 && tx < width - 2 && ty > 1 && ty < height - 2) {
            if (tiles[ty][tx] === TILES.GRASS || tiles[ty][tx] === TILES.DIRT) {
              tiles[ty][tx] = TILES.WATER;
            }
          }
        }
      }
    }
  }

  return {
    width,
    height,
    tiles,
    npcs: [],
    spawn: { x: Math.floor(width / 2), y: Math.floor(height / 2) },
  };
}

// ===== GAME STATE =====

interface WorldGenState {
  player: Player;
  camera: Camera;
  map: GameMap;
  seed: number;
}

export default function WorldGeneratorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const atlasRef = useRef<SpriteAtlas | null>(null);
  const stateRef = useRef<WorldGenState | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const animTimeRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSeed, setCurrentSeed] = useState(0);

  // Initialize
  useEffect(() => {
    async function init() {
      try {
        const atlas = await loadGameAtlas('/custom_sprites.atlas', '/Dawnlike4.png');
        atlasRef.current = atlas;

        const seed = Math.floor(Math.random() * 100000);
        setCurrentSeed(seed);
        const map = generateRandomMap(50, 40, seed);
        const player = createPlayer(map.spawn.x, map.spawn.y);

        stateRef.current = {
          player,
          camera: createCamera(player.x, player.y),
          map,
          seed,
        };

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
        setLoading(false);
      }
    }
    init();
  }, []);

  // Regenerate map
  const regenerateMap = () => {
    if (!stateRef.current) return;
    const seed = Math.floor(Math.random() * 100000);
    setCurrentSeed(seed);
    const map = generateRandomMap(50, 40, seed);
    const player = createPlayer(map.spawn.x, map.spawn.y);
    stateRef.current = {
      player,
      camera: createCamera(player.x, player.y),
      map,
      seed,
    };
  };

  // Input handling
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      keysRef.current.add(e.key.toLowerCase());

      // Regenerate with R
      if (e.key.toLowerCase() === 'r') {
        regenerateMap();
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
      const state = stateRef.current;
      if (!state) return;

      animTimeRef.current += deltaTime;

      // Update player movement
      updatePlayerMovement(state.player, state.map, keysRef.current, deltaTime);

      // Update camera
      updateCamera(state.camera, state.player.x, state.player.y);
    }

    function render() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const atlas = atlasRef.current;
      const state = stateRef.current;

      if (!canvas || !ctx || !atlas || !state) return;

      // Clear
      clearCanvas(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Get camera offset
      const { offsetX, offsetY } = getCameraOffset(state.camera, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Render tiles
      renderTiles(ctx, atlas, state.map, offsetX, offsetY, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Render player
      const animFrame = Math.floor(animTimeRef.current / 300) % 2;
      renderEntity(ctx, atlas, state.player, offsetX, offsetY, undefined, animFrame);

      // UI overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 250, 60);
      ctx.strokeStyle = '#8844aa';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 250, 60);

      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Seed: ${state.seed}`, 20, 32);
      ctx.fillStyle = '#888888';
      ctx.font = '12px monospace';
      ctx.fillText('WASD: Move | R: Regenerate', 20, 52);
    }

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [loading, error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-400">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          Loading World Generator...
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
      <h1 className="text-2xl font-bold text-purple-500 mb-4 tracking-wider">World Generator</h1>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-purple-700 rounded-lg"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="mt-4 flex gap-4">
        <button
          onClick={regenerateMap}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
        >
          Regenerate (R)
        </button>
        <span className="text-zinc-500 text-sm self-center">
          Seed: {currentSeed}
        </span>
      </div>
      <div className="mt-2 text-zinc-500 text-sm">
        <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-300">WASD</kbd> Move |{' '}
        <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-300">R</kbd> New World
      </div>
    </div>
  );
}
