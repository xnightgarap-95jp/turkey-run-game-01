// All of Gobble Run's art, drawn fresh with canvas paths — no images, no
// sprites from anywhere else. One job: draw the turkey, the farmer, the
// obstacles and the pickups, plus the farmyard and kitchen scenery behind
// them, in one coherent autumn palette.

import { PALETTE } from './config.js';

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------- turkey
// The hero: a plump brown turkey mid-stride, tail fanned, wattle bobbing.
// (x, y) is the ground point under its feet; runPhase drives the legs.
export function drawTurkey(ctx, x, y, runPhase, opts = {}) {
  const { ducking = false, dashing = false, hidden = false, hurt = false } = opts;
  const bob = Math.sin(runPhase * 2) * (ducking ? 1 : 3);
  const lean = dashing ? 0.22 : 0.08;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(lean);
  if (hurt) ctx.globalAlpha = 0.45 + 0.3 * Math.sin(runPhase * 14);

  // Fanned tail feathers behind the body.
  ctx.fillStyle = PALETTE.turkeyFeather;
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.translate(-22, -26);
    ctx.rotate(i * 0.32);
    ctx.beginPath();
    ctx.ellipse(0, -20, 7, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a4713f';
    ctx.beginPath();
    ctx.ellipse(0, -38, 3.5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyFeather;
    ctx.restore();
  }

  // Legs: two orange sticks alternating with the run cycle.
  const legSwing = Math.sin(runPhase * 2) * 10;
  ctx.strokeStyle = '#e67e22';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, -12);
  ctx.lineTo(-4 + legSwing, 0);
  ctx.moveTo(6, -12);
  ctx.lineTo(6 - legSwing, 0);
  ctx.stroke();

  // Body: a plump egg shape, belly lighter.
  ctx.fillStyle = PALETTE.turkeyBody;
  ellipse(ctx, 0, -30, 26, 24);
  ctx.fillStyle = PALETTE.turkeyBelly;
  ellipse(ctx, 6, -24, 17, 15);

  // Wing, tucked and flapping a little.
  ctx.fillStyle = PALETTE.turkeyFeather;
  ctx.save();
  ctx.translate(-2, -30);
  ctx.rotate(-0.5 + Math.sin(runPhase * 2) * 0.12);
  ctx.beginPath();
  ctx.ellipse(-8, 0, 15, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (!ducking) {
    // Neck and head, held high and proud.
    ctx.strokeStyle = PALETTE.turkeyHead;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(16, -48);
    ctx.quadraticCurveTo(24, -62, 22, -70);
    ctx.stroke();
    ctx.fillStyle = PALETTE.turkeyHead;
    circle(ctx, 22, -72, 10);
    // Beak.
    ctx.fillStyle = PALETTE.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(30, -74);
    ctx.lineTo(42, -70);
    ctx.lineTo(30, -67);
    ctx.closePath();
    ctx.fill();
    // Wattle, bobbing red.
    ctx.fillStyle = PALETTE.turkeyWattle;
    ctx.beginPath();
    ctx.ellipse(30, -63, 3.5, 6 + Math.sin(runPhase * 2) * 1.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Eye, wide and worried.
    ctx.fillStyle = '#fff';
    circle(ctx, 25, -75, 3.4);
    ctx.fillStyle = '#1a1a1a';
    circle(ctx, 26, -75, 1.7);
  } else {
    // Ducked: head tucked low, body squashed — the hiding pose.
    ctx.fillStyle = PALETTE.turkeyHead;
    circle(ctx, 20, -44, 9);
    ctx.fillStyle = PALETTE.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(27, -46);
    ctx.lineTo(37, -43);
    ctx.lineTo(27, -40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    circle(ctx, 23, -47, 3);
    ctx.fillStyle = '#1a1a1a';
    circle(ctx, 24, -47, 1.5);
  }
  ctx.restore();

  if (hidden) {
    // A hay-coloured "shhh" puff while the turkey hides.
    ctx.fillStyle = 'rgba(255, 233, 176, 0.95)';
    ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('shhh…', x + 10, y - 96);
  }
}

// ---------------------------------------------------------------- farmer
// The pursuer: a big farmer in overalls and a straw hat, arms pumping.
// state: 'chase' | 'search' | 'lunge' | 'caught'
export function drawFarmer(ctx, x, y, runPhase, state) {
  const bob = Math.abs(Math.sin(runPhase * 2)) * 3;
  const lean = state === 'lunge' ? 0.35 : 0.14;
  ctx.save();
  ctx.translate(x, y - bob);
  ctx.rotate(lean);

  // Legs, pumping hard.
  const swing = state === 'search' ? 0 : Math.sin(runPhase * 2) * 14;
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -44);
  ctx.lineTo(-6 + swing, 0);
  ctx.moveTo(6, -44);
  ctx.lineTo(6 - swing, 0);
  ctx.stroke();

  // Overalls and shirt.
  ctx.fillStyle = PALETTE.farmerOveralls;
  ctx.fillRect(-14, -78, 28, 38);
  ctx.fillStyle = PALETTE.farmerShirt;
  ctx.fillRect(-16, -84, 32, 12);
  // Arms: pumping forward when chasing, hands on hips when searching.
  ctx.strokeStyle = PALETTE.farmerShirt;
  ctx.lineWidth = 8;
  ctx.beginPath();
  if (state === 'search') {
    ctx.moveTo(-14, -80);
    ctx.lineTo(-24, -58);
    ctx.moveTo(14, -80);
    ctx.lineTo(24, -58);
  } else {
    ctx.moveTo(-14, -80);
    ctx.lineTo(-26 - swing * 0.4, -62);
    ctx.moveTo(14, -80);
    ctx.lineTo(28 + swing * 0.4, -64);
  }
  ctx.stroke();

  // Head, red-faced and determined.
  ctx.fillStyle = PALETTE.farmerSkin;
  circle(ctx, 0, -94, 13);
  // Moustache.
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(-9, -90, 18, 4);
  // Angry eyes.
  ctx.fillStyle = '#1a1a1a';
  circle(ctx, -5, -97, 1.8);
  circle(ctx, 5, -97, 1.8);
  // Straw hat.
  ctx.fillStyle = PALETTE.farmerHat;
  ctx.beginPath();
  ctx.ellipse(0, -104, 20, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-11, -116, 22, 12);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(-11, -106, 22, 3);

  ctx.restore();

  if (state === 'search') {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 34, y - 138, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', x + 34, y - 131);
  }
}

// ------------------------------------------------------------- obstacles
export function drawFence(ctx, x, y, w) {
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(x, y - 46, 6, 46);
  ctx.fillRect(x + w - 6, y - 46, 6, 46);
  ctx.fillStyle = '#a4713f';
  ctx.fillRect(x - 4, y - 40, w + 8, 8);
  ctx.fillRect(x - 4, y - 22, w + 8, 8);
  ctx.fillStyle = '#6b4423';
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 46);
  ctx.lineTo(x + 3, y - 54);
  ctx.lineTo(x + 8, y - 46);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w - 8, y - 46);
  ctx.lineTo(x + w - 3, y - 54);
  ctx.lineTo(x + w + 2, y - 46);
  ctx.closePath();
  ctx.fill();
}

