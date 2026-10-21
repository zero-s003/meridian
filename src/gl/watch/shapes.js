import { ExtrudeGeometry, Path, Shape } from 'three';

const TAU = Math.PI * 2;

export function roundedRectShape(width, height, radius) {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const shape = new Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  shape.closePath();
  return shape;
}

export function extrudeRoundedRect(width, height, radius, depth, bevel = 0.006) {
  const shape = roundedRectShape(width, height, radius);
  return new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 8,
  });
}

export function gearGeometry({ teeth = 30, radius = 0.4, toothDepth = 0.045, thickness = 0.026, hole = 0.075 }) {
  const shape = new Shape();
  const step = TAU / teeth;
  const root = radius - toothDepth;

  for (let i = 0; i < teeth; i += 1) {
    const a = i * step;
    const points = [
      [root, a],
      [radius, a + step * 0.14],
      [radius, a + step * 0.36],
      [root, a + step * 0.5],
    ];
    points.forEach(([r, angle], index) => {
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0 && index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
  }
  shape.closePath();

  const centre = new Path();
  centre.absarc(0, 0, hole, 0, TAU, true);
  shape.holes.push(centre);

  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * TAU + 0.3;
    const holePath = new Path();
    holePath.absarc(
      Math.cos(angle) * radius * 0.55,
      Math.sin(angle) * radius * 0.55,
      radius * 0.085,
      0,
      TAU,
      true,
    );
    shape.holes.push(holePath);
  }

  return new ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 1,
    curveSegments: 14,
  });
}

export function handGeometry(length, width, tail = 0.09) {
  const shape = new Shape();
  shape.moveTo(0, -tail);
  shape.lineTo(width / 2, 0.02);
  shape.lineTo(width * 0.16, length * 0.7);
  shape.lineTo(0, length);
  shape.lineTo(-width * 0.16, length * 0.7);
  shape.lineTo(-width / 2, 0.02);
  shape.closePath();

  return new ExtrudeGeometry(shape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 4,
  });
}
