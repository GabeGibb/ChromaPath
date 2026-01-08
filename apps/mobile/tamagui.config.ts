import { createTamagui } from 'tamagui';
import { config } from '@tamagui/config/v3';

export const tamaguiConfig = createTamagui({
  ...config,
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
