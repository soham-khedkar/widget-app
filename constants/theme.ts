/**
 * TruLuv Theme - Monochrome Doodle Style
 * Black and white with hand-drawn, sketchy aesthetic
 */

import { Platform } from 'react-native';

// Monochrome colors
const black = '#000000'
const white = '#FFFFFF'
const grayLight = '#E5E5E5'
const grayMedium = '#999999'
const grayDark = '#333333'

export const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#666666',
    background: '#FFFFFF',
    backgroundGradient: ['#FFFFFF', '#FFFFFF'], // Solid white
    surface: '#F5F5F5',
    tint: black,
    icon: '#000000',
    tabIconDefault: '#999999',
    tabIconSelected: black,
    primary: black,
    secondary: grayDark,
    accent: grayMedium,
    border: '#E0E0E0',
    error: '#000000',
    success: '#000000',
    paperOverlay: 'rgba(0, 0, 0, 0.05)',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    background: '#000000',
    backgroundGradient: ['#000000', '#000000'], // Solid black
    surface: '#1A1A1A',
    tint: white,
    icon: '#FFFFFF',
    tabIconDefault: '#666666',
    tabIconSelected: white,
    primary: white,
    secondary: grayLight,
    accent: grayMedium,
    border: '#333333',
    error: '#FFFFFF',
    success: '#FFFFFF',
    paperOverlay: 'rgba(255, 255, 255, 0.05)',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
