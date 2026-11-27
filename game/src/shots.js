// Deterministic screenshot states for Gobble Run. One job: read ?shot=
// from the URL and pose the game in a fixed, seeded state — title, a
// farmyard chase, the kitchen, or the escaped end screen — so the
// screenshots are real renders of the game's own code, repeatable exactly.

import { makeRng } from './random.js';
import { createWorld, updateWorld } from './world.js';
import { RUN, VIEW } from './config.js';

export function shotParams() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return null;
  const seed = Number(params.get('seed') || '1') || 1;
  return { shot, seed };
}

// Advance the world a fixed number of steps with a fixed timestep, so the
// posed frame does not depend on wall-clock time or frame rate.
function simulate(game, steps) {
  const events = [];
  for (let i = 0; i < steps; i++) {
    updateWorld(game.world, game.turkey, 1 / 60, events);
    // Drain events without side effects that need sound or lives.
    events.length = 0;
    game.runPhase += 1 / 60;
  }
}

function freshTurkey() {
  return {
    x: 220,
    y: VIEW.groundY,
    vy: 0,
    onGround: true,
    ducking: false,
    hiding: false,
    dashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    invulnerable: 0,
  };
}

export function applyShot(game, shot, seed) {
  const rng = makeRng(seed);
  game.rng = rng;
  game.time = 0;

  if (shot === 'start') {
    game.state = 'title';
    game.world = createWorld(rng);
    game.turkey = freshTurkey();
    game.lives = RUN.lives;
    return true;
  }

  if (shot === 'farm') {
    game.state = 'playing';
    game.world = createWorld(rng);
    game.turkey = freshTurkey();
    game.lives = RUN.lives;
    // A lively mid-chase frame: fences and corn ahead, farmer closing in.
    simulate(game, 60 * 7);
    game.world.farmer.gap = 132;
    game.turkey.y = VIEW.groundY - 46; // caught mid-jump over a fence
    game.turkey.onGround = false;
    // Pose a fence ahead of the jump and a hay bale further on, so the
    // shot shows what the turkey is jumping and what it can hide behind.
    game.world.obstacles = game.world.obstacles.filter((ob) => ob.x < 260 || ob.x > 900);
    game.world.obstacles.push({ kind: 'fence', x: 430, w: 56, h: 52, passed: false });
    game.world.obstacles.push({ kind: 'hay', x: 660, w: 84, h: 62, passed: false, hideSpot: true });
    game.world.pickups = game.world.pickups.filter((pk) => pk.x < 240 || pk.x > 900);
    for (let i = 0; i < 3; i++) {
      game.world.pickups.push({ kind: 'corn', x: 300 + i * 54, y: 300, taken: false });
    }
    return true;
  }

  if (shot === 'kitchen') {
    game.state = 'playing';
    game.world = createWorld(rng);
    game.turkey = freshTurkey();
    game.lives = 2;
    // Drive the run into stage 2, then pose it among ovens and knives.
    game.world.distance = 640;
    simulate(game, 60 * 6);
    game.world.distance = Math.max(game.world.distance, 780);
    game.world.farmer.gap = 108;
    game.turkey.y = VIEW.groundY;
    game.turkey.onGround = true;
    // Pose the kitchen's own dangers: a flaming oven, a falling knife and
    // a steaming pot, so the shot shows stage 2 at its most dangerous.
    game.world.obstacles = game.world.obstacles.filter((ob) => ob.x < 260 || ob.x > 900);
    game.world.obstacles.push({ kind: 'pot', x: 380, w: 70, h: 34, passed: false });
    game.world.obstacles.push({
      kind: 'oven', x: 560, w: 92, h: 96, passed: false,
      flameTimer: 0.85, flameOn: true, flameTime: 0.4,
    });
    game.world.obstacles.push({
      kind: 'knife', x: 760, w: 26, h: 46, passed: false,
      fall: 0.7, falling: true, warnTimer: 0,
    });
    return true;
  }

  if (shot === 'end') {
    game.state = 'end';
    game.world = createWorld(rng);
    game.turkey = freshTurkey();
    game.lives = 2;
    game.world.distance = RUN.escapeDistance;
    game.world.score = 2840;
    game.world.corn = 14;
    game.world.hides = 3;
    game.end = { kind: 'escaped' };
    return true;
  }

  return false;
}
