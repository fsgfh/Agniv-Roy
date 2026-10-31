/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Native Web Audio API ambient soundscape generator
class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private currentTrack: string | null = null;
  private activeNodes: { stop?: () => void; disconnect: () => void }[] = [];
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public stop() {
    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch {
        // ignore already stopped
      }
    });
    this.activeNodes = [];
    this.currentTrack = null;
  }

  public getCurrentTrack(): string | null {
    return this.currentTrack;
  }

  public toggle(soundId: string): boolean {
    if (this.currentTrack === soundId) {
      this.stop();
      return false;
    }
    this.play(soundId);
    return true;
  }

  public play(soundId: string) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.stop();
    this.currentTrack = soundId;

    switch (soundId) {
      case 'gentle_rain':
        this.startRain();
        break;
      case 'ocean_tides':
        this.startOcean();
        break;
      case 'deep_drone':
        this.startDrone();
        break;
      case 'forest_wind':
        this.startWind();
        break;
      case 'warm_chimes':
        this.startChimes();
        break;
      default:
        this.startRain();
    }
  }

  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('No context');
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private startRain() {
    if (!this.ctx || !this.masterGain) return;
    const buffer = this.createNoiseBuffer();
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    this.activeNodes.push(noise, filter, gain);
  }

  private startOcean() {
    if (!this.ctx || !this.masterGain) return;
    const buffer = this.createNoiseBuffer();
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 sec swell
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(280, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    lfo.start();
    this.activeNodes.push(noise, filter, lfo, lfoGain, gain);
  }

  private startWind() {
    if (!this.ctx || !this.masterGain) return;
    const buffer = this.createNoiseBuffer();
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(180, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    lfo.start();
    this.activeNodes.push(noise, filter, lfo, lfoGain, gain);
  }

  private startDrone() {
    if (!this.ctx || !this.masterGain) return;
    const freqs = [110, 164.81, 220, 329.63]; // A major 7th ethereal harmonic
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.18, this.ctx.currentTime);

    freqs.forEach(f => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f + (Math.random() * 0.4 - 0.2), this.ctx.currentTime);
      osc.connect(gainNode);
      osc.start();
      this.activeNodes.push(osc);
    });

    gainNode.connect(this.masterGain);
    this.activeNodes.push(gainNode);
  }

  private startChimes() {
    if (!this.ctx || !this.masterGain) return;
    // Ambient pulsating harmonic tone
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(261.63, this.ctx.currentTime); // C4

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const tremolo = this.ctx.createOscillator();
    tremolo.frequency.setValueAtTime(0.5, this.ctx.currentTime);
    const tremoloGain = this.ctx.createGain();
    tremoloGain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    tremolo.connect(tremoloGain);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    tremoloGain.connect(gain.gain);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    tremolo.start();
    this.activeNodes.push(osc, filter, tremolo, tremoloGain, gain);
  }

  public playResonanceBell() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const pitch = notes[Math.floor(Math.random() * notes.length)];
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.8);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.8);
  }
}

export const soundscape = new SoundscapeEngine();
