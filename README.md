# MERIDIAN 子午

A fictional haute-horlogerie concept site for **CALIBRE 01**, a hand-wound mechanical watch. One fixed WebGL canvas carries a seven-chapter story: case, dial, crown, movement, configurator, close.

- Vanilla JS + Three.js, Vite. No UI framework.
- Procedural watch: lathe-turned case, canvas sunray dial, gear train, balance wheel, alligator strap.
- Interactions: drag to inspect, live local time, crown winding with power reserve, hotspot callouts, exploded calibre view, 12-state configurator with a shareable hash.
- Responsive by re-computing camera framing per viewport; mobile uses a bottom-sheet reading layout.
- Quality tiers (`A/B/C`) plus a runtime FPS check; reduced-motion and no-WebGL fallbacks.

## Run

```bash
npm install
npm run dev
npm run build
npm run preview
```

Debug hooks: `?tier=A|B|C`, `?lock=1` to disable the automatic quality downgrade.

## Verify

With the dev server on `http://127.0.0.1:5174/`:

```bash
python scripts/shoot.py desktop   # screenshots -> shots/desktop
python scripts/shoot.py tablet
python scripts/shoot.py mobile
python scripts/interact.py        # 34 behaviour assertions
```

Screenshots use Edge through Playwright. Both scripts enable hardware GL for headless Chromium.

## Structure

```
src/gl/stage.js        renderer, composer, grade pass
src/gl/environment.js  hand-built softbox PMREM
src/gl/camera.js       screen-space focus keyframes + slow damping
src/gl/watch/          case, dial, movement, strap, materials
src/gl/textures.js     canvas textures (dial, perlage, Geneva, leather)
src/ui/                HUD, hotspots, configurator, crown, audio, cursor
src/motion/            scroll state, reduced-motion helpers
```

The site is a design study. MERIDIAN is a fictional maison; nothing is for sale.
