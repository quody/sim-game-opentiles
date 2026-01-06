// UI System - handles all game interfaces

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, TIME_SPEEDS, STAT_MAX } from './constants.js';
import { drawRoundedRect, wrapText } from './utils.js';

export class UI {
    constructor(game) {
        this.game = game;

        // UI State
        this.activePanel = null;
        this.dialogueQueue = [];
        this.currentDialogue = null;
        this.notifications = [];

        // Breeding bench state
        this.selectedSeedForExtract = null;
        this.selectedEssences = [];

        // Stabilization state
        this.stabilizingSeeds = [];

        // Cauldron state
        this.selectedCauldronItems = [];

        // Buttons for mouse interaction
        this.buttons = [];
    }

    hasActiveUI() {
        return this.activePanel !== null || this.currentDialogue !== null;
    }

    // Show dialogue
    showDialogue(speaker, text, options = []) {
        this.currentDialogue = { speaker, text, options, selectedOption: 0 };
        this.game.timeSystem.pause();
    }

    closeDialogue() {
        if (this.currentDialogue && this.currentDialogue.options.length > 0) {
            const selected = this.currentDialogue.options[this.currentDialogue.selectedOption];
            if (selected && selected.action) {
                selected.action();
            }
        }
        this.currentDialogue = null;
        this.game.timeSystem.resume();
    }

    // Show notification
    showNotification(text, duration = 3000) {
        this.notifications.push({
            text,
            timer: duration,
            opacity: 1
        });
    }

    // Panel management
    showPanel(panelId) {
        this.activePanel = panelId;
        this.game.timeSystem.pause();
    }

    closePanel() {
        this.activePanel = null;
        this.selectedSeedForExtract = null;
        this.selectedEssences = [];
        this.selectedCauldronItems = [];
        this.game.timeSystem.resume();
    }

    showBreedingBench() {
        this.showPanel('breeding_bench');
    }

    showStabilizationChamber() {
        this.showPanel('stabilization_chamber');
    }

    showStorage() {
        this.showPanel('storage');
    }

    showNoticeBoard() {
        this.showPanel('notice_board');
    }

    showPlantingMenu(x, y) {
        this.plantingPosition = { x, y };
        this.showPanel('planting');
    }

    showCauldron() {
        this.selectedCauldronItems = [];
        this.showPanel('cauldron');
    }

    showInventory() {
        this.showPanel('inventory');
    }

    // Input handling for UI
    handleInput(input) {
        if (this.currentDialogue) {
            if (input.isKeyJustPressed('ArrowUp') && this.currentDialogue.options.length > 0) {
                this.currentDialogue.selectedOption = Math.max(0, this.currentDialogue.selectedOption - 1);
            }
            if (input.isKeyJustPressed('ArrowDown') && this.currentDialogue.options.length > 0) {
                this.currentDialogue.selectedOption = Math.min(
                    this.currentDialogue.options.length - 1,
                    this.currentDialogue.selectedOption + 1
                );
            }
            if (input.isInteractPressed() || input.isKeyJustPressed('Enter')) {
                this.closeDialogue();
            }
            return;
        }

        if (this.activePanel) {
            if (input.isEscapePressed()) {
                this.closePanel();
            }
            // Handle panel-specific input
            this.handlePanelInput(input);
        }

        // Time controls (always available when no UI)
        if (!this.hasActiveUI()) {
            if (input.isKeyJustPressed('Digit1')) this.game.timeSystem.setSpeed(TIME_SPEEDS.PAUSED);
            if (input.isKeyJustPressed('Digit2')) this.game.timeSystem.setSpeed(TIME_SPEEDS.NORMAL);
            if (input.isKeyJustPressed('Digit3')) this.game.timeSystem.setSpeed(TIME_SPEEDS.FAST);
            if (input.isKeyJustPressed('Digit4')) this.game.timeSystem.setSpeed(TIME_SPEEDS.VERY_FAST);
            if (input.isKeyJustPressed('Space')) this.game.timeSystem.togglePause();
            if (input.isKeyJustPressed('KeyI')) this.showInventory();
        }

        // Handle button clicks
        if (input.isMouseJustClicked()) {
            const mousePos = input.getMousePosition();
            for (const button of this.buttons) {
                if (this.isPointInRect(mousePos.x, mousePos.y, button)) {
                    button.onClick();
                    break;
                }
            }
        }
    }

