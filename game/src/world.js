// The living world of Gobble Run. One job: spawn and move the obstacles,
// corn and the farmer, detect collisions, and run the farmer's chase /
// search / lunge mind — the part that makes the escape feel hunted.

import { FARMER, PLAYER, RUN, STAGES, SCORE } from './config.js';
import { pick, range } from './random.js';

export function createWorld(rng) {
  return {
    rng,
    distance: 0, // metres run
    speed: RUN.baseSpeed,
    score: 0,
    corn: 0,
    hides: 0,
    obstacles: [], // {kind, x, w, h, passed, ...kind state}
    pickups: [], // {kind:'corn', x, y, taken}
    spawnTimer: 0.9,
    stageIndex: 0,
    stageJustChanged: false,
    // The farmer: gap px behind the turkey, state machine, timers.
    farmer: {
      gap: FARMER.startGap,
      state: 'chase', // chase | search | lunge
      searchTimer: 0,
      warned: false,
    },
  };
}

function stageOf(distance) {
  return distance >= RUN.stageTwoAt ? 1 : 0;
}

function spawnObstacle(world, kind) {
  const x = 1000;
  switch (kind) {
    case 'fence':
      world.obstacles.push({ kind, x, w: 56, h: 52, passed: false });
      break;
    case 'hay':
      world.obstacles.push({ kind, x, w: 84, h: 62, passed: false, hideSpot: true });
      break;
    case 'puddle':
      world.obstacles.push({ kind, x, w: 110, h: 12, passed: false, slow: true });
      break;
    case 'oven':
      world.obstacles.push({
        kind,
        x,
        w: 92,
        h: 96,
        passed: false,
        flameTimer: 1.2,
        flameOn: false,
        flameTime: 0,
      });
      break;
    case 'knife':
      world.obstacles.push({
        kind,
        x: 500 + world.rng() * 380,
        w: 26,
        h: 46,
        passed: false,
        fall: 0,
        falling: false,
        warnTimer: 0.55,
      });
      break;
    case 'pot':
      world.obstacles.push({ kind, x, w: 70, h: 34, passed: false });
      break;
    case 'corn':
      world.pickups.push({ kind: 'corn', x, y: 395, taken: false });
      break;
    case 'cornRow':
      for (let i = 0; i < 3; i++) {
        world.pickups.push({ kind: 'corn', x: x + i * 54, y: 395, taken: false });
      }
      break;
    default:
      break;
  }
}

function spawnTick(world, dt) {
  world.spawnTimer -= dt;
  if (world.spawnTimer > 0) return;
  const stage = STAGES[world.stageIndex];
  const kind = pick(world.rng, stage.kinds);
  spawnObstacle(world, kind);
  world.spawnTimer = range(world.rng, stage.spawnGap[0], stage.spawnGap[1]);
}