export function drawHayBale(ctx, x, y, w, h) {
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y - h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b07f2a';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y - h / 2, (w / 2) * (0.7 - Math.abs(i) * 0.12), (h / 2) * (0.7 - Math.abs(i) * 0.12), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 8, y - h + 6);
  ctx.lineTo(x + w - 8, y - 6);
  ctx.stroke();
}

export function drawPuddle(ctx, x, y, w) {
  ctx.fillStyle = '#7a5a3a';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y - 4, w / 2, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2 - 8, y - 6, w / 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCorn(ctx, x, y, bobPhase) {
  const bob = Math.sin(bobPhase) * 4;
  ctx.save();
  ctx.translate(x, y - 26 + bob);
  ctx.rotate(0.5);
  // Husk leaves.
  ctx.fillStyle = '#4a7c59';
  ctx.beginPath();
  ctx.moveTo(-8, 14);
  ctx.quadraticCurveTo(-18, 0, -10, -16);
  ctx.quadraticCurveTo(-4, -2, -2, 10);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, 14);
  ctx.quadraticCurveTo(18, 0, 10, -16);
  ctx.quadraticCurveTo(4, -2, 2, 10);
  ctx.closePath();
  ctx.fill();
  // The cob.
  ctx.fillStyle = PALETTE.corn;
  ctx.beginPath();
  ctx.ellipse(0, -2, 9, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8b800';
  for (let row = -1; row <= 1; row++) {
    for (let col = -1; col <= 1; col++) {
      circle(ctx, col * 5, row * 9 - 2, 1.6);
    }
  }
  ctx.restore();
}

export function drawOven(ctx, x, y, w, h, flameOn) {
  ctx.fillStyle = PALETTE.oven;
  ctx.fillRect(x, y - h, w, h);
  ctx.fillStyle = '#2f2f36';
  ctx.fillRect(x + 8, y - h + 10, w - 16, h - 26);
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 8, y - h + 10, w - 16, h - 26);
  // Hot coils glowing inside.
  ctx.strokeStyle = flameOn ? '#ff5e00' : '#7a2e00';
  ctx.lineWidth = 5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 16, y - h + 26 + i * 14);
    ctx.lineTo(x + w - 16, y - h + 26 + i * 14);
    ctx.stroke();
  }
  // Knobs and a little "HOT!" sign.
  ctx.fillStyle = '#dfe6ea';
  circle(ctx, x + w / 2 - 12, y - h + 4, 3);
  circle(ctx, x + w / 2 + 12, y - h + 4, 3);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOT!', x + w / 2, y - h - 8);
}

