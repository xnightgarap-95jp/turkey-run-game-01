// Keyboard + mouse input for Gobble Run. One job: turn keys and clicks into
// game actions (jump, hide, dash, start, restart, pause, mute) and remember
// which buttons the mouse is over, so the canvas can draw hover states.

export function createInput(canvas, hooks) {
  const state = {
    jumpHeld: false,
    hideHeld: false,
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
  };

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    switch (event.code) {
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        event.preventDefault();
        state.jumpHeld = true;
        hooks.onJump();
        break;
      case 'ArrowDown':
      case 'KeyS':
        event.preventDefault();
        state.hideHeld = true;
        hooks.onHideStart();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
      case 'KeyX':
        hooks.onDash();
        break;
      case 'KeyR':
        hooks.onRestart();
        break;
      case 'KeyP':
      case 'Escape':
        hooks.onPause();
        break;
      case 'KeyM':
        hooks.onMute();
        break;
      case 'Enter':
        hooks.onConfirm();
        break;
      default:
        break;
    }
  }

  function onKeyUp(event) {
    switch (event.code) {
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        state.jumpHeld = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        state.hideHeld = false;
        hooks.onHideEnd();
        break;
      default:
        break;
    }
  }

  function onPointerDown(event) {
    const point = canvasPoint(event);
    state.mouseX = point.x;
    state.mouseY = point.y;
    state.mouseDown = true;
    hooks.onTap(point.x, point.y);
  }

  function onPointerMove(event) {
    const point = canvasPoint(event);
    state.mouseX = point.x;
    state.mouseY = point.y;
  }

  function onPointerUp() {
    state.mouseDown = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  return state;
}
