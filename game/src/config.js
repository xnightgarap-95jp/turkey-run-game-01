// Gobble Run: Turkey's Great Escape — tuning, palette and stage data.
// One job: every number the rest of the game reads, in one place.

export const VIEW = { width: 960, height: 540, groundY: 452 };

export const PALETTE = {
  skyTop: '#f7b733',
  skyBottom: '#fc4a1a',
  kitchenTop: '#8e3b2f',
  kitchenBottom: '#3d1f1a',
  groundFarm: '#7a5230',
  groundFarmTop: '#a4713f',
  groundKitchen: '#5d3a2e',
  groundKitchenTop: '#8a5a44',
  hudPanel: 'rgba(46, 24, 10, 0.78)',
  hudText: '#ffe9b0',
  hudAccent: '#ffb347',
  turkeyBody: '#8b5a2b',
  turkeyBelly: '#c98d4b',
  turkeyFeather: '#6b4423',
  turkeyHead: '#d97b4f',
  turkeyWattle: '#c0392b',
  turkeyBeak: '#f39c12',
  farmerShirt: '#4a7c59',
  farmerOveralls: '#3b5998',
  farmerSkin: '#e8b88a',
  farmerHat: '#8b5a2b',
  corn: '#ffd94d',
  knife: '#dfe6ea',
  knifeHandle: '#5d4037',
  oven: '#4a4a52',
  flame: '#ff7b00',
};

export const PLAYER = {
  x: 220,
  width: 64,
  height: 62,
  jumpVelocity: -820,
  gravity: 1600,
  duckHeight: 38,
  dashSpeed: 340,
  dashTime: 0.28,
  dashCooldown: 1.1,
  invulnerableTime: 1.4,
};

export const FARMER = {
  width: 58,
  height: 96,
  // Gap is measured in pixels behind the turkey. 0 = caught.
  startGap: 210,
  maxGap: 320,
  chaseGain: 13, // px per second the gap closes while the turkey runs clean
  stumbleCost: 46, // px lost per stumble
  cornGain: 9, // px regained per corn cob
  hideGain: 55, // px regained by a successful hide
  searchTime: 1.6, // seconds the farmer stands searching while the turkey hides
  lungeRange: 90, // inside this gap the farmer lunges and the turkey must dash
};

export const RUN = {
  baseSpeed: 265,
  speedPerMetre: 0.16,
  maxSpeed: 520,
  escapeDistance: 1200, // metres: reach this and the turkey is free
  stageTwoAt: 600, // metres: the farmyard ends and the kitchen begins
  lives: 3,
  cornScore: 25,
  stageBonus: 500,
};

// Spawn pacing per stage: [minGapSeconds, maxGapSeconds] between obstacles.
export const STAGES = [
  {
    key: 'farmyard',
    name: 'STAGE 1 — THE FARMYARD',
    hint: 'Jump the fences, duck the hay, grab the corn!',
    spawnGap: [0.95, 1.55],
    kinds: ['fence', 'hay', 'puddle', 'corn', 'cornRow'],
  },
  {
    key: 'kitchen',
    name: 'STAGE 2 — THE KITCHEN',
    hint: 'The oven is lit and the knives are falling — run!',
    spawnGap: [0.8, 1.3],
    kinds: ['oven', 'knife', 'pot', 'corn', 'cornRow', 'hay'],
  },
];

export const SCORE = {
  perMetre: 1,
  corn: 25,
  hide: 40,
  stageClear: 500,
  escape: 1000,
};
