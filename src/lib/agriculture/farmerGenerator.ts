// Farmer NPC generation with roles and behaviors

import type { Farm, Farmer, FarmerRole, Waypoint, ScheduleEntry } from './types';
import type { NPCTrouble } from '@/lib/gameEngine';

const FARMER_NAMES = [
  'Tom', 'Mary', 'Will', 'Sarah', 'Jack', 'Emma', 'George', 'Anne',
  'Henry', 'Rose', 'Peter', 'Kate', 'Sam', 'Lucy', 'Ben', 'Molly',
];

let farmerNameIndex = 0;

export function generateFarmersForFarm(farm: Farm, random: () => number): Farmer[] {
  const farmers: Farmer[] = [];
  const numFarmers = farm.zone.isVillage ? 2 : Math.floor(random() * 2) + 1;

  for (let i = 0; i < numFarmers; i++) {
    const role = selectFarmerRole(farm, i, random);
    const farmer = createFarmer(farm, role, random);
    farmers.push(farmer);
  }

  return farmers;
}

function selectFarmerRole(farm: Farm, index: number, random: () => number): FarmerRole {
  // First farmer is usually a planter
  if (index === 0) {
    return 'planter';
  }

  // Villages get specialized roles
  if (farm.zone.isVillage) {
    const hasMill = farm.buildings.some(b => b.type === 'mill');
    if (hasMill && random() > 0.5) {
      return 'miller';
    }
    return random() > 0.5 ? 'harvester' : 'planter';
  }

  // Homesteads get generalists or specialized based on biome
  if (farm.zone.biomeType === 'vegetable') {
    return random() > 0.6 ? 'irrigator' : 'generalist';
  }

  return random() > 0.5 ? 'harvester' : 'generalist';
}

function createFarmer(farm: Farm, role: FarmerRole, random: () => number): Farmer {
  const name = FARMER_NAMES[farmerNameIndex % FARMER_NAMES.length];
  farmerNameIndex++;

  const sprite = random() > 0.5 ? 'farmer man' : 'farmer woman';

  // Randomize spawn position based on role and random location
  let spawnX: number;
  let spawnY: number;

  if (random() > 0.5 && farm.fields.length > 0) {
    // Spawn near fields
    const randomField = farm.fields[Math.floor(random() * farm.fields.length)];
    spawnX = randomField.x + (random() > 0.5 ? 1 : 0);
    spawnY = randomField.y + (random() > 0.5 ? 1 : 0);
  } else if (random() > 0.4 && farm.buildings.length > 1) {
    // Spawn near a random building (not always farmhouse)
    const randomBuilding = farm.buildings[Math.floor(random() * farm.buildings.length)];
    spawnX = randomBuilding.x + Math.floor(random() * randomBuilding.width);
    spawnY = randomBuilding.y + Math.floor(random() * randomBuilding.height);
  } else {
    // Spawn at farmhouse or random location in farm zone
    const farmhouse = farm.buildings.find(b => b.type === 'farmhouse');
    if (farmhouse) {
      spawnX = farmhouse.x + (random() > 0.5 ? 0 : 1);
      spawnY = farmhouse.y + (random() > 0.5 ? 0 : 1);
    } else {
      spawnX = farm.zone.x + Math.floor(random() * Math.min(farm.zone.width, 5)) + 2;
      spawnY = farm.zone.y + Math.floor(random() * Math.min(farm.zone.height, 5)) + 2;
    }
  }

  // Randomize initial direction
  const directions: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];
  const direction = directions[Math.floor(random() * directions.length)];

  const waypoints = generateWaypoints(farm, role);
  const schedule = generateSchedule(role);
  const trouble = generateTrouble(farm, random);
  const dialogue = generateDialogue(role, farm.zone.biomeType, trouble, random);

  return {
    x: spawnX,
    y: spawnY,
    width: 1,
    height: 1,
    sprite,
    direction,
    isMoving: false,
    animFrame: 0,
    name,
    role,
    farmId: farm.id,
    waypoints,
    schedule,
    dialogue,
    trouble,
  };
}

