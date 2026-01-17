'use client';

import { useEffect, useRef, useState } from 'react';
import {
  loadGameAtlas,
  TILE_SIZE,
  type SpriteAtlas,
  type NPC,
} from '@/lib/gameEngine';
import {
  createCamera,
  updateCamera,
  getCameraOffset,
  renderChunks,
  renderChunkDebug,
  renderEntity,
  clearCanvas,
  type Camera,
} from '@/lib/renderEngine';
import {
  createPlayer,
  updatePlayerMovementWorld,
  getNPCAtPosition,
  type Player,
} from '@/lib/playerEngine';
import { ChunkManager } from '@/lib/world/chunkManager';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// ===== GAME STATE =====

interface WorldGenState {
  player: Player;
  camera: Camera;
  chunkManager: ChunkManager;
  worldSeed: number;
  showDebug: boolean;
  currentDialogue: {
    npcName: string;
    text: string;
    index: number;
    totalLines: number;
  } | null;
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
  const [stats, setStats] = useState({ chunks: 0, npcs: 0, regions: 0 });

  // Initialize
  useEffect(() => {
    async function init() {
      try {
        const atlas = await loadGameAtlas('/custom_sprites.atlas', '/Dawnlike4.png');
        atlasRef.current = atlas;

        const seed = Math.floor(Math.random() * 100000);
        setCurrentSeed(seed);

        const chunkManager = new ChunkManager(seed, {
          loadRadius: 3,
          unloadRadius: 5,
          maxLoadedChunks: 100,
        });

        // Find spawn point
        const spawn = chunkManager.findSpawnPoint();
        const player = createPlayer(spawn.x, spawn.y);

        stateRef.current = {
          player,
          camera: createCamera(player.x, player.y),
          chunkManager,
          worldSeed: seed,
          showDebug: false,
          currentDialogue: null,
        };

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
        setLoading(false);
      }
    }
    init();
  }, []);

  // Regenerate world
  const regenerateWorld = () => {
    if (!stateRef.current) return;

    const seed = Math.floor(Math.random() * 100000);
    setCurrentSeed(seed);

    const chunkManager = new ChunkManager(seed, {
      loadRadius: 3,
      unloadRadius: 5,
      maxLoadedChunks: 100,
    });

    const spawn = chunkManager.findSpawnPoint();
    const player = createPlayer(spawn.x, spawn.y);

    stateRef.current = {
      player,
      camera: createCamera(player.x, player.y),
      chunkManager,
      worldSeed: seed,
      showDebug: stateRef.current.showDebug,
      currentDialogue: null,
    };
  };

  // Input handling
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const state = stateRef.current;
      if (!state) return;

      const key = e.key.toLowerCase();
      keysRef.current.add(key);

      // Toggle debug with F3
      if (key === 'f3') {
        state.showDebug = !state.showDebug;
        e.preventDefault();
      }

      // Handle dialogue
      if (key === 'e') {
        if (state.currentDialogue) {
          // Advance or close dialogue
          const npcs = state.chunkManager.getAllLoadedNPCs();
          const npc = npcs.find(n => n.name === state.currentDialogue!.npcName);
          if (!npc) {
            state.currentDialogue = null;
            return;
          }

          const nextIndex = state.currentDialogue.index + 1;
          if (nextIndex >= npc.dialogue.length) {
            state.currentDialogue = null;
          } else {
            state.currentDialogue = {
              npcName: npc.name,
              text: npc.dialogue[nextIndex],
              index: nextIndex,
              totalLines: npc.dialogue.length,
            };
          }
        } else {
          // Try to interact with nearby NPC
          const nearbyNPC = findNearbyNPC(state);
          if (nearbyNPC) {
            state.currentDialogue = {
              npcName: nearbyNPC.name,
              text: nearbyNPC.dialogue[0],
              index: 0,
              totalLines: nearbyNPC.dialogue.length,
            };
          }
        }
      }

      // Regenerate with R
      if (key === 'r') {
        regenerateWorld();
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

  // Find nearby NPC for interaction
  function findNearbyNPC(state: WorldGenState): NPC | null {
    const { player, chunkManager } = state;
    const interactionDistance = 1.5;
    const npcs = chunkManager.getAllLoadedNPCs();

    for (const npc of npcs) {
      const dx = Math.abs(npc.x - player.x);
      const dy = Math.abs(npc.y - player.y);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= interactionDistance) {
        return npc;
      }
    }
    return null;
  }

