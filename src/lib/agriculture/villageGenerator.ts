// Village cluster generation and farm site selection

import type { FarmZone } from './types';

export function selectVillageAndHomesteadSites(zones: FarmZone[], random: () => number): {
  villages: FarmZone[];
  homesteads: FarmZone[];
} {
  if (zones.length === 0) {
    return { villages: [], homesteads: [] };
  }

  // Select top 2-4 zones as village sites
  const numVillages = Math.min(zones.length, Math.floor(random() * 3) + 2);
  const villages = zones.slice(0, numVillages).map(zone => ({
    ...zone,
    isVillage: true,
  }));

  // Remaining zones become homestead sites
  const homesteads = zones.slice(numVillages);

  return { villages, homesteads };
}

export function getVillageFacilities(random: () => number): {
  mill: boolean;
  market: boolean;
  storage: boolean;
  workshop: boolean;
  well: boolean;
} {
  // Villages always have a well and storage
  // 80% chance of mill, 60% chance of market, 40% chance of workshop
  return {
    mill: random() > 0.2,
    market: random() > 0.4,
    storage: true,
    workshop: random() > 0.6,
    well: true,
  };
}
