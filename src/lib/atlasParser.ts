export interface SpriteRegion {
  name: string;
  index: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotate?: boolean;
  offset?: { x: number; y: number };
  originalSize?: { width: number; height: number };
}

export interface AtlasData {
  imagePath: string;
  size: { width: number; height: number };
  repeat: string;
  regions: SpriteRegion[];
}

export function parseAtlas(content: string): AtlasData {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  if (lines.length < 3) {
    throw new Error('Invalid atlas file: too few lines');
  }

  const imagePath = lines[0];

  // Parse size line: "size:8192,4096"
  const sizeLine = lines[1];
  const sizeMatch = sizeLine.match(/size:\s*(\d+)\s*,\s*(\d+)/);
  if (!sizeMatch) {
    throw new Error(`Invalid size line: ${sizeLine}`);
  }
  const size = {
    width: parseInt(sizeMatch[1], 10),
    height: parseInt(sizeMatch[2], 10),
  };

  // Parse repeat line: "repeat:none"
  const repeatLine = lines[2];
  const repeatMatch = repeatLine.match(/repeat:\s*(\w+)/);
  const repeat = repeatMatch ? repeatMatch[1] : 'none';

  const regions: SpriteRegion[] = [];
  let currentRegion: Partial<SpriteRegion> | null = null;

  for (let i = 3; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a property line (contains a colon and starts with known property)
    if (line.startsWith('index:')) {
      if (currentRegion) {
        const indexMatch = line.match(/index:\s*(-?\d+)/);
        currentRegion.index = indexMatch ? parseInt(indexMatch[1], 10) : -1;
      }
    } else if (line.startsWith('bounds:')) {
      if (currentRegion) {
        const boundsMatch = line.match(/bounds:\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (boundsMatch) {
          currentRegion.bounds = {
            x: parseInt(boundsMatch[1], 10),
            y: parseInt(boundsMatch[2], 10),
            width: parseInt(boundsMatch[3], 10),
            height: parseInt(boundsMatch[4], 10),
          };
        }
      }
    } else if (line.startsWith('rotate:')) {
      if (currentRegion) {
        currentRegion.rotate = line.includes('true');
      }
    } else if (line.startsWith('offset:')) {
      if (currentRegion) {
        const offsetMatch = line.match(/offset:\s*(\d+)\s*,\s*(\d+)/);
        if (offsetMatch) {
          currentRegion.offset = {
            x: parseInt(offsetMatch[1], 10),
            y: parseInt(offsetMatch[2], 10),
          };
        }
      }
    } else if (line.startsWith('size:') && currentRegion) {
      // This is the original size for the region, not the atlas size
      const origSizeMatch = line.match(/size:\s*(\d+)\s*,\s*(\d+)/);
      if (origSizeMatch) {
        currentRegion.originalSize = {
          width: parseInt(origSizeMatch[1], 10),
          height: parseInt(origSizeMatch[2], 10),
        };
      }
    } else {
      // This is a sprite name - save previous region and start new one
      if (currentRegion && currentRegion.name && currentRegion.bounds) {
        regions.push(currentRegion as SpriteRegion);
      }
      currentRegion = {
        name: line,
        index: -1,
      };
    }
  }

  // Don't forget the last region
  if (currentRegion && currentRegion.name && currentRegion.bounds) {
    regions.push(currentRegion as SpriteRegion);
  }

  return {
    imagePath,
    size,
    repeat,
    regions,
  };
}

export function generateAtlas(
  originalAtlas: AtlasData,
  selectedRegions: SpriteRegion[],
  newImagePath: string
): string {
  const lines: string[] = [];

  lines.push(newImagePath);
  lines.push(`size:${originalAtlas.size.width},${originalAtlas.size.height}`);
  lines.push(`repeat:${originalAtlas.repeat}`);

  for (const region of selectedRegions) {
    lines.push(region.name);
    if (region.index !== -1) {
      lines.push(`index:${region.index}`);
    }
    lines.push(`bounds:${region.bounds.x},${region.bounds.y},${region.bounds.width},${region.bounds.height}`);
    if (region.rotate) {
      lines.push(`rotate:true`);
    }
    if (region.offset) {
      lines.push(`offset:${region.offset.x},${region.offset.y}`);
    }
    if (region.originalSize) {
      lines.push(`size:${region.originalSize.width},${region.originalSize.height}`);
    }
  }

  return lines.join('\n');
}

// Get unique sprite names (ignoring index for animated sprites)
export function getUniqueSpriteNames(regions: SpriteRegion[]): string[] {
  const names = new Set<string>();
  for (const region of regions) {
    names.add(region.name);
  }
  return Array.from(names).sort();
}

// Get all regions for a specific sprite name
export function getRegionsByName(regions: SpriteRegion[], name: string): SpriteRegion[] {
  return regions.filter(r => r.name === name).sort((a, b) => a.index - b.index);
}
