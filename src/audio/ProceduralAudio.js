export class ProceduralAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.ready = false;
    this.ambienceStarted = false;
  }

  async unlock() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
      this.noiseBuffer = this._createNoiseBuffer(1.0);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.ready = true;
    if (!this.ambienceStarted) this._startAmbience();
  }

  _createNoiseBuffer(seconds) {
    const length = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    return buffer;
  }

  _env(gain, now, attack, peak, decay, end = 0.0001) {
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + attack);
    gain.gain.exponentialRampToValueAtTime(end, now + attack + decay);
  }

  _tone({ type = "sine", start = 220, end = 110, peak = 0.08, attack = 0.005, decay = 0.18, delay = 0 }) {
    if (!this.ready) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, start), now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, end), now + attack + decay);
    this._env(gain, now, attack, peak, decay);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + attack + decay + 0.03);
  }

  _noise({ filterType = "bandpass", start = 400, end = 800, peak = 0.1, attack = 0.004, decay = 0.16, duration = 0.22, delay = 0 }) {
    if (!this.ready) return;
    const now = this.ctx.currentTime + delay;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(Math.max(1, start), now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(1, end), now + Math.max(0.02, decay));
    const gain = this.ctx.createGain();
    this._env(gain, now, attack, peak, decay);
    source.connect(filter).connect(gain).connect(this.master);
    source.start(now, Math.random() * 0.45, duration);
  }

  playFootstep() {
    this._noise({ start: 130 + Math.random() * 60, end: 180, peak: 0.11, decay: 0.07, duration: 0.09 });
  }

  playSword() {
    this._noise({ filterType: "highpass", start: 850, end: 3000, peak: 0.15, decay: 0.18, duration: 0.24 });
    this._tone({ type: "triangle", start: 520, end: 170, peak: 0.042, attack: 0.004, decay: 0.13, delay: 0.05 });
  }

  playDash() {
    this._noise({ start: 300, end: 1200, peak: 0.13, decay: 0.24, duration: 0.32 });
  }

  playPlayerHurt() {
    this._noise({ start: 280, end: 110, peak: 0.16, decay: 0.12, duration: 0.17 });
    this._tone({ type: "square", start: 120, end: 62, peak: 0.035, decay: 0.18 });
  }

  playEnemySwing() {
    this._noise({ filterType: "bandpass", start: 220, end: 980, peak: 0.17, decay: 0.24, duration: 0.3 });
    this._tone({ type: "sawtooth", start: 150, end: 72, peak: 0.032, decay: 0.22 });
  }

  playEnemyHurt() {
    this._tone({ type: "square", start: 96, end: 48, peak: 0.05, decay: 0.2 });
    this._noise({ start: 180, end: 90, peak: 0.08, decay: 0.14, duration: 0.18 });
  }

  playEnemyPhase() {
    this._tone({ type: "sawtooth", start: 72, end: 128, peak: 0.045, attack: 0.03, decay: 0.55 });
    this._tone({ type: "triangle", start: 108, end: 216, peak: 0.026, attack: 0.03, decay: 0.5, delay: 0.06 });
  }

  playEnemyDefeat() {
    this._noise({ filterType: "lowpass", start: 700, end: 80, peak: 0.19, decay: 0.65, duration: 0.78 });
    this._tone({ type: "sawtooth", start: 110, end: 36, peak: 0.055, attack: 0.01, decay: 0.72 });
  }

  playDefeat() {
    this._tone({ type: "triangle", start: 180, end: 45, peak: 0.05, attack: 0.01, decay: 0.8 });
  }

  playShrine() {
    [110, 165, 220, 330].forEach((frequency, index) => {
      this._tone({ type: index % 2 ? "triangle" : "sine", start: frequency, end: frequency * 1.5, peak: 0.028, attack: 0.12, decay: 1.0, delay: index * 0.08 });
    });
    this._noise({ filterType: "highpass", start: 900, end: 3500, peak: 0.055, attack: 0.08, decay: 0.9, duration: 1.0 });
  }

  _startAmbience() {
    if (!this.ready || this.ambienceStarted) return;
    this.ambienceStarted = true;
    const now = this.ctx.currentTime;

    const wind = this.ctx.createBufferSource();
    wind.buffer = this.noiseBuffer;
    wind.loop = true;
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.value = 620;
    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.018;
    wind.connect(windFilter).connect(windGain).connect(this.master);
    wind.start(now);

    [55, 82.5].forEach((frequency, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = index === 0 ? "sine" : "triangle";
      osc.frequency.value = frequency;
      gain.gain.value = index === 0 ? 0.009 : 0.004;
      osc.connect(gain).connect(this.master);
      osc.start(now);
    });
  }
}
