# Agriculture System Design

**Date**: 2026-01-10
**Status**: Approved
**Target**: World Generator (with future World.js integration)

## Overview

Add complete agricultural generation to the world-generator page, including procedural farm placement, crop systems, farmer NPCs with behaviors, and simulation-ready features. The system will be modular to allow future integration with World.js for extending Hobbs Farm.

## Goals

1. **Procedural farm placement** - Automatically place farms in appropriate locations
2. **Farmer NPCs with behavior** - Generate farmers with roles, paths, and schedules
3. **Agriculture-based biomes** - Create distinct agricultural regions based on terrain
4. **Simulation-ready** - Include irrigation, crop rotation, farmer schedules, and interaction data

## Architecture

### Modular Structure

```
src/lib/agriculture/
├── types.ts                 # Shared TypeScript interfaces
├── cropSystem.ts           # Crop definitions from graph.md
├── biomeAnalyzer.ts        # Terrain analysis for farm placement
├── farmGenerator.ts        # Farm structure generation
├── farmerGenerator.ts      # Farmer NPC creation
└── villageGenerator.ts     # Village cluster logic
```

### Integration Points

- **Now**: World-generator page imports modules to enhance `generateRandomMap()`
- **Later**: World.js imports same modules to extend Hobbs Farm with procedural content
- **Shared**: Crop types, building types, tile definitions referenced by both systems

## Farm Distribution & Specialization

### Distribution Model: Mixed Approach

- **Village clusters** in good flat areas with shared facilities (mills, markets, storage)
- **Isolated homesteads** in remote locations with self-sufficient layouts
- **Specialization** based on local terrain and resource proximity

### Biome-Driven Specialization

**Valley/Flat + Water Nearby → Grain Farms**
- Crops: Wheat, Barley, Oats
- Buildings: Large field plots, grain silos, mill (if village)
- Farmers: Planter, Harvester, Miller

**Hills/Slopes → Orchards**
- Crops: Apples, Pears, Plums, Grapes
- Buildings: Orchard groves, fruit storage, press house
- Farmers: Orchardist, Presser

**Near Water → Vegetable/Irrigated Farms**
- Crops: Potatoes, Carrots, Onions, Cabbages
- Buildings: Irrigation channels, root cellar, greenhouse
- Farmers: Gardener, Irrigator

**Mixed Terrain → Diversified Homesteads**
- Crops: Mix of grains + vegetables + herbs
- Buildings: Mushroom shed, herb garden, small livestock pen
- Farmers: Generalist farmer, Herbalist

### Village Facilities

Village centers include communal buildings:
- Mill (processes wheat/barley/oats)
- Market square (farmers gather here)
- Grain storage (large silos)
- Tool workshop (repairs farming tools)
- Well/fountain (water source)

## Tiles & Sprites

### New Tiles Added

```typescript
// Crop stages
FIELD_PLANTED: 16,        // 'dusk plowed field c'
FIELD_GROWING: 17,        // 'young leafy vegetable' variants
FIELD_MATURE: 18,         // 'ripe leafy vegetable' variants

// Farm buildings
FARMHOUSE: 20,            // 'lit orange wall center'
BARN: 21,                 // 'lit fort wall center'
SILO: 22,                 // 'closed barrel'
STORAGE_SHED: 23,         // 'closed big chest'
MILL: 24,                 // Building + table combination
WELL: 25,                 // 'stone table'

// Field infrastructure
FENCE: 26,                // 'stone fence' variants
IRRIGATION: 27,           // 'bridge e w' or water variants
ORCHARD_TREE: 28,         // 'cactus nw ne sw se' (placeholder)
```

### Sprites Added to custom_sprites.atlas

- `farmer man` (2 animation frames)
- `farmer woman` (2 animation frames)
- `young leafy vegetable`, `young root vegetable`, `young vine vegetable`
- `ripe leafy vegetable`, `ripe root vegetable`, `ripe vine vegetable`
- `stone fence` (11 directional variants)

## Farmer NPCs & Behaviors

### Farmer Roles

**Planter**
- Behavior: Patrols empty field tiles, simulates planting
- Path: Walks along field rows systematically
- Schedule: Active during planting season

**Harvester**
- Behavior: Patrols mature crop tiles, simulates harvesting
- Path: Checks fields for ripe crops
- Schedule: Active when crops mature

**Miller** (villages only)
- Behavior: Stays near mill, paths to storage
- Path: Mill → Storage → Mill loop
- Schedule: Constant during daylight

**Irrigator** (water farms)
- Behavior: Patrols irrigation channels
- Path: Follows water/irrigation tiles
- Schedule: Morning routine

**Generalist** (homesteads)
- Behavior: Mixed patrol of all farm areas
- Path: House → Fields → Barn → repeat
- Schedule: Full day cycle

### Simulation Features

**Path System**
- Farmers follow waypoint paths generated with farm
- Paths connect: House → Fields → Storage → Animal areas → House
- Use waypoint navigation on DIRT/PATH tiles

