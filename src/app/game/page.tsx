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
  createInventory,
  addTrouble,
  addRealItem,
  removeRealItem,
  removeTrouble,
  getCauldronItems,
  createPlayerStats,
  getCharismaModifier,
  rollD20,
  type SpriteAtlas,
  type GameMap,
  type Entity,
  type NPC,
  type Inventory,
  type Trouble,
  type RealItem,
  type PlayerStats,
} from '@/lib/gameEngine';
import { combiningSystem, combineInCauldron } from '@/lib/combiningSystem';

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
  queuedMoveX?: number;
  queuedMoveY?: number;
}

interface Camera {
  x: number;
  y: number;
}

interface PriceOption {
  coins: number;
  dc: number;
  disabled: boolean;
}

interface RollResult {
  roll: number;
  modifier: number;
  total: number;
  dc: number;
  success: boolean;
}

function createPriceOptions(): PriceOption[] {
  return [
    { coins: 0, dc: 0, disabled: false },
    { coins: 1, dc: 10, disabled: false },
    { coins: 2, dc: 15, disabled: false },
  ];
}

interface GameState {
  player: Player;
  camera: Camera;
  map: GameMap;
  dialogueNPC: NPC | null;
  dialogueIndex: number;
  showOfferOption: boolean;
  notification: string | null;
  notificationTimer: number;
  inventory: Inventory;
  activePanel: 'none' | 'inventory' | 'cauldron' | 'offer';
  selectedCauldronItems: string[];
  cauldronCursor: { column: 'seeds' | 'troubles'; index: number };
  selectedOfferItem: string | null;
  offerCursor: number;
  offerNPC: NPC | null;
  fieldInteractions: Set<string>;
  npcsTalkedTo: Set<string>;
  // Player stats
  playerStats: PlayerStats;
  // Negotiation state
  offerPriceOptions: PriceOption[];
  lastRoll: RollResult | null;
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
          showOfferOption: false,
          notification: 'Welcome! WASD: move, E: interact, I: inventory',
          notificationTimer: 3000,
          inventory: createInventory(),
          activePanel: 'none',
          selectedCauldronItems: [],
          cauldronCursor: { column: 'seeds', index: 0 },
          selectedOfferItem: null,
          offerCursor: 0,
          offerNPC: null,
          fieldInteractions: new Set(),
          npcsTalkedTo: new Set(),
          playerStats: createPlayerStats(),
          offerPriceOptions: createPriceOptions(),
          lastRoll: null,
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
      const state = gameStateRef.current;
      if (!state) return;

      // Inventory toggle
      if (e.key.toLowerCase() === 'i') {
        if (state.activePanel === 'inventory') {
          state.activePanel = 'none';
        } else if (state.activePanel === 'none' && !state.dialogueNPC) {
          state.activePanel = 'inventory';
        }
        return;
      }

      // Close panel or dialogue with Escape
      if (e.key === 'Escape') {
        if (state.activePanel !== 'none') {
          state.activePanel = 'none';
          state.selectedCauldronItems = [];
          state.selectedOfferItem = null;
          state.offerNPC = null;
        } else if (state.showOfferOption) {
          state.showOfferOption = false;
          state.dialogueNPC = null;
        } else if (state.dialogueNPC) {
          state.dialogueNPC = null;
          state.dialogueIndex = 0;
        }
        return;
      }

