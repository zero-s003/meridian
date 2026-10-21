function pad(value) {
  return String(value).padStart(2, '0');
}

export function initHud() {
  const hudTime = document.getElementById('hud-time');
  const dialTime = document.getElementById('dial-time');
  const chapterNumber = document.getElementById('chapter-num');
  const railFill = document.getElementById('rail-fill');
  const railLinks = [...document.querySelectorAll('[data-nav]')];
  const soundButton = document.getElementById('sound-toggle');
  const soundLabel = document.getElementById('sound-label');

  let lastChapter = -1;

  function tick() {
    const now = new Date();
    const text = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    if (hudTime) hudTime.textContent = text;
    if (dialTime) dialTime.textContent = text;
    if (hudTime) hudTime.dateTime = now.toISOString();
    if (dialTime) dialTime.dateTime = now.toISOString();
  }

  tick();
  window.setInterval(tick, 1000);

  function setChapter(index) {
    if (index === lastChapter) return;
    lastChapter = index;
    if (chapterNumber) chapterNumber.textContent = pad(index);
    railLinks.forEach((link) => {
      link.classList.toggle('is-active', Number(link.dataset.nav) === index);
    });
  }

  function setProgress(value) {
    if (railFill) railFill.style.height = `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`;
  }

  function setSound(enabled) {
    if (!soundButton || !soundLabel) return;
    soundButton.setAttribute('aria-pressed', String(enabled));
    soundLabel.textContent = enabled ? 'SOUND ON' : 'SOUND OFF';
  }

  return { tick, setChapter, setProgress, setSound, soundButton };
}
