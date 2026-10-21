function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

export function createScroll(sections) {
  let tops = [];
  let heights = [];

  const state = {
    active: 0,
    progress: 0,
    pos: 0,
    explode: 0,
    overall: 0,
  };

  function measure() {
    tops = [];
    heights = [];
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      tops.push(rect.top + window.scrollY);
      heights.push(Math.max(rect.height, 1));
    });
  }

  function read() {
    if (!tops.length) return state;

    const centre = window.scrollY + window.innerHeight * 0.5;
    let active = sections.length - 1;

    for (let index = 0; index < sections.length; index += 1) {
      if (centre >= tops[index] && centre < tops[index] + heights[index]) {
        active = index;
        break;
      }
      if (centre < tops[index]) {
        active = Math.max(0, index - 1);
        break;
      }
    }

    const progress = clamp((centre - tops[active]) / heights[active], 0, 1);
    const pos = active + smoothstep((progress - 0.55) / 0.45);

    let explode = 0;
    if (active === 4) {
      const open = smoothstep((progress - 0.08) / 0.3);
      const close = smoothstep((progress - 0.64) / 0.3);
      explode = open * (1 - close);
    }

    const end = tops[tops.length - 1] + heights[heights.length - 1];
    state.active = active;
    state.progress = progress;
    state.pos = pos;
    state.explode = explode;
    state.overall = clamp((centre - tops[0]) / Math.max(1, end - tops[0]), 0, 1);
    return state;
  }

  measure();
  window.addEventListener('resize', measure, { passive: true });

  return { state, measure, read };
}
