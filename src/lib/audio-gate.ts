/**
 * audio-gate.ts
 * Core audio processing logic for YELLM
 * Handles Web Audio API, decibel calculation, and threshold detection
 */

export interface AudioGateState {
  decibelLevel: number;
  isActive: boolean;
  isYelling: boolean;
  error: string | null;
}

export class AudioGate {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationFrame: number | null = null;

  private readonly FFT_SIZE = 2048;
  private readonly QUIET_THRESHOLD = 70;
  private readonly YELL_THRESHOLD = 80;

  // Callback for audio level updates
  private onUpdate: ((state: AudioGateState) => void) | null = null;

  private state: AudioGateState = {
    decibelLevel: 0,
    isActive: false,
    isYelling: false,
    error: null
  };

  /**
   * Initialize the audio gate and request microphone access
   */
  async initialize(onUpdate: (state: AudioGateState) => void): Promise<void> {
    this.onUpdate = onUpdate;

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // We want raw volume
          autoGainControl: false    // Disable AGC to get true levels
        }
      });

      // Create audio context
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.FFT_SIZE;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect microphone to analyser
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      // Prepare data array for frequency data
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      this.state.isActive = true;
      this.state.error = null;
      this.notifyUpdate();

      // Start audio processing loop
      this.startProcessing();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.state.error = `Microphone access denied: ${errorMessage}`;
      this.state.isActive = false;
      this.notifyUpdate();
      throw error;
    }
  }

  /**
   * Start the audio processing loop using requestAnimationFrame
   */
  private startProcessing(): void {
    const processAudio = () => {
      if (!this.analyser || !this.dataArray) return;

      // Get frequency data from analyser
      this.analyser.getByteFrequencyData(this.dataArray);

      // Calculate RMS (Root Mean Square) for volume level
      const rms = this.calculateRMS(this.dataArray);

      // Convert to decibels
      const decibels = this.rmsToDecibels(rms);

      // Update state
      this.state.decibelLevel = decibels;
      this.state.isYelling = decibels >= this.YELL_THRESHOLD;

      // Notify callback
      this.notifyUpdate();

      // Continue loop
      this.animationFrame = requestAnimationFrame(processAudio);
    };

    processAudio();
  }

  /**
   * Calculate RMS (Root Mean Square) from frequency data
   */
  private calculateRMS(dataArray: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = dataArray[i] / 255.0; // Normalize to 0-1
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    return rms;
  }

  /**
   * Convert RMS to decibels
   * Formula: dB = 20 * log10(rms)
   * We add an offset to calibrate to realistic dB levels
   */
  private rmsToDecibels(rms: number): number {
    if (rms === 0) return 0;

    // Calculate dB with calibration offset
    // The offset (94) is calibrated to match typical microphone levels
    const db = 20 * Math.log10(rms) + 94;

    // Clamp to reasonable range
    return Math.max(0, Math.min(120, db));
  }

  /**
   * Get the current audio state
   */
  getState(): AudioGateState {
    return { ...this.state };
  }

  /**
   * Get current decibel thresholds
   */
  getThresholds() {
    return {
      quiet: this.QUIET_THRESHOLD,
      yell: this.YELL_THRESHOLD
    };
  }

  /**
   * Notify the callback with current state
   */
  private notifyUpdate(): void {
    if (this.onUpdate) {
      this.onUpdate({ ...this.state });
    }
  }

  /**
   * Stop audio processing and cleanup resources
   */
  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.state.isActive = false;
    this.notifyUpdate();
  }
}

/**
 * Create a singleton instance
 */
export const audioGate = new AudioGate();
