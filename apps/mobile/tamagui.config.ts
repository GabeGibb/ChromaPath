import { createTamagui, createFont } from 'tamagui';
import { config } from '@tamagui/config/v3';

// Create Comfortaa font configuration
const comfortaaFont = createFont({
  family: 'Comfortaa_400Regular',
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 16,
    6: 18,
    7: 20,
    8: 24,
    9: 32,
    10: 44,
    11: 55,
    12: 62,
    13: 72,
    14: 92,
    15: 114,
    16: 134,
  },
  lineHeight: {
    1: 15,
    2: 17,
    3: 18,
    4: 20,
    5: 22,
    6: 26,
    7: 28,
    8: 32,
    9: 40,
    10: 52,
  },
  weight: {
    1: '300',
    2: '400',
    3: '500',
    4: '600',
    5: '700',
  },
  letterSpacing: {
    1: 0,
    2: -0.5,
    3: -1,
  },
  face: {
    300: { normal: 'Comfortaa_300Light' },
    400: { normal: 'Comfortaa_400Regular' },
    500: { normal: 'Comfortaa_500Medium' },
    600: { normal: 'Comfortaa_600SemiBold' },
    700: { normal: 'Comfortaa_700Bold' },
  },
});

// Monospace font for timer
const monoFont = createFont({
  family: 'Comfortaa_400Regular', // Use Comfortaa for mono too for consistency
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 16,
    6: 18,
    7: 20,
    8: 24,
    9: 32,
    10: 44,
  },
  lineHeight: {
    1: 15,
    2: 17,
    3: 18,
    4: 20,
    5: 22,
    6: 26,
    7: 28,
    8: 32,
    9: 40,
    10: 52,
  },
  weight: {
    1: '400',
    2: '500',
    3: '600',
    4: '700',
  },
  letterSpacing: {
    1: 0,
  },
  face: {
    400: { normal: 'Comfortaa_400Regular' },
    500: { normal: 'Comfortaa_500Medium' },
    600: { normal: 'Comfortaa_600SemiBold' },
    700: { normal: 'Comfortaa_700Bold' },
  },
});

export const tamaguiConfig = createTamagui({
  ...config,
  fonts: {
    ...config.fonts,
    heading: comfortaaFont,
    body: comfortaaFont,
    mono: monoFont,
  },
  themes: {
    ...config.themes,
    dark: {
      ...config.themes.dark,
      background: '#1a1a2e',
      backgroundHover: '#16213e',
      backgroundPress: '#0f3460',
      backgroundFocus: '#16213e',
      color: '#eaeaea',
      colorHover: '#ffffff',
      colorPress: '#cccccc',
      colorFocus: '#ffffff',
      borderColor: '#16213e',
      borderColorHover: '#0f3460',
      borderColorPress: '#e94560',
      borderColorFocus: '#0f3460',
      placeholderColor: '#888888',
      primary: '#e94560',
      secondary: '#0f3460',
    },
    light: {
      ...config.themes.light,
      background: '#f8f9fa',
      backgroundHover: '#e9ecef',
      backgroundPress: '#dee2e6',
      backgroundFocus: '#e9ecef',
      color: '#212529',
      colorHover: '#000000',
      colorPress: '#495057',
      colorFocus: '#000000',
      borderColor: '#dee2e6',
      borderColorHover: '#ced4da',
      borderColorPress: '#e94560',
      borderColorFocus: '#ced4da',
      placeholderColor: '#6c757d',
      primary: '#e94560',
      secondary: '#0f3460',
    },
  },
});

export default tamaguiConfig;

export type AppConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
