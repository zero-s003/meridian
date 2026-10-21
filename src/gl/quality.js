export function detectTier() {
  const forced = new URLSearchParams(window.location.search).get('tier');
  if (['A', 'B', 'C'].includes(forced)) return forced;

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.matchMedia('(max-width: 900px)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 8;

  if (cores <= 3 || memory <= 4) return 'C';
  if (coarse || narrow || cores <= 6) return 'B';
  return 'A';
}

export function tierSettings(tier) {
  return {
    A: { dpr: 1.75, transmission: true, bloom: true, radial: 160, dialSize: 2048 },
    B: { dpr: 1.5, transmission: false, bloom: false, radial: 96, dialSize: 1024 },
    C: { dpr: 1.0, transmission: false, bloom: false, radial: 64, dialSize: 1024 },
  }[tier];
}
