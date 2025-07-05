"use client";
class SoundService {
  private softClickAudio: HTMLAudioElement | null = null;
  private hardClickAudio: HTMLAudioElement | null = null;
  private successAudio: HTMLAudioElement | null = null;
  private isEnabled: boolean = true;
  private isInitialized: boolean = false;

  constructor() {
    // Don't initialize audio immediately - wait for first use
  }

  private initializeAudio(): void {
    if (this.isInitialized || typeof window === "undefined") return;

    try {
      // Import audio files using Vite's asset handling
      this.softClickAudio = new Audio(
        new URL("../assets/mouse-click-low.wav", import.meta.url).href
      );
      this.hardClickAudio = new Audio(
        new URL("../assets/light-switch-tap.wav", import.meta.url).href
      );
      this.successAudio = new Audio(
        new URL("../assets/single-key-press.wav", import.meta.url).href
      );

      // Preload the audio files
      this.softClickAudio.load();
      this.hardClickAudio.load();

      this.isInitialized = true;
    } catch (error) {
      console.warn("Failed to initialize audio:", error);
    }
  }

  public playSoftClick(): void {
    if (!this.isEnabled) return;

    if (!this.isInitialized) {
      this.initializeAudio();
    }

    if (!this.softClickAudio) return;

    try {
      // Reset the audio to the beginning and play
      this.softClickAudio.currentTime = 0;
      this.softClickAudio.play().catch((error) => {
        console.warn("Failed to play soft click sound:", error);
      });
    } catch (error) {
      console.warn("Error playing soft click sound:", error);
    }
  }

  public playHardClick(): void {
    if (!this.isEnabled) return;

    if (!this.isInitialized) {
      this.initializeAudio();
    }

    if (!this.hardClickAudio) return;

    try {
      // Reset the audio to the beginning and play
      this.hardClickAudio.currentTime = 0;
      this.hardClickAudio.volume = 0.8;
      this.hardClickAudio.play().catch((error) => {
        console.warn("Failed to play hard click sound:", error);
      });
    } catch (error) {
      console.warn("Error playing hard click sound:", error);
    }
  }

  public playSuccessSound(): void {
    if (!this.isEnabled) return;

    if (!this.isInitialized) {
      this.initializeAudio();
    }

    if (!this.successAudio) return;

    try {
      // Reset the audio to the beginning and play
      this.successAudio.currentTime = 0;
      this.successAudio.volume = 1.0;
      this.successAudio.play().catch((error) => {
        console.warn("Failed to play success sound:", error);
      });
    } catch (error) {
      console.warn("Error playing success sound:", error);
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export a singleton instance
export const soundService = new SoundService();
export default soundService;
