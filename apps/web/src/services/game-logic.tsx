// Re-export the game logic from the shared package
import { ChromaPathGame as BaseChromaPathGame, GameServices } from "@chromapath/game-logic";
import type { SoundContextType } from "./sound/SoundContext";

// Wrapper class for backwards compatibility with web's SoundContextType
export class ChromaPathGame extends BaseChromaPathGame {
  constructor(soundService: SoundContextType) {
    super({
      sound: {
        soundEnabled: soundService.soundEnabled,
        playSoftClick: soundService.playSoftClick,
        playHardClick: soundService.playHardClick,
        playSuccessSound: soundService.playSuccessSound,
      },
    });
  }

  public updateSoundService(soundService: SoundContextType): void {
    this.updateServices({
      sound: {
        soundEnabled: soundService.soundEnabled,
        playSoftClick: soundService.playSoftClick,
        playHardClick: soundService.playHardClick,
        playSuccessSound: soundService.playSuccessSound,
      },
    });
  }
}

// Re-export types
export type { GameServices };
