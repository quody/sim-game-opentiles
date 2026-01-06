// World/Map System

import { TILE_SIZE, TILES, COLORS } from './constants.js';
import { NPC } from './NPC.js';

export class World {
    constructor() {
        this.maps = {};
        this.currentMapId = 'eastern_hills';
        this.npcs = [];
        this.interactables = [];
        this.fields = [];

        this.initializeMaps();
    }

    initializeMaps() {
        // Eastern Hills - Main overworld
        this.maps['eastern_hills'] = this.createEasternHillsMap();
        this.maps['lab_interior'] = this.createLabInteriorMap();
        this.maps['hobbs_farm'] = this.createHobbsFarmMap();
        this.maps['market_square'] = this.createMarketSquareMap();
    }

    createEasternHillsMap() {
        const width = 40;
        const height = 35;
        const tiles = [];

        // Fill with grass
        for (let y = 0; y < height; y++) {
            tiles[y] = [];
            for (let x = 0; x < width; x++) {
                tiles[y][x] = TILES.GRASS;
            }
        }

        // Main vertical path
        for (let y = 5; y < height - 3; y++) {
            tiles[y][20] = TILES.PATH;
            tiles[y][21] = TILES.PATH;
        }

        // Horizontal path to lab
        for (let x = 8; x < 21; x++) {
            tiles[20][x] = TILES.PATH;
        }

        // Horizontal path to Hobbs farm
        for (let x = 21; x < 33; x++) {
            tiles[8][x] = TILES.PATH;
        }

        // Lab building area (bottom left)
        for (let y = 18; y < 26; y++) {
            for (let x = 3; x < 12; x++) {
                tiles[y][x] = TILES.BUILDING_EXTERIOR;
            }
        }
        // Lab door
        tiles[18][7] = TILES.DOOR;

        // Hobbs Farm area (top right)
        for (let y = 3; y < 12; y++) {
            for (let x = 28; x < 38; x++) {
                if (y >= 6 && y <= 10 && x >= 30 && x <= 36) {
                    tiles[y][x] = TILES.FIELD_DEAD;
                } else {
                    tiles[y][x] = TILES.GRASS;
                }
            }
        }
        // Trial row
        tiles[10][30] = TILES.FIELD_EMPTY;
        tiles[10][31] = TILES.FIELD_EMPTY;
        tiles[10][32] = TILES.FIELD_EMPTY;
        tiles[10][33] = TILES.FIELD_EMPTY;

        // Hobbs house
        tiles[4][32] = TILES.BUILDING_EXTERIOR;
        tiles[4][33] = TILES.BUILDING_EXTERIOR;
        tiles[5][32] = TILES.BUILDING_EXTERIOR;
        tiles[5][33] = TILES.BUILDING_EXTERIOR;

        // Market square (center)
        for (let y = 12; y < 18; y++) {
            for (let x = 16; x < 26; x++) {
                tiles[y][x] = TILES.PATH;
            }
        }

        // Road to Greendale (locked - top)
        for (let x = 18; x < 24; x++) {
            tiles[2][x] = TILES.ROAD;
            tiles[3][x] = TILES.ROAD;
            tiles[4][x] = TILES.ROAD;
        }
        // Lock indicator
        tiles[4][20] = TILES.WALL;
        tiles[4][21] = TILES.WALL;

        return {
            width,
            height,
            tiles,
            spawns: {
                default: { x: 7, y: 17 },
                from_lab: { x: 7, y: 17 },
                from_market: { x: 20, y: 15 }
            },
            doors: [
                { x: 7, y: 18, targetMap: 'lab_interior', targetSpawn: 'entrance' }
            ]
        };
    }

    createLabInteriorMap() {
        const width = 16;
        const height = 12;
        const tiles = [];

        // Fill with floor
        for (let y = 0; y < height; y++) {
            tiles[y] = [];
            for (let x = 0; x < width; x++) {
                if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                    tiles[y][x] = TILES.WALL;
                } else {
                    tiles[y][x] = TILES.BUILDING_FLOOR;
                }
            }
        }

