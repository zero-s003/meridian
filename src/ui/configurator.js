const DEFAULTS = { d: 'ob', m: 'st', s: 'bl' };
const VALID = {
  d: ['ob', 'iv', 'ox'],
  m: ['st', 'rg'],
  s: ['bl', 'br'],
};
const PRICE = {
  base: 68000,
  metal: { st: 0, rg: 46000 },
  strap: { bl: 0, br: -2000 },
};

function readHash() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const state = { ...DEFAULTS };
  Object.keys(VALID).forEach((key) => {
    const value = params.get(key);
    if (value && VALID[key].includes(value)) state[key] = value;
  });
  return state;
}

function formatPrice(state) {
  return (PRICE.base + PRICE.metal[state.m] + PRICE.strap[state.s]).toLocaleString('en-US');
}

export function initConfigurator({ onChange }) {
  const form = document.getElementById('config');
  const price = document.getElementById('price');
  const priceLine = price?.closest('.config__price');
  if (priceLine) priceLine.setAttribute('aria-live', 'polite');

  let state = readHash();

  function apply(next, writeHash = true) {
    state = { ...next };
    Object.entries(state).forEach(([key, value]) => {
      const input = form.querySelector(`input[name="${key}"][value="${value}"]`);
      if (input) input.checked = true;
    });
    price.textContent = formatPrice(state);
    onChange(state);
    if (writeHash) {
      const params = new URLSearchParams(state);
      window.history.replaceState(null, '', `#${params.toString()}`);
    }
  }

  form.addEventListener('change', () => {
    const next = {
      d: form.querySelector('input[name="d"]:checked')?.value || DEFAULTS.d,
      m: form.querySelector('input[name="m"]:checked')?.value || DEFAULTS.m,
      s: form.querySelector('input[name="s"]:checked')?.value || DEFAULTS.s,
    };
    apply(next);
  });

  window.addEventListener('hashchange', () => apply(readHash(), false));

  apply(state, false);

  return {
    getState: () => ({ ...state }),
  };
}