function generateWaypoints(farm: Farm, role: FarmerRole): Waypoint[] {
  const waypoints: Waypoint[] = [];
  const farmhouse = farm.buildings.find(b => b.type === 'farmhouse');
  const barn = farm.buildings.find(b => b.type === 'barn');
  const mill = farm.buildings.find(b => b.type === 'mill');
  const well = farm.buildings.find(b => b.type === 'well');

  // All farmers start at farmhouse
  if (farmhouse) {
    waypoints.push({ x: farmhouse.x + 1, y: farmhouse.y + 1, action: 'home' });
  }

  switch (role) {
    case 'planter':
    case 'harvester':
      // Patrol field areas
      if (farm.fields.length > 0) {
        const field1 = farm.fields[0];
        const field2 = farm.fields[Math.floor(farm.fields.length / 2)];
        const field3 = farm.fields[farm.fields.length - 1];

        waypoints.push({ x: field1.x, y: field1.y, action: 'work' });
        waypoints.push({ x: field2.x, y: field2.y, action: 'work' });
        waypoints.push({ x: field3.x, y: field3.y, action: 'work' });
      }
      break;

    case 'miller':
      // Patrol between mill and storage
      if (mill) {
        waypoints.push({ x: mill.x + 1, y: mill.y + 1, action: 'mill' });
      }
      if (barn) {
        waypoints.push({ x: barn.x + 1, y: barn.y + 1, action: 'storage' });
      }
      break;

    case 'irrigator':
      // Patrol near well and fields
      if (well) {
        waypoints.push({ x: well.x, y: well.y, action: 'water' });
      }
      if (farm.fields.length > 0) {
        waypoints.push({ x: farm.fields[0].x, y: farm.fields[0].y, action: 'irrigate' });
      }
      break;

    case 'generalist':
      // Visit all major areas
      if (barn) waypoints.push({ x: barn.x + 1, y: barn.y + 1 });
      if (farm.fields.length > 0) {
        waypoints.push({ x: farm.fields[0].x, y: farm.fields[0].y });
      }
      if (well) waypoints.push({ x: well.x, y: well.y });
      break;
  }

  // Return to farmhouse
  if (farmhouse) {
    waypoints.push({ x: farmhouse.x + 1, y: farmhouse.y + 1, action: 'home' });
  }

  return waypoints;
}

function generateSchedule(role: FarmerRole): ScheduleEntry[] {
  const baseSchedule: ScheduleEntry[] = [
    { time: 'dawn', action: 'wake', target: 'farmhouse' },
    { time: 'morning', action: 'work', target: 'fields' },
    { time: 'noon', action: 'rest', target: 'farmhouse' },
    { time: 'afternoon', action: 'work', target: 'fields' },
    { time: 'dusk', action: 'return', target: 'farmhouse' },
    { time: 'night', action: 'sleep', target: 'farmhouse' },
  ];

  // Customize based on role
  switch (role) {
    case 'planter':
      baseSchedule[1] = { time: 'morning', action: 'plant', target: 'fields' };
      baseSchedule[3] = { time: 'afternoon', action: 'plant', target: 'fields' };
      break;

    case 'harvester':
      baseSchedule[1] = { time: 'morning', action: 'harvest', target: 'fields' };
      baseSchedule[3] = { time: 'afternoon', action: 'harvest', target: 'fields' };
      break;

    case 'miller':
      baseSchedule[1] = { time: 'morning', action: 'grind', target: 'mill' };
      baseSchedule[3] = { time: 'afternoon', action: 'grind', target: 'mill' };
      break;

    case 'irrigator':
      baseSchedule[1] = { time: 'morning', action: 'water', target: 'fields' };
      baseSchedule[3] = { time: 'afternoon', action: 'maintain', target: 'irrigation' };
      break;
  }

  return baseSchedule;
}

