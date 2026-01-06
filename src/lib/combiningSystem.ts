// Combining System - Modular logic for combining items in the cauldron

import type { Trouble, RealItem, Inventory } from './gameEngine';
import { generateId, removeTrouble, removeRealItem, addRealItem, addTrouble } from './gameEngine';

export type CombinableItem = Trouble | RealItem;

export interface CombineResult {
  type: 'seed' | 'trouble';
  name: string;
  description: string;
  stats?: { yield: number; hardiness: number; speed: number; efficiency: number };
  feature: string | null;
  color: string;
  severity?: number;
  statModifiers?: Record<string, number>;
  grantsFeature?: string | null;
}

export interface CombinePrediction {
  canCombine: boolean;
  resultType: 'seed' | 'trouble' | 'unknown';
  possibleName: string;
}

type RecipeFunction = (item1: CombinableItem, item2: CombinableItem) => CombineResult | null;

class CombiningSystem {
  private recipes: Map<string, RecipeFunction> = new Map();

  constructor() {
    this.registerDefaultRecipes();
  }

  private getRecipeKey(type1: string, type2: string): string {
    const sorted = [type1, type2].sort();
    return `${sorted[0]}+${sorted[1]}`;
  }

  registerRecipe(type1: string, type2: string, fn: RecipeFunction): void {
    const key = this.getRecipeKey(type1, type2);
    this.recipes.set(key, fn);
  }

  private registerDefaultRecipes(): void {
    // Trouble + Seed = Trouble-infused Seed
    this.registerRecipe('trouble', 'seed', (item1, item2) => {
      const trouble = item1.type === 'trouble' ? item1 as Trouble : item2 as Trouble;
      const seed = item1.type === 'seed' ? item1 as RealItem : item2 as RealItem;

      // Generate combined name - extract key word from trouble
      const troubleWord = this.extractKeyWord(trouble.name);
      const combinedName = `${troubleWord} seed`;

      // Calculate stats with trouble modifiers
      const newStats = { ...seed.stats };
      if (trouble.statModifiers) {
        for (const [stat, modifier] of Object.entries(trouble.statModifiers)) {
          if (stat in newStats) {
            (newStats as Record<string, number>)[stat] = Math.max(1, Math.min(5,
              (newStats as Record<string, number>)[stat] + modifier
            ));
          }
        }
      }

      return {
        type: 'seed',
        name: combinedName,
        description: `A seed infused with the essence of ${trouble.name.toLowerCase()}.`,
        stats: newStats,
        feature: trouble.grantsFeature || seed.feature,
        color: this.blendColors(trouble.color, seed.color),
      };
    });

    // Seed + Seed = Hybrid Seed
    this.registerRecipe('seed', 'seed', (item1, item2) => {
      const seed1 = item1 as RealItem;
      const seed2 = item2 as RealItem;

      const name1 = seed1.name.replace(' seed', '').replace('Seed', '');
      const name2 = seed2.name.replace(' seed', '').replace('Seed', '');

      return {
        type: 'seed',
        name: `${name1}-${name2} hybrid`,
        description: `A hybrid seed combining traits of ${seed1.name} and ${seed2.name}.`,
        stats: this.averageStats(seed1.stats, seed2.stats),
        feature: this.combineFeatures(seed1.feature, seed2.feature),
        color: this.blendColors(seed1.color, seed2.color),
      };
    });

    // Trouble + Trouble = Compound Trouble
    this.registerRecipe('trouble', 'trouble', (item1, item2) => {
      const t1 = item1 as Trouble;
      const t2 = item2 as Trouble;

      const word1 = this.extractKeyWord(t1.name);
      const word2 = this.extractKeyWord(t2.name);

      const combinedModifiers: Record<string, number> = { ...t1.statModifiers };
      for (const [stat, mod] of Object.entries(t2.statModifiers)) {
        combinedModifiers[stat] = (combinedModifiers[stat] || 0) + mod;
      }

      return {
        type: 'trouble',
        name: `${word1} ${word2}`,
        description: `A compound trouble combining ${t1.name} and ${t2.name}.`,
        severity: Math.max(t1.severity, t2.severity) + 1,
        statModifiers: combinedModifiers,
        grantsFeature: t1.grantsFeature || t2.grantsFeature,
        color: this.blendColors(t1.color, t2.color),
        feature: null,
      };
    });
  }

  private extractKeyWord(name: string): string {
    // Extract meaningful word from trouble name for combined seed name
    // "Seeds dry out" -> "Dry spell"
    const words = name.toLowerCase().split(' ');
    if (words.includes('dry')) return 'Dry spell';
    if (words.includes('frost')) return 'Frost';
    if (words.includes('pest')) return 'Resistant';
    if (words.includes('blight')) return 'Blight-proof';
    // Default: use first meaningful word
    return words[0].charAt(0).toUpperCase() + words[0].slice(1);
  }

