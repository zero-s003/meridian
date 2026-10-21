import { CanvasTexture, NoColorSpace, SRGBColorSpace, RepeatWrapping } from 'three';

const TAU = Math.PI * 2;

const DIAL_PALETTES = {
  ob: {
    base: '#0f1013',
    light: '#1d1f24',
    ray: '255,255,255',
    rayAlpha: 0.085,
    text: '#d8d1c1',
    tick: 'rgba(214, 207, 192, 0.82)',
    hair: 'rgba(214, 207, 192, 0.18)',
    sub: '#101114',
    subLine: 'rgba(214, 207, 192, 0.16)',
  },
  iv: {
    base: '#ded4bf',
    light: '#efe6d3',
    ray: '80,62,40',
    rayAlpha: 0.07,
    text: '#2b251d',
    tick: 'rgba(40, 34, 27, 0.82)',
    hair: 'rgba(40, 34, 27, 0.22)',
    sub: '#d3c8b1',
    subLine: 'rgba(40, 34, 27, 0.24)',
  },
  ox: {
    base: '#451218',
    light: '#602228',
    ray: '255,210,200',
    rayAlpha: 0.05,
    text: '#e4cdc0',
    tick: 'rgba(228, 205, 192, 0.85)',
    hair: 'rgba(228, 205, 192, 0.2)',
    sub: '#360d12',
    subLine: 'rgba(228, 205, 192, 0.2)',
  },
};

function makeCanvas(size, height = size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = height;
  return canvas;
}

function toTexture(canvas, { srgb = false, repeat = null, anisotropy = 1 } = {}) {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  texture.anisotropy = anisotropy;
  if (repeat) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
  }
  texture.needsUpdate = true;
  return texture;
}

function spacedText(ctx, text, cx, y, spacing) {
  const chars = [...text];
  const widths = chars.map((char) => ctx.measureText(char).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  chars.forEach((char, index) => {
    ctx.fillText(char, x, y);
    x += widths[index] + spacing;
  });
}

function makeDialTexture(size, key, anisotropy = 1) {
  const palette = DIAL_PALETTES[key] || DIAL_PALETTES.ob;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.5;

  ctx.fillStyle = palette.base;
  ctx.fillRect(0, 0, size, size);

  // soft directional sheen so the sunburst has a centre of gravity
  const sheen = ctx.createRadialGradient(cx - size * 0.16, cy - size * 0.2, 0, cx, cy, radius);
  sheen.addColorStop(0, palette.light);
  sheen.addColorStop(0.42, 'rgba(255,255,255,0)');
  sheen.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 1;

  // 720 rays
  for (let i = 0; i < 720; i += 1) {
    const angle = (i / 720) * TAU + (Math.random() - 0.5) * 0.0025;
    const inner = size * (0.035 + Math.random() * 0.055);
    const outer = size * 0.49;
    ctx.strokeStyle = `rgba(${palette.ray}, ${palette.rayAlpha * (0.35 + Math.random() * 1.1)})`;
    ctx.lineWidth = 0.35 + Math.random() * 1.35;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.stroke();
  }

  // fine grain
  for (let i = 0; i < 5200; i += 1) {
    const r = Math.sqrt(Math.random()) * radius * 0.96;
    const a = Math.random() * TAU;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.045)';
    ctx.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.2, 1.2);
  }

  // hairlines
  [0.4, 0.445].forEach((ratio) => {
    ctx.strokeStyle = palette.hair;
    ctx.lineWidth = Math.max(1, size * 0.0007);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * ratio, 0, TAU);
    ctx.stroke();
  });

  // minute track
  for (let i = 0; i < 60; i += 1) {
    const angle = (i / 60) * TAU - Math.PI / 2;
    const major = i % 5 === 0;
    const inner = radius * (major ? 0.452 : 0.464);
    const outer = radius * 0.484;
    ctx.strokeStyle = palette.tick;
    ctx.lineWidth = major ? size * 0.0018 : size * 0.0009;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.stroke();
  }

  ctx.fillStyle = palette.text;

  // brand
  ctx.font = `300 ${size * 0.034}px "Cormorant Garamond", Georgia, serif`;
  spacedText(ctx, 'MERIDIAN', cx, size * 0.235, size * 0.0125);
  ctx.font = `400 ${size * 0.021}px "Noto Serif SC", "Songti SC", serif`;
  spacedText(ctx, '子午', cx, size * 0.281, size * 0.011);

  // subdial
  const subY = size * 0.777;
  const subR = size * 0.108;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, subY, subR, 0, TAU);
  ctx.fillStyle = palette.sub;
  ctx.fill();
  ctx.strokeStyle = palette.subLine;
  ctx.lineWidth = Math.max(1, size * 0.0008);
  ctx.stroke();
  ctx.clip();
  for (let i = 0; i < 46; i += 1) {
    ctx.strokeStyle = palette.subLine;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(cx, subY, (subR * (i + 1)) / 46, 0, TAU);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // subdial minutes
  for (let i = 0; i < 60; i += 1) {
    const angle = (i / 60) * TAU - Math.PI / 2;
    const major = i % 15 === 0;
    const inner = subR * (major ? 0.82 : 0.9);
    ctx.strokeStyle = palette.tick;
    ctx.lineWidth = major ? size * 0.0014 : size * 0.0007;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, subY + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * (subR * 0.96), subY + Math.sin(angle) * (subR * 0.96));
    ctx.stroke();
  }

  // calibre mark above the small seconds
  ctx.fillStyle = palette.text;
  ctx.font = `500 ${size * 0.0115}px "Inter", Arial, sans-serif`;
  spacedText(ctx, 'CALIBRE 01', cx, size * 0.625, size * 0.0048);
  ctx.font = `400 ${size * 0.0095}px "Inter", Arial, sans-serif`;
  spacedText(ctx, 'MANUAL WIND · 72H', cx, size * 0.651, size * 0.0042);
  ctx.font = `400 ${size * 0.0085}px "Inter", Arial, sans-serif`;
  spacedText(ctx, 'SWISS MADE', cx, size * 0.952, size * 0.0038);

  const texture = toTexture(canvas, { srgb: true, anisotropy });
  texture.needsUpdate = true;
  return texture;
}

