export function createAudio() {
  let context = null;
  let noise = null;
  let enabled = false;
  let lastTick = 0;

  function ensure() {
    if (context) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    context = new AudioContext();
    const length = Math.floor(context.sampleRate * 0.06);
    noise = context.createBuffer(1, length, context.sampleRate);
    const channel = noise.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
  }

  async function enable() {
    ensure();
    if (!context) return false;
    if (context.state === 'suspended') await context.resume();
    enabled = true;
    return true;
  }

  function disable() {
    enabled = false;
  }

  function isEnabled() {
    return enabled;
  }

  function ratchet(strength = 1) {
    if (!enabled || !context || !noise) return;
    const now = context.currentTime;
    if (now - lastTick < 0.045) return;
    lastTick = now;

    const source = context.createBufferSource();
    source.buffer = noise;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2300 + Math.random() * 500;
    filter.Q.value = 5.5;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.11 * strength, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start(now);
    source.stop(now + 0.06);
  }

  return { enable, disable, isEnabled, ratchet };
}
