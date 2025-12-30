// Base Entity class for all game objects

import { TILE_SIZE, COLORS } from './constants.js';
import { generateId } from './utils.js';

export class Entity {
    constructor(x, y) {
        this.id = generateId();
        this.x = x;
        this.y = y;
        this.width = 1;
        this.height = 1;
        this.color = COLORS.PLAYER;
        this.solid = true;
        this.interactable = false;
        this.name = 'Entity';
    }

    update(deltaTime, game) {
        // Override in subclasses
    }

    render(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);

        ctx.fillStyle = this.color;
        ctx.fillRect(
            screenPos.x + 4,
            screenPos.y + 4,
            TILE_SIZE - 8,
            TILE_SIZE - 8
        );
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }

    intersects(other) {
        const a = this.getBounds();
        const b = other.getBounds();
        return a.left < b.right &&
               a.right > b.left &&
               a.top < b.bottom &&
               a.bottom > b.top;
    }

    distanceTo(other) {
        const dx = (this.x + this.width / 2) - (other.x + other.width / 2);
        const dy = (this.y + this.height / 2) - (other.y + other.height / 2);
        return Math.sqrt(dx * dx + dy * dy);
    }

    onInteract(game) {
        // Override in subclasses
    }
}