function makeBrushedTexture(size = 512) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#8a8a8a';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 3400; i += 1) {
    const y = Math.random() * size;
    const alpha = 0.008 + Math.random() * 0.032;
    ctx.strokeStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
    ctx.lineWidth = 0.4 + Math.random() * 1.1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (Math.random() - 0.5) * 1.2);
    ctx.stroke();
  }
  return toTexture(canvas, { repeat: [6, 3] });
}

function makeKnurlTexture(size = 256) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#888888';
  ctx.fillRect(0, 0, size, size);
  for (let x = 0; x < size; x += 8) {
    const gradient = ctx.createLinearGradient(x, 0, x + 8, 0);
    gradient.addColorStop(0, '#585858');
    gradient.addColorStop(0.5, '#d8d8d8');
    gradient.addColorStop(1, '#585858');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, 8, size);
  }
  return toTexture(canvas, { repeat: [12, 1] });
}

function makeGenevaTexture(size = 1024) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#7a7a7a';
  ctx.fillRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(-Math.PI / 4);
  for (let x = -size; x < size; x += 14) {
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(x, -size, 5, size * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(x + 5, -size, 3, size * 2);
  }
  ctx.restore();
  return toTexture(canvas, { repeat: [2, 2] });
}

function makePerlageTexture(size = 512) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#777777';
  ctx.fillRect(0, 0, size, size);
  const step = size / 10;
  for (let y = 0; y < size + step; y += step) {
    for (let x = 0; x < size + step; x += step) {
      const ox = (Math.round(y / step) % 2) * step * 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x + ox, y, step * 0.72, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.arc(x + ox, y, step * 0.5, 0, TAU);
      ctx.stroke();
    }
  }
  return toTexture(canvas, { repeat: [3, 3] });
}

function makeLeatherTexture(size = 1024) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b4b4b4';
  ctx.fillRect(0, 0, size, size);

  // alligator scale rows
  const columns = 4;
  const rows = 7;
  const cellW = size / columns;
  const cellH = size / rows;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = column * cellW + cellW * 0.06;
      const y = row * cellH + cellH * 0.08;
      const w = cellW * 0.88;
      const h = cellH * 0.84;
      const radius = cellW * 0.16;
      const shade = 0.78 + Math.random() * 0.16;
      const grain = Math.round(255 * shade);
      ctx.fillStyle = `rgb(${grain},${grain},${grain})`;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,40,40,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, w - 2, h - 2, radius);
      ctx.stroke();
      // scale grain
      for (let i = 0; i < 24; i += 1) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
        ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 2, 2);
      }
    }
  }

  // saddle stitching near both edges (u is width)
  ctx.setLineDash([size * 0.012, size * 0.012]);
  ctx.lineWidth = size * 0.007;
  ctx.strokeStyle = 'rgba(228,220,200,0.62)';
  [size * 0.09, size * 0.91].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  return toTexture(canvas, { repeat: [1, 6] });
}

function makeRehautTexture() {
  const width = 2048;
  const height = 96;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4d4d4d';
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 60; i += 1) {
    const x = (i / 60) * width;
    const major = i % 5 === 0;
    const w = major ? 4 : 2;
    const h = major ? height * 0.62 : height * 0.34;
    ctx.fillStyle = major ? 'rgba(240,238,232,0.92)' : 'rgba(220,216,206,0.62)';
    ctx.fillRect(x, height * 0.5 - h / 2, w, h);
  }
  return toTexture(canvas, { srgb: true });
}

export function createTextures({ dialSize = 1024, anisotropy = 1 } = {}) {
  const dials = new Map();

  function dial(key) {
    if (!dials.has(key)) {
      dials.set(key, makeDialTexture(dialSize, key, anisotropy));
    }
    return dials.get(key);
  }

  return {
    dial,
    brushed: makeBrushedTexture(),
    knurl: makeKnurlTexture(),
    geneva: makeGenevaTexture(),
    perlage: makePerlageTexture(),
    leather: makeLeatherTexture(),
    rehaut: makeRehautTexture(),
    anisotropy,
  };
}

export const DIAL_KEYS = ['ob', 'iv', 'ox'];
