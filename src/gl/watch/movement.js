import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  TorusGeometry,
  Vector3,
} from 'three';
import { extrudeRoundedRect, gearGeometry } from './shapes.js';

function axialCylinder(radius, height, segments = 32) {
  const geometry = new CylinderGeometry(radius, radius, height, segments);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

export function buildMovement({ materials, radial = 96 }) {
  const group = new Group();
  const plateGroup = new Group();
  const bridgeGroup = new Group();
  const barrelGroup = new Group();
  const trainGroup = new Group();
  const balanceGroup = new Group();

  const plate = new Mesh(new CylinderGeometry(1.29, 1.29, 0.045, radial), materials.plate);
  plate.rotation.x = Math.PI / 2;
  plate.position.z = -0.32;
  plateGroup.add(plate);

  const gears = [];
  const jewelSpots = [];

  function addScrew(parent, x, y, z) {
    const head = new Mesh(axialCylinder(0.055, 0.018, 20), materials.blued);
    head.position.set(x, y, z);
    const slot = new Mesh(new BoxGeometry(0.1, 0.01, 0.006), materials.darkInset);
    slot.position.set(x, y, z - 0.012);
    parent.add(head, slot);
  }

  function addJewel(x, y, z) {
    const chaton = new Mesh(axialCylinder(0.085, 0.014, 24), materials.roseGold);
    chaton.position.set(x, y, z);
    const stone = new Mesh(axialCylinder(0.048, 0.018, 20), materials.jewel);
    stone.position.set(x, y, z - 0.01);
    bridgeGroup.add(chaton, stone);
    jewelSpots.push({ x, y, z });
  }

  function addBridge({ length, width, rotation, x, y, z }) {
    const bar = new Mesh(extrudeRoundedRect(length, width, width * 0.35, 0.032, 0.007), materials.bridge);
    bar.position.set(x, y, z);
    bar.rotation.z = rotation;
    bridgeGroup.add(bar);

    [-1, 1].forEach((side) => {
      const dx = Math.cos(rotation) * side * length * 0.37;
      const dy = Math.sin(rotation) * side * length * 0.37;
      const boss = new Mesh(axialCylinder(width * 0.45, 0.034, 28), materials.bridge);
      boss.position.set(x + dx, y + dy, z - 0.006);
      bridgeGroup.add(boss);
      addScrew(bridgeGroup, x + dx, y + dy, z - 0.032);
      addJewel(x + dx, y + dy, z - 0.035);
    });
  }

  addBridge({ length: 1.45, width: 0.34, rotation: -0.28, x: -0.38, y: 0.5, z: -0.385 });
  addBridge({ length: 1.2, width: 0.29, rotation: 0.95, x: 0.3, y: 0.08, z: -0.392 });
  addBridge({ length: 0.92, width: 0.33, rotation: 1.18, x: 0.58, y: -0.48, z: -0.388 });

  // barrel and ratchet wheel
  const barrel = new Mesh(
    gearGeometry({ teeth: 38, radius: 0.54, toothDepth: 0.05, thickness: 0.028, hole: 0.09 }),
    materials.gear,
  );
  barrel.position.set(-0.48, 0.4, -0.355);
  barrelGroup.add(barrel);
  const ratchet = new Mesh(axialCylinder(0.22, 0.04, 36), materials.bridge);
  ratchet.position.set(-0.48, 0.4, -0.378);
  barrelGroup.add(ratchet);
  const ratchetScrew = new Mesh(axialCylinder(0.05, 0.02, 20), materials.blued);
  ratchetScrew.position.set(-0.48, 0.4, -0.402);
  barrelGroup.add(ratchetScrew);
  gears.push({ mesh: barrel, speed: 0.22 });

  const train = [
    { x: 0.12, y: 0.62, radius: 0.34, teeth: 32, speed: -0.55 },
    { x: 0.52, y: 0.18, radius: 0.3, teeth: 28, speed: 0.72 },
    { x: 0.06, y: -0.22, radius: 0.26, teeth: 24, speed: -0.92 },
    { x: -0.76, y: -0.52, radius: 0.24, teeth: 20, speed: 1.15 },
    { x: -0.04, y: 0.02, radius: 0.19, teeth: 16, speed: -1.4 },
  ];
  train.forEach((item) => {
    const wheel = new Mesh(
      gearGeometry({
        teeth: item.teeth,
        radius: item.radius,
        toothDepth: 0.038,
        thickness: 0.024,
        hole: 0.045,
      }),
      materials.gear,
    );
    wheel.position.set(item.x, item.y, -0.355);
    trainGroup.add(wheel);
    const pinion = new Mesh(axialCylinder(0.045, 0.05, 16), materials.steelDark);
    pinion.position.set(item.x, item.y, -0.36);
    trainGroup.add(pinion);
    gears.push({ mesh: wheel, speed: item.speed });
  });

  // balance wheel + hairspring
  balanceGroup.position.set(0.62, -0.5, 0);
  const balance = new Group();
  const rim = new Mesh(new TorusGeometry(0.32, 0.024, 10, 72), materials.gear);
  rim.position.z = -0.355;
  balance.add(rim);
  for (let i = 0; i < 3; i += 1) {
    const spoke = new Mesh(new BoxGeometry(0.025, 0.6, 0.014), materials.gear);
    spoke.rotation.z = (i / 3) * Math.PI * 2;
    spoke.position.z = -0.357;
    balance.add(spoke);
  }
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const weight = new Mesh(axialCylinder(0.018, 0.014, 10), materials.steelDark);
    weight.position.set(Math.cos(angle) * 0.32, Math.sin(angle) * 0.32, -0.372);
    balance.add(weight);
  }
  const balanceCap = new Mesh(axialCylinder(0.06, 0.02, 20), materials.roseGold);
  balanceCap.position.z = -0.375;
  balance.add(balanceCap);
  balanceGroup.add(balance);

  const springPoints = [];
  const turns = 2.6;
  const steps = 180;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const radius = 0.035 + t * 0.27;
    springPoints.push(
      new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, -0.342),
    );
  }
  const spring = new Line(
    new BufferGeometry().setFromPoints(springPoints),
    new LineBasicMaterial({ color: 0x9aa0a8, transparent: true, opacity: 0.42 }),
  );
  balanceGroup.add(spring);

  addJewel(0.62, -0.5, -0.4);

  group.add(plateGroup, barrelGroup, trainGroup, bridgeGroup, balanceGroup);

  const groups = { plateGroup, barrelGroup, trainGroup, bridgeGroup, balanceGroup };
  const offsets = {
    plateGroup: 0.14,
    barrelGroup: 0.3,
    trainGroup: 0.46,
    bridgeGroup: 0.62,
    balanceGroup: 0.76,
  };

  let power = 12 / 72;
  let elapsed = 0;

  function update(dt) {
    elapsed += dt;
    gears.forEach(({ mesh, speed }) => {
      mesh.rotation.z += speed * dt;
    });
    const amplitude = 0.28 + 0.22 * power;
    balance.rotation.z = Math.sin(elapsed * Math.PI * 2 * 3.2) * amplitude;
  }

  function setPower(value) {
    power = Math.max(0, Math.min(1, value));
  }

  function setExplode(amount) {
    Object.entries(groups).forEach(([key, part]) => {
      part.position.z = -offsets[key] * amount;
    });
  }

  return {
    group,
    gears,
    balance,
    groups,
    update,
    setPower,
    setExplode,
    jewelSpots,
  };
}