  // Game loop
  useEffect(() => {
    if (loading || error) return;

    let lastTime = performance.now();
    let animationId: number;
    let statsUpdateTimer = 0;

    function gameLoop() {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      update(deltaTime);
      render();

      // Update stats periodically
      statsUpdateTimer += deltaTime;
      if (statsUpdateTimer > 500) {
        statsUpdateTimer = 0;
        const state = stateRef.current;
        if (state) {
          setStats({
            chunks: state.chunkManager.getLoadedChunkCount(),
            npcs: state.chunkManager.getAllLoadedNPCs().length,
            regions: state.chunkManager.getLoadedRegionCount(),
          });
        }
      }

      animationId = requestAnimationFrame(gameLoop);
    }

    function update(deltaTime: number) {
      const state = stateRef.current;
      if (!state) return;

      animTimeRef.current += deltaTime;

      // Update chunk loading based on player position
      state.chunkManager.update(state.player.x, state.player.y);

      // Update player movement
      updatePlayerMovementWorld(state.player, state.chunkManager, keysRef.current, deltaTime);

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

      // Get visible chunks
      const viewportTilesX = Math.ceil(CANVAS_WIDTH / TILE_SIZE) + 2;
      const viewportTilesY = Math.ceil(CANVAS_HEIGHT / TILE_SIZE) + 2;
      const visibleChunks = state.chunkManager.getVisibleChunks(
        state.camera.x,
        state.camera.y,
        viewportTilesX,
        viewportTilesY
      );

      // Render chunks
      renderChunks(ctx, atlas, visibleChunks, offsetX, offsetY, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Debug: render chunk boundaries
      if (state.showDebug) {
        renderChunkDebug(ctx, visibleChunks, offsetX, offsetY);
      }

      // Render NPCs
      const animFrame = Math.floor(animTimeRef.current / 300) % 2;
      const npcs = state.chunkManager.getAllLoadedNPCs();
      for (const npc of npcs) {
        renderEntity(ctx, atlas, npc, offsetX, offsetY, undefined, animFrame);

        // Draw NPC name
        const screenX = npc.x * TILE_SIZE + offsetX;
        const screenY = npc.y * TILE_SIZE + offsetY;
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, screenX + TILE_SIZE / 2, screenY - 4);
      }

      // Render player
      renderEntity(ctx, atlas, state.player, offsetX, offsetY, undefined, animFrame);

      // Check if near NPC for interaction prompt
      const nearbyNPC = findNearbyNPC(state);

      // UI overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 280, 100);
      ctx.strokeStyle = '#8844aa';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 280, 100);

      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Seed: ${state.worldSeed}`, 20, 32);
      ctx.fillText(`Position: ${Math.floor(state.player.x)}, ${Math.floor(state.player.y)}`, 20, 52);
      ctx.fillText(`Chunks: ${stats.chunks} | NPCs: ${stats.npcs} | Regions: ${stats.regions}`, 20, 72);
      ctx.fillStyle = '#888888';
      ctx.font = '12px monospace';
      ctx.fillText('WASD: Move | R: Regenerate | F3: Debug', 20, 92);

      // Interaction prompt
      if (nearbyNPC && !state.currentDialogue) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT - 80, 200, 30);
        ctx.strokeStyle = '#8844aa';
        ctx.lineWidth = 2;
        ctx.strokeRect(CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT - 80, 200, 30);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`E: Talk to ${nearbyNPC.name}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 58);
      }

      // Dialogue box
      if (state.currentDialogue) {
        const dialogueWidth = CANVAS_WIDTH - 100;
        const dialogueHeight = 120;
        const dialogueX = 50;
        const dialogueY = CANVAS_HEIGHT - dialogueHeight - 20;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(dialogueX, dialogueY, dialogueWidth, dialogueHeight);
        ctx.strokeStyle = '#8844aa';
        ctx.lineWidth = 3;
        ctx.strokeRect(dialogueX, dialogueY, dialogueWidth, dialogueHeight);

        // NPC name
        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(state.currentDialogue.npcName, dialogueX + 20, dialogueY + 25);

        // Dialogue text (word wrap)
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        const words = state.currentDialogue.text.split(' ');
        let line = '';
        let y = dialogueY + 50;
        const maxWidth = dialogueWidth - 40;

        for (const word of words) {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, dialogueX + 20, y);
            line = word + ' ';
            y += 20;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, dialogueX + 20, y);

        // Progress indicator
        ctx.fillStyle = '#888888';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(
          `${state.currentDialogue.index + 1}/${state.currentDialogue.totalLines} | E: Continue`,
          dialogueX + dialogueWidth - 20,
          dialogueY + dialogueHeight - 15
        );
      }
    }

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [loading, error, stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-400">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          Loading Infinite World Generator...
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
      <h1 className="text-2xl font-bold text-purple-500 mb-4 tracking-wider">Infinite World Generator</h1>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-purple-700 rounded-lg"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="mt-4 flex gap-4">
        <button
          onClick={regenerateWorld}
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
        <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-300">E</kbd> Interact |{' '}
        <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-300">R</kbd> New World |{' '}
        <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-300">F3</kbd> Debug
      </div>
    </div>
  );
}