**Daily Schedule Structure**
```typescript
{
  role: 'planter',
  schedule: [
    { time: 'dawn', action: 'leave_house', target: 'field_1' },
    { time: 'morning', action: 'work', target: 'field_1' },
    { time: 'noon', action: 'rest', target: 'house' },
    { time: 'afternoon', action: 'work', target: 'field_2' },
    { time: 'dusk', action: 'return', target: 'house' }
  ]
}
```

**Interaction Data**
- Dialogue about crops, weather, troubles
- Trade seeds/produce (World.js integration point)
- Quest-giver potential

## Data Structures

### Core Types

```typescript
export interface FarmZone {
  x: number;
  y: number;
  width: number;
  height: number;
  biomeType: 'grain' | 'orchard' | 'vegetable' | 'mixed';
  waterProximity: number;
  suitabilityScore: number;
}

export interface Farm {
  zone: FarmZone;
  buildings: Building[];
  fields: Field[];
  infrastructure: Infrastructure[];
  paths: Path[];
}

export interface Farmer extends NPC {
  role: 'planter' | 'harvester' | 'miller' | 'irrigator' | 'generalist';
  farmId: string;
  waypoints: Waypoint[];
  schedule: ScheduleEntry[];
}

export interface CropType {
  name: string;
  growthStages: number[];  // TILES for planted, growing, mature
  biome: 'grain' | 'orchard' | 'vegetable' | 'mixed';
  graphMdRef: string;      // Reference to graph.md
}
```

## Implementation Flow

### Phase 1: Terrain Analysis
1. After `generateRandomMap()` creates base terrain
2. `biomeAnalyzer` scans map for suitability zones:
   - Flat areas (10x10+ grass/dirt clusters)
   - Water proximity scores
   - Elevation patterns (hills vs valleys)
   - Existing obstacles
3. Returns `FarmZone[]` with biome types

### Phase 2: Village & Homestead Placement
1. `villageGenerator` selects 2-4 best zones for villages
2. Remaining zones become homesteads
3. Place shared facilities in villages
4. Generate farm layouts based on specialization

### Phase 3: Farm Generation
1. `farmGenerator.generateFarm()` creates structures
2. Places buildings (farmhouse, barn, storage)
3. Generates field plots with crop types
4. Adds infrastructure (wells, irrigation, paths)
5. Returns farm data with locations

### Phase 4: Farmer Generation
1. `farmerGenerator.createFarmers()` spawns 1-3 NPCs per farm
2. Assigns roles based on specialization
3. Generates waypoint paths
4. Creates schedule data
5. Returns farmer NPC objects for map.npcs

### Phase 5: Integration
1. Update `generateRandomMap()` to call agriculture system
2. Add tiles to `TILES` in gameEngine.ts
3. Add sprite mappings to `TILE_SPRITES`
4. Render farmers with animation

## Crop System (from graph.md)

### Crop Type Mapping

**Grain Farms**
- Wheat (graph.md: Agriculture/Wheat)
- Barley (graph.md: Agriculture/Barley)
- Oats (graph.md: Agriculture/Oats)

**Orchards**
- Apples (graph.md: Agriculture/Apples)
- Pears (graph.md: Agriculture/Pears)
- Plums (graph.md: Agriculture/Plums)
- Grapes (graph.md: Agriculture/Grapes)

**Vegetable Farms**
- Potatoes (graph.md: Agriculture/Potatoes)
- Carrots (graph.md: Agriculture/Carrots)
- Onions (graph.md: Agriculture/Onions)
- Cabbages (graph.md: Agriculture/Cabbages)

**Mixed/Specialty**
- Mushrooms (graph.md: Agriculture/Mushrooms)
- Herbs (graph.md: Agriculture/HerbGarden)
- Pipe-Weed (graph.md: Agriculture/PipeWeed)
- Hops (graph.md: Agriculture/Hops)

## Farm Layout Patterns

### Village Farm (8x12 tiles)
```
[Farmhouse][Barn]
[Field][Field][Field]
[Field][Field][Field]
[Path to shared mill/storage]
```

### Homestead (12x12 tiles)
```
[Silo][Farmhouse][Barn]
[Field][Field][Field][Tool Shed]
[Field][Field][Field][Well]
[Orchard/Livestock area]
```

## Future World.js Integration

```typescript
// Example integration in World.js
import { generateFarm } from '@/lib/agriculture/farmGenerator';
import { CROP_TYPES } from '@/lib/agriculture/cropSystem';

// Extend Hobbs Farm with procedural fields
const additionalFields = generateFarm(hobbsFarmZone, 'grain');
this.fields.push(...additionalFields.fields);
```

## Success Criteria

1. World generator creates 2-4 village clusters with shared facilities
2. 4-8 isolated homesteads in suitable locations
3. Farms specialize based on terrain (grain, orchard, vegetable, mixed)
4. 1-3 farmers per farm with roles and patrol paths
5. Fields show crop variety matching graph.md agriculture domain
6. Infrastructure (fences, irrigation, wells) placed appropriately
7. All new tiles render correctly with atlas sprites
8. System is modular and importable by World.js

## Next Steps

1. Create agriculture module files
2. Update gameEngine.ts with new tiles
3. Integrate into world-generator page
4. Test and verify generation
5. Document API for World.js integration
