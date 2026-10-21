import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/noto-serif-sc/chinese-simplified-400.css';

import './styles/base.css';
import './styles/layout.css';
import './styles/hud.css';
import './styles/ui.css';

import { AmbientLight, DirectionalLight, Vector3 } from 'three';
import { createStage } from './gl/stage.js';
import { createStudioEnvironment } from './gl/environment.js';
import { createTextures } from './gl/textures.js';
import { createWatchMaterials } from './gl/watch/materials.js';
import { createWatch } from './gl/watch/index.js';
import { createCameraRig } from './gl/camera.js';
import { detectTier, tierSettings } from './gl/quality.js';
import { createScroll } from './motion/scroll.js';
import { prefersReduced, onReducedChange } from './motion/reduced.js';
import { initHud } from './ui/hud.js';
import { initHotspots } from './ui/hotspots.js';
import { initConfigurator } from './ui/configurator.js';
import { createAudio } from './ui/audio.js';
import { initCursor } from './ui/cursor.js';
import { initCrown } from './ui/crown.js';

window.__MERIDIAN_READY__ = false;

const intro = document.getElementById('intro');
intro?.classList.add('is-show');

const bootStarted = performance.now();

function showFallback() {
  document.documentElement.classList.add('no-webgl');
  const fallback = document.getElementById('fallback');
  if (fallback) fallback.hidden = false;
  intro?.classList.add('is-done');
  window.__MERIDIAN_READY__ = true;
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl')),
    );
  } catch {
    return false;
  }
}

async function waitForFonts() {
  if (!document.fonts) return;
  await Promise.race([
    document.fonts.ready,
    new Promise((resolve) => {
      window.setTimeout(resolve, 1800);
    }),
  ]);
}