function generateTrouble(farm: Farm, random: () => number): NPCTrouble | undefined {
  // Determine trouble based on farm surroundings and biome
  const { biomeType, waterProximity } = farm.zone;

  // 60% chance of having a trouble, 40% just want better yields
  if (random() > 0.6) {
    return undefined; // No trouble, just want yield/speed improvements
  }

  // Water-based troubles
  if (waterProximity < 0.3 && biomeType !== 'orchard') {
    return {
      name: 'Dry Soil',
      description: 'The soil is too dry here. Crops need more water to thrive.',
      severity: 2,
      statModifiers: { hardiness: 2, efficiency: 1 },
      grantsFeature: 'Drought Resistant',
      color: '#d4a574',
    };
  }

  if (waterProximity > 0.7 && biomeType === 'vegetable') {
    return {
      name: 'Soggy Ground',
      description: 'Too much water makes the soil muddy. Crops need better drainage.',
      severity: 2,
      statModifiers: { hardiness: 2, speed: -1 },
      grantsFeature: 'Waterlogged Tolerant',
      color: '#7a9eb5',
    };
  }

  // Biome-specific troubles
  if (biomeType === 'grain') {
    const troubles = [
      {
        name: 'Poor Soil',
        description: 'The soil lacks nutrients. Grain yields are lower than expected.',
        severity: 2,
        statModifiers: { yield: 2, efficiency: 1 },
        grantsFeature: 'Hardy Roots',
        color: '#8b7355',
      },
      {
        name: 'Short Season',
        description: 'The growing season is too short. Grain needs to mature faster.',
        severity: 1,
        statModifiers: { speed: 2 },
        grantsFeature: 'Fast Growing',
        color: '#f4a460',
      },
    ];
    return troubles[Math.floor(random() * troubles.length)];
  }

  if (biomeType === 'orchard') {
    return {
      name: 'Rocky Soil',
      description: 'The hillside has rocky soil. Fruit trees struggle to take root.',
      severity: 2,
      statModifiers: { hardiness: 3, yield: 1 },
      grantsFeature: 'Deep Roots',
      color: '#a0826d',
    };
  }

  if (biomeType === 'vegetable') {
    return {
      name: 'Pest Pressure',
      description: 'Insects are damaging the vegetables. Crops need resilience.',
      severity: 2,
      statModifiers: { hardiness: 2, yield: 1 },
      grantsFeature: 'Pest Resistant',
      color: '#6b8e23',
    };
  }

  // Default mixed farm trouble
  return {
    name: 'Unpredictable Weather',
    description: 'The weather changes too quickly. Crops must adapt.',
    severity: 1,
    statModifiers: { hardiness: 1, speed: 1 },
    grantsFeature: 'Adaptable',
    color: '#b8b8b8',
  };
}

