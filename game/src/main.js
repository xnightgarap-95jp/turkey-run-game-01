// Gobble Run: Turkey's Great Escape — bootstrap and game loop. One job:
// own the state machine (title → playing → paused → end), the turkey's
// movement, and the frame loop; everything else lives in its own module.

import { VIEW, PLAYER, RUN, SCORE, STAGES } from './config.js';
import { makeRng } from './random.js';
import { createInput } from './input.js';
import { createSound } from './audio.js';
import { createWorld, updateWorld, applyStumble, hideTurkey, dashBoost } from './world.js';
import { drawHud, drawWorld, drawTitle, drawEnd, drawPaused, pointIn, BUTTONS } from './render.js';
import { shotParams, applyShot } from './shots.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');

const sound = createSound();

const game = {
  state: 'title', // title | playing | paused | end
  time: 0,
  runPhase: 0,
  rng: makeRng((Date.now() % 2147483647) || 1),
  world: null,
  turkey: null,
  lives: RUN.lives,
  end: null,
  floaters: [],
  paused: false,
  muted: false,
  shotMode: false,
  input: null,
};

function freshTurkey() {
  return {
    x: PLAYER.x,
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

function newRun() {
  game.rng = makeRng((Date.now() % 2147483647) || 1);
  game.world = createWorld(game.rng);
  game.turkey = freshTurkey();
  game.lives = RUN.lives;
  game.end = null;
  game.floaters = [];
  game.runPhase = 0;
  game.state = 'playing';
  game.paused = false;
  sound.startHum();
  announce('The run begins! Jump the fences, grab the corn, outrun the farmer.');
}

function announce(text) {
  statusLine.textContent = text;
}

function addFloater(text, x, y, color) {
  game.floaters.push({ text, x, y, color, life: 1.1, maxLife: 1.1 });
}

function handleEvents(events) {
  for (const event of events) {
    if (event.type === 'corn') {
      sound.pickup();
      addFloater('+25', event.x, event.y - 40, '#ffd94d');
    } else if (event.type === 'stumble') {
      game.lives -= 1;
      game.turkey.invulnerable = PLAYER.invulnerableTime;
      applyStumble(game.world);
      sound.stumble();
      addFloater('OUCH!', game.turkey.x, game.turkey.y - 90, '#ff5252');
      announce(`Stumble! ${game.lives} ${game.lives === 1 ? 'life' : 'lives'} left. The farmer is closing in!`);
      if (game.lives <= 0) endRun('caught');
    } else if (event.type === 'caught') {
      endRun('caught');
    } else if (event.type === 'farmerClose') {
      sound.farmerClose();
      addFloater('HE IS CLOSE!', VIEW.width / 2, 150, '#ff5252');
    } else if (event.type === 'farmerLunge') {
      sound.farmerClose();
      announce('The farmer is lunging! Dash away!');
    } else if (event.type === 'farmerBack') {
      announce('The farmer lost you — for now. Keep running!');
    } else if (event.type === 'stage') {
      sound.stageClear();
      addFloater(STAGES[event.stage].name, VIEW.width / 2, 200, '#ffb347');
      announce(`${STAGES[event.stage].name}. ${STAGES[event.stage].hint}`);
    } else if (event.type === 'flame') {
      // The oven roars; no sound spam, the visual sells it.
    }
  }
}

function endRun(kind) {
  if (game.state === 'end') return;
  game.state = 'end';
  game.end = { kind };
  sound.stopHum();
  if (kind === 'escaped') {
    game.world.score += SCORE.escape;
    sound.escape();
    announce(`Escaped! Final score ${Math.floor(game.world.score)}. Press R to run again.`);
  } else {
    sound.caught();
    announce(`Caught! The farmer got you at ${Math.floor(game.world.distance)} metres. Press R to run again.`);
  }
}

function tryJump() {
  sound.unlock();
  if (game.state === 'title') {
    newRun();
    return;
  }
  if (game.state === 'end') return;
  if (game.paused) return;
  const turkey = game.turkey;
  if (turkey.onGround && !turkey.hiding) {
    turkey.vy = PLAYER.jumpVelocity;
    turkey.onGround = false;
    turkey.ducking = false;
    sound.jump();
  }
}

function tryHideStart() {
  if (game.state !== 'playing' || game.paused) return;
  const turkey = game.turkey;
  if (!turkey.onGround) return;
  turkey.ducking = true;
  if (hideTurkey(game.world, turkey)) {
    turkey.hiding = true;
    sound.hide();
    addFloater('HIDDEN! +40', turkey.x, turkey.y - 100, '#7bc96f');
    announce('Hidden in the hay! The farmer is searching…');
  }
}

function tryHideEnd() {
  const turkey = game.turkey;
  if (!turkey) return;
  turkey.ducking = false;
  turkey.hiding = false;
}

function tryDash() {
  if (game.state !== 'playing' || game.paused) return;
  const turkey = game.turkey;
  if (turkey.dashCooldown > 0 || turkey.dashing) return;
  turkey.dashing = true;
  turkey.dashTimer = PLAYER.dashTime;
  turkey.dashCooldown = PLAYER.dashCooldown;
  dashBoost(game.world);
  sound.dash();
}

function togglePause() {
  if (game.state !== 'playing') return;
  game.paused = !game.paused;
  if (game.paused) sound.stopHum();
  else sound.startHum();
}

function toggleMute() {
  game.muted = sound.toggleMute();
  if (!game.muted && game.state === 'playing' && !game.paused) sound.startHum();
}

function onTap(x, y) {
  sound.unlock();
  if (game.state === 'title') {
    if (pointIn(x, y, BUTTONS.start)) newRun();
    return;
  }
  if (game.state === 'end') {
    if (pointIn(x, y, BUTTONS.restart)) newRun();
    return;
  }
  if (game.state === 'playing') {
    if (pointIn(x, y, BUTTONS.mute)) {
      toggleMute();
      return;
    }
    if (pointIn(x, y, BUTTONS.pause)) {
      togglePause();
      return;
    }
    if (!game.paused) tryJump();
  }
}

game.input = createInput(canvas, {
  onJump: tryJump,
  onHideStart: tryHideStart,
  onHideEnd: tryHideEnd,
  onDash: tryDash,
  onRestart: () => {
    if (game.state === 'end' || game.state === 'title') newRun();
  },
  onPause: togglePause,
  onMute: toggleMute,
  onConfirm: () => {
    if (game.state === 'title' || game.state === 'end') newRun();
  },
  onTap,
});

function update(dt) {
  game.time += dt;
  if (game.state !== 'playing' || game.paused) return;

  const turkey = game.turkey;
  const world = game.world;

  // Turkey vertical physics.
  if (!turkey.onGround) {
    turkey.vy += PLAYER.gravity * dt;
    turkey.y += turkey.vy * dt;
    if (turkey.y >= VIEW.groundY) {
      turkey.y = VIEW.groundY;
      turkey.vy = 0;
      turkey.onGround = true;
    }
  }

  // Dash timers.
  if (turkey.dashing) {
    turkey.dashTimer -= dt;
    if (turkey.dashTimer <= 0) turkey.dashing = false;
  }
  if (turkey.dashCooldown > 0) turkey.dashCooldown -= dt;
  if (turkey.invulnerable > 0) turkey.invulnerable -= dt;

  // Hiding ends when the farmer gives up searching.
  if (turkey.hiding && world.farmer.state !== 'search') turkey.hiding = false;

  game.runPhase += dt * (world.speed / 60);

  const events = [];
  updateWorld(world, turkey, dt, events);
  handleEvents(events);

  // Floaters drift up and fade.
  for (const floater of game.floaters) {
    floater.y -= 34 * dt;
    floater.life -= dt;
  }
  game.floaters = game.floaters.filter((f) => f.life > 0);

  // Escape!
  if (world.distance >= RUN.escapeDistance) {
    endRun('escaped');
  }
}

function render() {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  if (game.state === 'title') {
    drawTitle(ctx, game);
  } else if (game.state === 'end') {
    drawWorld(ctx, game, game.time);
    drawEnd(ctx, game);
  } else {
    drawWorld(ctx, game, game.time);
    drawHud(ctx, game);
    if (game.paused) drawPaused(ctx, game);
    if (game.world.stageJustChanged) {
      game.world.stageJustChanged = false;
      addFloater(STAGES[game.world.stageIndex].name, VIEW.width / 2, 200, '#ffb347');
    }
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - frame.last) / 1000 || 0.016);
  frame.last = now;
  update(dt);
  render();
  if (!game.shotMode) requestAnimationFrame(frame);
}
frame.last = 0;

// --- boot ---------------------------------------------------------------
game.world = createWorld(game.rng);
game.turkey = freshTurkey();

const shot = shotParams();
if (shot && applyShot(game, shot.shot, shot.seed)) {
  game.shotMode = true;
  render(); // one deterministic frame; no loop, no clock dependence
} else {
  announce('Gobble Run — a turkey escape game. Press Space or click to start.');
  requestAnimationFrame(frame);
}
