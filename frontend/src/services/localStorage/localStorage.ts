"use client";
// Define all possible storage keys as an enum
enum StorageKey {
  APP_SETTINGS = "app_settings",
  USER_PREFERENCES = "user_preferences", // Example of another key
}

// Define all possible settings
interface Settings {
  show_numbers: boolean;
  sound_enabled: boolean;
  // theme: "light" | "dark";
  // fontSize: number;
  // fontFamily: string;
}

// Define other storage data types
// interface UserPreferences {
// 	// language: "en" | "es" | "fr";
// 	// notifications: {
// 	// 	email: boolean;
// 	// 	push: boolean;
// 	// };
// }

// Main storage data type mapping
export interface LocalStorageData {
  [StorageKey.APP_SETTINGS]: Settings;
  // [StorageKey.USER_PREFERENCES]: UserPreferences;
}

// Type for nested paths
type NestedPaths<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? K | `${K}.${NestedPaths<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

export class LocalStorageService {
  public static initializeFields(): void {
    if (typeof window === "undefined") return;

    // Initialize settings
    const defaultSettings: Settings = {
      show_numbers: true,
      sound_enabled: true,
      // Add other default settings here
    };

    // Get current settings from storage
    const storedSettings = this.getSettings();

    if (!storedSettings) {
      // If no settings exist at all, initialize with defaults
      this.setSettings(defaultSettings);
      return;
    }

    // Check for missing fields by comparing with default settings
    let hasUpdates = false;
    const updatedSettings: Partial<Settings> = {};

    // Iterate through default settings to find missing fields
    (Object.keys(defaultSettings) as Array<keyof Settings>).forEach((key) => {
      if (!(key in storedSettings)) {
        hasUpdates = true;
        updatedSettings[key] = defaultSettings[key];
      }
    });

    // Only update if there are missing fields
    if (hasUpdates) {
      this.setSettings({
        ...storedSettings,
        ...updatedSettings,
      });
    }
  }

  private static parseKey(key: string): { mainKey: string; subPath: string[] } {
    const [mainKey, ...subPath] = key.split(".");
    return { mainKey, subPath };
  }

  private static getNestedValue<T>(obj: T, path: string[]): unknown {
    return path.reduce(
      (acc, part) => acc && (acc as Record<string, unknown>)[part],
      obj as unknown
    );
  }

  private static setNestedValue<T>(
    obj: T,
    path: string[],
    value: unknown
  ): void {
    path.reduce((acc, part, index) => {
      if (index === path.length - 1) {
        (acc as Record<string, unknown>)[part] = value;
      } else {
        (acc as Record<string, unknown>)[part] =
          (acc as Record<string, unknown>)[part] || {};
      }
      return (acc as Record<string, unknown>)[part];
    }, obj as unknown);
  }

  static getItem<K extends keyof LocalStorageData>(
    key: K | `${K}.${NestedPaths<LocalStorageData[K]>}`
  ): LocalStorageData[K] | null {
    if (typeof window === "undefined") return null;

    const { mainKey, subPath } = this.parseKey(key as string);
    const item = localStorage.getItem(mainKey);
    if (!item) return null;

    const parsedItem = JSON.parse(item);
    return subPath.length
      ? (this.getNestedValue(parsedItem, subPath) as LocalStorageData[K])
      : (parsedItem as LocalStorageData[K]);
  }

  static setItem<K extends keyof LocalStorageData>(
    key: K | `${K}.${NestedPaths<LocalStorageData[K]>}`,
    value: Partial<LocalStorageData[K]>
  ): void {
    if (typeof window === "undefined") return;

    const { mainKey, subPath } = this.parseKey(key as string);
    const item = localStorage.getItem(mainKey);
    const parsedItem: Record<string, unknown> = item ? JSON.parse(item) : {};

    if (subPath.length) {
      this.setNestedValue(parsedItem, subPath, value);
    } else {
      Object.assign(parsedItem, value);
    }

    localStorage.setItem(mainKey, JSON.stringify(parsedItem));
  }

  static getSettings(): Settings | null {
    return this.getItem(StorageKey.APP_SETTINGS);
  }

  static setSettings(settings: Partial<Settings>): void {
    this.setItem(StorageKey.APP_SETTINGS, settings);
  }
}

// Initialize fields only on client side
if (typeof window !== "undefined") {
  LocalStorageService.initializeFields();
}
