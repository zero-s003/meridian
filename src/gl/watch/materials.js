import { DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial } from 'three';

const STEEL = 0xd2d3d3;
const ROSE = 0xb9815f;

export function createWatchMaterials({ tier, textures }) {
  const brushed = new MeshPhysicalMaterial({
    color: STEEL,
    metalness: 1,
    roughness: 0.62,
    roughnessMap: textures.brushed,
    anisotropy: 0.65,
    envMapIntensity: 1.15,
  });

  const polished = new MeshPhysicalMaterial({
    color: STEEL,
    metalness: 1,
    roughness: 0.17,
    clearcoat: 0.2,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.5,
  });

  const caseback = new MeshPhysicalMaterial({
    color: STEEL,
    metalness: 1,
    roughness: 0.52,
    anisotropy: 0.25,
    envMapIntensity: 1.05,
  });

  const crown = new MeshPhysicalMaterial({
    color: STEEL,
    metalness: 1,
    roughness: 0.26,
    bumpMap: textures.knurl,
    bumpScale: 0.006,
    envMapIntensity: 1.35,
  });

  const roseGold = new MeshPhysicalMaterial({
    color: ROSE,
    metalness: 1,
    roughness: 0.3,
    clearcoat: 0.18,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.15,
  });

  const handMetal = new MeshPhysicalMaterial({
    color: 0xd0a27f,
    metalness: 1,
    roughness: 0.14,
    envMapIntensity: 1.5,
  });

  const dial = new MeshPhysicalMaterial({
    map: textures.dial('ob'),
    metalness: 0.72,
    roughness: 0.38,
    anisotropy: 0.45,
    envMapIntensity: 0.7,
  });

  const rehaut = new MeshStandardMaterial({
    map: textures.rehaut,
    color: 0xd7d7d7,
    metalness: 0.9,
    roughness: 0.3,
    side: DoubleSide,
    envMapIntensity: 1.1,
  });

  const crystalFake = new MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.035,
    transparent: true,
    opacity: 0.075,
    envMapIntensity: 2.3,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    side: DoubleSide,
    depthWrite: false,
  });

  const backGlass = new MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.05,
    transparent: true,
    opacity: 0.1,
    envMapIntensity: 1.8,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    side: DoubleSide,
    depthWrite: false,
  });

  const darkInset = new MeshStandardMaterial({
    color: 0x08080a,
    metalness: 0.3,
    roughness: 0.8,
  });

  const plate = new MeshStandardMaterial({
    color: 0x2c2d31,
    metalness: 0.85,
    roughness: 0.55,
    roughnessMap: textures.perlage,
    envMapIntensity: 1,
  });

  const bridge = new MeshPhysicalMaterial({
    color: 0x9b8c75,
    metalness: 0.95,
    roughness: 0.36,
    bumpMap: textures.geneva,
    bumpScale: 0.014,
    envMapIntensity: 1.15,
  });

  const gear = new MeshStandardMaterial({
    color: 0xbf9a72,
    metalness: 1,
    roughness: 0.32,
    envMapIntensity: 1.2,
  });

  const steelDark = new MeshStandardMaterial({
    color: 0x55585e,
    metalness: 1,
    roughness: 0.35,
  });

  const jewel = new MeshPhysicalMaterial({
    color: 0x7f1420,
    metalness: 0.2,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.5,
  });

  const blued = new MeshStandardMaterial({
    color: 0x1c2f4d,
    metalness: 1,
    roughness: 0.26,
  });

  const leather = new MeshPhysicalMaterial({
    map: textures.leather,
    bumpMap: textures.leather,
    bumpScale: 0.018,
    color: 0x171717,
    metalness: 0,
    roughness: 0.64,
    clearcoat: 0.12,
    clearcoatRoughness: 0.52,
    side: DoubleSide,
    envMapIntensity: 0.85,
  });

  return {
    tier,
    brushed,
    polished,
    caseback,
    crown,
    roseGold,
    handMetal,
    dial,
    rehaut,
    crystalFake,
    backGlass,
    darkInset,
    plate,
    bridge,
    gear,
    steelDark,
    jewel,
    blued,
    leather,
  };
}

export function setCaseMetal(materials, key) {
  const color = key === 'rg' ? ROSE : STEEL;
  [materials.brushed, materials.polished, materials.caseback, materials.crown].forEach((material) => {
    material.color.setHex(color);
  });
}

export function setDial(materials, textures, key) {
  materials.dial.map = textures.dial(key);
  materials.dial.metalness = key === 'iv' ? 0.18 : 0.72;
  materials.dial.roughness = key === 'iv' ? 0.42 : 0.38;
  materials.dial.needsUpdate = true;
}

export function setStrap(materials, key) {
  materials.leather.color.setHex(key === 'br' ? 0x64402a : 0x171717);
  materials.leather.roughness = key === 'br' ? 0.72 : 0.64;
}
