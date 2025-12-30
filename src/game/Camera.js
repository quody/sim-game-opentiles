// Camera System - handles viewport and following

import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE } from './constants.js';
import { clamp, lerp } from './utils.js';

export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.smoothing = 0.1;
        this.bounds = null;
    }

    follow(entity) {
        this.targetX = entity.x * TILE_SIZE - CANVAS_WIDTH / 2 + TILE_SIZE / 2;
        this.targetY = entity.y * TILE_SIZE - CANVAS_HEIGHT / 2 + TILE_SIZE / 2;
    }

    setBounds(mapWidth, mapHeight) {
        this.bounds = {
            minX: 0,
            minY: 0,
            maxX: mapWidth * TILE_SIZE - CANVAS_WIDTH,
            maxY: mapHeight * TILE_SIZE - CANVAS_HEIGHT
        };
    }

    update(deltaTime) {
        // Smooth camera movement
        this.x = lerp(this.x, this.targetX, this.smoothing);
        this.y = lerp(this.y, this.targetY, this.smoothing);

        // Clamp to bounds if set
        if (this.bounds) {
            this.x = clamp(this.x, this.bounds.minX, this.bounds.maxX);
            this.y = clamp(this.y, this.bounds.minY, this.bounds.maxY);
        }
    }

    screenToWorld(screenX, screenY) {
        return {
            x: (screenX + this.x) / TILE_SIZE,
            y: (screenY + this.y) / TILE_SIZE
        };
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX * TILE_SIZE - this.x,
            y: worldY * TILE_SIZE - this.y
        };
    }

    isOnScreen(worldX, worldY, margin = 1) {
        const screen = this.worldToScreen(worldX, worldY);
        return screen.x >= -margin * TILE_SIZE &&
               screen.x <= CANVAS_WIDTH + margin * TILE_SIZE &&
               screen.y >= -margin * TILE_SIZE &&
               screen.y <= CANVAS_HEIGHT + margin * TILE_SIZE;
    }

    applyTransform(ctx) {
        ctx.save();
        ctx.translate(-this.x, -this.y);
    }

    resetTransform(ctx) {
        ctx.restore();
    }
}
