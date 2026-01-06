// Main Game Class

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';
import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { TimeSystem } from './TimeSystem.js';
import { World } from './World.js';
import { Player } from './Player.js';
import { Inventory } from './Inventory.js';
import { QuestSystem } from './QuestSystem.js';
import { UI } from './UI.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        // Initialize systems
        this.input = new Input(canvas);
        this.camera = new Camera();
        this.timeSystem = new TimeSystem();
        this.world = new World();
        this.inventory = new Inventory();
        this.questSystem = new QuestSystem();

        // Create player at starting position
        const map = this.world.getCurrentMap();
        const spawn = map.spawns.default;
        this.player = new Player(spawn.x, spawn.y);

        // Initialize UI (after other systems)
        this.ui = new UI(this);

        // Initialize world NPCs
        this.world.initializeNPCsForMap('eastern_hills', this);

        // Set camera bounds
        this.camera.setBounds(map.width, map.height);

        // Game loop
        this.lastTime = 0;
        this.running = false;

        // Day change listener for field updates and stabilization
        this.timeSystem.on('dayChange', () => {
            this.world.updateFields(this);
            this.ui.updateStabilization();
        });

        // Start with intro dialogue
        this.scheduleIntro();
    }

    scheduleIntro() {
        // Show intro dialogue after a short delay
        setTimeout(() => {
            this.timeSystem.pause();
            this.ui.showNotification('Welcome to Seed Breeder! WASD: move, E: interact, I: inventory');

            setTimeout(() => {
                this.ui.showNotification('Visit your LAB (southwest) - it has a CAULDRON for magic!');
            }, 3000);
        }, 500);
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    stop() {
        this.running = false;
    }

    gameLoop() {
        if (!this.running) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        // Handle UI input first
        this.ui.handleInput(this.input);

        // Update time system
        this.timeSystem.update(deltaTime);

        // Update player if no active UI
        if (!this.ui.hasActiveUI()) {
            this.player.update(deltaTime, this);
        }

        // Update camera to follow player
        this.camera.follow(this.player);
        this.camera.update(deltaTime);

        // Update UI
        this.ui.update(deltaTime);

        // Clear input states at end of frame
        this.input.endFrame();
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Apply camera transform
        this.camera.applyTransform(this.ctx);

        // Render world
        this.world.render(this.ctx, this.camera);

        // Render player
        this.player.render(this.ctx, this.camera);

        // Reset camera transform
        this.camera.resetTransform(this.ctx);

        // Render UI (screen space)
        this.ui.render(this.ctx);
    }

    // Save/Load
    save() {
        const saveData = {
            player: { x: this.player.x, y: this.player.y },
            time: this.timeSystem.serialize(),
            inventory: this.inventory.serialize(),
            quests: this.questSystem.serialize(),
            currentMap: this.world.currentMapId
        };

        localStorage.setItem('seedBreederSave', JSON.stringify(saveData));
        this.ui.showNotification('Game saved!');
    }

    load() {
        const saveStr = localStorage.getItem('seedBreederSave');
        if (!saveStr) {
            this.ui.showNotification('No save found!');
            return;
        }

        try {
            const saveData = JSON.parse(saveStr);

            this.player.x = saveData.player.x;
            this.player.y = saveData.player.y;
            this.timeSystem.deserialize(saveData.time);
            this.inventory.deserialize(saveData.inventory);
            this.questSystem.deserialize(saveData.quests);
            this.world.currentMapId = saveData.currentMap;

            const map = this.world.getCurrentMap();
            this.camera.setBounds(map.width, map.height);
            this.world.initializeNPCsForMap(this.world.currentMapId, this);

            this.ui.showNotification('Game loaded!');
        } catch (e) {
            this.ui.showNotification('Error loading save!');
            console.error(e);
        }
    }
}
