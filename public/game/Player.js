// Player Entity

import { Entity } from './Entity.js';
import { TILE_SIZE, COLORS, INTERACTION_DISTANCE } from './constants.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y);
        this.color = COLORS.PLAYER;
        this.speed = 5; // Tiles per second
        this.name = 'Player';
        this.solid = true;
        this.direction = { x: 0, y: 1 }; // Facing direction
        this.isMoving = false;
    }

    update(deltaTime, game) {
        if (game.ui.hasActiveUI()) return;

        const input = game.input;
        const movement = input.getMovementVector();

        this.isMoving = movement.x !== 0 || movement.y !== 0;

        if (this.isMoving) {
            this.direction = { x: movement.x, y: movement.y };

            const moveAmount = this.speed * (deltaTime / 1000);
            const newX = this.x + movement.x * moveAmount;
            const newY = this.y + movement.y * moveAmount;

            // Check collision for X movement
            if (!game.world.isColliding(newX, this.y, this.width, this.height)) {
                this.x = newX;
            }

            // Check collision for Y movement
            if (!game.world.isColliding(this.x, newY, this.width, this.height)) {
                this.y = newY;
            }
        }

        // Handle interaction
        if (input.isInteractPressed()) {
            this.tryInteract(game);
        }
    }

    tryInteract(game) {
        // Check for nearby interactables
        const interactX = this.x + this.direction.x * 0.5;
        const interactY = this.y + this.direction.y * 0.5;

        // Check NPCs
        for (const npc of game.world.npcs) {
            if (this.distanceTo(npc) <= INTERACTION_DISTANCE) {
                npc.onInteract(game);
                return;
            }
        }

        // Check tile interactions
        const tileX = Math.floor(interactX + 0.5);
        const tileY = Math.floor(interactY + 0.5);
        game.world.interactWithTile(tileX, tileY, game);
    }

    render(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);

        // Draw player body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(
            screenPos.x + TILE_SIZE / 2,
            screenPos.y + TILE_SIZE / 2,
            TILE_SIZE / 2 - 4,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Draw direction indicator
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(
            screenPos.x + TILE_SIZE / 2 + this.direction.x * 8,
            screenPos.y + TILE_SIZE / 2 + this.direction.y * 8,
            4,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Draw interaction hint
        if (this.isMoving === false) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('[E] Interact', screenPos.x + TILE_SIZE / 2, screenPos.y - 4);
        }
    }
}
