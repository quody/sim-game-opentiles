// Game Constants
export const TILE_SIZE = 32;
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

// Time constants
export const TIME_SPEEDS = {
    PAUSED: 0,
    NORMAL: 1,
    FAST: 3,
    VERY_FAST: 10
};

export const MINUTES_PER_DAY = 1440;
export const GAME_MINUTES_PER_REAL_SECOND = 2; // At normal speed

// Season constants
export const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
export const DAYS_PER_SEASON = 28;

// Seed stats
export const STAT_MAX = 5;

// Colors
export const COLORS = {
    GRASS: '#4a7c59',
    DEAD_CROP: '#8b7355',
    PATH: '#c9b896',
    ROAD: '#9a8b7a',
    BUILDING: '#6b5b4f',
    BUILDING_INTERIOR: '#8b7b6b',
    WATER: '#4a90a4',
    FIELD: '#5d8a4a',
    FIELD_DEAD: '#7a6b5a',
    PLAYER: '#3498db',
    NPC: '#e67e22',
    UI_BG: '#2c2c2c',
    UI_BORDER: '#4a4a4a',
    UI_TEXT: '#ffffff',
    UI_HIGHLIGHT: '#5dade2',
    BUTTON: '#3498db',
    BUTTON_HOVER: '#2980b9'
};

// Tile types
export const TILES = {
    GRASS: 0,
    PATH: 1,
    ROAD: 2,
    BUILDING_EXTERIOR: 3,
    BUILDING_FLOOR: 4,
    FIELD_EMPTY: 5,
    FIELD_PLANTED: 6,
    FIELD_GROWING: 7,
    FIELD_MATURE: 8,
    FIELD_DEAD: 9,
    WATER: 10,
    WALL: 11,
    DOOR: 12,
    BENCH: 13,
    CHAMBER: 14,
    STORAGE: 15,
    NOTICE_BOARD: 16
};

// Interaction distances
export const INTERACTION_DISTANCE = 1.5;