async function boot() {
  if (!hasWebGL()) {
    showFallback();
    return;
  }

  await waitForFonts();

  const tier = detectTier();
  const settings = tierSettings(tier);
  const reduced = prefersReduced();
  document.documentElement.classList.toggle('reduced', reduced);

  const stage = createStage(tier);
  if (new URLSearchParams(window.location.search).has('nobloom')) stage.setBloom(false);
  const environment = createStudioEnvironment(stage.renderer);
  stage.scene.environment = environment;
  stage.scene.environmentIntensity = 1.0;

  stage.scene.add(new AmbientLight(0xffffff, 0.12));
  const keyLight = new DirectionalLight(0xfff1e2, 2.1);
  keyLight.position.set(3.5, 4.2, 5);
  const rimLight = new DirectionalLight(0xb9cbdd, 1.25);
  rimLight.position.set(-4, 2.5, -4.5);
  const fillLight = new DirectionalLight(0xffffff, 0.65);
  fillLight.position.set(-2.5, -3, 3.5);
  const calibreLight = new DirectionalLight(0xfff2e2, 1.15);
  calibreLight.position.set(0.6, 1.2, -4);
  const crownLight = new DirectionalLight(0xffffff, 1.0);
  crownLight.position.set(4, 0.5, 1.4);
  stage.scene.add(keyLight, rimLight, fillLight, calibreLight, crownLight);

  const anisotropy = Math.min(8, stage.renderer.capabilities.getMaxAnisotropy());
  const textures = createTextures({ dialSize: settings.dialSize, anisotropy });
  const materials = createWatchMaterials({ tier, textures });
  const watch = createWatch({
    materials,
    textures,
    radial: settings.radial,
    tier,
    reduced,
  });
  stage.scene.add(watch.group);

  const rig = createCameraRig(stage.camera);
  rig.setReduced(reduced);

  const sections = [...document.querySelectorAll('.chapter')];
  const scroll = createScroll(sections);
  const hud = initHud();
  const audio = createAudio();
  const cursor = initCursor();
  const hotspots = initHotspots({ camera: stage.camera });

  const reserveArc = document.getElementById('reserve-arc');
  const reserveValue = document.getElementById('reserve-value');
  const CIRCUMFERENCE = 326.73;

  function updateReserve(hours) {
    if (reserveValue) reserveValue.textContent = String(Math.round(hours));
    if (reserveArc) {
      const fraction = Math.max(0, Math.min(1, (hours - 12) / 60));
      reserveArc.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - fraction));
    }
  }

  const crown = initCrown({
    canvas: stage.canvas,
    camera: stage.camera,
    watch,
    audio,
    cursor,
    getActive: () => scroll.state.active,
    onChange: updateReserve,
  });

  const configurator = initConfigurator({
    onChange(state) {
      watch.setDial(state.d);
      watch.setMetal(state.m);
      watch.setStrap(state.s);
    },
  });

  let soundOn = false;
  hud.soundButton?.addEventListener('click', async () => {
    if (audio.isEnabled()) {
      audio.disable();
      soundOn = false;
    } else {
      soundOn = await audio.enable();
      if (soundOn) audio.ratchet();
    }
    hud.setSound(soundOn);
  });

  // ——— pointer: orbit inspection + parallax ———
  const INSPECT = new Set([0, 2, 5, 6]);
  const pointer = { x: 0, y: 0 };
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'touch') return;
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true },
  );

  stage.canvas.addEventListener('pointerenter', () => {
    if (INSPECT.has(scroll.state.active)) cursor.setState('drag');
  });
  stage.canvas.addEventListener('pointerleave', () => {
    cursor.setState(null);
    pointer.x = 0;
    pointer.y = 0;
  });

  stage.canvas.addEventListener('pointerdown', (event) => {
    if (!INSPECT.has(scroll.state.active)) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    rig.setDragging(true);
    cursor.setState('drag');
    stage.canvas.setPointerCapture?.(event.pointerId);
  });

  stage.canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    if (event.pointerType === 'mouse') rig.addDrag(dx, dy);
    else rig.addDrag(dx, 0);
  });

  function endDrag(event) {
    if (!dragging) return;
    dragging = false;
    rig.setDragging(false);
    cursor.setState(INSPECT.has(scroll.state.active) ? 'drag' : null);
    if (event?.pointerId != null) {
      try {
        stage.canvas.releasePointerCapture(event.pointerId);
      } catch {
        /* pointer already released */
      }
    }
  }

  stage.canvas.addEventListener('pointerup', endDrag);
  stage.canvas.addEventListener('pointercancel', endDrag);

  // ——— exploded calibre toggle ———
  const explodeButton = document.getElementById('explode-toggle');
  // null follows the scroll story; true/false is a manual override for this chapter
  let manualExplode = null;
  let lastExplodeOpen = false;

  function syncExplodeButton(open) {
    if (!explodeButton || open === lastExplodeOpen) return;
    lastExplodeOpen = open;
    explodeButton.setAttribute('aria-pressed', String(open));
    explodeButton.textContent = open ? '合拢机芯' : '展开机芯';
  }

  explodeButton?.addEventListener('click', () => {
    const openNow =
      (manualExplode === null ? scroll.state.explode : manualExplode ? 1 : 0) > 0.5;
    manualExplode = !openNow;
  });

  // ——— resize & reduced motion ———
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      stage.resize();
      scroll.measure();
    }, 140);
  });

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => scroll.measure());
    observer.observe(document.getElementById('main'));
  }

  onReducedChange((value) => {
    rig.setReduced(value);
    watch.setReduced(value);
    document.documentElement.classList.toggle('reduced', value);
  });

  stage.canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    showFallback();
  });

  // ——— initial position ———
  scroll.measure();
  rig.update(2, scroll.read(), pointer);
  let lastActive = -1;
  let currentTier = tier;
  let downgraded = false;

  // ——— ready state ———
  let readyScheduled = false;
  let framesRendered = 0;

  function finishIntro() {
    if (readyScheduled) return;
    readyScheduled = true;
    intro?.classList.add('is-done');
    window.setTimeout(
      () => {
        window.__MERIDIAN_READY__ = true;
        intro?.remove();
      },
      reduced ? 80 : 950,
    );
  }

  // ——— loop ———
  let lastTime = performance.now();
  let firstFrameAt = 0;
  let fpsFrames = 0;
  let fpsWindowStart = 0;
  let lastFps = 60;
  let fpsAssessed = false;
  let fps = 0;
  const fpsSamples = [];
  const lockTier = new URLSearchParams(window.location.search).has('lock');

  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) {
      lastTime = now;
      return;
    }

    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    const state = scroll.read();

    if (state.active !== lastActive) {
      lastActive = state.active;
      hud.setChapter(state.active);
      document.body.dataset.chapter = String(state.active);
      if (state.active !== 4) manualExplode = null;
      watch.setStrapVisible(state.active >= 5);
    }

    const desiredExplode =
      state.active === 4
        ? manualExplode === null
          ? state.explode
          : manualExplode
            ? 1
            : 0
        : 0;
    watch.setExplodeTarget(desiredExplode);
    syncExplodeButton(state.active === 4 && desiredExplode > 0.5);
    watch.update(dt);
    rig.setExplode(watch.getExplode());
    rig.update(dt, state, pointer);

    hotspots.update(state.active, watch.getExplode());
    hud.setProgress(state.overall);

    stage.render(now / 1000);

    if (!firstFrameAt) {
      firstFrameAt = now;
      fpsWindowStart = now;
    }

    fpsFrames += 1;
    if (now - fpsWindowStart >= 1000) {
      fps = (fpsFrames * 1000) / (now - fpsWindowStart);
      lastFps = fps;
      window.__MERIDIAN_FPS__ = Math.round(fps);
      fpsFrames = 0;
      fpsWindowStart = now;
      fpsSamples.push(fps);
      if (fpsSamples.length > 5) fpsSamples.shift();

      // ignore the shader-compile stall: judge only after the first 7 seconds
      if (!fpsAssessed && now - firstFrameAt > 7000 && fpsSamples.length >= 3) {
        fpsAssessed = true;
        const average = fpsSamples.reduce((sum, value) => sum + value, 0) / fpsSamples.length;
        if (average < 42 && currentTier === 'A' && !lockTier) {
          currentTier = 'B';
          downgraded = true;
          stage.setBloom(false);
          stage.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
          watch.applyQuality('B');
        }
      }
    }

    framesRendered += 1;
    if (!readyScheduled && framesRendered > 2 && now - bootStarted > 900) {
      finishIntro();
    }
  }

  requestAnimationFrame(frame);

  window.__MERIDIAN_DEBUG__ = {
    get scroll() {
      return { ...scroll.state };
    },
    get camera() {
      return rig.getState();
    },
    get explode() {
      return watch.getExplode();
    },
    get reserve() {
      return crown.getReserve();
    },
    get config() {
      return configurator.getState();
    },
    get tier() {
      return currentTier;
    },
    get fps() {
      return lastFps;
    },
    get downgraded() {
      return downgraded;
    },
    setReserve: (value) => crown.setReserve(value),
    projectPoint: (point) => {
      const vector = new Vector3(point[0], point[1], point[2]).project(stage.camera);
      return {
        x: (vector.x * 0.5 + 0.5) * window.innerWidth,
        y: (-vector.y * 0.5 + 0.5) * window.innerHeight,
        z: vector.z,
      };
    },
    hasWebGL: true,
  };

  window.__MERIDIAN_SETTLE__ = () => {
    scroll.measure();
    scroll.read();
  };
}

boot().catch((error) => {
  console.error('[MERIDIAN] boot failed', error);
  showFallback();
});
