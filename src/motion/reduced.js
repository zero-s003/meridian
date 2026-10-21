const query = window.matchMedia('(prefers-reduced-motion: reduce)');

export function prefersReduced() {
  return query.matches;
}

export function onReducedChange(callback) {
  query.addEventListener('change', (event) => callback(event.matches));
}