      // WASD navigation in cauldron panel
      if (state.activePanel === 'cauldron') {
        const troubles = state.inventory.troubles.filter(t => t.count > 0);
        const seeds = state.inventory.realItems.filter(i => i.count > 0);
        const key = e.key.toLowerCase();

        if (key === 'w' || key === 'arrowup') {
          e.preventDefault();
          if (state.cauldronCursor.index > 0) {
            state.cauldronCursor.index--;
          }
        } else if (key === 's' || key === 'arrowdown') {
          e.preventDefault();
          const maxIndex = state.cauldronCursor.column === 'seeds' ? seeds.length - 1 : troubles.length - 1;
          if (state.cauldronCursor.index < maxIndex) {
            state.cauldronCursor.index++;
          }
        } else if (key === 'a' || key === 'arrowleft') {
          e.preventDefault();
          if (state.cauldronCursor.column === 'troubles') {
            state.cauldronCursor.column = 'seeds';
            state.cauldronCursor.index = Math.min(state.cauldronCursor.index, Math.max(0, seeds.length - 1));
          }
        } else if (key === 'd' || key === 'arrowright') {
          e.preventDefault();
          if (state.cauldronCursor.column === 'seeds') {
            state.cauldronCursor.column = 'troubles';
            state.cauldronCursor.index = Math.min(state.cauldronCursor.index, Math.max(0, troubles.length - 1));
          }
        } else if (key === 'e' || key === ' ') {
          e.preventDefault();
          // Select/deselect item at cursor
          const items = state.cauldronCursor.column === 'seeds' ? seeds : troubles;
          if (items.length > 0 && state.cauldronCursor.index < items.length) {
            const itemId = items[state.cauldronCursor.index].id;
            if (state.selectedCauldronItems.includes(itemId)) {
              state.selectedCauldronItems = state.selectedCauldronItems.filter(id => id !== itemId);
            } else if (state.selectedCauldronItems.length < 2) {
              state.selectedCauldronItems = [...state.selectedCauldronItems, itemId];
            }
          }
        } else if (key === 'c') {
          // Combine selected items
          if (state.selectedCauldronItems.length === 2) {
            const result = combineInCauldron(
              state.inventory,
              state.selectedCauldronItems[0],
              state.selectedCauldronItems[1]
            );
            if (result) {
              state.notification = `Created: ${result.name}!`;
              state.notificationTimer = 3000;
              state.selectedCauldronItems = [];
              // Reset cursor
              state.cauldronCursor = { column: 'seeds', index: 0 };
            } else {
              state.notification = 'Cannot combine these items!';
              state.notificationTimer = 2000;
            }
          }
        }
        return;
      }

      // WASD navigation in offer panel
      if (state.activePanel === 'offer') {
        const items = state.inventory.realItems.filter(i => i.count > 0);
        const key = e.key.toLowerCase();

        if (key === 'w' || key === 'arrowup') {
          e.preventDefault();
          if (state.offerCursor > 0) {
            state.offerCursor--;
          }
        } else if (key === 's' || key === 'arrowdown') {
          e.preventDefault();
          if (state.offerCursor < items.length - 1) {
            state.offerCursor++;
          }
        } else if (key === 'e' || key === ' ') {
          e.preventDefault();
          // Select/deselect item at cursor
          if (items.length > 0 && state.offerCursor < items.length) {
            const itemId = items[state.offerCursor].id;
            if (state.selectedOfferItem === itemId) {
              state.selectedOfferItem = null;
              // Reset price options when deselecting
              state.offerPriceOptions = createPriceOptions();
              state.lastRoll = null;
            } else {
              state.selectedOfferItem = itemId;
              // Reset price options when selecting new item
              state.offerPriceOptions = createPriceOptions();
              state.lastRoll = null;
            }
          }
        } else if ((key === '1' || key === '2' || key === '3') && state.selectedOfferItem && state.offerNPC) {
          // Negotiate price
          e.preventDefault();
          const optionIndex = parseInt(key) - 1;
          const option = state.offerPriceOptions[optionIndex];

          if (option.disabled) {
            state.notification = 'That price was already rejected!';
            state.notificationTimer = 2000;
            return;
          }

          const roll = rollD20();
          const modifier = getCharismaModifier(state.playerStats.charisma);
          const total = roll + modifier;
          const success = total >= option.dc;

          state.lastRoll = { roll, modifier, total, dc: option.dc, success };

          if (success) {
            const item = state.inventory.realItems.find(i => i.id === state.selectedOfferItem);
            if (item) {
              removeRealItem(state.inventory, item.id);
              state.inventory.gold += option.coins;
              const coinText = option.coins === 0 ? 'for free' : `for ${option.coins} coin${option.coins > 1 ? 's' : ''}`;
              state.notification = `Deal! Gave ${item.name} ${coinText}. (Rolled ${roll}+${modifier}=${total} vs DC ${option.dc})`;
              state.notificationTimer = 4000;
              state.selectedOfferItem = null;
              state.offerCursor = 0;
              state.offerPriceOptions = createPriceOptions();
              state.lastRoll = null;
              state.activePanel = 'none';
              state.offerNPC = null;
            }
          } else {
            state.offerPriceOptions[optionIndex].disabled = true;
            state.notification = `Rejected! Rolled ${roll}+${modifier}=${total} vs DC ${option.dc}`;
            state.notificationTimer = 3000;
          }
        }
        return;
      }

