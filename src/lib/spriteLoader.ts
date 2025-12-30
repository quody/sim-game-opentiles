import { parseAtlas, getRegionsByName, getUniqueSpriteNames } from './atlasParser';
import type { AtlasData, SpriteRegion } from './atlasParser';

export interface SpriteData {
  name: string;
  frames: SpriteRegion[];
  isAnimated: boolean;
}

export interface LoadedAtlas {
  data: AtlasData;
  imagePath: string;
  sprites: Map<string, SpriteData>;
  spriteNames: string[];
}

export async function loadAtlas(atlasPath: string, imagePath: string): Promise<LoadedAtlas> {
  const response = await fetch(atlasPath);
  const content = await response.text();
  const data = parseAtlas(content);

  const spriteNames = getUniqueSpriteNames(data.regions);
  const sprites = new Map<string, SpriteData>();

  for (const name of spriteNames) {
    const frames = getRegionsByName(data.regions, name);
    sprites.set(name, {
      name,
      frames,
      isAnimated: frames.length > 1,
    });
  }

  return {
    data,
    imagePath,
    sprites,
    spriteNames,
  };
}

export function getSprite(atlas: LoadedAtlas, name: string): SpriteData | undefined {
  return atlas.sprites.get(name);
}

export function getSpriteFrame(sprite: SpriteData, frameIndex: number = 0): SpriteRegion {
  return sprite.frames[frameIndex % sprite.frames.length];
}
