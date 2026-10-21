import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  Path,
  Shape,
  SphereGeometry,
  Vector2,
} from 'three';

function lathe(profile, segments) {
  const points = profile.map(([r, z]) => new Vector2(r, z));
  const geometry = new LatheGeometry(points, segments);
  // lathe revolves around Y; the watch is built around Z
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

export function buildCase({ materials, radial = 128 }) {
  const group = new Group();
  const parts = {};

  const midcaseProfile = [
    [1.3, -0.42],
    [1.46, -0.435],
    [1.72, -0.43],
    [1.86, -0.402],
    [1.925, -0.355],
    [1.95, -0.3],
    [1.95, 0.14],
    [1.94, 0.196],
    [1.9, 0.238],
    [1.8, 0.262],
    [1.7, 0.266],
    [1.665, 0.245],
    [1.66, 0.18],
    [1.66, 0.15],
    [1.3, 0.15],
    [1.3, -0.42],
  ];
  const midcase = new Mesh(lathe(midcaseProfile, radial), materials.brushed);
  group.add(midcase);

  const bezelProfile = [
    [1.665, 0.24],
    [1.72, 0.3],
    [1.82, 0.332],
    [1.9, 0.332],
    [1.9, 0.25],
    [1.8, 0.236],
    [1.7, 0.236],
    [1.665, 0.24],
  ];
  group.add(new Mesh(lathe(bezelProfile, radial), materials.brushed));

  const bezelEdgeProfile = [
    [1.9, 0.332],
    [1.955, 0.3],
    [1.95, 0.25],
    [1.9, 0.25],
    [1.9, 0.332],
  ];
  group.add(new Mesh(lathe(bezelEdgeProfile, radial), materials.polished));

  // domed sapphire: a thin shell, so the hands never clip it
  const crystalPoints = [];
  const crystalSegments = 18;
  for (let i = 0; i <= crystalSegments; i += 1) {
    const r = (i / crystalSegments) * 1.625;
    const z = 0.338 + 0.04 * Math.pow(1 - (r / 1.625) ** 2, 0.62);
    crystalPoints.push(new Vector2(r, z));
  }
  const crystalGeometry = new LatheGeometry(crystalPoints, radial);
  crystalGeometry.rotateX(Math.PI / 2);
  const crystal = new Mesh(crystalGeometry, materials.crystalFake);
  crystal.renderOrder = 3;
  group.add(crystal);
  parts.crystal = crystal;

  // lugs
  const lugShape = new Shape();
  lugShape.moveTo(-0.15, 0);
  lugShape.lineTo(0.15, 0);
  lugShape.lineTo(0.125, 0.55);
  lugShape.quadraticCurveTo(0.125, 0.7, 0.07, 0.72);
  lugShape.lineTo(-0.07, 0.72);
  lugShape.quadraticCurveTo(-0.125, 0.7, -0.125, 0.55);
  lugShape.closePath();
  const lugGeometry = new ExtrudeGeometry(lugShape, {
    depth: 0.17,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 2,
    curveSegments: 8,
  });
  [
    [-0.92, 1.55, 0, 1],
    [0.92, 1.55, 0, 1],
    [-0.92, -1.55, Math.PI, -1],
    [0.92, -1.55, Math.PI, -1],
  ].forEach(([x, y, rotation, side]) => {
    const lug = new Mesh(lugGeometry, materials.brushed);
    lug.position.set(x, y, -0.305);
    lug.rotation.z = rotation;
    lug.rotation.x = -0.12 * side;
    group.add(lug);
  });

  const springBarGeometry = new CylinderGeometry(0.055, 0.055, 1.72, 16);
  springBarGeometry.rotateZ(Math.PI / 2);
  [1, -1].forEach((direction) => {
    const bar = new Mesh(springBarGeometry, materials.steelDark);
    bar.position.set(0, direction * 2.26, -0.19);
    group.add(bar);
  });

  // crown
  const crownGroup = new Group();
  crownGroup.position.set(2.06, 0, -0.01);
  const crownGeometry = new CylinderGeometry(0.27, 0.27, 0.26, 48);
  crownGeometry.rotateZ(Math.PI / 2);
  crownGroup.add(new Mesh(crownGeometry, materials.crown));

  const cabochon = new Mesh(new SphereGeometry(0.07, 24, 16), materials.roseGold);
  cabochon.position.x = 0.155;
  cabochon.scale.set(0.55, 1, 1);
  crownGroup.add(cabochon);

  const crownHitMaterial = new MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const crownHitGeometry = new CylinderGeometry(0.4, 0.4, 0.44, 16);
  crownHitGeometry.rotateZ(Math.PI / 2);
  const crownHit = new Mesh(crownHitGeometry, crownHitMaterial);
  crownHit.userData.crown = true;
  crownGroup.add(crownHit);
  group.add(crownGroup);
  parts.crownGroup = crownGroup;
  parts.crownHit = crownHit;

  const stemGeometry = new CylinderGeometry(0.12, 0.12, 0.2, 20);
  stemGeometry.rotateZ(Math.PI / 2);
  const stem = new Mesh(stemGeometry, materials.brushed);
  stem.position.set(1.95, 0, -0.01);
  group.add(stem);

  // display caseback
  const casebackGroup = new Group();
  const ringShape = new Shape();
  ringShape.absarc(0, 0, 1.92, 0, Math.PI * 2, false);
  const ringHole = new Path();
  ringHole.absarc(0, 0, 1.255, 0, Math.PI * 2, true);
  ringShape.holes.push(ringHole);
  const ringGeometry = new ExtrudeGeometry(ringShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 96,
  });
  const ring = new Mesh(ringGeometry, materials.caseback);
  ring.position.z = -0.505;
  casebackGroup.add(ring);

  const window = new Mesh(new CircleGeometry(1.252, 96), materials.backGlass);
  window.position.z = -0.512;
  window.rotation.y = Math.PI;
  window.renderOrder = 2;
  casebackGroup.add(window);

  const screwGeometry = new CylinderGeometry(0.062, 0.062, 0.026, 20);
  screwGeometry.rotateX(Math.PI / 2);
  const slotGeometry = new BoxGeometry(0.105, 0.012, 0.007);
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2 + 0.25;
    const screw = new Group();
    const head = new Mesh(screwGeometry, materials.steelDark);
    head.position.z = -0.53;
    const slot = new Mesh(slotGeometry, materials.darkInset);
    slot.position.z = -0.542;
    slot.rotation.z = angle;
    screw.add(head, slot);
    screw.position.set(Math.cos(angle) * 1.58, Math.sin(angle) * 1.58, 0);
    casebackGroup.add(screw);
  }

  group.add(casebackGroup);
  parts.casebackGroup = casebackGroup;

  return { group, parts };
}
