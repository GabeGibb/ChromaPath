"use client";
import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
} from "react";
import { useSetting } from "../localStorage/SettingsContext";

// Sound file paths - using public directory paths
const SOFT_CLICK = "/mouse-click-low.wav";
const HARD_CLICK = "/light-switch-tap.wav";
const SUCCESS = "/single-key-press.wav";

export interface SoundContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playSoftClick: () => void;
  playHardClick: () => void;
  playSuccessSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  const [soundEnabled, setSoundEnabled] = useSetting("sound_enabled");

  // Use refs to persist audio elements across renders
  const softClickAudio = useRef<HTMLAudioElement | null>(null);
  const hardClickAudio = useRef<HTMLAudioElement | null>(null);
  const successAudio = useRef<HTMLAudioElement | null>(null);
  const initialized = useRef(false);

  const initializeAudio = useCallback(() => {
    if (initialized.current || typeof window === "undefined") return;
    softClickAudio.current = new Audio(SOFT_CLICK);
    hardClickAudio.current = new Audio(HARD_CLICK);
    successAudio.current = new Audio(SUCCESS);
    initialized.current = true;
  }, []);

  const playSoftClick = useCallback(() => {
    if (!soundEnabled) return;
    if (!initialized.current) initializeAudio();
    const audio = softClickAudio.current;
    if (!audio) return;
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {}
  }, [soundEnabled, initializeAudio]);

  const playHardClick = useCallback(() => {
    if (!soundEnabled) return;
    if (!initialized.current) initializeAudio();
    const audio = hardClickAudio.current;
    if (!audio) return;
    try {
      audio.currentTime = 0;
      audio.volume = 0.8;
      audio.play().catch(() => {});
    } catch {}
  }, [soundEnabled, initializeAudio]);

  const playSuccessSound = useCallback(() => {
    if (!soundEnabled) return;
    if (!initialized.current) initializeAudio();
    const audio = successAudio.current;
    if (!audio) return;
    try {
      audio.currentTime = 0;
      audio.volume = 1.0;
      audio.play().catch(() => {});
    } catch {}
  }, [soundEnabled, initializeAudio]);

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        setSoundEnabled,
        playSoftClick,
        playHardClick,
        playSuccessSound,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used within a SoundProvider");
  return ctx;
};
