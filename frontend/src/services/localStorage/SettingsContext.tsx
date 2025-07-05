"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

// Define all possible settings
export interface Settings {
  show_numbers: boolean;
  sound_enabled: boolean;
  // theme: "light" | "dark";
  // fontSize: number;
  // fontFamily: string;
}

// Default settings
const defaultSettings: Settings = {
  show_numbers: true,
  sound_enabled: true,
};

// Context type
interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  isLoading: boolean;
}

// Create context
const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

// Provider component
export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem("app_settings");
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        // Merge with defaults to ensure all fields exist
        const mergedSettings = { ...defaultSettings, ...parsedSettings };
        setSettings(mergedSettings);
      } else {
        // Initialize with defaults if no settings exist
        localStorage.setItem("app_settings", JSON.stringify(defaultSettings));
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update settings function
  const updateSettings = (newSettings: Partial<Settings>) => {
    if (typeof window === "undefined") return;

    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      localStorage.setItem("app_settings", JSON.stringify(updatedSettings));
    } catch (error) {
      console.error("Failed to save settings to localStorage:", error);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use settings
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

// Hook for individual settings
export const useSetting = <K extends keyof Settings>(
  key: K
): [Settings[K], (value: Settings[K]) => void] => {
  const { settings, updateSettings } = useSettings();

  const setValue = (value: Settings[K]) => {
    updateSettings({ [key]: value } as Partial<Settings>);
  };

  return [settings[key], setValue];
};
