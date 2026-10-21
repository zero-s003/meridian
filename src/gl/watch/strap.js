import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Group, Mesh, Vector3 } from 'three';

function ribbonGeometry(points, widthStart, widthEnd, segments = 56) {
  const curve = new CatmullRomCurve3(points, false, 'catmullrom', 0.4);
  const positions = [];
  const uvs = [];
  const indices = [];
  const columns = 3;

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const point = curve.getPoint(t);
    const width = widthStart + (widthEnd - widthStart) * t;

    // cross-section curls toward the wrist, so the strap is not a flat strip
    for (let column = 0; column < columns; column += 1) {
      const u = column / (columns - 1);
      const x = (u - 0.5) * width;
      const curl = -0.09 * Math.pow(Math.abs(u - 0.5) * 2, 2);
      positions.push(point.x + x, point.y, point.z + curl);
      uvs.push(u, t);
    }

    if (i < segments) {
      for (let column = 0; column < columns - 1; column += 1) {
        const a = i * columns + column;
        const b = a + 1;
        const c = a + columns;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function buildStrap({ materials }) {
  const group = new Group();

  const upper = new Mesh(
    ribbonGeometry(
      [
        new Vector3(0, 2.2, -0.12),
        new Vector3(0, 2.62, -0.42),
        new Vector3(0, 2.98, -1.15),
        new Vector3(0, 3.3, -2.15),
        new Vector3(0, 3.36, -3.1),
      ],
      1.84,
      1.48,
    ),
    materials.leather,
  );
  group.add(upper);

  const lower = new Mesh(
    ribbonGeometry(
      [
        new Vector3(0, -2.2, -0.12),
        new Vector3(0, -2.62, -0.42),
        new Vector3(0, -2.98, -1.15),
        new Vector3(0, -3.3, -2.15),
        new Vector3(0, -3.36, -3.1),
      ],
      1.84,
      1.48,
    ),
    materials.leather,
  );
  group.add(lower);

  return { group };
}
