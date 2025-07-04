class SoundService {
  private softClickAudio: HTMLAudioElement | null = null;
  private hardClickAudio: HTMLAudioElement | null = null;
  private successAudio: HTMLAudioElement | null = null;
  private isEnabled: boolean = true;
  private lastSoftClickTime: number = 0;
  private lastHardClickTime: number = 0;
  private readonly SOFT_CLICK_DEBOUNCE = 50; // 50ms debounce
  private readonly HARD_CLICK_DEBOUNCE = 100; // 100ms debounce

  constructor() {
    this.initializeAudio();
  }

  private initializeAudio(): void {
    try {
      // Import audio files using Vite's asset handling
      this.softClickAudio = new Audio(
        new URL("../assets/mouse-click.wav", import.meta.url).href
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
    } catch (error) {
      console.warn("Failed to initialize audio:", error);
    }
  }

  public playSoftClick(): void {
    if (!this.isEnabled || !this.softClickAudio) return;

    const now = Date.now();
    if (now - this.lastSoftClickTime < this.SOFT_CLICK_DEBOUNCE) return;
    this.lastSoftClickTime = now;

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
    if (!this.isEnabled || !this.hardClickAudio) return;

    const now = Date.now();
    if (now - this.lastHardClickTime < this.HARD_CLICK_DEBOUNCE) return;
    this.lastHardClickTime = now;

    try {
      // Reset the audio to the beginning and play
      this.hardClickAudio.currentTime = 0;
      this.hardClickAudio.play().catch((error) => {
        console.warn("Failed to play hard click sound:", error);
      });
    } catch (error) {
      console.warn("Error playing hard click sound:", error);
    }
  }

  public playSuccessSound(): void {
    if (!this.isEnabled || !this.successAudio) return;

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
