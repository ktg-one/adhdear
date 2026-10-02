/**
 * Procedural Focus Audio Engine
 * Zero external audio assets (0 MB footprint, no token drops, no REST polling).
 * Generates synthetic Brown Noise, White Noise, 432Hz Alpha Drone, and 60 BPM Cyber Pulse
 * via the native Web Audio API.
 */

import { AudioTrackType } from '../types/synapse';

class FocusAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentTrack: AudioTrackType = 'brown';
  private isPlaying: boolean = false;
  private activeNodes: Array<{ stop?: () => void; disconnect?: () => void }> = [];
  private pulseTimer: number | null = null;

  public initContext(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
    }
  }

  public stop(): void {
    if (this.pulseTimer) {
      window.clearTimeout(this.pulseTimer);
      this.pulseTimer = null;
    }

    this.activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {
        // Node already cleaned up
      }
    });
    this.activeNodes = [];
    this.isPlaying = false;
  }

  public play(track: AudioTrackType): void {
    this.initContext();
    this.stop();
    this.currentTrack = track;

    if (track === 'off') {
      return;
    }

    this.isPlaying = true;

    switch (track) {
      case 'brown':
        this.generateBrownNoise();
        break;
      case 'white':
        this.generateWhiteNoise();
        break;
      case 'alpha':
        this.generateAlphaDrone();
        break;
      case 'cyber':
        this.generateCyberPulse();
        break;
      default:
        break;
    }
  }

  public toggle(track?: AudioTrackType): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.play(track || this.currentTrack);
      return true;
    }
  }

  public getStatus(): { isPlaying: boolean; currentTrack: AudioTrackType } {
    return { isPlaying: this.isPlaying, currentTrack: this.currentTrack };
  }

  /**
   * Procedural Brown Noise ($1/f^2$ sub-bass rumble)
   * Integrates white noise to attenuate high frequencies, passed through a lowpass filter.
   */
  private generateBrownNoise(): void {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Normalization boost
    }

    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
    this.activeNodes.push(source, filter, gain);
  }

  /**
   * Procedural White Noise (Crisp masking curtain)
   */
  private generateWhiteNoise(): void {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
    this.activeNodes.push(source, filter, gain);
  }

  /**
   * 432Hz Alpha Drone
   * Sine carrier at 432Hz with an octave-down triangle subharmonic and 0.16Hz breathing modulation.
   */
  private generateAlphaDrone(): void {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(432, this.ctx.currentTime);

    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(216, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.16, this.ctx.currentTime); // ~6 second breath cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.28, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(droneGain.gain);

    osc.connect(droneGain);
    subOsc.connect(droneGain);
    droneGain.connect(this.masterGain);

    osc.start();
    subOsc.start();
    lfo.start();

    this.activeNodes.push(osc, subOsc, lfo, lfoGain, droneGain);
  }

  /**
   * 60 BPM Cyber Pulse (Lo-Fi rhythmic heartbeat)
   */
  private generateCyberPulse(): void {
    if (!this.ctx || !this.masterGain) return;

    const scheduleKick = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.frequency.setValueAtTime(105, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);

      this.pulseTimer = window.setTimeout(scheduleKick, 1000);
    };

    scheduleKick();
  }

  /**
   * Celebration chime when completing an atomic action
   */
  public playCelebrationChime(): void {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6 arpeggio

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.18, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.3);
      });
    } catch {
      // Audio permission or unsupported context
    }
  }

  /**
   * Hard-stop emergency cutoff (Instant silence + subtle break tone)
   */
  public triggerHardStopCutoff(): void {
    this.stop();
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.4);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // ignore
    }
  }
}

export const audioEngine = new FocusAudioEngine();
