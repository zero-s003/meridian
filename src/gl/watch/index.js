import { Group } from 'three';
import { buildCase } from './case.js';
import { buildDial } from './dial.js';
import { buildMovement } from './movement.js';
import { buildStrap } from './strap.js';
import { setCaseMetal, setDial, setStrap } from './materials.js';

export const HOTSPOT_ANCHORS = {
  1: [
    { id: 'chamfer', position: [-1.58, 0.86, 0.2] },
    { id: 'lugs', position: [0.92, 2.12, -0.22] },
    { id: 'crown', position: [2.16, 0, 0.02] },
  ],
  2: [
    { id: 'sunray', position: [-0.88, 0.6, 0.26] },
    { id: 'indices', position: [1.08, 0.78, 0.29] },
    { id: 'seconds', position: [0, -0.92, 0.3] },
  ],
  3: [
    { id: 'knurling', position: [2.1, 0.17, 0.1] },
    { id: 'cabochon', position: [2.22, 0, 0.04] },
  ],
  4: [
    { id: 'bridge', position: [-0.4, 0.52, -0.42], explode: 0.62 },
    { id: 'balance', position: [0.62, -0.5, -0.42], explode: 0.76 },
    { id: 'jewels', position: [0.3, 0.2, -0.43], explode: 0.62 },
  ],
};

export function createWatch({ materials, textures, radial = 128, tier = 'B', reduced = false }) {
  const group = new Group();

  const caseParts = buildCase({ materials, radial });
  const dialParts = buildDial({ materials });
  const movement = buildMovement({ materials, radial });
  const strap = buildStrap({ materials });

  group.add(caseParts.group, dialParts.group, movement.group, strap.group);

  const { hands } = dialParts;
  let power = 12 / 72;
  let explode = 0;
  let explodeTarget = 0;
  let currentTier = tier;

  function update(dt) {
    const now = new Date();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;

    hands.hour.rotation.z = -(hours * Math.PI) / 6;
    hands.minute.rotation.z = -(minutes * Math.PI) / 30;
    const tick = Math.floor(seconds * 6) / 6;
    hands.seconds.rotation.z = -(tick * Math.PI) / 30;
    hands.subSeconds.rotation.z = -(tick * Math.PI) / 30;

    movement.update(reduced ? 0 : dt);

    explode += (explodeTarget - explode) * (1 - Math.exp(-dt * 3.6));
    if (Math.abs(explodeTarget - explode) < 0.0005) explode = explodeTarget;
    movement.setExplode(explode);
    caseParts.parts.casebackGroup.position.z = -0.98 * explode;
  }

  function setExplodeTarget(value) {
    explodeTarget = Math.max(0, Math.min(1, value));
  }

  function setPower(value) {
    power = Math.max(0, Math.min(72, value));
    movement.setPower(power / 72);
  }

  function getPower() {
    return power;
  }

  function rotateCrown(delta) {
    caseParts.parts.crownGroup.rotation.x += delta;
  }

  function applyQuality(tierKey) {
    // the frosted crystal is intentionally shared by every tier; only DPR,
    // geometry density and post resolution change with quality
    currentTier = tierKey;
  }

  function setReduced(value) {
    reduced = value;
  }

  function setStrapVisible(value) {
    strap.group.visible = value;
  }

  return {
    group,
    parts: caseParts.parts,
    materials,
    textures,
    update,
    setExplodeTarget,
    setPower,
    getPower,
    rotateCrown,
    applyQuality,
    setReduced,
    setStrapVisible,
    setMetal: (key) => setCaseMetal(materials, key),
    setDial: (key) => setDial(materials, textures, key),
    setStrap: (key) => setStrap(materials, key),
    getExplode: () => explode,
    getTier: () => currentTier,
    crownHit: caseParts.parts.crownHit,
  };
}
