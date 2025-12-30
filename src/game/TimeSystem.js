// Time System - handles game time progression
import { TIME_SPEEDS, SEASONS, DAYS_PER_SEASON, GAME_MINUTES_PER_REAL_SECOND } from './constants.js';

export class TimeSystem {
    constructor() {
        this.minutes = 360; // Start at 6:00 AM
        this.day = 1;
        this.season = 0; // 0 = Spring
        this.year = 1;
        this.speed = TIME_SPEEDS.PAUSED;
        this.previousSpeed = TIME_SPEEDS.NORMAL;

        this.autoPauseReasons = [];
        this.autoSlowReasons = [];

        this.listeners = {
            dayChange: [],
            seasonChange: [],
            yearChange: [],
            hourChange: []
        };
    }

    update(deltaTime) {
        if (this.speed === TIME_SPEEDS.PAUSED) return;

        const minutesToAdd = (deltaTime / 1000) * GAME_MINUTES_PER_REAL_SECOND * this.speed;
        const oldHour = Math.floor(this.minutes / 60);

        this.minutes += minutesToAdd;

        // Check for hour change
        const newHour = Math.floor(this.minutes / 60);
        if (newHour !== oldHour) {
            this.emit('hourChange', { hour: newHour % 24 });
        }

        // Check for day change
        if (this.minutes >= 1440) {
            this.minutes -= 1440;
            this.advanceDay();
        }
    }

    advanceDay() {
        this.day++;
        this.emit('dayChange', { day: this.day, season: this.getSeason(), year: this.year });

        if (this.day > DAYS_PER_SEASON) {
            this.day = 1;
            this.advanceSeason();
        }
    }

    advanceSeason() {
        this.season++;
        if (this.season >= SEASONS.length) {
            this.season = 0;
            this.advanceYear();
        }
        this.emit('seasonChange', { season: this.getSeason(), year: this.year });
        this.triggerAutoPause('Season change');
    }

    advanceYear() {
        this.year++;
        this.emit('yearChange', { year: this.year });
    }

    setSpeed(speed) {
        if (speed !== TIME_SPEEDS.PAUSED) {
            this.previousSpeed = speed;
        }
        this.speed = speed;
    }

    pause() {
        if (this.speed !== TIME_SPEEDS.PAUSED) {
            this.previousSpeed = this.speed;
        }
        this.speed = TIME_SPEEDS.PAUSED;
    }

    resume() {
        this.speed = this.previousSpeed || TIME_SPEEDS.NORMAL;
    }

    togglePause() {
        if (this.speed === TIME_SPEEDS.PAUSED) {
            this.resume();
        } else {
            this.pause();
        }
    }

    triggerAutoPause(reason) {
        this.autoPauseReasons.push(reason);
        this.pause();
    }

    triggerAutoSlow(reason) {
        this.autoSlowReasons.push(reason);
        if (this.speed > TIME_SPEEDS.NORMAL) {
            this.setSpeed(TIME_SPEEDS.NORMAL);
        }
    }

    clearAutoPause() {
        this.autoPauseReasons = [];
    }

    clearAutoSlow(reason) {
        this.autoSlowReasons = this.autoSlowReasons.filter(r => r !== reason);
    }

    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    getSeason() {
        return SEASONS[this.season];
    }

    getHour() {
        return Math.floor(this.minutes / 60) % 24;
    }

    getFormattedTime() {
        const hours = this.getHour();
        const mins = Math.floor(this.minutes % 60);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
    }

    getDateString() {
        return `Day ${this.day} of ${this.getSeason()}, Year ${this.year}`;
    }

    getSpeedName() {
        switch (this.speed) {
            case TIME_SPEEDS.PAUSED: return 'PAUSED';
            case TIME_SPEEDS.NORMAL: return 'NORMAL';
            case TIME_SPEEDS.FAST: return 'FAST';
            case TIME_SPEEDS.VERY_FAST: return 'VERY FAST';
            default: return 'UNKNOWN';
        }
    }

    skipDays(numDays) {
        for (let i = 0; i < numDays; i++) {
            this.advanceDay();
        }
    }

    // For save/load
    serialize() {
        return {
            minutes: this.minutes,
            day: this.day,
            season: this.season,
            year: this.year
        };
    }

    deserialize(data) {
        this.minutes = data.minutes;
        this.day = data.day;
        this.season = data.season;
        this.year = data.year;
    }
}
