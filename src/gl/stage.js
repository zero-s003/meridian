import {
  ACESFilmicToneMapping,
  Color,
  HalfFloatType,
  PerspectiveCamera,
  Scene,
  Vector2,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GradeShader } from '../shaders.js';
import { tierSettings } from './quality.js';

export function createStage(tier) {
  const settings = tierSettings(tier);
  const canvas = document.getElementById('stage');

  const renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.dpr));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = 'srgb';
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new Scene();
  scene.background = new Color(0x0a0a0b);

  const camera = new PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.05, 120);

  const target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    samples: tier === 'A' ? 4 : 0,
  });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));

  const grade = new ShaderPass(GradeShader);
  grade.uniforms.uResolution.value = new Vector2(1, 1);
  composer.addPass(grade);

  composer.addPass(new OutputPass());

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const pixelRatio = renderer.getPixelRatio();
    grade.uniforms.uResolution.value.set(width * pixelRatio, height * pixelRatio);
  }

  resize();

  function render(time) {
    grade.uniforms.uTime.value = time;
    composer.render();
  }

  function setBloom() {
    // Bloom is deliberately disabled: specular highlights should stay crisp.
  }

  function setPixelRatio(ratio) {
    renderer.setPixelRatio(ratio);
    resize();
  }

  return {
    canvas,
    renderer,
    scene,
    camera,
    composer,
    grade,
    resize,
    render,
    setBloom,
    setPixelRatio,
    settings,
  };
}
