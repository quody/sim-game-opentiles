// Game Entry Point

import { Game } from './Game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');

    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    // Create and start the game
    const game = new Game(canvas);

    // Expose game instance for debugging
    window.game = game;

    // Add keyboard shortcuts for save/load
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            game.save();
        }
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            game.load();
        }
    });

    // Start the game
    game.start();

    console.log('Seed Breeder game started!');
    console.log('Controls:');
    console.log('  WASD / Arrow Keys - Move');
    console.log('  E / Space - Interact');
    console.log('  1-4 - Time speed (Pause, Normal, Fast, Very Fast)');
    console.log('  ESC - Close menus');
    console.log('  Ctrl+S - Save game');
    console.log('  Ctrl+L - Load game');
});
