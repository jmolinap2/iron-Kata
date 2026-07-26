import { createContext, createElement, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { resolveVisibleStyle, resolveVisibleTheme, type AppStyle, type AppTheme } from './types';

type AccentPalette = {
  primary: string;
  primaryStrong: string;
  primaryDark: string;
  primaryBorder: string;
  primarySoftBackground: string;
  gradientStart: string;
  gradientEnd: string;
  heroOverlayStart: string;
  heroOverlayMiddle: string;
};

type BaseColors = {
  background: string;
  backgroundSoft: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  navigation: string;
  border: string;
  borderSoft: string;
  success: string;
  successSurface: string;
  successBorder: string;
  warning: string;
  warningSurface: string;
  warningBorder: string;
  danger: string;
  dangerSurface: string;
  text: string;
  textOnImage: string;
  textMuted: string;
  textDim: string;
  black: string;
  white: string;
};

export type ThemeColors = BaseColors & AccentPalette;
type StyleValue = ViewStyle | TextStyle | ImageStyle;

// Hero overlay compartido: el hero de Inicio siempre es una foto con texto
// claro encima, independiente del estilo general — no hace falta una
// variante clara para esto.
const heroOverlay: Record<AppTheme, Pick<AccentPalette, 'heroOverlayStart' | 'heroOverlayMiddle'>> = {
  Lima: { heroOverlayStart: 'rgba(2, 15, 7, 0.98)', heroOverlayMiddle: 'rgba(3, 23, 9, 0.72)' },
  Esmeralda: { heroOverlayStart: 'rgba(2, 15, 9, 0.98)', heroOverlayMiddle: 'rgba(3, 27, 15, 0.72)' },
  Cobalto: { heroOverlayStart: 'rgba(3, 10, 20, 0.98)', heroOverlayMiddle: 'rgba(4, 18, 34, 0.72)' },
  Ámbar: { heroOverlayStart: 'rgba(22, 13, 3, 0.98)', heroOverlayMiddle: 'rgba(38, 22, 4, 0.72)' },
};

const accentPalettes: Record<AppStyle, Record<AppTheme, AccentPalette>> = {
  Oscuro: {
    Lima: {
      primary: '#A7F20A', primaryStrong: '#8DDB00', primaryDark: '#173507',
      primaryBorder: '#16472D', primarySoftBackground: '#0D1208',
      gradientStart: '#B8FF18', gradientEnd: '#8CE600', ...heroOverlay.Lima,
    },
    Esmeralda: {
      primary: '#35E87A', primaryStrong: '#16C861', primaryDark: '#0B3A23',
      primaryBorder: '#15603C', primarySoftBackground: '#07130D',
      gradientStart: '#4DF091', gradientEnd: '#1BCB67', ...heroOverlay.Esmeralda,
    },
    Cobalto: {
      primary: '#4AA8FF', primaryStrong: '#2187E8', primaryDark: '#0C2A46',
      primaryBorder: '#1B5A86', primarySoftBackground: '#07111A',
      gradientStart: '#65B8FF', gradientEnd: '#2B8EF0', ...heroOverlay.Cobalto,
    },
    Ámbar: {
      primary: '#FFC247', primaryStrong: '#F29C1F', primaryDark: '#472B06',
      primaryBorder: '#74501A', primarySoftBackground: '#171005',
      gradientStart: '#FFD36B', gradientEnd: '#F5A623', ...heroOverlay.Ámbar,
    },
  },
  // Badges e íconos ya no pueden ser un tinte casi negro sobre una tarjeta
  // blanca — acá `primaryDark`/`primarySoftBackground` son tintes pálidos
  // del acento en vez de fondos oscuros.
  Bento: {
    Lima: {
      primary: '#5E8B00', primaryStrong: '#4C7300', primaryDark: '#EAF7CE',
      primaryBorder: '#CDEAA0', primarySoftBackground: '#F3FBE6',
      gradientStart: '#9FE83A', gradientEnd: '#6FBE00', ...heroOverlay.Lima,
    },
    Esmeralda: {
      primary: '#0E9F56', primaryStrong: '#0B8747', primaryDark: '#DDF7E9',
      primaryBorder: '#A9E9C6', primarySoftBackground: '#EAFBF2',
      gradientStart: '#3EDB8A', gradientEnd: '#0FA75C', ...heroOverlay.Esmeralda,
    },
    Cobalto: {
      primary: '#2F7DE0', primaryStrong: '#2568BE', primaryDark: '#DEEBFC',
      primaryBorder: '#AECFF6', primarySoftBackground: '#EAF3FE',
      gradientStart: '#5CA6FF', gradientEnd: '#1E6FD8', ...heroOverlay.Cobalto,
    },
    Ámbar: {
      primary: '#C9820A', primaryStrong: '#A96B06', primaryDark: '#FBEBD2',
      primaryBorder: '#F0CE8E', primarySoftBackground: '#FDF5E7',
      gradientStart: '#FFC15A', gradientEnd: '#E89416', ...heroOverlay.Ámbar,
    },
  },
};

const baseColorsByStyle: Record<AppStyle, BaseColors> = {
  Oscuro: {
    background: '#050708', backgroundSoft: '#090C0E', surface: '#111518',
    surfaceRaised: '#171B1E', surfaceMuted: '#202428', navigation: '#0B0E10',
    border: '#30363B', borderSoft: '#252A2E',
    success: '#7CE000', successSurface: '#14220A', successBorder: '#365A12',
    warning: '#FFC928', warningSurface: '#19180E', warningBorder: '#51420B',
    danger: '#FF5B65', dangerSurface: '#22100F',
    text: '#F6F7F8', textOnImage: '#D7DADB', textMuted: '#A7ABB0', textDim: '#737980',
    black: '#050505', white: '#FFFFFF',
  },
  Bento: {
    background: '#F1F2F5', backgroundSoft: '#FFFFFF', surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF', surfaceMuted: '#EEF0F3', navigation: '#FFFFFF',
    border: '#E7E9ED', borderSoft: '#F0F1F4',
    success: '#1FA463', successSurface: '#E7F7EF', successBorder: '#BEEBD3',
    warning: '#B87A0A', warningSurface: '#FDF3E1', warningBorder: '#F3DFAF',
    danger: '#DB4437', dangerSurface: '#FBEAE8',
    text: '#14161A', textOnImage: '#F6F7F8', textMuted: '#6B7280', textDim: '#9CA3AF',
    black: '#050505', white: '#FFFFFF',
  },
};

export const themeOptions = [
  { name: 'Lima', label: 'Lima eléctrico', description: 'El carácter original de Iron Kata.' },
  { name: 'Esmeralda', label: 'Esmeralda', description: 'Energía limpia y equilibrada.' },
  { name: 'Cobalto', label: 'Cobalto', description: 'Un acento frío y concentrado.' },
  { name: 'Ámbar', label: 'Ámbar', description: 'Potencia cálida y deportiva.' },
] satisfies { name: AppTheme; label: string; description: string }[];

export const styleOptions = [
  { name: 'Oscuro', label: 'Oscuro', description: 'El look original de Iron Kata.' },
  { name: 'Bento', label: 'Bento claro', description: 'Tarjetas blancas, fondo claro, estilo dashboard.' },
] satisfies { name: AppStyle; label: string; description: string }[];

export function getThemePalette(theme: AppTheme, style: AppStyle = 'Oscuro'): AccentPalette {
  return accentPalettes[style][theme];
}

export function getStyleBaseColors(style: AppStyle): BaseColors {
  return baseColorsByStyle[style];
}

export function resolveTheme(theme: AppTheme, style: AppStyle): ThemeColors {
  return { ...baseColorsByStyle[style], ...accentPalettes[style][theme] };
}

type ThemeContextValue = {
  colors: ThemeColors;
  theme: AppTheme;
  previewTheme: AppTheme | null;
  setPreviewTheme: (theme: AppTheme) => void;
  clearPreviewTheme: () => void;
  style: AppStyle;
  previewStyle: AppStyle | null;
  setPreviewStyle: (style: AppStyle) => void;
  clearPreviewStyle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ savedTheme, savedStyle, children }: PropsWithChildren<{ savedTheme: AppTheme; savedStyle: AppStyle }>) {
  const [previewTheme, setPreviewThemeState] = useState<AppTheme | null>(null);
  const [previewStyle, setPreviewStyleState] = useState<AppStyle | null>(null);
  const theme = resolveVisibleTheme(savedTheme, previewTheme);
  const style = resolveVisibleStyle(savedStyle, previewStyle);
  const colors = useMemo(() => resolveTheme(theme, style), [theme, style]);
  const setPreviewTheme = useCallback((nextTheme: AppTheme) => setPreviewThemeState(nextTheme), []);
  const clearPreviewTheme = useCallback(() => setPreviewThemeState(null), []);
  const setPreviewStyle = useCallback((nextStyle: AppStyle) => setPreviewStyleState(nextStyle), []);
  const clearPreviewStyle = useCallback(() => setPreviewStyleState(null), []);
  const value = useMemo(
    () => ({ colors, theme, previewTheme, setPreviewTheme, clearPreviewTheme, style, previewStyle, setPreviewStyle, clearPreviewStyle }),
    [colors, theme, previewTheme, setPreviewTheme, clearPreviewTheme, style, previewStyle, setPreviewStyle, clearPreviewStyle],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('Los componentes de Iron Kata requieren ThemeProvider.');
  return context;
}

export function useTheme(): ThemeColors {
  return useThemeContext().colors;
}

export function useThemePreferences() {
  const { theme, previewTheme, setPreviewTheme, clearPreviewTheme, style, previewStyle, setPreviewStyle, clearPreviewStyle } = useThemeContext();
  return { theme, previewTheme, setPreviewTheme, clearPreviewTheme, style, previewStyle, setPreviewStyle, clearPreviewStyle };
}

export function createThemedStyleSheet<T extends Record<string, StyleValue>>(
  createStyles: (colors: ThemeColors) => T,
) {
  return function useThemedStyles(): T {
    const colors = useTheme();
    return useMemo(() => StyleSheet.create(createStyles(colors)), [colors]);
  };
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  huge: 36,
};

export const radius = {
  sm: 10,
  md: 15,
  lg: 20,
  xl: 26,
  pill: 999,
};

export const typography = {
  title: 34,
  heading: 25,
  subheading: 19,
  body: 16,
  small: 13,
  tiny: 11,
};

export const shadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.35,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};
