// Combining System - Modular logic for combining items in the cauldron

import { generateId } from './utils.js';

export class CombiningSystem {
    constructor() {
        // Recipe registry - maps input types to output generators
        this.recipes = new Map();

        // Initialize default recipes
        this.registerDefaultRecipes();
    }

    registerDefaultRecipes() {
        // Trouble + Seed = Trouble-infused Seed
        this.registerRecipe('trouble', 'seed', (trouble, seed) => {
            return {
                type: 'seed',
                id: generateId(),
                name: `${trouble.name} ${seed.name}`,
                baseItem: seed,
                infusedTrouble: trouble,
                stats: this.calculateInfusedStats(trouble, seed),
                feature: this.deriveFeature(trouble, seed),
                color: this.blendColors(trouble.color || '#8b0000', seed.color || '#4a7c59'),
                isStable: false,
                count: 1
            };
        });

        // Seed + Seed = Hybrid Seed (from existing essence combining)
        this.registerRecipe('seed', 'seed', (seed1, seed2) => {
            return {
                type: 'seed',
                id: generateId(),
                name: `${seed1.name}-${seed2.name} Hybrid`,
                stats: this.averageStats(seed1.stats, seed2.stats),
                feature: this.combineFeatures(seed1.feature, seed2.feature),
                color: this.blendColors(seed1.color, seed2.color),
                isStable: false,
                count: 1
            };
        });

        // Trouble + Trouble = Compound Trouble
        this.registerRecipe('trouble', 'trouble', (t1, t2) => {
            return {
                type: 'trouble',
                id: generateId(),
                name: this.combineTroubleNames(t1.name, t2.name),
                severity: Math.max(t1.severity || 1, t2.severity || 1) + 1,
                effects: [...(t1.effects || []), ...(t2.effects || [])],
                color: this.blendColors(t1.color || '#8b0000', t2.color || '#8b0000')
            };
        });
    }

    // Register a custom recipe
    registerRecipe(type1, type2, combineFunction) {
        const key = this.getRecipeKey(type1, type2);
        this.recipes.set(key, combineFunction);
    }

    // Get recipe key (order-independent)
    getRecipeKey(type1, type2) {
        const sorted = [type1, type2].sort();
        return `${sorted[0]}+${sorted[1]}`;
    }

    // Check if two items can be combined
    canCombine(item1, item2) {
        const key = this.getRecipeKey(item1.type, item2.type);
        return this.recipes.has(key);
    }

    // Combine two items
    combine(item1, item2) {
        const key = this.getRecipeKey(item1.type, item2.type);
        const recipe = this.recipes.get(key);

        if (!recipe) {
            return null;
        }

        // Ensure consistent order for the recipe function
        const sorted = [item1.type, item2.type].sort();
        if (item1.type === sorted[0]) {
            return recipe(item1, item2);
        } else {
            return recipe(item2, item1);
        }
    }

    // Predict the result of combining (without actually combining)
    predictCombination(item1, item2) {
        if (!this.canCombine(item1, item2)) {
            return null;
        }

        const key = this.getRecipeKey(item1.type, item2.type);

        return {
            canCombine: true,
            resultType: this.predictResultType(item1.type, item2.type),
            possibleName: this.predictName(item1, item2),
            inputTypes: [item1.type, item2.type]
        };
    }

    predictResultType(type1, type2) {
        if (type1 === 'trouble' && type2 === 'seed') return 'seed';
        if (type1 === 'seed' && type2 === 'trouble') return 'seed';
        if (type1 === 'seed' && type2 === 'seed') return 'seed';
        if (type1 === 'trouble' && type2 === 'trouble') return 'trouble';
        return 'unknown';
    }

    predictName(item1, item2) {
        const type1 = item1.type;
        const type2 = item2.type;

        if ((type1 === 'trouble' && type2 === 'seed') || (type1 === 'seed' && type2 === 'trouble')) {
            const trouble = type1 === 'trouble' ? item1 : item2;
            const seed = type1 === 'seed' ? item1 : item2;
            return `${trouble.name} ${seed.name}`;
        }
        if (type1 === 'seed' && type2 === 'seed') {
            return `${item1.name}-${item2.name} Hybrid`;
        }
        if (type1 === 'trouble' && type2 === 'trouble') {
            return this.combineTroubleNames(item1.name, item2.name);
        }
        return '???';
    }

    // Calculate stats for trouble-infused seed
    calculateInfusedStats(trouble, seed) {
        const stats = { ...seed.stats };

        // Troubles can modify stats based on their nature
        if (trouble.statModifiers) {
            for (const [stat, modifier] of Object.entries(trouble.statModifiers)) {
                if (stats[stat] !== undefined) {
                    stats[stat] = Math.max(1, Math.min(5, stats[stat] + modifier));
                }
            }
        }

        return stats;
    }

    // Derive feature from trouble and seed combination
    deriveFeature(trouble, seed) {
        // If trouble has a specific feature to grant
        if (trouble.grantsFeature) {
            return trouble.grantsFeature;
        }

        // Otherwise keep seed's feature with potential modification
        if (seed.feature && trouble.featureModifier) {
            return `${trouble.featureModifier} ${seed.feature}`;
        }

        return seed.feature || trouble.name;
    }

    // Average stats between two seeds
    averageStats(stats1, stats2) {
        const result = {};
        const allStats = ['yield', 'hardiness', 'speed', 'efficiency'];

        for (const stat of allStats) {
            const v1 = stats1?.[stat] || 2;
            const v2 = stats2?.[stat] || 2;
            // Random between min and max with slight improvement chance
            const min = Math.min(v1, v2);
            const max = Math.max(v1, v2);
            let value = Math.floor(Math.random() * (max - min + 1)) + min;
            if (Math.random() < 0.15) value = Math.min(value + 1, 5);
            result[stat] = value;
        }

        return result;
    }

    // Combine features from two seeds
    combineFeatures(feature1, feature2) {
        if (feature1 && feature2) {
            return Math.random() < 0.5 ? feature1 : feature2;
        }
        if (feature1) return Math.random() < 0.6 ? feature1 : null;
        if (feature2) return Math.random() < 0.6 ? feature2 : null;
        return null;
    }

    // Combine trouble names creatively
    combineTroubleNames(name1, name2) {
        // Extract key words and combine
        const word1 = name1.split(' ')[0];
        const word2 = name2.split(' ').pop();
        return `${word1} ${word2}`;
    }

    // Blend two hex colors
    blendColors(color1, color2) {
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
        if (!hex) return { r: 100, g: 100, b: 100 };
        if (hex.startsWith('rgb')) {
            const match = hex.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
            }
        }
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 100, g: 100, b: 100 };
    }
}

// Singleton instance
export const combiningSystem = new CombiningSystem();
