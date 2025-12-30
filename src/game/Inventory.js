// Inventory and Seed System

import { generateId, randomInt, randomFloat } from './utils.js';
import { STAT_MAX } from './constants.js';

export class Inventory {
    constructor() {
        this.gold = 50;
        this.seeds = [];
        this.essences = [];
        this.items = {
            essence_vials: 5,
            synthesis_catalysts: 2,
            stabilization_gel: 1,
            harvest: 0
        };

        this.initializeStartingSeeds();
    }

    initializeStartingSeeds() {
        // Thornwall seeds
        this.seeds.push({
            id: 'thornwall',
            name: 'Thornwall',
            count: 8,
            stats: {
                yield: 3,
                hardiness: 4,
                speed: 2,
                efficiency: 3
            },
            feature: 'Deep Root',
            isStable: true,
            color: '#4a7c59'
        });

        // Quicksprout seeds
        this.seeds.push({
            id: 'quicksprout',
            name: 'Quicksprout',
            count: 8,
            stats: {
                yield: 4,
                hardiness: 2,
                speed: 5,
                efficiency: 2
            },
            feature: 'Quick Start',
            isStable: true,
            color: '#7cb342'
        });

        // Oldstock seeds
        this.seeds.push({
            id: 'oldstock',
            name: 'Oldstock',
            count: 8,
            stats: {
                yield: 2,
                hardiness: 3,
                speed: 3,
                efficiency: 3
            },
            feature: null,
            isStable: true,
            color: '#8d6e63'
        });
    }

    getSeedById(id) {
        return this.seeds.find(s => s.id === id);
    }

    getSeeds() {
        return this.seeds.filter(s => s.count > 0);
    }

    addSeeds(id, count) {
        const seed = this.getSeedById(id);
        if (seed) {
            seed.count += count;
        }
    }

    removeSeeds(id, count) {
        const seed = this.getSeedById(id);
        if (seed && seed.count >= count) {
            seed.count -= count;
            return true;
        }
        return false;
    }

    getEssences() {
        return this.essences;
    }

    addEssence(seedId) {
        const seed = this.getSeedById(seedId);
        if (!seed) return null;

        const essence = {
            id: generateId(),
            sourceSeedId: seedId,
            name: `${seed.name} Essence`,
            stats: { ...seed.stats },
            feature: seed.feature,
            color: seed.color
        };

        this.essences.push(essence);
        return essence;
    }

    removeEssence(essenceId) {
        const index = this.essences.findIndex(e => e.id === essenceId);
        if (index >= 0) {
            this.essences.splice(index, 1);
            return true;
        }
        return false;
    }

    hasItem(itemId, count = 1) {
        return (this.items[itemId] || 0) >= count;
    }

    addItem(itemId, count = 1) {
        this.items[itemId] = (this.items[itemId] || 0) + count;
    }

    removeItem(itemId, count = 1) {
        if (this.hasItem(itemId, count)) {
            this.items[itemId] -= count;
            return true;
        }
        return false;
    }

    getItemCount(itemId) {
        return this.items[itemId] || 0;
    }

    addGold(amount) {
        this.gold += amount;
    }

    removeGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }

    // Create new seed from two essences
    combineEssences(essence1Id, essence2Id) {
        const e1 = this.essences.find(e => e.id === essence1Id);
        const e2 = this.essences.find(e => e.id === essence2Id);

        if (!e1 || !e2) return null;

        // Calculate new stats (randomized between parents)
        const newStats = {};
        for (const stat of ['yield', 'hardiness', 'speed', 'efficiency']) {
            const min = Math.min(e1.stats[stat], e2.stats[stat]);
            const max = Math.max(e1.stats[stat], e2.stats[stat]);
            // Random with slight chance of improvement
            let value = randomInt(min, max);
            if (Math.random() < 0.15) value = Math.min(value + 1, STAT_MAX);
            newStats[stat] = value;
        }

        // Determine feature inheritance
        let feature = null;
        if (e1.feature && e2.feature) {
            feature = Math.random() < 0.5 ? e1.feature : e2.feature;
        } else if (e1.feature) {
            feature = Math.random() < 0.6 ? e1.feature : null;
        } else if (e2.feature) {
            feature = Math.random() < 0.6 ? e2.feature : null;
        }

        // Create prototype seed
        const prototype = {
            id: generateId(),
            name: '??? Prototype',
            count: 1,
            stats: newStats,
            feature: feature,
            isStable: false,
            stability: 12 + randomInt(0, 10),
            color: this.blendColors(e1.color, e2.color),
            parentEssences: [essence1Id, essence2Id]
        };

        // Remove used essences
        this.removeEssence(essence1Id);
        this.removeEssence(essence2Id);

        // Add prototype to seeds
        this.seeds.push(prototype);

        return prototype;
    }

    blendColors(color1, color2) {
        // Simple color blending
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);

        const blended = {
            r: Math.floor((c1.r + c2.r) / 2),
            g: Math.floor((c1.g + c2.g) / 2),
            b: Math.floor((c1.b + c2.b) / 2)
        };

        return `rgb(${blended.r}, ${blended.g}, ${blended.b})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 100, g: 100, b: 100 };
    }

    // Predict result of combining two essences
    predictCombination(essence1Id, essence2Id) {
        const e1 = this.essences.find(e => e.id === essence1Id);
        const e2 = this.essences.find(e => e.id === essence2Id);

        if (!e1 || !e2) return null;

        const prediction = {
            stats: {},
            featureChance: 0,
            possibleFeatures: []
        };

        for (const stat of ['yield', 'hardiness', 'speed', 'efficiency']) {
            prediction.stats[stat] = {
                min: Math.min(e1.stats[stat], e2.stats[stat]),
                max: Math.max(e1.stats[stat], e2.stats[stat]) + 1
            };
        }

        if (e1.feature && e2.feature) {
            prediction.possibleFeatures = [e1.feature, e2.feature];
            prediction.featureChance = 100;
        } else if (e1.feature) {
            prediction.possibleFeatures = [e1.feature];
            prediction.featureChance = 60;
        } else if (e2.feature) {
            prediction.possibleFeatures = [e2.feature];
            prediction.featureChance = 60;
        }

        return prediction;
    }

    // Stabilize a prototype seed
    stabilizeSeed(seedId, daysElapsed, totalDays) {
        const seed = this.getSeedById(seedId);
        if (!seed || seed.isStable) return null;

        seed.stability = Math.min(100, seed.stability + (daysElapsed / totalDays) * 100);

        if (seed.stability >= 100) {
            seed.isStable = true;
            seed.name = this.generateSeedName(seed);
            seed.count = 4; // Multiplication
            return { complete: true, seed };
        }

        return { complete: false, seed };
    }

    generateSeedName(seed) {
        const prefixes = ['Clay', 'Hardy', 'Quick', 'Robust', 'Strong', 'Vital'];
        const suffixes = ['root', 'sprout', 'seed', 'bloom', 'grow'];

        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const num = Math.floor(Math.random() * 10);

        return `${prefix}${suffix}-${num}`;
    }

    serialize() {
        return {
            gold: this.gold,
            seeds: this.seeds,
            essences: this.essences,
            items: this.items
        };
    }

    deserialize(data) {
        this.gold = data.gold;
        this.seeds = data.seeds;
        this.essences = data.essences;
        this.items = data.items;
    }
}
