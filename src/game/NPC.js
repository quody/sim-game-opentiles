// NPC Entity

import { Entity } from './Entity.js';
import { TILE_SIZE, COLORS } from './constants.js';

export class NPC extends Entity {
    constructor(x, y, name, dialogues) {
        super(x, y);
        this.name = name;
        this.dialogues = dialogues || [];
        this.currentDialogueIndex = 0;
        this.color = COLORS.NPC;
        this.interactable = true;
        this.hasSpoken = false;
        this.questGiver = false;
        this.questId = null;
    }

    onInteract(game) {
        if (this.dialogues.length === 0) return;

        const dialogue = this.getCurrentDialogue(game);
        if (dialogue) {
            game.timeSystem.triggerAutoPause(`Talking to ${this.name}`);
            game.ui.showDialogue(this.name, dialogue.text, dialogue.options);
        }
    }

    getCurrentDialogue(game) {
        // Check for conditional dialogues first
        for (const dialogue of this.dialogues) {
            if (dialogue.condition && dialogue.condition(game)) {
                return dialogue;
            }
        }

        // Return default dialogue
        const defaultDialogues = this.dialogues.filter(d => !d.condition);
        if (defaultDialogues.length > 0) {
            return defaultDialogues[this.currentDialogueIndex % defaultDialogues.length];
        }

        return null;
    }

    advanceDialogue() {
        this.currentDialogueIndex++;
        this.hasSpoken = true;
    }

    setDialogues(dialogues) {
        this.dialogues = dialogues;
        this.currentDialogueIndex = 0;
    }

    render(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);

        // Draw NPC body
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

        // Draw name above
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, screenPos.x + TILE_SIZE / 2, screenPos.y - 6);

        // Draw interaction indicator if not spoken
        if (!this.hasSpoken || this.questGiver) {
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('!', screenPos.x + TILE_SIZE / 2 + 12, screenPos.y);
        }
    }
}
