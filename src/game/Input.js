// Input System - handles keyboard and mouse input

export class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.keysJustPressed = {};
        this.keysJustReleased = {};
        this.mouse = { x: 0, y: 0, clicked: false, justClicked: false };

        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keysJustPressed[e.code] = true;
            }
            this.keys[e.code] = true;

            // Prevent default for game keys
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE', 'KeyI'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keysJustReleased[e.code] = true;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.clicked = true;
            this.mouse.justClicked = true;
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.mouse.clicked = false;
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    isKeyDown(code) {
        return !!this.keys[code];
    }

    isKeyJustPressed(code) {
        return !!this.keysJustPressed[code];
    }

    isKeyJustReleased(code) {
        return !!this.keysJustReleased[code];
    }

    isMovingUp() {
        return this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp');
    }

    isMovingDown() {
        return this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown');
    }

    isMovingLeft() {
        return this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft');
    }

    isMovingRight() {
        return this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight');
    }

    isInteractPressed() {
        return this.isKeyJustPressed('KeyE') || this.isKeyJustPressed('Space');
    }

    isEscapePressed() {
        return this.isKeyJustPressed('Escape');
    }

    getMovementVector() {
        let dx = 0;
        let dy = 0;

        if (this.isMovingUp()) dy -= 1;
        if (this.isMovingDown()) dy += 1;
        if (this.isMovingLeft()) dx -= 1;
        if (this.isMovingRight()) dx += 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        return { x: dx, y: dy };
    }

    isMouseJustClicked() {
        return this.mouse.justClicked;
    }

    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    // Call at end of frame to clear just-pressed states
    endFrame() {
        this.keysJustPressed = {};
        this.keysJustReleased = {};
        this.mouse.justClicked = false;
    }
}