    handlePanelInput(input) {
        const inv = this.game.inventory;

        switch (this.activePanel) {
            case 'breeding_bench':
                // Number keys to select seeds for extraction
                if (input.isKeyJustPressed('Digit1') && inv.getSeeds()[0]) {
                    this.selectedSeedForExtract = inv.getSeeds()[0].id;
                }
                if (input.isKeyJustPressed('Digit2') && inv.getSeeds()[1]) {
                    this.selectedSeedForExtract = inv.getSeeds()[1].id;
                }
                if (input.isKeyJustPressed('Digit3') && inv.getSeeds()[2]) {
                    this.selectedSeedForExtract = inv.getSeeds()[2].id;
                }
                // E to extract
                if (input.isKeyJustPressed('KeyX') && this.selectedSeedForExtract) {
                    this.extractEssence(this.selectedSeedForExtract);
                }
                // C to combine (if 2 essences selected)
                if (input.isKeyJustPressed('KeyC') && this.selectedEssences.length === 2) {
                    this.combineEssences();
                }
                break;

            case 'planting':
                // Number keys to select seed
                const seeds = inv.getSeeds().filter(s => s.isStable && s.count > 0);
                for (let i = 0; i < Math.min(seeds.length, 9); i++) {
                    if (input.isKeyJustPressed(`Digit${i + 1}`)) {
                        this.plantSeed(seeds[i].id);
                        break;
                    }
                }
                break;

            case 'cauldron':
                // C to combine when 2 items selected
                if (input.isKeyJustPressed('KeyC') && this.selectedCauldronItems.length === 2) {
                    this.combineCauldronItems();
                }
                break;
        }
    }

    extractEssence(seedId) {
        const inv = this.game.inventory;
        if (!inv.hasItem('essence_vials')) {
            this.showNotification('No essence vials!');
            return;
        }
        if (!inv.removeSeeds(seedId, 1)) {
            this.showNotification('Not enough seeds!');
            return;
        }

        inv.removeItem('essence_vials');
        const essence = inv.addEssence(seedId);
        this.showNotification(`Extracted ${essence.name}!`);
        this.selectedSeedForExtract = null;
    }

    combineEssences() {
        const inv = this.game.inventory;
        if (!inv.hasItem('synthesis_catalysts')) {
            this.showNotification('No synthesis catalyst!');
            return;
        }

        inv.removeItem('synthesis_catalysts');
        const prototype = inv.combineEssences(this.selectedEssences[0], this.selectedEssences[1]);

        if (prototype) {
            this.showNotification(`Created ${prototype.name}! Stability: ${prototype.stability}%`);
            this.selectedEssences = [];

            // Auto-show prompt to stabilize
            this.game.questSystem.completeObjective('prove_seeds', 'create_seed');
        }
    }

    combineCauldronItems() {
        const inv = this.game.inventory;

        if (this.selectedCauldronItems.length !== 2) {
            this.showNotification('Select exactly 2 items to combine!');
            return;
        }

        const result = inv.combineInCauldron(
            this.selectedCauldronItems[0],
            this.selectedCauldronItems[1]
        );

        if (result) {
            this.showNotification(`Created: ${result.name}!`);
            this.selectedCauldronItems = [];
        } else {
            this.showNotification('These items cannot be combined!');
        }
    }

    plantSeed(seedId) {
        const inv = this.game.inventory;
        if (!inv.removeSeeds(seedId, 1)) {
            this.showNotification('Not enough seeds!');
            return;
        }

        this.game.world.plantField(this.plantingPosition.x, this.plantingPosition.y, seedId, this.game);
        this.showNotification('Planted seeds!');
        this.game.questSystem.completeObjective('prove_seeds', 'plant_trial');
        this.closePanel();
    }

    startStabilization(seedId) {
        const seed = this.game.inventory.getSeedById(seedId);
        if (!seed || seed.isStable) return;

        this.stabilizingSeeds.push({
            seedId,
            daysRemaining: 5,
            totalDays: 5,
            costPerDay: 2
        });

        this.showNotification('Stabilization started! 5 days remaining.');
    }

    updateStabilization() {
        for (const stab of this.stabilizingSeeds) {
            stab.daysRemaining--;

            // Deduct daily cost
            this.game.inventory.removeGold(stab.costPerDay);

            if (stab.daysRemaining <= 0) {
                const result = this.game.inventory.stabilizeSeed(stab.seedId, stab.totalDays, stab.totalDays);
                if (result && result.complete) {
                    this.showNotification(`Stabilization complete! Created ${result.seed.name}!`);
                    this.game.timeSystem.triggerAutoPause('Stabilization complete');
                }
            }
        }

        this.stabilizingSeeds = this.stabilizingSeeds.filter(s => s.daysRemaining > 0);
    }

    isPointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }

    update(deltaTime) {
        // Update notifications
        for (const notif of this.notifications) {
            notif.timer -= deltaTime;
            if (notif.timer < 500) {
                notif.opacity = notif.timer / 500;
            }
        }
        this.notifications = this.notifications.filter(n => n.timer > 0);
    }

    render(ctx) {
        this.buttons = [];

        // Render HUD
        this.renderHUD(ctx);

        // Render time controls
        this.renderTimeControls(ctx);

        // Render notifications
        this.renderNotifications(ctx);

        // Render active panel
        if (this.activePanel) {
            this.renderPanel(ctx);
        }

        // Render dialogue
        if (this.currentDialogue) {
            this.renderDialogue(ctx);
        }
    }

    renderHUD(ctx) {
        const inv = this.game.inventory;
        const time = this.game.timeSystem;

        // Top bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, 35);

        ctx.font = '14px monospace';
        ctx.fillStyle = '#ffffff';

        // Date and time
        ctx.textAlign = 'left';
        ctx.fillText(`${time.getDateString()} - ${time.getFormattedTime()}`, 10, 23);

        // Gold
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`${inv.gold}g`, CANVAS_WIDTH - 10, 23);

        // Active quests indicator
        const activeQuests = this.game.questSystem.getActiveQuests();
        if (activeQuests.length > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'right';
            ctx.fillText(`Quests: ${activeQuests.length}`, CANVAS_WIDTH - 80, 23);
        }
    }

    renderTimeControls(ctx) {
        const time = this.game.timeSystem;

        // Time control bar at bottom
        const barY = CANVAS_HEIGHT - 40;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, barY, CANVAS_WIDTH, 40);

        const speeds = [
            { key: '1', label: '||', speed: TIME_SPEEDS.PAUSED },
            { key: '2', label: '>', speed: TIME_SPEEDS.NORMAL },
            { key: '3', label: '>>', speed: TIME_SPEEDS.FAST },
            { key: '4', label: '>>>', speed: TIME_SPEEDS.VERY_FAST }
        ];

        let x = 10;
        ctx.font = '14px monospace';

        for (const s of speeds) {
            const isActive = time.speed === s.speed;

            ctx.fillStyle = isActive ? COLORS.UI_HIGHLIGHT : '#666666';
            ctx.fillRect(x, barY + 8, 50, 24);

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(`[${s.key}] ${s.label}`, x + 25, barY + 25);

            x += 60;
        }

        // Speed indicator
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`Speed: ${time.getSpeedName()}`, x + 20, barY + 25);

        // Controls hint
        ctx.textAlign = 'right';
        ctx.fillStyle = '#888888';
        ctx.fillText('WASD: Move | E: Interact | I: Inventory | ESC: Close', CANVAS_WIDTH - 10, barY + 25);
    }

    renderNotifications(ctx) {
        let y = 50;
        for (const notif of this.notifications) {
            ctx.globalAlpha = notif.opacity;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            drawRoundedRect(ctx, CANVAS_WIDTH / 2 - 150, y, 300, 30, 5);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(notif.text, CANVAS_WIDTH / 2, y + 20);

            y += 40;
        }
        ctx.globalAlpha = 1;
    }

    renderPanel(ctx) {
        // Panel background
        const panelX = 50;
        const panelY = 60;
        const panelW = CANVAS_WIDTH - 100;
        const panelH = CANVAS_HEIGHT - 140;

        ctx.fillStyle = 'rgba(30, 30, 30, 0.95)';
        drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 10);
        ctx.fill();

        ctx.strokeStyle = COLORS.UI_BORDER;
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 10);
        ctx.stroke();

        switch (this.activePanel) {
            case 'breeding_bench':
                this.renderBreedingBench(ctx, panelX, panelY, panelW, panelH);
                break;
            case 'stabilization_chamber':
                this.renderStabilizationChamber(ctx, panelX, panelY, panelW, panelH);
                break;
            case 'storage':
                this.renderStorage(ctx, panelX, panelY, panelW, panelH);
                break;
            case 'notice_board':
                this.renderNoticeBoard(ctx, panelX, panelY, panelW, panelH);
                break;
            case 'planting':
                this.renderPlantingMenu(ctx, panelX, panelY, panelW, panelH);
                break;
            case 'cauldron':
                this.renderCauldron(ctx, panelX, panelY, panelW, panelH);
                break;
            case 'inventory':
                this.renderInventory(ctx, panelX, panelY, panelW, panelH);
                break;
        }

        // Close button hint
        ctx.fillStyle = '#888888';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('[ESC] Close', panelX + panelW - 10, panelY + 20);
    }

    renderBreedingBench(ctx, x, y, w, h) {
        const inv = this.game.inventory;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('ESSENCE SYNTHESIS BENCH', x + 20, y + 35);

        // Step 1: Extract Essence
        ctx.font = 'bold 14px monospace';
        ctx.fillText('STEP 1: EXTRACT ESSENCE', x + 20, y + 70);

        ctx.font = '12px monospace';
        ctx.fillText(`Vials remaining: ${inv.getItemCount('essence_vials')}`, x + 20, y + 90);

        // Show available seeds
        const seeds = inv.getSeeds();
        let seedY = y + 115;
        seeds.forEach((seed, i) => {
            const isSelected = this.selectedSeedForExtract === seed.id;
            ctx.fillStyle = isSelected ? COLORS.UI_HIGHLIGHT : '#444444';
            ctx.fillRect(x + 20, seedY, 200, 60);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`[${i + 1}] ${seed.name}`, x + 30, seedY + 18);

            ctx.font = '10px monospace';
            ctx.fillText(`Count: ${seed.count}`, x + 30, seedY + 35);
            ctx.fillText(`Hrd: ${seed.stats.hardiness} | ${seed.feature || 'No feature'}`, x + 30, seedY + 50);

            seedY += 70;
        });

        if (this.selectedSeedForExtract) {
            ctx.fillStyle = COLORS.BUTTON;
            ctx.fillRect(x + 230, y + 115, 100, 30);
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('[X] EXTRACT', x + 280, y + 135);
        }

        // Step 2: Show essences and combine
        ctx.textAlign = 'left';
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('STEP 2: COMBINE ESSENCES', x + 350, y + 70);

        ctx.font = '12px monospace';
        ctx.fillText(`Catalysts: ${inv.getItemCount('synthesis_catalysts')}`, x + 350, y + 90);

        const essences = inv.getEssences();
        let essY = y + 115;
        essences.forEach((ess, i) => {
            const isSelected = this.selectedEssences.includes(ess.id);
            ctx.fillStyle = isSelected ? COLORS.UI_HIGHLIGHT : '#444444';
            ctx.fillRect(x + 350, essY, 180, 50);

            ctx.fillStyle = '#ffffff';
            ctx.font = '11px monospace';
            ctx.fillText(ess.name, x + 360, essY + 18);
            ctx.font = '10px monospace';
            ctx.fillText(`Hrd: ${ess.stats.hardiness} | ${ess.feature || '-'}`, x + 360, essY + 35);

            // Click to select
            this.buttons.push({
                x: x + 350,
                y: essY,
                width: 180,
                height: 50,
                onClick: () => {
                    if (isSelected) {
                        this.selectedEssences = this.selectedEssences.filter(id => id !== ess.id);
                    } else if (this.selectedEssences.length < 2) {
                        this.selectedEssences.push(ess.id);
                    }
                }
            });

            essY += 55;
        });

        if (this.selectedEssences.length === 2) {
            const prediction = inv.predictCombination(this.selectedEssences[0], this.selectedEssences[1]);
            if (prediction) {
                ctx.fillStyle = '#333333';
                ctx.fillRect(x + 350, essY + 10, 200, 100);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px monospace';
                ctx.fillText('PREDICTED RESULT:', x + 360, essY + 30);

                ctx.font = '10px monospace';
                ctx.fillText(`Hardiness: ${prediction.stats.hardiness.min}-${prediction.stats.hardiness.max}`, x + 360, essY + 50);
                if (prediction.possibleFeatures.length > 0) {
                    ctx.fillText(`${prediction.possibleFeatures[0]}: ${prediction.featureChance}%`, x + 360, essY + 70);
                }

                ctx.fillStyle = COLORS.BUTTON;
                ctx.fillRect(x + 360, essY + 80, 100, 25);
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText('[C] COMBINE', x + 410, essY + 97);
            }
        }

        // Hint
        ctx.textAlign = 'left';
        ctx.fillStyle = '#888888';
        ctx.font = '11px monospace';
        ctx.fillText('Hint: Hardiness 4+ with "Deep Root" survives drought!', x + 20, y + h - 20);
    }

    renderStabilizationChamber(ctx, x, y, w, h) {
        const inv = this.game.inventory;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('STABILIZATION CHAMBER', x + 20, y + 35);

        // Show currently stabilizing
        if (this.stabilizingSeeds.length > 0) {
            ctx.font = 'bold 14px monospace';
            ctx.fillText('CURRENTLY STABILIZING:', x + 20, y + 70);

            let stabY = y + 95;
            for (const stab of this.stabilizingSeeds) {
                const seed = inv.getSeedById(stab.seedId);
                if (seed) {
                    ctx.fillStyle = '#444444';
                    ctx.fillRect(x + 20, stabY, 300, 60);

                    ctx.fillStyle = '#ffffff';
                    ctx.font = '12px monospace';
                    ctx.fillText(seed.name, x + 30, stabY + 20);
                    ctx.fillText(`Days remaining: ${stab.daysRemaining}`, x + 30, stabY + 40);

                    // Progress bar
                    const progress = 1 - (stab.daysRemaining / stab.totalDays);
                    ctx.fillStyle = '#333333';
                    ctx.fillRect(x + 180, stabY + 25, 130, 15);
                    ctx.fillStyle = COLORS.UI_HIGHLIGHT;
                    ctx.fillRect(x + 180, stabY + 25, 130 * progress, 15);

                    stabY += 70;
                }
            }
        }

        // Show unstable seeds that can be stabilized
        const unstableSeeds = inv.seeds.filter(s => !s.isStable);
        if (unstableSeeds.length > 0) {
            ctx.font = 'bold 14px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('UNSTABLE PROTOTYPES:', x + 350, y + 70);

            let protoY = y + 95;
            unstableSeeds.forEach((seed, i) => {
                // Skip if already stabilizing
                if (this.stabilizingSeeds.find(s => s.seedId === seed.id)) return;

                ctx.fillStyle = '#444444';
                ctx.fillRect(x + 350, protoY, 280, 70);

                ctx.fillStyle = '#ffffff';
                ctx.font = '12px monospace';
                ctx.fillText(seed.name, x + 360, protoY + 20);
                ctx.font = '10px monospace';
                ctx.fillText(`Stability: ${Math.floor(seed.stability)}%`, x + 360, protoY + 38);
                ctx.fillText(`Cost: 2g/day for 5 days`, x + 360, protoY + 55);

                // Start button
                ctx.fillStyle = COLORS.BUTTON;
                ctx.fillRect(x + 540, protoY + 20, 80, 30);
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.font = '11px monospace';
                ctx.fillText('START', x + 580, protoY + 40);

                this.buttons.push({
                    x: x + 540,
                    y: protoY + 20,
                    width: 80,
                    height: 30,
                    onClick: () => this.startStabilization(seed.id)
                });

                protoY += 80;
            });
        }

        ctx.textAlign = 'left';
        ctx.fillStyle = '#888888';
        ctx.font = '11px monospace';
        ctx.fillText('Tip: You can explore or speed up time while stabilizing.', x + 20, y + h - 20);
    }

    renderStorage(ctx, x, y, w, h) {
        const inv = this.game.inventory;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('SEED STORAGE', x + 20, y + 35);

        ctx.font = '12px monospace';
        ctx.fillText('Your mentor left you three seed varieties:', x + 20, y + 60);

        // Render seed cards
        const seeds = inv.getSeeds();
        let cardX = x + 20;
        const cardY = y + 90;
        const cardW = 200;
        const cardH = 200;

        seeds.forEach((seed, i) => {
            // Card background
            ctx.fillStyle = '#3a3a3a';
            drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 8);
            ctx.fill();

            ctx.strokeStyle = seed.color;
            ctx.lineWidth = 3;
            drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 8);
            ctx.stroke();

            // Seed name
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(seed.name.toUpperCase(), cardX + 10, cardY + 25);

            // Stats
            ctx.font = '11px monospace';
            const stats = [
                { name: 'Yld', value: seed.stats.yield },
                { name: 'Hrd', value: seed.stats.hardiness },
                { name: 'Spd', value: seed.stats.speed },
                { name: 'Eff', value: seed.stats.efficiency }
            ];

            let statY = cardY + 50;
            stats.forEach(stat => {
                ctx.fillStyle = '#888888';
                ctx.fillText(`${stat.name}:`, cardX + 10, statY);

                // Stat pips
                for (let p = 0; p < STAT_MAX; p++) {
                    ctx.fillStyle = p < stat.value ? '#ffffff' : '#444444';
                    ctx.beginPath();
                    ctx.arc(cardX + 60 + p * 18, statY - 4, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
                statY += 25;
            });

            // Feature
            if (seed.feature) {
                ctx.fillStyle = '#ffd700';
                ctx.font = '11px monospace';
                ctx.fillText(`* ${seed.feature}`, cardX + 10, statY + 10);
            } else {
                ctx.fillStyle = '#666666';
                ctx.font = '11px monospace';
                ctx.fillText('(no feature)', cardX + 10, statY + 10);
            }

            // Count
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`[${seed.count} seeds]`, cardX + 10, cardY + cardH - 15);

            cardX += cardW + 20;
        });

        // Items section
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('SUPPLIES:', x + 20, y + 310);

        ctx.font = '12px monospace';
        ctx.fillText(`Essence Vials: ${inv.getItemCount('essence_vials')}`, x + 20, y + 335);
        ctx.fillText(`Synthesis Catalysts: ${inv.getItemCount('synthesis_catalysts')}`, x + 20, y + 355);
        ctx.fillText(`Stabilization Gel: ${inv.getItemCount('stabilization_gel')}`, x + 20, y + 375);
    }

    renderNoticeBoard(ctx, x, y, w, h) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('NOTICE BOARD', x + 20, y + 35);

        const notices = [
            {
                title: 'DROUGHT WARNING - Eastern Hills',
                text: 'Third consecutive dry season expected.\nFarmers advised to conserve water.'
            },
            {
                title: 'OLDGROWTH SEEDS - "Trusted for generations"',
                text: 'New shipment arrived! Visit our market stall.'
            },
            {
                title: 'WANTED: Seeds that survive clay soil',
                text: 'Contact: Farmer Mira, north farm\n"Will pay premium for something that WORKS"'
            }
        ];

        let noticeY = y + 70;
        notices.forEach(notice => {
            ctx.fillStyle = '#ddd8c8';
            ctx.fillRect(x + 20, noticeY, w - 60, 80);

            ctx.fillStyle = '#333333';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(notice.title, x + 30, noticeY + 20);

            ctx.font = '11px monospace';
            const lines = notice.text.split('\n');
            lines.forEach((line, i) => {
                ctx.fillText(line, x + 30, noticeY + 40 + i * 16);
            });

            noticeY += 95;
        });
    }

    renderPlantingMenu(ctx, x, y, w, h) {
        const inv = this.game.inventory;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('PLANT SEEDS', x + 20, y + 35);

        ctx.font = '12px monospace';
        ctx.fillText('Select seeds to plant:', x + 20, y + 60);

        const seeds = inv.getSeeds().filter(s => s.isStable && s.count > 0);
        let seedY = y + 90;

        seeds.forEach((seed, i) => {
            ctx.fillStyle = '#444444';
            ctx.fillRect(x + 20, seedY, 350, 60);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`[${i + 1}] ${seed.name}`, x + 30, seedY + 20);

            ctx.font = '11px monospace';
            ctx.fillText(`Seeds: ${seed.count} | Hrd: ${seed.stats.hardiness} | ${seed.feature || '-'}`, x + 30, seedY + 45);

            this.buttons.push({
                x: x + 20,
                y: seedY,
                width: 350,
                height: 60,
                onClick: () => this.plantSeed(seed.id)
            });

            seedY += 70;
        });

        ctx.fillStyle = '#888888';
        ctx.font = '11px monospace';
        ctx.fillText('This field will take 1 season to grow.', x + 20, y + h - 20);
    }

    renderCauldron(ctx, x, y, w, h) {
        const inv = this.game.inventory;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('MAGIC CAULDRON', x + 20, y + 35);

        ctx.font = '12px monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('Combine Troubles with Seeds to create specialized seeds', x + 20, y + 55);

        // Get all cauldron items (troubles + real items)
        const cauldronItems = inv.getCauldronItems();

        // === LEFT SIDE: Available Items ===
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('AVAILABLE ITEMS:', x + 20, y + 85);

        let itemY = y + 110;

        if (cauldronItems.length === 0) {
            ctx.fillStyle = '#666666';
            ctx.font = '12px monospace';
            ctx.fillText('No items available.', x + 30, itemY);
            ctx.fillText('Talk to NPCs to get Troubles.', x + 30, itemY + 20);
            ctx.fillText('Interact with fields to find seeds.', x + 30, itemY + 40);
        } else {
            cauldronItems.forEach((item, i) => {
                const isSelected = this.selectedCauldronItems.includes(item.id);

                // Item card background
                ctx.fillStyle = isSelected ? '#4a3a8a' : (item.type === 'trouble' ? '#4a2020' : '#2a4a2a');
                ctx.fillRect(x + 20, itemY, 280, 55);

                // Border if selected
                if (isSelected) {
                    ctx.strokeStyle = '#9966ff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x + 20, itemY, 280, 55);
                }

                // Type indicator
                ctx.fillStyle = item.type === 'trouble' ? '#ff6666' : '#66ff66';
                ctx.font = 'bold 10px monospace';
                ctx.fillText(item.type.toUpperCase(), x + 30, itemY + 15);

                // Item name
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px monospace';
                ctx.fillText(item.name, x + 30, itemY + 32);

                // Item details
                ctx.font = '10px monospace';
                ctx.fillStyle = '#aaaaaa';
                if (item.type === 'trouble') {
                    ctx.fillText(`Severity: ${item.severity || 1} | ${item.grantsFeature || item.description?.substring(0, 30) || ''}`, x + 30, itemY + 48);
                } else {
                    ctx.fillText(`Hrd: ${item.stats?.hardiness || '?'} | ${item.feature || 'no feature'}`, x + 30, itemY + 48);
                }

                // Count badge
                ctx.fillStyle = '#ffffff';
                ctx.font = '10px monospace';
                ctx.textAlign = 'right';
                ctx.fillText(`x${item.count || 1}`, x + 290, itemY + 15);
                ctx.textAlign = 'left';

                // Click to select
                this.buttons.push({
                    x: x + 20,
                    y: itemY,
                    width: 280,
                    height: 55,
                    onClick: () => {
                        if (isSelected) {
                            this.selectedCauldronItems = this.selectedCauldronItems.filter(id => id !== item.id);
                        } else if (this.selectedCauldronItems.length < 2) {
                            this.selectedCauldronItems.push(item.id);
                        }
                    }
                });

                itemY += 60;
            });
        }

        // === RIGHT SIDE: Combination Preview ===
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('COMBINE:', x + 330, y + 85);

        // Selected items display
        const slot1Y = y + 110;
        const slot2Y = y + 175;

        // Slot 1
        ctx.fillStyle = '#333333';
        ctx.fillRect(x + 330, slot1Y, 200, 55);
        if (this.selectedCauldronItems[0]) {
            const item1 = inv.getTroubleById(this.selectedCauldronItems[0]) || inv.getRealItemById(this.selectedCauldronItems[0]);
            if (item1) {
                ctx.fillStyle = item1.type === 'trouble' ? '#ff6666' : '#66ff66';
                ctx.font = 'bold 10px monospace';
                ctx.fillText(item1.type.toUpperCase(), x + 340, slot1Y + 20);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px monospace';
                ctx.fillText(item1.name, x + 340, slot1Y + 40);
            }
        } else {
            ctx.fillStyle = '#666666';
            ctx.font = '12px monospace';
            ctx.fillText('Select first item...', x + 340, slot1Y + 35);
        }

        // Plus sign
        ctx.fillStyle = '#9966ff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('+', x + 430, slot1Y + 75);
        ctx.textAlign = 'left';

        // Slot 2
        ctx.fillStyle = '#333333';
        ctx.fillRect(x + 330, slot2Y, 200, 55);
        if (this.selectedCauldronItems[1]) {
            const item2 = inv.getTroubleById(this.selectedCauldronItems[1]) || inv.getRealItemById(this.selectedCauldronItems[1]);
            if (item2) {
                ctx.fillStyle = item2.type === 'trouble' ? '#ff6666' : '#66ff66';
                ctx.font = 'bold 10px monospace';
                ctx.fillText(item2.type.toUpperCase(), x + 340, slot2Y + 20);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px monospace';
                ctx.fillText(item2.name, x + 340, slot2Y + 40);
            }
        } else {
            ctx.fillStyle = '#666666';
            ctx.font = '12px monospace';
            ctx.fillText('Select second item...', x + 340, slot2Y + 35);
        }

        // === RESULT PREVIEW ===
        if (this.selectedCauldronItems.length === 2) {
            const prediction = inv.predictCauldronCombination(
                this.selectedCauldronItems[0],
                this.selectedCauldronItems[1]
            );

            ctx.fillStyle = '#222244';
            ctx.fillRect(x + 330, slot2Y + 70, 200, 80);

            if (prediction && prediction.canCombine) {
                ctx.fillStyle = '#9966ff';
                ctx.font = 'bold 12px monospace';
                ctx.fillText('RESULT PREVIEW:', x + 340, slot2Y + 90);

                ctx.fillStyle = '#ffffff';
                ctx.font = '11px monospace';
                ctx.fillText(`Name: ${prediction.possibleName}`, x + 340, slot2Y + 110);
                ctx.fillText(`Type: ${prediction.resultType}`, x + 340, slot2Y + 125);

                // Combine button
                ctx.fillStyle = COLORS.BUTTON;
                ctx.fillRect(x + 340, slot2Y + 135, 180, 25);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('[C] COMBINE', x + 430, slot2Y + 152);
                ctx.textAlign = 'left';

                this.buttons.push({
                    x: x + 340,
                    y: slot2Y + 135,
                    width: 180,
                    height: 25,
                    onClick: () => this.combineCauldronItems()
                });
            } else {
                ctx.fillStyle = '#ff6666';
                ctx.font = '12px monospace';
                ctx.fillText('Cannot combine these items', x + 340, slot2Y + 110);
            }
        }

        // Instructions
        ctx.fillStyle = '#888888';
        ctx.font = '11px monospace';
        ctx.fillText('Click items to select. Combine Trouble + Seed to create specialized seeds.', x + 20, y + h - 20);
    }

    renderInventory(ctx, x, y, w, h) {
        const inv = this.game.inventory;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('INVENTORY', x + 20, y + 35);

        ctx.font = '12px monospace';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`Gold: ${inv.gold}g`, x + 200, y + 35);

        // === LEFT COLUMN: Troubles ===
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#ff6666';
        ctx.fillText('TROUBLES:', x + 20, y + 70);

        const troubles = inv.getTroubles();
        let troubleY = y + 95;

        if (troubles.length === 0) {
            ctx.fillStyle = '#666666';
            ctx.font = '11px monospace';
            ctx.fillText('No troubles collected.', x + 30, troubleY);
            ctx.fillText('Talk to NPCs to learn about', x + 30, troubleY + 18);
            ctx.fillText('problems you can solve.', x + 30, troubleY + 36);
        } else {
            troubles.forEach((trouble, i) => {
                ctx.fillStyle = '#4a2020';
                ctx.fillRect(x + 20, troubleY, 250, 60);

                ctx.fillStyle = '#ff6666';
                ctx.font = 'bold 12px monospace';
                ctx.fillText(trouble.name, x + 30, troubleY + 18);

                ctx.fillStyle = '#aaaaaa';
                ctx.font = '10px monospace';
                ctx.fillText(`Severity: ${trouble.severity || 1}`, x + 30, troubleY + 35);
                if (trouble.grantsFeature) {
                    ctx.fillText(`Grants: ${trouble.grantsFeature}`, x + 30, troubleY + 50);
                }

                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'right';
                ctx.fillText(`x${trouble.count || 1}`, x + 260, troubleY + 18);
                ctx.textAlign = 'left';

                troubleY += 65;
            });
        }

        // === RIGHT COLUMN: Real Items (Seeds, etc) ===
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#66ff66';
        ctx.fillText('ITEMS:', x + 300, y + 70);

        const realItems = inv.getRealItems();
        let itemY = y + 95;

        if (realItems.length === 0) {
            ctx.fillStyle = '#666666';
            ctx.font = '11px monospace';
            ctx.fillText('No items collected.', x + 310, itemY);
            ctx.fillText('Interact with fields to find', x + 310, itemY + 18);
            ctx.fillText('Old Growth seeds.', x + 310, itemY + 36);
        } else {
            realItems.forEach((item, i) => {
                ctx.fillStyle = '#2a4a2a';
                ctx.fillRect(x + 300, itemY, 250, 60);

                ctx.fillStyle = '#66ff66';
                ctx.font = 'bold 12px monospace';
                ctx.fillText(item.name, x + 310, itemY + 18);

                ctx.fillStyle = '#aaaaaa';
                ctx.font = '10px monospace';
                if (item.stats) {
                    ctx.fillText(`Hrd: ${item.stats.hardiness} | Yld: ${item.stats.yield}`, x + 310, itemY + 35);
                }
                if (item.feature) {
                    ctx.fillText(`Feature: ${item.feature}`, x + 310, itemY + 50);
                }

                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'right';
                ctx.fillText(`x${item.count || 1}`, x + 540, itemY + 18);
                ctx.textAlign = 'left';

                itemY += 65;
            });
        }

        // === BOTTOM: Supplies ===
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('SUPPLIES:', x + 20, y + h - 80);

        ctx.font = '11px monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`Essence Vials: ${inv.getItemCount('essence_vials')}`, x + 20, y + h - 60);
        ctx.fillText(`Synthesis Catalysts: ${inv.getItemCount('synthesis_catalysts')}`, x + 20, y + h - 45);
        ctx.fillText(`Harvest: ${inv.getItemCount('harvest')} bushels`, x + 250, y + h - 60);

        // Instructions
        ctx.fillStyle = '#888888';
        ctx.font = '11px monospace';
        ctx.fillText('Press [I] to open/close inventory. Use cauldron to combine Troubles + Seeds.', x + 20, y + h - 15);
    }

    renderDialogue(ctx) {
        const d = this.currentDialogue;
        if (!d) return;

        // Dialogue box at bottom
        const boxY = CANVAS_HEIGHT - 180;
        const boxH = 160;

        ctx.fillStyle = 'rgba(20, 20, 20, 0.95)';
        drawRoundedRect(ctx, 20, boxY, CANVAS_WIDTH - 40, boxH, 10);
        ctx.fill();

        ctx.strokeStyle = COLORS.UI_BORDER;
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, 20, boxY, CANVAS_WIDTH - 40, boxH, 10);
        ctx.stroke();

        // Speaker name
        ctx.fillStyle = COLORS.UI_HIGHLIGHT;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(d.speaker, 35, boxY + 28);

        // Dialogue text
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        const lines = wrapText(ctx, d.text, CANVAS_WIDTH - 80);
        lines.forEach((line, i) => {
            ctx.fillText(line, 35, boxY + 55 + i * 20);
        });

        // Options
        if (d.options.length > 0) {
            let optY = boxY + 55 + lines.length * 20 + 15;
            d.options.forEach((opt, i) => {
                const isSelected = i === d.selectedOption;
                ctx.fillStyle = isSelected ? COLORS.UI_HIGHLIGHT : '#888888';
                ctx.fillText(`${isSelected ? '>' : ' '} ${opt.text}`, 45, optY);
                optY += 22;
            });
        }

        // Continue prompt
        ctx.fillStyle = '#666666';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('[E / Enter] Continue', CANVAS_WIDTH - 35, boxY + boxH - 15);
    }
}
