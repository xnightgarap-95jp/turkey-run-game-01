// Everything Gobble Run paints on the canvas. One job: turn the game state
// into a readable picture — the scrolling scenery, the HUD, the title and
// end screens — with big outlined text that stays legible when shrunk.

import { PALETTE, VIEW, RUN } from './config.js';
import {
  drawTurkey,
  drawFarmer,
  drawFence,
  drawHayBale,
  drawPuddle,
  drawCorn,
  drawOven,
  drawFlame,
  drawKnife,
  drawPot,
  drawFarmyardBackdrop,
  drawKitchenBackdrop,
} from './art.js';
import { farmerDrawState, farmerScreenX } from './world.js';

export const BUTTONS = {
  start: { x: 330, y: 396, w: 300, h: 62, label: 'START THE ESCAPE' },
  restart: { x: 330, y: 420, w: 300, h: 62, label: 'RUN AGAIN  (R)' },
  mute: { x: 896, y: 12, w: 52, h: 34, label: '♪' },
  pause: { x: 836, y: 12, w: 52, h: 34, label: 'II' },
};

function outlinedText(ctx, text, x, y, font, fill, align = 'center') {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(46, 24, 10, 0.9)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function drawButton(ctx, button, hover) {
  ctx.fillStyle = hover ? '#ffb347' : '#e67e22';
  ctx.strokeStyle = '#5d2f0e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(button.x, button.y, button.w, button.h, 12);
  ctx.fill();
  ctx.stroke();
  outlinedText(
    ctx,
    button.label,
    button.x + button.w / 2,
    button.y + button.h / 2 + 8,
    'bold 22px "Trebuchet MS", Verdana, sans-serif',
    '#fff8e6',
  );
}

export function drawHud(ctx, game) {
  const { world, lives, paused, muted, input } = game;
  // Top panel.
  ctx.fillStyle = PALETTE.hudPanel;
  ctx.beginPath();
  ctx.roundRect(10, 10, 940, 56, 10);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillStyle = PALETTE.hudText;
  ctx.fillText(`SCORE  ${Math.floor(world.score)}`, 24, 34);
  ctx.fillText(`DIST  ${Math.floor(world.distance)} m / ${RUN.escapeDistance} m`, 24, 58);
  ctx.fillText(`CORN  🌽 ${world.corn}`, 300, 34);
  ctx.fillText(world.stageIndex === 0 ? 'FARMYARD' : 'KITCHEN', 300, 58);

  // Lives as hearts, right of the farmer meter.
  ctx.font = '24px "Trebuchet MS", Verdana, sans-serif';
  let hearts = '';
  for (let i = 0; i < RUN.lives; i++) hearts += i < lives ? '♥ ' : '♡ ';
  ctx.fillStyle = '#ff6b6b';
  ctx.fillText(hearts, 725, 36);

  // Farmer gap meter: how close the farmer is behind the turkey.
  const meterX = 470;
  const meterY = 50;
  const meterW = 240;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(meterX, meterY - 8, meterW, 12);
  const gapFrac = world.farmer.gap / 320;
  ctx.fillStyle = gapFrac > 0.5 ? '#7bc96f' : gapFrac > 0.25 ? '#ffb347' : '#ff5252';
  ctx.fillRect(meterX, meterY - 8, meterW * gapFrac, 12);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('FARMER', meterX, meterY - 12);
  ctx.fillText('TURKEY', meterX + meterW - 52, meterY - 12);

  // Mute + pause buttons (clickable).
  const hoverMute = pointIn(input.mouseX, input.mouseY, BUTTONS.mute);
  const hoverPause = pointIn(input.mouseX, input.mouseY, BUTTONS.pause);
  drawSmallButton(ctx, BUTTONS.mute, muted ? '✕' : '♪', hoverMute);
  drawSmallButton(ctx, BUTTONS.pause, paused ? '▶' : 'II', hoverPause);
}

function drawSmallButton(ctx, button, label, hover) {
  ctx.fillStyle = hover ? '#ffb347' : 'rgba(255, 233, 176, 0.9)';
  ctx.strokeStyle = '#5d2f0e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(button.x, button.y, button.w, button.h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5d2f0e';
  ctx.font = 'bold 18px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, button.x + button.w / 2, button.y + 24);
}

export function pointIn(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function drawWorld(ctx, game, time) {
  const { world, turkey } = game;
  if (world.stageIndex === 0) {
    drawFarmyardBackdrop(ctx, VIEW.width, VIEW.height, VIEW.groundY, world.distance * 26, time);
  } else {
    drawKitchenBackdrop(ctx, VIEW.width, VIEW.height, VIEW.groundY, world.distance * 26, time);
  }

  // Pickups.
  for (const pk of world.pickups) {
    if (!pk.taken) drawCorn(ctx, pk.x, pk.y, time * 3 + pk.x);
  }

  // Obstacles.
  for (const ob of world.obstacles) {
    if (ob.kind === 'fence') drawFence(ctx, ob.x, VIEW.groundY, ob.w);
    else if (ob.kind === 'hay') drawHayBale(ctx, ob.x, VIEW.groundY, ob.w, ob.h);
    else if (ob.kind === 'puddle') drawPuddle(ctx, ob.x, VIEW.groundY, ob.w);
    else if (ob.kind === 'oven') {
      drawOven(ctx, ob.x, VIEW.groundY, ob.w, ob.h, ob.flameOn);
      if (ob.flameOn) drawFlame(ctx, ob.x + ob.w / 2, VIEW.groundY - ob.h, 96, ob.flameTime);
    } else if (ob.kind === 'knife') {
      // Warning shadow on the ground, then the falling blade.
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(ob.x + 13, VIEW.groundY - 2, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      if (!ob.falling) {
        ctx.fillStyle = 'rgba(255, 82, 82, 0.9)';
        ctx.font = 'bold 18px "Trebuchet MS", Verdana, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', ob.x + 13, 120 + Math.sin(time * 8) * 4);
      } else {
        const knifeY = 40 + ob.fall * (VIEW.groundY - 40 - ob.h);
        drawKnife(ctx, ob.x + 13, knifeY, ob.fall, 0.12);
      }
    } else if (ob.kind === 'pot') drawPot(ctx, ob.x, VIEW.groundY, ob.w);
  }

  // The farmer, behind the turkey by the gap.
  const farmerX = farmerScreenX(world);
  if (farmerX > -80) {
    drawFarmer(ctx, farmerX, VIEW.groundY, game.runPhase, farmerDrawState(world));
    if (world.farmer.state === 'lunge') {
      outlinedText(ctx, 'HE\'S LUNGING — DASH!', VIEW.width / 2, 120, 'bold 26px "Trebuchet MS", Verdana, sans-serif', '#ff5252');
    }
  }

  // The turkey.
  drawTurkey(ctx, turkey.x, turkey.y, game.runPhase, {
    ducking: turkey.ducking,
    dashing: turkey.dashing,
    hidden: turkey.hiding,
    hurt: turkey.invulnerable > 0,
  });

  // Floating feedback text.
  for (const fx of game.floaters) {
    ctx.globalAlpha = Math.max(0, fx.life / fx.maxLife);
    outlinedText(ctx, fx.text, fx.x, fx.y, 'bold 20px "Trebuchet MS", Verdana, sans-serif', fx.color);
    ctx.globalAlpha = 1;
  }
}

export function drawTitle(ctx, game) {
  drawFarmyardBackdrop(ctx, VIEW.width, VIEW.height, VIEW.groundY, 0, game.time);
  // A calm turkey and a distant farmer set the scene, clear of the button.
  drawTurkey(ctx, 205, VIEW.groundY, 0.6, {});
  drawFarmer(ctx, 95, VIEW.groundY, 0.6, 'chase');

  ctx.fillStyle = 'rgba(46, 24, 10, 0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  outlinedText(ctx, 'GOBBLE RUN', VIEW.width / 2, 108, 'bold 84px "Trebuchet MS", Verdana, sans-serif', '#ffb347');
  outlinedText(ctx, "Turkey's Great Escape", VIEW.width / 2, 152, 'bold 30px "Trebuchet MS", Verdana, sans-serif', '#ffe9b0');
  outlinedText(
    ctx,
    'Thanksgiving is coming. The farmer is coming faster. Run 1200 m from the farmyard,',
    VIEW.width / 2, 200,
    'bold 19px "Trebuchet MS", Verdana, sans-serif', '#fff8e6',
  );
  outlinedText(
    ctx,
    'through the kitchen, and out the window — or become dinner.',
    VIEW.width / 2, 226,
    'bold 19px "Trebuchet MS", Verdana, sans-serif', '#fff8e6',
  );

  outlinedText(ctx, 'SPACE / CLICK — jump      ↓ / S — hide in the hay', VIEW.width / 2, 292, 'bold 20px "Trebuchet MS", Verdana, sans-serif', '#ffe9b0');
  outlinedText(ctx, 'SHIFT / X — dash away      P — pause      M — mute', VIEW.width / 2, 322, 'bold 20px "Trebuchet MS", Verdana, sans-serif', '#ffe9b0');
  outlinedText(ctx, 'Grab corn to slow the farmer. A stumble lets him catch up.', VIEW.width / 2, 352, 'bold 18px "Trebuchet MS", Verdana, sans-serif', '#ffd94d');

  const hover = pointIn(game.input.mouseX, game.input.mouseY, BUTTONS.start);
  drawButton(ctx, BUTTONS.start, hover);
  outlinedText(ctx, 'or press SPACE', VIEW.width / 2, 486, 'bold 16px "Trebuchet MS", Verdana, sans-serif', '#ffe9b0');
}

export function drawEnd(ctx, game) {
  const { end, world, input } = game;
  const escaped = end.kind === 'escaped';
  // Dim the frozen scene behind the panel.
  ctx.fillStyle = 'rgba(30, 12, 4, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  ctx.fillStyle = 'rgba(46, 24, 10, 0.9)';
  ctx.beginPath();
  ctx.roundRect(180, 70, 600, 380, 18);
  ctx.fill();
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 4;
  ctx.stroke();

  if (escaped) {
    outlinedText(ctx, 'ESCAPED!', VIEW.width / 2, 140, 'bold 54px "Trebuchet MS", Verdana, sans-serif', '#7bc96f');
    outlinedText(ctx, 'The turkey made it out the window —', VIEW.width / 2, 188, 'bold 20px "Trebuchet MS", Verdana, sans-serif', '#ffe9b0');
    outlinedText(ctx, 'Thanksgiving dinner is cancelled this year!', VIEW.width / 2, 216, 'bold 20px "Trebuchet MS", Verdana, sans-serif', '#ffe9b0');
  } else {
    outlinedText(ctx, 'CAUGHT!', VIEW.width / 2, 140, 'bold 54px "Trebuchet MS", Verdana, sans-serif', '#ff5252');
    outlinedText(ctx, 'The farmer got his turkey after all…', VIEW.width / 2, 188, 'bold 20px "Trebuchet MS", Verdana, sans-serif', '#ffe9b0');
    outlinedText(ctx, 'Dinner is served. Better luck next run!', VIEW.width / 2, 216, 'bold 20px "Trebuchet MS", Verdana, sans-serif', '#ffe9b0');
  }

  ctx.textAlign = 'left';
  ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillStyle = '#ffe9b0';
  const rows = [
    ['Final score', `${Math.floor(world.score)}`],
    ['Distance run', `${Math.floor(world.distance)} m`],
    ['Corn collected', `${world.corn}`],
    ['Times hidden', `${world.hides}`],
  ];
  let rowY = 262;
  for (const [label, value] of rows) {
    ctx.fillText(label, 300, rowY);
    ctx.textAlign = 'right';
    ctx.fillText(value, 660, rowY);
    ctx.textAlign = 'left';
    rowY += 32;
  }

  const hover = pointIn(input.mouseX, input.mouseY, BUTTONS.restart);
  drawButton(ctx, BUTTONS.restart, hover);
}

export function drawPaused(ctx, game) {
  ctx.fillStyle = 'rgba(30, 12, 4, 0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  outlinedText(ctx, 'PAUSED', VIEW.width / 2, 250, 'bold 56px "Trebuchet MS", Verdana, sans-serif', '#ffe9b0');
  outlinedText(ctx, 'Press P or click II to keep running', VIEW.width / 2, 300, 'bold 20px "Trebuchet MS", Verdana, sans-serif', '#ffe9b0');
  void game;
}
