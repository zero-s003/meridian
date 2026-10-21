import { MathUtils, Vector3 } from 'three';

const DEG = Math.PI / 180;
const UP = new Vector3(0, 1, 0);

// Each key pins a focus point to a screen position. Screen x/y are 0–1 from the
// top-left. fit is the world radius that must stay in frame.
const KEYS = [
  {
    az: -24,
    el: 10,
    fit: 3.4,
    fov: 30,
    focus: [0, 0, 0],
    screen: [0.66, 0.44],
    mobile: { fit: 2.25, screen: [0.5, 0.29] },
  },
  {
    az: -56,
    el: 18,
    fit: 1.15,
    fov: 26,
    focus: [-1.2, 0.7, 0.12],
    screen: [0.66, 0.48],
    mobile: { fit: 2.35, screen: [0.5, 0.28] },
  },
  {
    az: 0,
    el: 66,
    fit: 2.5,
    fov: 25,
    focus: [0, 0, 0.12],
    screen: [0.34, 0.46],
    mobile: { fit: 2.15, screen: [0.5, 0.3] },
  },
  {
    az: 64,
    el: 12,
    fit: 0.98,
    fov: 25,
    focus: [2.05, 0, 0.02],
    screen: [0.64, 0.48],
    mobile: { fit: 2.2, screen: [0.55, 0.28], az: 55, el: 14, focus: [1.85, 0, 0.02] },
  },
  {
    az: 180,
    el: 12,
    fit: 2.5,
    fov: 30,
    focus: [0, 0, -0.15],
    screen: [0.34, 0.47],
    mobile: { fit: 2.1, screen: [0.5, 0.28] },
  },
  {
    az: -20,
    el: 12,
    fit: 3.1,
    fov: 30,
    focus: [0, 0, 0],
    screen: [0.67, 0.47],
    mobile: { fit: 2.35, screen: [0.5, 0.24] },
  },
  {
    az: -8,
    el: 9,
    fit: 3.6,
    fov: 30,
    focus: [0, -0.3, 0],
    screen: [0.3, 0.46],
    mobile: { fit: 3.3, screen: [0.5, 0.2] },
  },
];

const SMOOTH = 5.2;

function fitDistance(fit, fov, aspect) {
  const v = Math.tan((fov * DEG) / 2);
  const vertical = fit / v;
  const horizontal = fit / (v * aspect);
  return Math.max(vertical, horizontal);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function isMobile() {
  return window.innerWidth < 768;
}

export function createCameraRig(camera) {
  const state = {
    az: KEYS[0].az,
    el: KEYS[0].el,
    fit: KEYS[0].fit,
    fov: KEYS[0].fov,
    fx: KEYS[0].focus[0],
    fy: KEYS[0].focus[1],
    fz: KEYS[0].focus[2],
    sx: KEYS[0].screen[0],
    sy: KEYS[0].screen[1],
  };

  let dragAz = 0;
  let dragEl = 0;
  let velAz = 0;
  let velEl = 0;
  let dragging = false;
  let explode = 0;
  let reduced = false;

  const focus = new Vector3();
  const direction = new Vector3();
  const forward = new Vector3();
  const right = new Vector3();
  const up = new Vector3();
  const target = new Vector3();

  function keyFor(index) {
    const key = KEYS[MathUtils.clamp(index, 0, KEYS.length - 1)];
    if (!isMobile()) return key;
    const m = key.mobile;
    return {
      ...key,
      fit: m.fit ?? key.fit,
      screen: m.screen ?? key.screen,
      focus: m.focus ?? key.focus,
      az: m.az ?? key.az,
      el: m.el ?? key.el,
      fov: m.fov ?? key.fov,
    };
  }

  function sample(pos) {
    const clamped = MathUtils.clamp(pos, 0, KEYS.length - 1);
    const index = Math.min(Math.floor(clamped), KEYS.length - 2);
    const t = clamped - index;
    const a = keyFor(index);
    const b = keyFor(index + 1);
    return {
      az: lerp(a.az, b.az, t),
      el: lerp(a.el, b.el, t),
      fit: lerp(a.fit, b.fit, t),
      fov: lerp(a.fov, b.fov, t),
      fx: lerp(a.focus[0], b.focus[0], t),
      fy: lerp(a.focus[1], b.focus[1], t),
      fz: lerp(a.focus[2], b.focus[2], t),
      sx: lerp(a.screen[0], b.screen[0], t),
      sy: lerp(a.screen[1], b.screen[1], t),
    };
  }

  function update(dt, scroll, pointer) {
    const goal = sample(scroll.pos);
    const rate = reduced ? 16 : SMOOTH;
    const alpha = 1 - Math.exp(-rate * Math.max(dt, 0.001));

    state.az = lerp(state.az, goal.az, alpha);
    state.el = lerp(state.el, goal.el, alpha);
    state.fit = lerp(state.fit, goal.fit, alpha);
    state.fov = lerp(state.fov, goal.fov, alpha);
    state.fx = lerp(state.fx, goal.fx, alpha);
    state.fy = lerp(state.fy, goal.fy, alpha);
    state.fz = lerp(state.fz, goal.fz, alpha);
    state.sx = lerp(state.sx, goal.sx, alpha);
    state.sy = lerp(state.sy, goal.sy, alpha);

    if (!dragging) {
      dragAz += velAz;
      dragEl += velEl;
      velAz *= 0.92;
      velEl *= 0.92;
      const decay = Math.exp(-dt * (reduced ? 8 : 0.35));
      dragAz *= decay;
      dragEl *= decay;
    }

    const parallaxX = reduced ? 0 : pointer.x * 0.024;
    const parallaxY = reduced ? 0 : pointer.y * 0.016;

    const az = state.az * DEG + dragAz + parallaxX;
    const el = MathUtils.clamp(state.el, -80, 80) * DEG + dragEl + parallaxY;

    direction.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
    focus.set(state.fx, state.fy, state.fz);

    const fit = state.fit * (1 + explode * 0.16);
    const distance = fitDistance(fit, state.fov, camera.aspect);

    forward.copy(direction).multiplyScalar(-1);
    right.crossVectors(forward, UP).normalize();
    up.crossVectors(right, forward).normalize();

    // visible half extents at the target plane
    const halfHeight = distance * Math.tan((state.fov * DEG) / 2);
    const halfWidth = halfHeight * camera.aspect;
    const ndcX = state.sx * 2 - 1;
    const ndcY = 1 - state.sy * 2;

    target
      .copy(focus)
      .addScaledVector(right, -ndcX * halfWidth)
      .addScaledVector(up, -ndcY * halfHeight);

    camera.position.copy(target).addScaledVector(direction, distance);
    camera.lookAt(target);
    camera.fov = state.fov;
    camera.updateProjectionMatrix();
  }

  function addDrag(dx, dy) {
    dragAz -= dx * 0.0042;
    dragEl += dy * 0.0032;
    dragEl = MathUtils.clamp(dragEl, -0.5, 0.5);
    velAz = -dx * 0.00035;
    velEl = dy * 0.00025;
  }

  function setDragging(value) {
    dragging = value;
    if (value) {
      velAz = 0;
      velEl = 0;
    }
  }

  function setExplode(value) {
    explode = value;
  }

  function setReduced(value) {
    reduced = value;
  }

  function project(point, out = new Vector3()) {
    out.copy(point).project(camera);
    return out;
  }

  return {
    camera,
    update,
    addDrag,
    setDragging,
    setExplode,
    setReduced,
    project,
    getState: () => ({ ...state, dragAz, dragEl, explode }),
  };
}
