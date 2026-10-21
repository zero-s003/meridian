import {
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
} from 'three';

// A hand-built softbox room. It reads as real studio light in metal reflections,
// where three's RoomEnvironment reads as a demo scene.
export function createStudioEnvironment(renderer) {
  const env = new Scene();
  env.background = new Color(0x040405);

  const geometry = new PlaneGeometry(1, 1);
  const meshes = [];

  function panel({ w, h, position, rotation, color = 0xffffff, intensity = 1 }) {
    const material = new MeshBasicMaterial({
      color: new Color(color).multiplyScalar(intensity),
      side: DoubleSide,
      toneMapped: false,
    });
    const mesh = new Mesh(geometry, material);
    mesh.scale.set(w, h, 1);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    env.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  // long overhead strip: the dial's long highlight
  panel({
    w: 9,
    h: 1.35,
    position: [0, 5.2, 1.4],
    rotation: [Math.PI / 2, 0, 0],
    intensity: 7.5,
  });

  // two vertical flanks: the case's brushed falloff
  panel({
    w: 2.4,
    h: 6.5,
    position: [-4.6, 0.6, 2.4],
    rotation: [0, Math.PI / 2, 0],
    intensity: 5.4,
  });
  panel({
    w: 2.0,
    h: 6,
    position: [4.4, 0.2, 1.2],
    rotation: [0, -Math.PI / 2, 0],
    intensity: 4.2,
  });

  // warm bounce card: keeps rose gold from going grey
  panel({
    w: 4.2,
    h: 1.5,
    position: [1.1, -3.8, 2.6],
    rotation: [-Math.PI / 2, 0, 0],
    color: 0xffd2b8,
    intensity: 0.7,
  });

  // front strips: define the bezel and crown, not just the silhouette
  panel({
    w: 4.2,
    h: 0.7,
    position: [0.6, 2.4, 4.6],
    rotation: [0, Math.PI, 0],
    intensity: 2.2,
  });
  panel({
    w: 3,
    h: 0.8,
    position: [0, -2.9, 4.2],
    rotation: [0, Math.PI, 0],
    intensity: 1.15,
  });
  panel({
    w: 0.8,
    h: 1.8,
    position: [2.6, 0.8, 4.2],
    rotation: [0, Math.PI, 0],
    intensity: 1.7,
  });
  panel({
    w: 1.6,
    h: 2.6,
    position: [4.4, 0.4, 1.5],
    rotation: [0, Math.PI / 2, 0],
    intensity: 4.6,
  });

  // narrow rim behind the watch: the caseback edge
  panel({
    w: 1.2,
    h: 5.2,
    position: [-1.4, 0.4, -4.6],
    rotation: [0, 0, 0],
    intensity: 2.6,
  });
  panel({
    w: 3.6,
    h: 0.5,
    position: [0.8, 3.6, -3.4],
    rotation: [0, 0, 0],
    intensity: 1.8,
  });

  const pmrem = new PMREMGenerator(renderer);
  pmrem.compileCubemapShader();
  const renderTarget = pmrem.fromScene(env, 0.1, 0.1, 100);
  pmrem.dispose();

  meshes.forEach((mesh) => mesh.material.dispose());
  geometry.dispose();
  env.clear();

  return renderTarget.texture;
}