      // Handle interaction (only when no panel is open)
      if (e.key.toLowerCase() === 'e' || e.key === ' ') {
        // If showing offer option, E closes it
        if (state.showOfferOption) {
          state.showOfferOption = false;
          state.dialogueNPC = null;
          return;
        }

        if (state.dialogueNPC) {
          const npc = state.dialogueNPC;
          const hasTrouble = !!npc.trouble;
          const isFirstTime = !state.npcsTalkedTo.has(npc.name);

          state.dialogueIndex++;

          // Check if dialogue ended
          if (state.dialogueIndex >= npc.dialogue.length) {
            // First time talking to NPC with trouble - give them the trouble
            if (hasTrouble && isFirstTime) {
              state.npcsTalkedTo.add(npc.name);
              addTrouble(state.inventory, {
                name: npc.trouble!.name,
                description: npc.trouble!.description,
                severity: npc.trouble!.severity,
                statModifiers: npc.trouble!.statModifiers,
                grantsFeature: npc.trouble!.grantsFeature,
                color: npc.trouble!.color,
              });
              state.notification = `Received Trouble: ${npc.trouble!.name}`;
              state.notificationTimer = 3000;
            }

            // If NPC has trouble and we've talked before, show offer option
            if (hasTrouble && state.npcsTalkedTo.has(npc.name)) {
              state.showOfferOption = true;
              state.dialogueIndex = npc.dialogue.length; // Keep at end
            } else {
              state.dialogueNPC = null;
              state.dialogueIndex = 0;
            }
          }
        } else {
          // Try to interact with nearby NPC or tile
          tryInteract(state);
        }
      }

      // Handle 'O' to offer something when option is shown
      if (e.key.toLowerCase() === 'o' && state.showOfferOption && state.dialogueNPC) {
        state.offerNPC = state.dialogueNPC;
        state.activePanel = 'offer';
        state.selectedOfferItem = null;
        state.offerCursor = 0;
        state.offerPriceOptions = createPriceOptions();
        state.lastRoll = null;
        state.showOfferOption = false;
        state.dialogueNPC = null;
        state.dialogueIndex = 0;
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      keysRef.current.delete(e.key.toLowerCase());
    }

    function getCauldronItemAtPosition(mouseX: number, mouseY: number): number {
      const state = gameStateRef.current;
      if (!state) return -1;

      const panelWidth = 600;
      const panelHeight = 450;
      const panelX = (CANVAS_WIDTH - panelWidth) / 2;
      const panelY = (CANVAS_HEIGHT - panelHeight) / 2;
      const colWidth = (panelWidth - 40) / 2;

      if (mouseX < panelX || mouseX > panelX + panelWidth ||
          mouseY < panelY || mouseY > panelY + panelHeight) {
        return -1;
      }

      const troubles = state.inventory.troubles.filter(t => t.count > 0);
      const seeds = state.inventory.realItems.filter(i => i.count > 0);
      const itemHeight = 26;
      const startY = 90; // 70 + 20 for header

      // Left column: Seeds (indices start after troubles)
      const leftX = panelX + 15;
      for (let i = 0; i < seeds.length; i++) {
        const itemY = panelY + startY + (i * itemHeight) - 12;
        const itemEndY = itemY + 28;
        if (mouseY >= itemY && mouseY <= itemEndY && mouseX >= leftX - 5 && mouseX <= leftX + colWidth - 5) {
          return troubles.length + i; // Seeds come after troubles in the combined list
        }
      }

      // Right column: Troubles (indices 0 to troubles.length-1)
      const rightX = panelX + panelWidth / 2 + 10;
      for (let i = 0; i < troubles.length; i++) {
        const itemY = panelY + startY + (i * itemHeight) - 12;
        const itemEndY = itemY + 28;
        if (mouseY >= itemY && mouseY <= itemEndY && mouseX >= rightX - 5 && mouseX <= rightX + colWidth - 5) {
          return i;
        }
      }

      return -1;
    }