        // Exit door
        tiles[height - 1][8] = TILES.DOOR;

        // Breeding bench (left side)
        tiles[3][3] = TILES.BENCH;
        tiles[3][4] = TILES.BENCH;

        // Stabilization chamber (center)
        tiles[3][7] = TILES.CHAMBER;
        tiles[3][8] = TILES.CHAMBER;

        // Storage (right side)
        tiles[3][12] = TILES.STORAGE;

        // Tables (scattered for workspace feel)
        tiles[5][2] = TILES.TABLE;
        tiles[5][5] = TILES.TABLE;
        tiles[7][10] = TILES.TABLE;
        tiles[7][13] = TILES.TABLE;

        // CAULDRON - The Magic Bench (center-left area)
        tiles[6][7] = TILES.CAULDRON;

        return {
            width,
            height,
            tiles,
            spawns: {
                entrance: { x: 8, y: 9 }
            },
            doors: [
                { x: 8, y: 11, targetMap: 'eastern_hills', targetSpawn: 'from_lab' }
            ],
            isInterior: true
        };
    }

    createHobbsFarmMap() {
        const width = 20;
        const height = 15;
        const tiles = [];

        for (let y = 0; y < height; y++) {
            tiles[y] = [];
            for (let x = 0; x < width; x++) {
                tiles[y][x] = TILES.GRASS;
            }
        }

        // Dead crop fields
        for (let y = 4; y < 10; y++) {
            for (let x = 3; x < 17; x++) {
                tiles[y][x] = TILES.FIELD_DEAD;
            }
        }

        // Trial row at bottom
        for (let x = 5; x < 15; x++) {
            tiles[10][x] = TILES.FIELD_EMPTY;
        }

        return {
            width,
            height,
            tiles,
            spawns: {
                default: { x: 10, y: 13 }
            },
            doors: []
        };
    }

    createMarketSquareMap() {
        const width = 18;
        const height = 14;
        const tiles = [];

        for (let y = 0; y < height; y++) {
            tiles[y] = [];
            for (let x = 0; x < width; x++) {
                tiles[y][x] = TILES.PATH;
            }
        }

        // Buildings around the edges
        // OldGrowth Seeds stall (top left)
        tiles[1][2] = TILES.BUILDING_EXTERIOR;
        tiles[1][3] = TILES.BUILDING_EXTERIOR;
        tiles[2][2] = TILES.BUILDING_EXTERIOR;
        tiles[2][3] = TILES.BUILDING_EXTERIOR;

        // Supply shop (top right)
        tiles[1][14] = TILES.BUILDING_EXTERIOR;
        tiles[1][15] = TILES.BUILDING_EXTERIOR;
        tiles[2][14] = TILES.BUILDING_EXTERIOR;
        tiles[2][15] = TILES.BUILDING_EXTERIOR;

        // Notice board (bottom left)
        tiles[10][3] = TILES.NOTICE_BOARD;

        // Inn (bottom right)
        tiles[10][14] = TILES.BUILDING_EXTERIOR;
        tiles[10][15] = TILES.BUILDING_EXTERIOR;
        tiles[11][14] = TILES.BUILDING_EXTERIOR;
        tiles[11][15] = TILES.BUILDING_EXTERIOR;

        return {
            width,
            height,
            tiles,
            spawns: {
                default: { x: 9, y: 7 }
            },
            doors: []
        };
    }

    getCurrentMap() {
        return this.maps[this.currentMapId];
    }

    getTile(x, y) {
        const map = this.getCurrentMap();
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        if (tileX < 0 || tileX >= map.width || tileY < 0 || tileY >= map.height) {
            return TILES.WALL;
        }

        return map.tiles[tileY][tileX];
    }

    setTile(x, y, tileType) {
        const map = this.getCurrentMap();
        if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
            map.tiles[y][x] = tileType;
        }
    }

    isColliding(x, y, width, height) {
        const map = this.getCurrentMap();

        // Check corners and edges
        const checkPoints = [
            { x: x + 0.1, y: y + 0.1 },
            { x: x + width - 0.1, y: y + 0.1 },
            { x: x + 0.1, y: y + height - 0.1 },
            { x: x + width - 0.1, y: y + height - 0.1 }
        ];

        for (const point of checkPoints) {
            const tile = this.getTile(point.x, point.y);
            if (this.isSolidTile(tile)) {
                return true;
            }
        }

        // Check NPC collisions
        for (const npc of this.npcs) {
            if (x < npc.x + npc.width &&
                x + width > npc.x &&
                y < npc.y + npc.height &&
                y + height > npc.y) {
                return true;
            }
        }

        return false;
    }

    isSolidTile(tile) {
        return tile === TILES.WALL ||
               tile === TILES.BUILDING_EXTERIOR ||
               tile === TILES.WATER ||
               tile === TILES.BENCH ||
               tile === TILES.CHAMBER ||
               tile === TILES.STORAGE ||
               tile === TILES.CAULDRON ||
               tile === TILES.TABLE;
    }

    interactWithTile(x, y, game) {
        const tile = this.getTile(x, y);

        switch (tile) {
            case TILES.DOOR:
                this.useDoor(x, y, game);
                break;
            case TILES.BENCH:
                game.ui.showBreedingBench();
                break;
            case TILES.CHAMBER:
                game.ui.showStabilizationChamber();
                break;
            case TILES.STORAGE:
                game.ui.showStorage();
                break;
            case TILES.NOTICE_BOARD:
                game.ui.showNoticeBoard();
                break;
            case TILES.CAULDRON:
                game.ui.showCauldron();
                break;
            case TILES.FIELD_EMPTY:
                this.interactWithField(x, y, game);
                break;
            case TILES.FIELD_MATURE:
                this.harvestField(x, y, game);
                break;
            case TILES.FIELD_DEAD:
                this.interactWithDeadField(x, y, game);
                break;
        }
    }

    useDoor(x, y, game) {
        const map = this.getCurrentMap();
        for (const door of map.doors || []) {
            if (door.x === x && door.y === y) {
                this.changeMap(door.targetMap, door.targetSpawn, game);
                return;
            }
        }
    }

    changeMap(mapId, spawnId, game) {
        this.currentMapId = mapId;
        const map = this.getCurrentMap();
        const spawn = map.spawns[spawnId] || map.spawns.default;

        game.player.x = spawn.x;
        game.player.y = spawn.y;
        game.camera.setBounds(map.width, map.height);

        // Reinitialize NPCs for this map
        this.initializeNPCsForMap(mapId, game);

        game.timeSystem.triggerAutoSlow('Entering new area');
    }

    initializeNPCsForMap(mapId, game) {
        this.npcs = [];

        if (mapId === 'eastern_hills') {
            // Hobbs at his farm
            const hobbs = new NPC(33, 6, 'Hobbs', [
                {
                    condition: (g) => !g.questSystem.isQuestStarted('prove_seeds'),
                    text: "Third year. Third failure. OldGrowth's seeds just... die here. I'm done.\n\nUnless... you really think your 'essence magic' can make something that survives this clay and drought?",
                    options: [
                        {
                            text: "Give me one row. One season.",
                            action: () => {
                                game.questSystem.startQuest('prove_seeds');
                                // Give player the "Dry spell" trouble
                                game.inventory.addTrouble({
                                    name: 'Dry spell',
                                    description: 'The drought plaguing these eastern hills. Seeds must be hardy to survive.',
                                    severity: 2,
                                    effects: ['drought_resistance_needed'],
                                    statModifiers: { hardiness: 2 },
                                    grantsFeature: 'Drought Resistant',
                                    color: '#d4a574'
                                });
                                game.ui.showNotification('Received Trouble: Dry spell');
                            }
                        }
                    ]
                },
                {
                    condition: (g) => g.questSystem.isQuestActive('prove_seeds') && !g.inventory.getTroubles().some(t => t.name === 'Dry spell'),
                    text: "You need to understand the problem before you can solve it. Talk to me again about the drought.",
                    options: [
                        {
                            text: "Tell me about the dry spell.",
                            action: () => {
                                game.inventory.addTrouble({
                                    name: 'Dry spell',
                                    description: 'The drought plaguing these eastern hills. Seeds must be hardy to survive.',
                                    severity: 2,
                                    effects: ['drought_resistance_needed'],
                                    statModifiers: { hardiness: 2 },
                                    grantsFeature: 'Drought Resistant',
                                    color: '#d4a574'
                                });
                                game.ui.showNotification('Received Trouble: Dry spell');
                            }
                        }
                    ]
                },
                {
                    condition: (g) => g.questSystem.isQuestActive('prove_seeds'),
                    text: "That row there. Don't expect payment if it fails like everything else.",
                    options: []
                },
                {
                    text: "We'll see if your seeds work...",
                    options: []
                }
            ]);
            hobbs.questGiver = true;
            this.npcs.push(hobbs);
        }
    }

    harvestField(x, y, game) {
        const field = this.fields.find(f => f.x === x && f.y === y);
        if (field && field.stage === 'mature') {
            const seedType = game.inventory.getSeedById(field.seedId);
            const yield_ = seedType ? seedType.stats.yield : 3;

            game.inventory.addItem('harvest', yield_);
            game.inventory.addSeeds(field.seedId, Math.floor(yield_ / 2));

            this.setTile(x, y, TILES.FIELD_EMPTY);
            this.fields = this.fields.filter(f => f !== field);

            game.ui.showNotification(`Harvested ${yield_} bushels and ${Math.floor(yield_ / 2)} seeds!`);
        }
    }

    interactWithField(x, y, game) {
        // Check if this field has already given an Old Growth seed
        const fieldKey = `field_${x}_${y}`;
        if (!this.fieldInteractions) {
            this.fieldInteractions = {};
        }

        if (!this.fieldInteractions[fieldKey]) {
            // First interaction - give Old Growth seed
            const oldGrowthSeed = game.inventory.addRealItem({
                type: 'seed',
                name: 'Old Growth seed',
                description: 'A seed from the old fields. Holds ancient potential.',
                stats: { yield: 2, hardiness: 2, speed: 2, efficiency: 3 },
                feature: null,
                color: '#6b5b4f'
            });
            this.fieldInteractions[fieldKey] = true;
            game.ui.showNotification('Found an Old Growth seed!');
        }

        // Show planting menu
        game.ui.showPlantingMenu(x, y);
    }

    interactWithDeadField(x, y, game) {
        // Dead fields can also yield Old Growth seeds on first interaction
        const fieldKey = `dead_field_${x}_${y}`;
        if (!this.fieldInteractions) {
            this.fieldInteractions = {};
        }

        if (!this.fieldInteractions[fieldKey]) {
            // First interaction - give Old Growth seed from dead field
            const oldGrowthSeed = game.inventory.addRealItem({
                type: 'seed',
                name: 'Old Growth seed',
                description: 'A withered seed from the failed crops. Still holds some life.',
                stats: { yield: 1, hardiness: 3, speed: 1, efficiency: 2 },
                feature: 'Survivor',
                color: '#8b7355'
            });
            this.fieldInteractions[fieldKey] = true;
            game.ui.showNotification('Found an Old Growth seed among the dead crops!');
        } else {
            game.ui.showNotification('Nothing but dead crops here...');
        }
    }

    plantField(x, y, seedId, game) {
        this.setTile(x, y, TILES.FIELD_PLANTED);
        this.fields.push({
            x,
            y,
            seedId,
            stage: 'planted',
            daysGrown: 0,
            daysToMature: 25
        });
    }

    updateFields(game) {
        for (const field of this.fields) {
            field.daysGrown++;

            if (field.daysGrown >= field.daysToMature) {
                field.stage = 'mature';
                this.setTile(field.x, field.y, TILES.FIELD_MATURE);
            } else if (field.daysGrown >= field.daysToMature * 0.4) {
                field.stage = 'growing';
                this.setTile(field.x, field.y, TILES.FIELD_GROWING);
            }
        }
    }

    render(ctx, camera) {
        const map = this.getCurrentMap();

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                if (!camera.isOnScreen(x, y)) continue;

                const tile = map.tiles[y][x];
                const screenPos = camera.worldToScreen(x, y);

                ctx.fillStyle = this.getTileColor(tile);
                ctx.fillRect(screenPos.x, screenPos.y, TILE_SIZE, TILE_SIZE);

                // Draw tile details
                this.renderTileDetails(ctx, tile, screenPos.x, screenPos.y);
            }
        }

        // Render NPCs
        for (const npc of this.npcs) {
            npc.render(ctx, camera);
        }
    }

    getTileColor(tile) {
        switch (tile) {
            case TILES.GRASS: return COLORS.GRASS;
            case TILES.PATH: return COLORS.PATH;
            case TILES.ROAD: return COLORS.ROAD;
            case TILES.BUILDING_EXTERIOR: return COLORS.BUILDING;
            case TILES.BUILDING_FLOOR: return COLORS.BUILDING_INTERIOR;
            case TILES.FIELD_EMPTY: return '#6b5b4f';
            case TILES.FIELD_PLANTED: return '#5a7a4a';
            case TILES.FIELD_GROWING: return '#4a8a3a';
            case TILES.FIELD_MATURE: return '#7aaa5a';
            case TILES.FIELD_DEAD: return COLORS.FIELD_DEAD;
            case TILES.WATER: return COLORS.WATER;
            case TILES.WALL: return '#3a3a3a';
            case TILES.DOOR: return '#8b4513';
            case TILES.BENCH: return '#daa520';
            case TILES.CHAMBER: return '#4169e1';
            case TILES.STORAGE: return '#8b7355';
            case TILES.NOTICE_BOARD: return '#654321';
            case TILES.CAULDRON: return '#4a2080';
            case TILES.TABLE: return '#8b6914';
            default: return COLORS.GRASS;
        }
    }

    renderTileDetails(ctx, tile, x, y) {
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';

        switch (tile) {
            case TILES.DOOR:
                ctx.fillText('DOOR', x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 4);
                break;
            case TILES.BENCH:
                ctx.fillText('BENCH', x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 4);
                break;
            case TILES.CHAMBER:
                ctx.fillText('CHMBR', x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 4);
                break;
            case TILES.STORAGE:
                ctx.fillText('STGE', x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 4);
                break;
            case TILES.NOTICE_BOARD:
                ctx.fillText('BOARD', x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 4);
                break;
            case TILES.FIELD_DEAD:
                ctx.fillStyle = '#555';
                ctx.fillText('~', x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 4);
                break;
            case TILES.FIELD_PLANTED:
                ctx.fillText('.', x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 4);
                break;
            case TILES.FIELD_GROWING:
                ctx.fillText('^', x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 4);
                break;
            case TILES.FIELD_MATURE:
                ctx.fillText('*', x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 4);
                break;
            case TILES.CAULDRON:
                ctx.fillStyle = '#9966ff';
                ctx.fillText('CLDN', x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 4);
                break;
            case TILES.TABLE:
                ctx.fillStyle = '#daa520';
                ctx.fillText('TBL', x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 4);
                break;
        }
    }
}