  private averageStats(
    stats1: { yield: number; hardiness: number; speed: number; efficiency: number },
    stats2: { yield: number; hardiness: number; speed: number; efficiency: number }
  ) {
    return {
      yield: Math.round((stats1.yield + stats2.yield) / 2),
      hardiness: Math.round((stats1.hardiness + stats2.hardiness) / 2),
      speed: Math.round((stats1.speed + stats2.speed) / 2),
      efficiency: Math.round((stats1.efficiency + stats2.efficiency) / 2),
    };
  }

  private combineFeatures(f1: string | null, f2: string | null): string | null {
    if (f1 && f2) return Math.random() < 0.5 ? f1 : f2;
    return f1 || f2;
  }

  private blendColors(color1: string, color2: string): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    return `rgb(${Math.round((c1.r + c2.r) / 2)}, ${Math.round((c1.g + c2.g) / 2)}, ${Math.round((c1.b + c2.b) / 2)})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    if (hex.startsWith('rgb')) {
      const match = hex.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
      }
    }
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 100, g: 100, b: 100 };
  }

  canCombine(item1: CombinableItem, item2: CombinableItem): boolean {
    const key = this.getRecipeKey(item1.type, item2.type);
    return this.recipes.has(key);
  }

  combine(item1: CombinableItem, item2: CombinableItem): CombineResult | null {
    const key = this.getRecipeKey(item1.type, item2.type);
    const recipe = this.recipes.get(key);
    if (!recipe) return null;
    return recipe(item1, item2);
  }

  predict(item1: CombinableItem, item2: CombinableItem): CombinePrediction {
    if (!this.canCombine(item1, item2)) {
      return { canCombine: false, resultType: 'unknown', possibleName: '???' };
    }

    // Predict result type
    let resultType: 'seed' | 'trouble' = 'seed';
    if (item1.type === 'trouble' && item2.type === 'trouble') {
      resultType = 'trouble';
    }

    // Predict name
    let possibleName = '???';
    if (item1.type === 'trouble' && item2.type === 'seed') {
      const trouble = item1 as Trouble;
      possibleName = `${this.extractKeyWord(trouble.name)} seed`;
    } else if (item1.type === 'seed' && item2.type === 'trouble') {
      const trouble = item2 as Trouble;
      possibleName = `${this.extractKeyWord(trouble.name)} seed`;
    } else if (item1.type === 'seed' && item2.type === 'seed') {
      const s1 = (item1 as RealItem).name.replace(' seed', '');
      const s2 = (item2 as RealItem).name.replace(' seed', '');
      possibleName = `${s1}-${s2} hybrid`;
    } else if (item1.type === 'trouble' && item2.type === 'trouble') {
      const w1 = this.extractKeyWord((item1 as Trouble).name);
      const w2 = this.extractKeyWord((item2 as Trouble).name);
      possibleName = `${w1} ${w2}`;
    }

    return { canCombine: true, resultType, possibleName };
  }
}

// Singleton instance
export const combiningSystem = new CombiningSystem();

// Helper function to perform combination and update inventory
export function combineInCauldron(
  inventory: Inventory,
  item1Id: string,
  item2Id: string
): CombineResult | null {
  const item1 = inventory.troubles.find(t => t.id === item1Id) ||
                inventory.realItems.find(i => i.id === item1Id);
  const item2 = inventory.troubles.find(t => t.id === item2Id) ||
                inventory.realItems.find(i => i.id === item2Id);

  if (!item1 || !item2) return null;
  if (!combiningSystem.canCombine(item1, item2)) return null;

  const result = combiningSystem.combine(item1, item2);
  if (!result) return null;

  // Remove used items
  if (item1.type === 'trouble') {
    removeTrouble(inventory, item1.id);
  } else {
    removeRealItem(inventory, item1.id);
  }

  if (item2.type === 'trouble') {
    removeTrouble(inventory, item2.id);
  } else {
    removeRealItem(inventory, item2.id);
  }

  // Add result to inventory
  if (result.type === 'seed') {
    addRealItem(inventory, {
      name: result.name,
      description: result.description,
      stats: result.stats!,
      feature: result.feature,
      color: result.color,
    });
  } else {
    addTrouble(inventory, {
      name: result.name,
      description: result.description,
      severity: result.severity!,
      statModifiers: result.statModifiers!,
      grantsFeature: result.grantsFeature!,
      color: result.color,
    });
  }

  return result;
}
