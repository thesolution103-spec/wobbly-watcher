class SoundEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isMuted: boolean = false;

  constructor() {
    // We defer initialization until user interaction
  }

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.ctx.createGain();
      this.gainNode.connect(this.ctx.destination);
      this.gainNode.gain.value = 0.3; // Master volume
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.gainNode) {
      this.gainNode.gain.value = muted ? 0 : 0.3;
    }
  }

  // Play a simple waveform sound
  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, volume: number = 1) {
    if (!this.ctx || !this.gainNode || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start(this.ctx.currentTime + startTime);
    osc.stop(this.ctx.currentTime + startTime + duration);
  }

  public playStart() {
    this.init();
    // Happy Major Arpeggio
    this.playTone(440, 'sine', 0.5, 0);       // A4
    this.playTone(554.37, 'sine', 0.5, 0.1);  // C#5
    this.playTone(659.25, 'sine', 0.5, 0.2);  // E5
    this.playTone(880, 'triangle', 0.8, 0.3); // A5
  }

  public playTaunt() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.1);
    osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.2);
    
    const lfo = this.ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 50;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 500;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    lfo.stop(this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.gainNode!); 
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  public playGameOver() {
    if (!this.ctx) return;
    this.playTone(100, 'sawtooth', 1.0, 0, 0.5);
    this.playTone(106, 'sawtooth', 1.0, 0, 0.5); 
    this.playTone(50, 'square', 1.5, 0, 0.5);
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 1.5);
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
    
    osc.connect(gain);
    gain.connect(this.gainNode!);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.5);
  }

  // NEW SOUNDS

  public playBuffPickup() {
    // High pitched magical chime
    this.playTone(880, 'sine', 0.2, 0, 0.3);
    this.playTone(1108, 'sine', 0.2, 0.1, 0.3);
    this.playTone(1320, 'sine', 0.4, 0.2, 0.3);
  }

  public playExplosion() {
    if (!this.ctx) return;
    // Noise buffer for explosion
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Lowpass filter to make it dull/bassy
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode!);
    noise.start();
  }

  public playFuse() {
    // Ticking sound
    this.playTone(600, 'square', 0.05, 0, 0.2);
  }

  public playFreeze() {
    if (!this.ctx) return;
    // Slide down sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(this.gainNode!);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }
}

export const soundEngine = new SoundEngine();