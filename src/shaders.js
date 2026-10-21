export const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: null },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;
      vec2 centered = uv - 0.5;
      float d = length(centered);

      // barely-there colour split; loud fringing reads as video noise
      vec2 off = centered * d * 0.0012;
      float r = texture2D(tDiffuse, uv + off).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - off).b;
      vec3 col = vec3(r, g, b);

      // keep the black and steel palette from going flat after tone mapping
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(luma), col, 1.06);

      // vignette
      float vig = smoothstep(1.02, 0.24, d);
      col *= mix(0.42, 1.0, vig);

      // fine film grain
      float n = hash(uv * uResolution + fract(uTime * 0.37) * 91.0);
      col += (n - 0.5) * 0.02;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};
