// Synthesised sound for Gobble Run, WebAudio only — no audio files, no
// network. One job: short named effects (gobble, jump, pickup, stumble,
// caught, escape) plus a quiet farmyard hum, all mutable with M.

export function createSound() {
  let ctx = null;
  let muted = false;
  let humNodes = null;

  function ensure() {
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      ctx = new AudioContext();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const audio = ensure();
    if (!audio) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audio.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, audio.currentTime + dur);
    gain.gain.setValueAtTime(vol, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + dur + 0.02);
  }

  function noise(dur, vol, lowpass) {
    if (muted) return;
    const audio = ensure();
    if (!audio) return;
    const len = Math.floor(audio.sampleRate * dur);
    const buffer = audio.createBuffer(1, len, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = audio.createBufferSource();
    src.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = audio.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(audio.destination);
    src.start();
  }

  const api = {
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      if (muted) api.stopHum();
      return muted;
    },
    unlock() {
      ensure();
    },
    gobble() {
      tone(320, 0.09, 'square', 0.16, 180);
      setTimeout(() => tone(280, 0.1, 'square', 0.16, 150), 90);
      setTimeout(() => tone(360, 0.12, 'square', 0.14, 200), 190);
    },
    jump() {
      noise(0.16, 0.12, 900);
      tone(300, 0.14, 'sine', 0.1, 560);
    },
    dash() {
      noise(0.2, 0.16, 1600);
    },
    pickup() {
      tone(880, 0.09, 'sine', 0.16);
      setTimeout(() => tone(1320, 0.12, 'sine', 0.14), 70);
    },
    hide() {
      tone(520, 0.1, 'triangle', 0.1, 340);
    },
    stumble() {
      noise(0.22, 0.22, 500);
      tone(140, 0.25, 'sawtooth', 0.16, 70);
    },
    farmerClose() {
      tone(196, 0.16, 'sawtooth', 0.12, 147);
      setTimeout(() => tone(196, 0.16, 'sawtooth', 0.12, 147), 180);
    },
    caught() {
      tone(392, 0.22, 'sawtooth', 0.18, 370);
      setTimeout(() => tone(311, 0.22, 'sawtooth', 0.18, 294), 200);
      setTimeout(() => tone(233, 0.5, 'sawtooth', 0.18, 110), 400);
    },
    escape() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => setTimeout(() => tone(freq, 0.22, 'triangle', 0.18), i * 130));
      setTimeout(() => tone(1319, 0.5, 'triangle', 0.16), 540);
    },
    stageClear() {
      tone(659, 0.14, 'triangle', 0.16);
      setTimeout(() => tone(988, 0.2, 'triangle', 0.16), 120);
    },
    startHum() {
      if (muted || humNodes) return;
      const audio = ensure();
      if (!audio) return;
      const osc = audio.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 110;
      const gain = audio.createGain();
      gain.gain.value = 0.02;
      const lfo = audio.createOscillator();
      lfo.frequency.value = 0.4;
      const lfoGain = audio.createGain();
      lfoGain.gain.value = 0.008;
      lfo.connect(lfoGain).connect(gain.gain);
      osc.connect(gain).connect(audio.destination);
      osc.start();
      lfo.start();
      humNodes = { osc, lfo, gain };
    },
    stopHum() {
      if (!humNodes) return;
      try {
        humNodes.osc.stop();
        humNodes.lfo.stop();
      } catch (e) {
        // already stopped
      }
      humNodes = null;
    },
  };
  return api;
}
