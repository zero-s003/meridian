import { Raycaster, Vector2 } from 'three';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function initCrown({ canvas, camera, watch, audio, getActive, onChange, cursor }) {
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let reserve = 12;
  let engaged = false;
  let lastY = 0;
  let totalMove = 0;

  function hitTest(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObject(watch.crownHit, false).length > 0;
  }

  function setReserve(value) {
    reserve = clamp(value, 12, 72);
    watch.setPower(reserve);
    onChange(reserve);
  }

  function pointerDown(event) {
    if (getActive() !== 3) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (!hitTest(event)) return;

    engaged = true;
    lastY = event.clientY;
    totalMove = 0;
    event.stopImmediatePropagation();
    event.preventDefault();
    canvas.setPointerCapture?.(event.pointerId);
    cursor?.setState('wind');
  }

  function pointerMove(event) {
    if (!engaged) {
      if (getActive() === 3 && event.pointerType === 'mouse') {
        cursor?.setState(hitTest(event) ? 'wind' : null);
      }
      return;
    }

    event.stopImmediatePropagation();
    event.preventDefault();
    const dy = event.clientY - lastY;
    lastY = event.clientY;
    totalMove += Math.abs(dy);

    if (dy !== 0) {
      setReserve(reserve + dy * 0.1);
      watch.rotateCrown(dy * 0.045);
      audio.ratchet(Math.min(1, Math.abs(dy) / 5));
    }
  }

  function end(event) {
    if (!engaged) return;
    engaged = false;
    if (totalMove < 6) setReserve(reserve + 6);
    cursor?.setState(null);
    if (event) event.stopImmediatePropagation();
  }

  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('lostpointercapture', end);

  document.querySelectorAll('[data-wind]').forEach((button) => {
    button.addEventListener('click', () => {
      const amount = Number(button.dataset.wind);
      setReserve(amount >= 72 ? 72 : reserve + amount);
      watch.rotateCrown(1.2);
      audio.ratchet();
    });
  });

  setReserve(12);

  return {
    setReserve,
    getReserve: () => reserve,
  };
}