// The turkey's hit box, shrunk a little so near-misses feel fair.
export function turkeyBox(turkey) {
  const h = turkey.ducking ? PLAYER.duckHeight : PLAYER.height;
  return {
    x: turkey.x - 22,
    y: turkey.y - h + 6,
    w: 46,
    h: h - 6,
  };
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function updateWorld(world, turkey, dt, events) {
  const prevStage = world.stageIndex;
  world.stageIndex = stageOf(world.distance);
  if (world.stageIndex !== prevStage) {
    world.stageJustChanged = true;
    world.score += SCORE.stageClear;
    events.push({ type: 'stage', stage: world.stageIndex });
  }

  world.speed = Math.min(RUN.maxSpeed, RUN.baseSpeed + world.distance * RUN.speedPerMetre);
  const move = world.speed * dt;
  world.distance += (move / 26) * 0.9; // ~26 px per metre
  world.score += (move / 26) * 0.9 * SCORE.perMetre;

  spawnTick(world, dt);

  const box = turkeyBox(turkey);

  // --- obstacles ------------------------------------------------------
  for (const ob of world.obstacles) {
    ob.x -= move;
    if (ob.kind === 'oven') {
      ob.flameTimer -= dt;
      if (ob.flameTimer <= 0) {
        ob.flameOn = !ob.flameOn;
        ob.flameTime = 0;
        ob.flameTimer = ob.flameOn ? 0.85 : 1.5;
        if (ob.flameOn) events.push({ type: 'flame', x: ob.x });
      }
      if (ob.flameOn) ob.flameTime += dt;
    }
    if (ob.kind === 'knife') {
      if (!ob.falling) {
        ob.warnTimer -= dt;
        if (ob.warnTimer <= 0) ob.falling = true;
      } else if (ob.fall < 1) {
        ob.fall = Math.min(1, ob.fall + dt * 3.4);
      }
    }

    if (ob.passed) continue;
    if (ob.x + ob.w < turkey.x - 40) {
      ob.passed = true;
      continue;
    }
    if (turkey.invulnerable > 0) continue;

    let hit = false;
    if (ob.kind === 'fence' || ob.kind === 'pot') {
      // Jumpable: only a hit while the turkey is low.
      const obBox = { x: ob.x, y: 452 - ob.h, w: ob.w, h: ob.h };
      hit = overlap(box, obBox);
    } else if (ob.kind === 'puddle') {
      const obBox = { x: ob.x, y: 452 - 12, w: ob.w, h: 12 };
      if (overlap(box, obBox)) {
        world.speed = Math.max(150, world.speed - 60);
        hit = false; // a puddle slows, it does not hurt
      }
    } else if (ob.kind === 'hay') {
      // A hay bale is a wall unless the turkey ducks behind it to hide.
      if (turkey.hiding) {
        hit = false;
      } else {
        const obBox = { x: ob.x, y: 452 - ob.h, w: ob.w, h: ob.h };
        hit = overlap(box, obBox);
      }
    } else if (ob.kind === 'oven') {
      const obBox = { x: ob.x, y: 452 - ob.h, w: ob.w, h: ob.h };
      hit = overlap(box, obBox);
      if (!hit && ob.flameOn) {
        // The flame jet reaches above the oven — jump over the burst.
        // The hitbox is shorter than the drawn flame, so a good jump
        // clears it with room to spare.
        const flameBox = { x: ob.x + 8, y: 452 - ob.h - 70, w: ob.w - 16, h: 70 };
        hit = overlap(box, flameBox);
      }
    } else if (ob.kind === 'knife') {
      // The blade is only dangerous once it is nearly down — a turkey
      // running under it while it falls is safe, and a landed blade is
      // jumped like any low obstacle.
      if (ob.falling && ob.fall > 0.8) {
        const knifeY = 40 + ob.fall * (452 - 40 - ob.h);
        const obBox = { x: ob.x, y: knifeY, w: ob.w, h: ob.h };
        hit = overlap(box, obBox);
      }
    }

    if (hit) {
      ob.passed = true;
      events.push({ type: 'stumble', kind: ob.kind });
    }
  }
  world.obstacles = world.obstacles.filter((ob) => ob.x + ob.w > -80);

  // --- pickups ---------------------------------------------------------
  for (const pk of world.pickups) {
    pk.x -= move;
    if (pk.taken) continue;
    const pkBox = { x: pk.x - 16, y: pk.y - 20, w: 32, h: 40 };
    if (overlap(box, pkBox)) {
      pk.taken = true;
      world.corn += 1;
      world.score += SCORE.corn;
      world.farmer.gap = Math.min(FARMER.maxGap, world.farmer.gap + FARMER.cornGain);
      events.push({ type: 'corn', x: pk.x, y: pk.y });
    }
  }
  world.pickups = world.pickups.filter((pk) => pk.x > -60 && !pk.taken);

  // --- the farmer ------------------------------------------------------
  const farmer = world.farmer;
  if (farmer.state === 'search') {
    farmer.searchTimer -= dt;
    if (farmer.searchTimer <= 0) {
      farmer.state = 'chase';
      events.push({ type: 'farmerBack' });
    }
  } else {
    // The gap closes as the turkey runs; corn and dashes open it again.
    farmer.gap -= FARMER.chaseGain * dt * (world.speed / RUN.baseSpeed);
    if (farmer.gap <= FARMER.lungeRange && farmer.state === 'chase') {
      farmer.state = 'lunge';
      events.push({ type: 'farmerLunge' });
    }
    if (farmer.state === 'lunge') {
      farmer.gap -= 30 * dt; // the lunge closes fast — dash or be caught
      if (farmer.gap > FARMER.lungeRange + 20) farmer.state = 'chase';
    }
  }
  if (!farmer.warned && farmer.gap < 120) {
    farmer.warned = true;
    events.push({ type: 'farmerClose' });
  }
  if (farmer.gap > 170) farmer.warned = false;
  if (farmer.gap <= 0) {
    farmer.gap = 0;
    events.push({ type: 'caught' });
  }
}

export function applyStumble(world) {
  world.farmer.gap = Math.max(0, world.farmer.gap - FARMER.stumbleCost);
}

// A dash is a burst of speed that opens the gap at once — one well-timed
// dash is always enough to break out of the farmer's lunge.
export function dashBoost(world) {
  world.farmer.gap = Math.min(FARMER.maxGap, world.farmer.gap + 60);
}

export function hideTurkey(world, turkey) {
  // Hiding only works tucked behind a hay bale, and only once per bale.
  const nearHay = world.obstacles.find(
    (ob) => ob.kind === 'hay' && !ob.passed && Math.abs(ob.x + ob.w / 2 - turkey.x) < 90,
  );
  if (!nearHay || world.farmer.state === 'search') return false;
  nearHay.passed = true;
  world.hides += 1;
  world.score += SCORE.hide;
  world.farmer.gap = Math.min(FARMER.maxGap, world.farmer.gap + FARMER.hideGain);
  world.farmer.state = 'search';
  world.farmer.searchTimer = FARMER.searchTime;
  return true;
}

export function farmerDrawState(world) {
  return world.farmer.state;
}

export function farmerScreenX(world) {
  return PLAYER.x - 46 - world.farmer.gap;
}