    function getOfferItemAtPosition(mouseX: number, mouseY: number): number {
      const state = gameStateRef.current;
      if (!state) return -1;

      const panelWidth = 450;
      const panelHeight = 400;
      const panelX = (CANVAS_WIDTH - panelWidth) / 2;
      const panelY = (CANVAS_HEIGHT - panelHeight) / 2;

      if (mouseX < panelX || mouseX > panelX + panelWidth ||
          mouseY < panelY || mouseY > panelY + panelHeight) {
        return -1;
      }

      const items = state.inventory.realItems.filter(i => i.count > 0);
      const itemHeight = 28;
      // Items start at yOffset 100 (80 + 20 for header)
      const startY = 100;

      for (let i = 0; i < items.length; i++) {
        const itemY = panelY + startY + (i * itemHeight) - 12;
        const itemEndY = itemY + 32;
        if (mouseY >= itemY && mouseY <= itemEndY && mouseX >= panelX + 15 && mouseX <= panelX + panelWidth - 15) {
          return i;
        }
      }

      return -1;
    }

    function handleClick(e: MouseEvent) {
      const state = gameStateRef.current;
      const canvas = canvasRef.current;
      if (!state || !canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // Handle cauldron panel clicks
      if (state.activePanel === 'cauldron') {
        const itemIndex = getCauldronItemAtPosition(clickX, clickY);
        if (itemIndex >= 0) {
          const items = getCauldronItems(state.inventory);
          const itemId = items[itemIndex].id;
          if (state.selectedCauldronItems.includes(itemId)) {
            state.selectedCauldronItems = state.selectedCauldronItems.filter(id => id !== itemId);
          } else if (state.selectedCauldronItems.length < 2) {
            state.selectedCauldronItems = [...state.selectedCauldronItems, itemId];
          }
        }
      }

      // Handle offer panel clicks
      if (state.activePanel === 'offer') {
        const itemIndex = getOfferItemAtPosition(clickX, clickY);
        if (itemIndex >= 0) {
          const items = state.inventory.realItems.filter(i => i.count > 0);
          const itemId = items[itemIndex].id;
          state.selectedOfferItem = state.selectedOfferItem === itemId ? null : itemId;
        }
      }
    }

    function handleMouseMove(e: MouseEvent) {
      const canvas = canvasRef.current;
      const state = gameStateRef.current;
      if (!canvas || !state) return;

      if (state.activePanel !== 'cauldron' && state.activePanel !== 'offer') {
        canvas.style.cursor = 'default';
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      let itemIndex = -1;
      if (state.activePanel === 'cauldron') {
        itemIndex = getCauldronItemAtPosition(mouseX, mouseY);
      } else if (state.activePanel === 'offer') {
        itemIndex = getOfferItemAtPosition(mouseX, mouseY);
      }
      canvas.style.cursor = itemIndex >= 0 ? 'pointer' : 'default';
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
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
    } else if (tile === TILES.CAULDRON) {
      // Open cauldron panel
      state.activePanel = 'cauldron';
      state.selectedCauldronItems = [];
    } else if (tile === TILES.FIELD_EMPTY || tile === TILES.FIELD_DEAD) {
      // Give Old Growth seed on first interaction with each field
      const fieldKey = `${interactX},${interactY}`;
      if (!state.fieldInteractions.has(fieldKey)) {
        state.fieldInteractions.add(fieldKey);
        addRealItem(state.inventory, {
          name: 'Old Growth seed',
          description: 'A seed from the old fields. Holds ancient potential.',
          stats: { yield: 1, hardiness: 1, speed: 1, efficiency: 1 },
          feature: tile === TILES.FIELD_DEAD ? 'Survivor' : null,
          color: '#6b5b4f',
        });
        state.notification = 'Found an Old Growth seed!';
        state.notificationTimer = 3000;
      } else {
        state.notification = tile === TILES.FIELD_DEAD ? 'Nothing but dead crops here...' : 'An empty field.';
        state.notificationTimer = 2000;
      }
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

      // Don't update player if in dialogue or panel is open
      if (state.dialogueNPC || state.activePanel !== 'none') return;

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
      }

      // Check for new movement input
      // Allow checking near the end of movement for smoother transitions, but don't interrupt early
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
          if (dx === -1) player.direction = 'left';
          else if (dx === 1) player.direction = 'right';
          else if (dy === -1) player.direction = 'up';
          else if (dy === 1) player.direction = 'down';

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
            // Queue next movement - will start when current movement completes
            // Store the queued direction
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
        const showingOffer = state.showOfferOption;
        const dialogueHeight = showingOffer ? 130 : 100;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(20, CANVAS_HEIGHT - dialogueHeight - 20, CANVAS_WIDTH - 40, dialogueHeight);
        ctx.strokeStyle = showingOffer ? '#aa66cc' : '#4a7c59';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, CANVAS_HEIGHT - dialogueHeight - 20, CANVAS_WIDTH - 40, dialogueHeight);

        // NPC name
        ctx.fillStyle = showingOffer ? '#aa66cc' : '#4a7c59';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(state.dialogueNPC.name, 40, CANVAS_HEIGHT - dialogueHeight + 5);

        if (showingOffer) {
          // Show offer option
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px monospace';
          ctx.fillText(`${state.dialogueNPC.name} has shared their troubles with you.`, 40, CANVAS_HEIGHT - dialogueHeight + 35);

          // Offer option
          ctx.fillStyle = '#aa66cc';
          ctx.font = 'bold 14px monospace';
          ctx.fillText('[O] Offer something for their troubles...', 40, CANVAS_HEIGHT - dialogueHeight + 65);

          // Close prompt
          ctx.fillStyle = '#888888';
          ctx.font = '12px monospace';
          ctx.textAlign = 'right';
          ctx.fillText('[E] or [ESC] Leave', CANVAS_WIDTH - 40, CANVAS_HEIGHT - 35);
        } else {
          // Normal dialogue text
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
      }

      // Draw inventory panel
      if (state.activePanel === 'inventory') {
        renderInventoryPanel(ctx, state);
      }

      // Draw cauldron panel
      if (state.activePanel === 'cauldron') {
        renderCauldronPanel(ctx, state);
      }

      // Draw offer panel
      if (state.activePanel === 'offer') {
        renderOfferPanel(ctx, state);
      }

      // Draw controls hint
      if (!state.dialogueNPC && !state.notification && state.activePanel === 'none') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('WASD: Move | E: Interact | I: Inventory', 10, 20);
      }
    }

    function renderInventoryPanel(ctx: CanvasRenderingContext2D, state: GameState) {
      const panelWidth = 350;
      const panelHeight = 400;
      const panelX = (CANVAS_WIDTH - panelWidth) / 2;
      const panelY = (CANVAS_HEIGHT - panelHeight) / 2;

      // Panel background
      ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
      ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
      ctx.strokeStyle = '#4a7c59';
      ctx.lineWidth = 3;
      ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

      // Title
      ctx.fillStyle = '#4a7c59';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('INVENTORY', panelX + panelWidth / 2, panelY + 30);

      // Gold display
      ctx.fillStyle = '#ffd700';
      ctx.font = '14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Gold: ${state.inventory.gold}`, panelX + panelWidth - 20, panelY + 30);

      let yOffset = 60;

      // Troubles section
      ctx.fillStyle = '#d9534f';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Troubles:', panelX + 20, panelY + yOffset);
      yOffset += 25;

      if (state.inventory.troubles.length === 0) {
        ctx.fillStyle = '#666666';
        ctx.font = '12px monospace';
        ctx.fillText('  (none)', panelX + 20, panelY + yOffset);
        yOffset += 20;
      } else {
        for (const trouble of state.inventory.troubles) {
          ctx.fillStyle = trouble.color;
          ctx.font = '12px monospace';
          const countStr = trouble.count > 1 ? ` x${trouble.count}` : '';
          ctx.fillText(`  • ${trouble.name}${countStr}`, panelX + 20, panelY + yOffset);
          yOffset += 18;
          ctx.fillStyle = '#888888';
          ctx.font = '10px monospace';
          ctx.fillText(`    ${trouble.description.slice(0, 40)}...`, panelX + 20, panelY + yOffset);
          yOffset += 20;
        }
      }

      yOffset += 15;

      // Seeds section
      ctx.fillStyle = '#5cb85c';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Seeds:', panelX + 20, panelY + yOffset);
      yOffset += 25;

      if (state.inventory.realItems.length === 0) {
        ctx.fillStyle = '#666666';
        ctx.font = '12px monospace';
        ctx.fillText('  (none)', panelX + 20, panelY + yOffset);
        yOffset += 20;
      } else {
        for (const item of state.inventory.realItems) {
          ctx.fillStyle = item.color;
          ctx.font = '12px monospace';
          const countStr = item.count > 1 ? ` x${item.count}` : '';
          ctx.fillText(`  • ${item.name}${countStr}`, panelX + 20, panelY + yOffset);
          yOffset += 18;
          ctx.fillStyle = '#888888';
          ctx.font = '10px monospace';
          const statsStr = `Y:${item.stats.yield} H:${item.stats.hardiness} S:${item.stats.speed} E:${item.stats.efficiency}`;
          ctx.fillText(`    ${statsStr}`, panelX + 20, panelY + yOffset);
          yOffset += 20;
        }
      }

      // Close hint
      ctx.fillStyle = '#666666';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[I] or [ESC] to close', panelX + panelWidth / 2, panelY + panelHeight - 15);
    }

    function renderCauldronPanel(ctx: CanvasRenderingContext2D, state: GameState) {
      const panelWidth = 600;
      const panelHeight = 450;
      const panelX = (CANVAS_WIDTH - panelWidth) / 2;
      const panelY = (CANVAS_HEIGHT - panelHeight) / 2;
      const colWidth = (panelWidth - 40) / 2;

      // Panel background
      ctx.fillStyle = 'rgba(30, 20, 40, 0.95)';
      ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
      ctx.strokeStyle = '#8844aa';
      ctx.lineWidth = 3;
      ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

      // Title
      ctx.fillStyle = '#aa66cc';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MAGIC CAULDRON', panelX + panelWidth / 2, panelY + 30);

      // Instructions
      ctx.fillStyle = '#888888';
      ctx.font = '11px monospace';
      ctx.fillText('WASD: navigate | E: select | C: combine', panelX + panelWidth / 2, panelY + 48);

      // Get items separately
      const troubles = state.inventory.troubles.filter(t => t.count > 0);
      const seeds = state.inventory.realItems.filter(i => i.count > 0);
      const allItems = getCauldronItems(state.inventory);

      // Draw column divider
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(panelX + panelWidth / 2, panelY + 60);
      ctx.lineTo(panelX + panelWidth / 2, panelY + panelHeight - 120);
      ctx.stroke();

      // LEFT COLUMN: Seeds (real items)
      const leftX = panelX + 15;
      let leftY = 70;
      const cursorOnSeeds = state.cauldronCursor.column === 'seeds';

      ctx.fillStyle = cursorOnSeeds ? '#5cb85c' : '#444444';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('● SEEDS', leftX, panelY + leftY);
      leftY += 20;

      if (seeds.length === 0) {
        ctx.fillStyle = '#555555';
        ctx.font = '11px monospace';
        ctx.fillText('(none)', leftX, panelY + leftY);
      } else {
        for (let i = 0; i < seeds.length; i++) {
          const seed = seeds[i];
          const isSelected = state.selectedCauldronItems.includes(seed.id);
          const isCursor = cursorOnSeeds && state.cauldronCursor.index === i;

          // Cursor highlight (white border)
          if (isCursor) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(leftX - 5, panelY + leftY - 12, colWidth, 26);
          }

          // Selection background
          if (isSelected) {
            ctx.fillStyle = 'rgba(92, 184, 92, 0.35)';
            ctx.fillRect(leftX - 4, panelY + leftY - 11, colWidth - 2, 24);
          }

          // Cursor indicator
          ctx.fillStyle = isCursor ? '#ffffff' : '#444444';
          ctx.font = '11px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(isCursor ? '>' : ' ', leftX - 2, panelY + leftY);

          ctx.fillStyle = isSelected ? '#5cb85c' : (isCursor ? '#ffffff' : seed.color);
          ctx.font = '11px monospace';
          const name = seed.name.length > 16 ? seed.name.slice(0, 14) + '..' : seed.name;
          ctx.fillText(name, leftX + 10, panelY + leftY);

          ctx.fillStyle = '#555555';
          ctx.font = '9px monospace';
          ctx.fillText(`Y${seed.stats.yield} H${seed.stats.hardiness}`, leftX + colWidth - 50, panelY + leftY);

          leftY += 26;
        }
      }

      // RIGHT COLUMN: Troubles
      const rightX = panelX + panelWidth / 2 + 10;
      let rightY = 70;
      const cursorOnTroubles = state.cauldronCursor.column === 'troubles';

      ctx.fillStyle = cursorOnTroubles ? '#d9534f' : '#444444';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('◆ TROUBLES', rightX, panelY + rightY);
      rightY += 20;

      if (troubles.length === 0) {
        ctx.fillStyle = '#555555';
        ctx.font = '11px monospace';
        ctx.fillText('(none)', rightX, panelY + rightY);
      } else {
        for (let i = 0; i < troubles.length; i++) {
          const trouble = troubles[i];
          const isSelected = state.selectedCauldronItems.includes(trouble.id);
          const isCursor = cursorOnTroubles && state.cauldronCursor.index === i;

          // Cursor highlight (white border)
          if (isCursor) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(rightX - 5, panelY + rightY - 12, colWidth, 26);
          }

          // Selection background
          if (isSelected) {
            ctx.fillStyle = 'rgba(217, 83, 79, 0.35)';
            ctx.fillRect(rightX - 4, panelY + rightY - 11, colWidth - 2, 24);
          }

          // Cursor indicator
          ctx.fillStyle = isCursor ? '#ffffff' : '#444444';
          ctx.font = '11px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(isCursor ? '>' : ' ', rightX - 2, panelY + rightY);

          ctx.fillStyle = isSelected ? '#d9534f' : (isCursor ? '#ffffff' : trouble.color);
          ctx.font = '11px monospace';
          const name = trouble.name.length > 16 ? trouble.name.slice(0, 14) + '..' : trouble.name;
          ctx.fillText(name, rightX + 10, panelY + rightY);

          ctx.fillStyle = '#555555';
          ctx.font = '9px monospace';
          ctx.fillText(`Sev:${trouble.severity}`, rightX + colWidth - 50, panelY + rightY);

          rightY += 26;
        }
      }

      // Preview section at bottom
      const previewY = panelHeight - 100;
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(panelX + 20, panelY + previewY);
      ctx.lineTo(panelX + panelWidth - 20, panelY + previewY);
      ctx.stroke();

      ctx.fillStyle = '#888888';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('PREVIEW:', panelX + 20, panelY + previewY + 20);

      if (state.selectedCauldronItems.length === 2) {
        const item1 = allItems.find(i => i.id === state.selectedCauldronItems[0]);
        const item2 = allItems.find(i => i.id === state.selectedCauldronItems[1]);
        if (item1 && item2) {
          const prediction = combiningSystem.predict(item1, item2);
          if (prediction.canCombine) {
            ctx.fillStyle = '#aa66cc';
            ctx.font = '14px monospace';
            ctx.fillText(`→ ${prediction.possibleName}`, panelX + 100, panelY + previewY + 20);
            ctx.fillStyle = '#5cb85c';
            ctx.font = 'bold 12px monospace';
            ctx.fillText('[C] Combine!', panelX + 20, panelY + previewY + 45);
          } else {
            ctx.fillStyle = '#d9534f';
            ctx.font = '12px monospace';
            ctx.fillText('Cannot combine these items.', panelX + 100, panelY + previewY + 20);
          }
        }
      } else if (state.selectedCauldronItems.length === 1) {
        ctx.fillStyle = '#666666';
        ctx.font = '12px monospace';
        ctx.fillText('Select one more...', panelX + 100, panelY + previewY + 20);
      } else {
        ctx.fillStyle = '#666666';
        ctx.font = '12px monospace';
        ctx.fillText('Select a seed + trouble', panelX + 100, panelY + previewY + 20);
      }

      // Close hint
      ctx.fillStyle = '#666666';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ESC] to close', panelX + panelWidth / 2, panelY + panelHeight - 15);
    }

    function renderOfferPanel(ctx: CanvasRenderingContext2D, state: GameState) {
      const panelWidth = 500;
      const panelHeight = 450;
      const panelX = (CANVAS_WIDTH - panelWidth) / 2;
      const panelY = (CANVAS_HEIGHT - panelHeight) / 2;

      // Panel background
      ctx.fillStyle = 'rgba(30, 30, 20, 0.95)';
      ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 3;
      ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

      // Title
      ctx.fillStyle = '#c9a227';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      const npcName = state.offerNPC?.name || 'NPC';
      ctx.fillText(`NEGOTIATE WITH ${npcName.toUpperCase()}`, panelX + panelWidth / 2, panelY + 30);

      // Instructions
      ctx.fillStyle = '#888888';
      ctx.font = '11px monospace';
      ctx.fillText('W/S: navigate | E: select item | 1-3: negotiate price', panelX + panelWidth / 2, panelY + 48);

      // Only show real items (seeds), not troubles
      const items = state.inventory.realItems.filter(i => i.count > 0);

      let yOffset = 70;

      // Section header
      ctx.fillStyle = '#5cb85c';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('● SEEDS', panelX + 20, panelY + yOffset);
      yOffset += 20;

      if (items.length === 0) {
        ctx.fillStyle = '#666666';
        ctx.font = '12px monospace';
        ctx.fillText('  You have no items to offer.', panelX + 20, panelY + yOffset);
        yOffset += 20;
        ctx.fillText('  Explore fields to find seeds!', panelX + 20, panelY + yOffset);
      } else {
        // Draw items with cursor-based navigation
        for (let i = 0; i < Math.min(items.length, 5); i++) {
          const item = items[i];
          const isSelected = state.selectedOfferItem === item.id;
          const isCursor = state.offerCursor === i;

          // Cursor highlight (white border)
          if (isCursor) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(panelX + 15, panelY + yOffset - 12, panelWidth - 30, 26);
          }

          // Selection background
          if (isSelected) {
            ctx.fillStyle = 'rgba(201, 162, 39, 0.35)';
            ctx.fillRect(panelX + 16, panelY + yOffset - 11, panelWidth - 32, 24);
          }

          // Cursor indicator
          ctx.fillStyle = isCursor ? '#ffffff' : '#444444';
          ctx.font = '11px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(isCursor ? '>' : ' ', panelX + 20, panelY + yOffset);

          // Item name
          ctx.fillStyle = isSelected ? '#c9a227' : (isCursor ? '#ffffff' : item.color);
          ctx.font = '12px monospace';
          const countStr = item.count > 1 ? ` x${item.count}` : '';
          ctx.fillText(`${item.name}${countStr}`, panelX + 35, panelY + yOffset);

          // Stats
          ctx.fillStyle = '#555555';
          ctx.font = '10px monospace';
          ctx.fillText(`Y${item.stats.yield} H${item.stats.hardiness} S${item.stats.speed} E${item.stats.efficiency}`, panelX + 280, panelY + yOffset);

          yOffset += 26;
        }
      }

      // Divider
      yOffset = 220;
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(panelX + 20, panelY + yOffset);
      ctx.lineTo(panelX + panelWidth - 20, panelY + yOffset);
      ctx.stroke();

      // Price negotiation section
      yOffset += 20;
      ctx.fillStyle = '#c9a227';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('NEGOTIATE PRICE:', panelX + 20, panelY + yOffset);

      const modifier = getCharismaModifier(state.playerStats.charisma);
      ctx.fillStyle = '#888888';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Your modifier: +${modifier}`, panelX + panelWidth - 20, panelY + yOffset);

      yOffset += 25;

      if (state.selectedOfferItem) {
        // Show price options
        for (let i = 0; i < state.offerPriceOptions.length; i++) {
          const option = state.offerPriceOptions[i];
          const label = option.coins === 0 ? 'Free (always works)' :
                       `${option.coins} coin${option.coins > 1 ? 's' : ''} (DC ${option.dc})`;

          if (option.disabled) {
            ctx.fillStyle = '#553333';
            ctx.font = '12px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`[${i + 1}] ${label} - REJECTED`, panelX + 30, panelY + yOffset);
          } else {
            ctx.fillStyle = '#5cb85c';
            ctx.font = '12px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`[${i + 1}] ${label}`, panelX + 30, panelY + yOffset);
          }
          yOffset += 22;
        }

        // Show last roll result
        if (state.lastRoll) {
          yOffset += 10;
          const roll = state.lastRoll;
          const resultColor = roll.success ? '#5cb85c' : '#d9534f';
          const resultText = roll.success ? 'SUCCESS' : 'FAILED';
          ctx.fillStyle = resultColor;
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`Last roll: ${roll.roll} + ${roll.modifier} = ${roll.total} vs DC ${roll.dc} → ${resultText}`, panelX + 30, panelY + yOffset);
        }
      } else {
        ctx.fillStyle = '#666666';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Select an item first...', panelX + 30, panelY + yOffset);
      }

      // Charisma display at bottom
      yOffset = panelHeight - 60;
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(panelX + 20, panelY + yOffset);
      ctx.lineTo(panelX + panelWidth - 20, panelY + yOffset);
      ctx.stroke();

      yOffset += 20;
      ctx.fillStyle = '#aa66cc';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Charisma: ${state.playerStats.charisma} (+${modifier} modifier)`, panelX + 20, panelY + yOffset);

      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'right';
      ctx.fillText(`Gold: ${state.inventory.gold}`, panelX + panelWidth - 20, panelY + yOffset);

      // Close hint
      ctx.fillStyle = '#666666';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ESC] to close', panelX + panelWidth / 2, panelY + panelHeight - 15);
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
      <h1 className="text-2xl font-bold text-green-500 mb-4 tracking-wider">Magicraft</h1>
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