function generateDialogue(role: FarmerRole, biome: string, trouble?: NPCTrouble, random?: () => number): string[] {
  const rand = random || Math.random;

  const greetings = [
    'Good day to you!',
    'Fine weather we\'re having.',
    'Hard work, but honest work.',
    'Ah, a traveler!',
    'Welcome to our farm.',
    'Greetings, stranger.',
  ];

  const roleDialogue: Record<FarmerRole, string[][]> = {
    planter: [
      ['Been working these fields for years now.', 'The soil tells you what it needs, if you listen.'],
      ['Each seed has its own character.', 'Some take to the ground better than others.'],
      ['Planting season keeps me busy from dawn to dusk.', 'But there\'s satisfaction in the work.'],
    ],
    harvester: [
      ['The harvest determines everything.', 'A good yield means we eat well through winter.'],
      ['Been watching the crops carefully.', 'They\'re coming along, slowly but surely.'],
      ['There\'s an art to knowing when to harvest.', 'Too early or too late ruins everything.'],
    ],
    miller: [
      ['The mill\'s been in my family for generations.', 'Grain from all around comes through here.'],
      ['I can tell the quality of grain just by the sound it makes.', 'Each type has its own voice.'],
      ['Grinding grain is simple work, but important.', 'Without flour, there\'s no bread.'],
    ],
    irrigator: [
      ['Water is everything in farming.', 'Without it, nothing grows.'],
      ['I maintain the channels and keep the water flowing.', 'Simple work, but crucial.'],
      ['The crops drink deep when properly watered.', 'You can see the difference in days.'],
    ],
    generalist: [
      ['A bit of everything on this farm.', 'Keeps life interesting, never the same day twice.'],
      ['Farm work never truly ends.', 'Always something needing attention.'],
      ['Been farming all my life.', 'Wouldn\'t know what else to do.'],
    ],
  };

  const biomeDialogue: Record<string, string[]> = {
    grain: [
      'The grain fields go on for acres.',
      'Wheat and barley, mostly. Good reliable crops.',
      'These fields have fed the region for generations.',
    ],
    orchard: [
      'The fruit trees are beautiful in spring.',
      'Takes years for a tree to bear fruit, but worth the wait.',
      'The hillside gives the fruit a particular sweetness.',
    ],
    vegetable: [
      'We grow a variety here. Carrots, onions, potatoes.',
      'Root vegetables do well in this soil.',
      'Fresh vegetables fetch good prices at market.',
    ],
    mixed: [
      'We grow whatever seems to thrive.',
      'A little of this, a little of that.',
      'Variety keeps the soil healthy, they say.',
    ],
  };

  // Start with random greeting
  const dialogue: string[] = [greetings[Math.floor(rand() * greetings.length)]];

  // Add random role-specific dialogue
  const roleLines = roleDialogue[role][Math.floor(rand() * roleDialogue[role].length)];
  dialogue.push(...roleLines);

  // Add biome dialogue
  const biomeLines = biomeDialogue[biome] || biomeDialogue.mixed;
  dialogue.push(biomeLines[Math.floor(rand() * biomeLines.length)]);

  // Add trouble-specific dialogue (subtle)
  if (trouble) {
    const troubleIntros = [
      `The ${trouble.name.toLowerCase()} has been... challenging.`,
      `We manage, despite the ${trouble.name.toLowerCase()}.`,
      `${trouble.description}`,
      `It\'s not easy with the ${trouble.name.toLowerCase()} we have here.`,
    ];
    dialogue.push(troubleIntros[Math.floor(rand() * troubleIntros.length)]);

    // Only sometimes hint at wanting better seeds
    if (rand() > 0.5) {
      const hints = [
        'Old ways don\'t always work anymore.',
        'Sometimes I wonder if different seeds might fare better.',
        'The old varieties struggle these days.',
      ];
      dialogue.push(hints[Math.floor(rand() * hints.length)]);
    }
  } else {
    // No trouble - just farming talk, rarely mention yields
    const casualLines = [
      'Can\'t complain. The crops do well enough.',
      'We get by just fine.',
      'The land provides.',
      'Some years are better than others, but we manage.',
    ];

    if (rand() > 0.7) {
      // Only sometimes mention wanting improvement
      dialogue.push(casualLines[Math.floor(rand() * casualLines.length)]);
      if (rand() > 0.6) {
        dialogue.push('Though better yields never hurt anyone.');
      }
    } else {
      dialogue.push(casualLines[Math.floor(rand() * casualLines.length)]);
    }
  }

  // Shuffle middle dialogue for variety (keep greeting first)
  if (dialogue.length > 2) {
    const first = dialogue[0];
    const rest = dialogue.slice(1);
    for (let i = rest.length - 1; i > 0; i--) {
      if (rand() > 0.5) {
        const j = Math.floor(rand() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
    }
    return [first, ...rest];
  }

  return dialogue;
}
