export function initCursor() {
  const fine = window.matchMedia('(pointer: fine)').matches;
  if (!fine) {
    return { setState() {} };
  }

  const element = document.createElement('div');
  element.className = 'cursor';
  element.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.className = 'cursor__label';
  element.append(label);
  document.body.append(element);
  document.documentElement.classList.add('has-cursor');

  let visible = false;

  window.addEventListener(
    'pointermove',
    (event) => {
      element.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      if (!visible) {
        visible = true;
        element.classList.add('is-visible');
      }
    },
    { passive: true },
  );

  document.addEventListener('pointerleave', () => {
    visible = false;
    element.classList.remove('is-visible');
  });

  function setState(state) {
    element.classList.toggle('is-active', Boolean(state));
    label.textContent = state === 'wind' ? 'WIND' : state === 'drag' ? 'DRAG' : '';
  }

  return { setState };
}
