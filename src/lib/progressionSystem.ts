// Progression System - Manages unlocks and progression state for the cauldron

export type RecipeType = 'trouble+seed' | 'seed+seed' | 'trouble+trouble';

export interface ProgressionState {
  unlockedRecipes: Set<RecipeType>;
}

class ProgressionSystem {
  private state: ProgressionState;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): ProgressionState {
    return {
      unlockedRecipes: new Set<RecipeType>(['trouble+seed']),
    };
  }

  isRecipeUnlocked(recipeType: RecipeType): boolean {
    return this.state.unlockedRecipes.has(recipeType);
  }

  canCombineTypes(type1: string, type2: string): boolean {
    const recipeType = this.getRecipeType(type1, type2);
    if (!recipeType) return false;
    return this.isRecipeUnlocked(recipeType);
  }

  private getRecipeType(type1: string, type2: string): RecipeType | null {
    const sorted = [type1, type2].sort();
    const key = `${sorted[0]}+${sorted[1]}`;

    if (key === 'seed+trouble') return 'trouble+seed';
    if (key === 'seed+seed') return 'seed+seed';
    if (key === 'trouble+trouble') return 'trouble+trouble';

    return null;
  }

  unlockRecipe(recipeType: RecipeType): void {
    this.state.unlockedRecipes.add(recipeType);
  }

  getUnlockedRecipes(): RecipeType[] {
    return Array.from(this.state.unlockedRecipes);
  }

  reset(): void {
    this.state = this.getInitialState();
  }
}

export const progressionSystem = new ProgressionSystem();