export function drawFlame(ctx, x, y, height, phase) {
  ctx.fillStyle = PALETTE.flame;
  ctx.beginPath();
  ctx.moveTo(x - 14, y);
  ctx.quadraticCurveTo(x - 18, y - height * 0.6, x - 4, y - height);
  ctx.quadraticCurveTo(x + 2, y - height * 0.5, x + 8, y - height * 0.85);
  ctx.quadraticCurveTo(x + 16, y - height * 0.4, x + 14, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.moveTo(x - 7, y);
  ctx.quadraticCurveTo(x - 8, y - height * 0.45, x, y - height * 0.62);
  ctx.quadraticCurveTo(x + 8, y - height * 0.4, x + 7, y);
  ctx.closePath();
  ctx.fill();
  void phase;
}

export function drawKnife(ctx, x, y, fall, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.35 + 0.65 * (1 - fall);
  ctx.fillStyle = PALETTE.knife;
  ctx.beginPath();
  ctx.moveTo(-4, -34);
  ctx.lineTo(10, -30);
  ctx.lineTo(12, 6);
  ctx.lineTo(-4, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.knifeHandle;
  ctx.fillRect(-6, 8, 20, 10);
  ctx.fillStyle = '#8a5a2b';
  circle(ctx, 10, 13, 2);
  ctx.restore();
}

export function drawPot(ctx, x, y, w) {
  ctx.fillStyle = '#3d3d46';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y - 16, w / 2, 16, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x, y - 18, w, 18);
  ctx.fillStyle = '#565664';
  ctx.fillRect(x - 6, y - 20, 8, 6);
  ctx.fillRect(x + w - 2, y - 20, 8, 6);
  // Steam curls.
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 10, y - 34);
  ctx.quadraticCurveTo(x + w / 2 - 16, y - 44, x + w / 2 - 8, y - 52);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w / 2 + 12, y - 34);
  ctx.quadraticCurveTo(x + w / 2 + 18, y - 44, x + w / 2 + 10, y - 52);
  ctx.stroke();
}

