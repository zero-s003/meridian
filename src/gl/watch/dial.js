import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  Shape,
  TorusGeometry,
} from 'three';
import { handGeometry, roundedRectShape } from './shapes.js';

export function buildDial({ materials }) {
  const group = new Group();

  const surface = new Mesh(new CircleGeometry(1.66, 128), materials.dial);
  surface.position.z = 0.238;
  group.add(surface);

  const rehautGeometry = new CylinderGeometry(1.673, 1.673, 0.08, 128, 1, true);
  rehautGeometry.rotateX(Math.PI / 2);
  const rehaut = new Mesh(rehautGeometry, materials.rehaut);
  rehaut.position.z = 0.245;
  group.add(rehaut);

  // applied indices
  const indexGeometry = new ExtrudeGeometry(roundedRectShape(0.055, 0.24, 0.012), {
    depth: 0.028,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 2,
    curveSegments: 6,
  });
  const thinIndexGeometry = new ExtrudeGeometry(roundedRectShape(0.042, 0.22, 0.01), {
    depth: 0.028,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 2,
    curveSegments: 6,
  });

  for (let hour = 0; hour < 12; hour += 1) {
    const angle = (hour / 12) * Math.PI * 2;
    const isTwelve = hour === 0;
    if (isTwelve) {
      [-0.043, 0.043].forEach((offset) => {
        const index = new Mesh(thinIndexGeometry, materials.roseGold);
        const a = offset;
        index.position.set(Math.sin(a) * 1.33, Math.cos(a) * 1.33, 0.252);
        index.rotation.z = -a;
        group.add(index);
      });
      continue;
    }
    const index = new Mesh(indexGeometry, materials.roseGold);
    index.position.set(Math.sin(angle) * 1.33, Math.cos(angle) * 1.33, 0.252);
    index.rotation.z = -angle;
    group.add(index);
  }

  // small seconds rim
  const subRim = new Mesh(new TorusGeometry(0.356, 0.005, 8, 72), materials.polished);
  subRim.position.set(0, -0.92, 0.25);
  group.add(subRim);

  // hands
  const hourHand = new Mesh(handGeometry(1.0, 0.112), materials.handMetal);
  hourHand.position.z = 0.298;
  group.add(hourHand);

  const minuteHand = new Mesh(handGeometry(1.44, 0.082), materials.handMetal);
  minuteHand.position.z = 0.315;
  group.add(minuteHand);

  const seconds = new Group();
  const secondsStem = new Mesh(new BoxGeometry(0.015, 1.46, 0.012), materials.handMetal);
  secondsStem.position.y = 0.66;
  const secondsTail = new Mesh(new BoxGeometry(0.015, 0.24, 0.012), materials.handMetal);
  secondsTail.position.y = -0.16;
  const secondsWeight = new Mesh(new CylinderGeometry(0.05, 0.05, 0.014, 20), materials.handMetal);
  secondsWeight.rotation.x = Math.PI / 2;
  secondsWeight.position.y = -0.27;
  seconds.add(secondsStem, secondsTail, secondsWeight);
  seconds.position.z = 0.333;
  group.add(seconds);

  const subSeconds = new Group();
  const subHand = new Mesh(new BoxGeometry(0.012, 0.32, 0.009), materials.handMetal);
  subHand.position.y = 0.135;
  subSeconds.add(subHand);
  subSeconds.position.set(0, -0.92, 0.305);
  group.add(subSeconds);

  const cap = new Mesh(new CylinderGeometry(0.07, 0.072, 0.036, 24), materials.roseGold);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = 0.347;
  group.add(cap);

  return { group, hands: { hour: hourHand, minute: minuteHand, seconds, subSeconds } };
}