// -------------------------------------------------------------- scenery
export function drawFarmyardBackdrop(ctx, width, height, groundY, scroll, time) {
  // Amber sunset sky.
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, groundY);
  // Low sun.
  ctx.fillStyle = 'rgba(255, 240, 180, 0.9)';
  circle(ctx, width - 140, 84, 44);
  ctx.fillStyle = 'rgba(255, 240, 180, 0.35)';
  circle(ctx, width - 140, 84, 62);
  // Drifting clouds.
  ctx.fillStyle = 'rgba(255, 235, 200, 0.85)';
  for (let i = 0; i < 3; i++) {
    const cx = ((i * 340 - scroll * 0.12 + time * 6) % (width + 240) + width + 240) % (width + 240) - 120;
    ellipse(ctx, cx, 66 + i * 26, 52, 15);
    ellipse(ctx, cx + 34, 74 + i * 26, 38, 12);
  }
  // Distant hills and a red barn.
  ctx.fillStyle = '#9c6b3f';
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.quadraticCurveTo(width * 0.3, groundY - 90, width * 0.6, groundY);
  ctx.quadraticCurveTo(width * 0.85, groundY - 70, width, groundY - 20);
  ctx.closePath();
  ctx.fill();
  const barnX = width - 260 - ((scroll * 0.25) % (width + 520));
  ctx.fillStyle = '#a93226';
  ctx.fillRect(barnX, groundY - 118, 150, 118);
  ctx.fillStyle = '#7b241c';
  ctx.beginPath();
  ctx.moveTo(barnX - 10, groundY - 118);
  ctx.lineTo(barnX + 75, groundY - 168);
  ctx.lineTo(barnX + 160, groundY - 118);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f5e6c8';
  ctx.lineWidth = 4;
  ctx.strokeRect(barnX + 55, groundY - 70, 40, 70);
  ctx.beginPath();
  ctx.moveTo(barnX + 55, groundY - 70);
  ctx.lineTo(barnX + 95, groundY);
  ctx.moveTo(barnX + 95, groundY - 70);
  ctx.lineTo(barnX + 55, groundY);
  ctx.stroke();
  // Fence line along the back.
  ctx.fillStyle = '#6b4423';
  for (let i = 0; i < 12; i++) {
    const fx = ((i * 90 - scroll * 0.6) % (width + 90) + width + 90) % (width + 90) - 45;
    ctx.fillRect(fx, groundY - 34, 5, 34);
  }
  ctx.fillRect(0, groundY - 30, width, 5);
  ctx.fillRect(0, groundY - 16, width, 5);
  // Ground.
  const gnd = ctx.createLinearGradient(0, groundY, 0, height);
  gnd.addColorStop(0, PALETTE.groundFarmTop);
  gnd.addColorStop(1, PALETTE.groundFarm);
  ctx.fillStyle = gnd;
  ctx.fillRect(0, groundY, width, height - groundY);
  // Scattered leaves.
  ctx.fillStyle = '#c0392b';
  for (let i = 0; i < 8; i++) {
    const lx = ((i * 137 - scroll * 1.0) % (width + 60) + width + 60) % (width + 60) - 30;
    ellipse(ctx, lx, groundY + 24 + ((i * 37) % 46), 7, 3.5);
  }
}

export function drawKitchenBackdrop(ctx, width, height, groundY, scroll, time) {
  // Warm dark kitchen wall.
  const wall = ctx.createLinearGradient(0, 0, 0, groundY);
  wall.addColorStop(0, PALETTE.kitchenTop);
  wall.addColorStop(1, PALETTE.kitchenBottom);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, groundY);
  // Chequered tile band.
  const tile = 46;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < Math.ceil(width / tile) + 1; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? 'rgba(255, 220, 180, 0.16)' : 'rgba(120, 50, 30, 0.25)';
      ctx.fillRect(col * tile, 150 + row * tile, tile, tile);
    }
  }
  // Hanging pots and pans swaying gently, kept left of the window.
  for (let i = 0; i < 4; i++) {
    const hx = 260 + i * 200;
    const sway = Math.sin(time * 1.2 + i) * 4;
    ctx.strokeStyle = '#2b1a12';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hx, 0);
    ctx.lineTo(hx + sway, 58);
    ctx.stroke();
    ctx.fillStyle = i % 2 === 0 ? '#3d3d46' : '#7a5a3a';
    ctx.beginPath();
    ctx.arc(hx + sway, 78, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.arc(hx + sway - 8, 70, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  // Window with the farm outside — the way out — on the left, clear of the HUD buttons.
  ctx.fillStyle = '#f7b733';
  ctx.fillRect(40, 40, 140, 96);
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(40, 118, 140, 18);
  ctx.strokeStyle = '#3d1f1a';
  ctx.lineWidth = 5;
  ctx.strokeRect(40, 40, 140, 96);
  ctx.beginPath();
  ctx.moveTo(110, 40);
  ctx.lineTo(110, 136);
  ctx.moveTo(40, 88);
  ctx.lineTo(180, 88);
  ctx.stroke();
  ctx.fillStyle = '#3d1f1a';
  ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FREEDOM →', 110, 160);
  // Tiled floor.
  ctx.fillStyle = PALETTE.groundKitchenTop;
  ctx.fillRect(0, groundY, width, height - groundY);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < 10; i++) {
    const tx = ((i * 110 - scroll * 1.0) % (width + 110) + width + 110) % (width + 110) - 55;
    ctx.fillRect(tx, groundY, 3, height - groundY);
  }
  void scroll;
}
