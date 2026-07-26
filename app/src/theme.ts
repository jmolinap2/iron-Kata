import { createContext, createElement, Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren, type RefObject } from 'react';
import { StyleSheet, View, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

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
  // Vidrio: mismos acentos vívidos que Oscuro (se lucen sobre paneles
  // esmerilados), pero los tonos "de fondo" del acento (badges, bordes) son
  // translúcidos en vez de sólidos para que el vidrio debajo siga viéndose.
  Vidrio: {
    Lima: {
      primary: '#A7F20A', primaryStrong: '#8DDB00', primaryDark: 'rgba(167,242,10,0.16)',
      primaryBorder: 'rgba(167,242,10,0.35)', primarySoftBackground: 'rgba(167,242,10,0.08)',
      gradientStart: '#B8FF18', gradientEnd: '#8CE600', ...heroOverlay.Lima,
    },
    Esmeralda: {
      primary: '#35E87A', primaryStrong: '#16C861', primaryDark: 'rgba(53,232,122,0.16)',
      primaryBorder: 'rgba(53,232,122,0.35)', primarySoftBackground: 'rgba(53,232,122,0.08)',
      gradientStart: '#4DF091', gradientEnd: '#1BCB67', ...heroOverlay.Esmeralda,
    },
    Cobalto: {
      primary: '#4AA8FF', primaryStrong: '#2187E8', primaryDark: 'rgba(74,168,255,0.16)',
      primaryBorder: 'rgba(74,168,255,0.35)', primarySoftBackground: 'rgba(74,168,255,0.08)',
      gradientStart: '#65B8FF', gradientEnd: '#2B8EF0', ...heroOverlay.Cobalto,
    },
    Ámbar: {
      primary: '#FFC247', primaryStrong: '#F29C1F', primaryDark: 'rgba(255,194,71,0.16)',
      primaryBorder: 'rgba(255,194,71,0.35)', primarySoftBackground: 'rgba(255,194,71,0.08)',
      gradientStart: '#FFD36B', gradientEnd: '#F5A623', ...heroOverlay.Ámbar,
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
  // Base oscura + tokens de "superficie" translúcidos: cualquier contenedor
  // que use colors.surface/navigation/etc directamente ya se ve vidrioso sin
  // código extra. Card y la barra de pestañas suman además un BlurView real
  // (ver ui.tsx / AppNavigator.tsx) que desenfoca lo que hay detrás.
  Vidrio: {
    background: '#0A0D11', backgroundSoft: '#0D1115', surface: 'rgba(255,255,255,0.06)',
    surfaceRaised: 'rgba(255,255,255,0.10)', surfaceMuted: 'rgba(255,255,255,0.04)', navigation: 'rgba(9,12,15,0.5)',
    border: 'rgba(255,255,255,0.16)', borderSoft: 'rgba(255,255,255,0.09)',
    success: '#7CE000', successSurface: 'rgba(124,224,0,0.12)', successBorder: 'rgba(124,224,0,0.32)',
    warning: '#FFC928', warningSurface: 'rgba(255,201,40,0.12)', warningBorder: 'rgba(255,201,40,0.32)',
    danger: '#FF5B65', dangerSurface: 'rgba(255,91,101,0.14)',
    text: '#F6F7F8', textOnImage: '#F6F7F8', textMuted: '#B7BBC0', textDim: '#83898F',
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
  { name: 'Vidrio', label: 'Vidrio', description: 'Paneles esmerilados translúcidos, estilo Apple.' },
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

// El vidrio esmerilado en Android (`dimezisBlurView`) desenfoca un
// `BlurTargetView` con nombre, no "lo que está atrás" en pantalla — por eso
// todos los BlurView de la app (Card, HelpSheet, la barra de pestañas)
// comparten esta única referencia, montada una sola vez arriba de todo, con
// un "mesh" de manchas de color con deriva lenta que le dan textura viva al
// desenfoque (el blur nativo ya recalcula cada frame de por sí en Android,
// así que animar el fondo no le suma costo real).
const GlassBackdropContext = createContext<RefObject<View | null> | null>(null);

type BlobSpec = { key: string; color: string; size: number; top?: number | `${number}%`; bottom?: number | `${number}%`; left?: number | `${number}%`; right?: number | `${number}%`; opacity: number; driftX: number; driftY: number; duration: number };

function GlassBlob({ color, size, top, bottom, left, right, opacity, driftX, driftY, duration }: BlobSpec) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [duration, t]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (t.value - 0.5) * 2 * driftX },
      { translateY: (t.value - 0.5) * 2 * driftY },
    ],
  }));
  return createElement(
    Animated.View,
    { style: [{ position: 'absolute', width: size, height: size, borderRadius: size / 2, top, bottom, left, right, opacity }, animatedStyle] },
    createElement(LinearGradient, { colors: [color, 'transparent'], style: StyleSheet.absoluteFill }),
  );
}

export function GlassBackdropProvider({ children }: PropsWithChildren) {
  const target = useRef<View>(null);
  const colors = useTheme();
  const { style } = useThemePreferences();
  const isGlass = style === 'Vidrio';
  const blobs: BlobSpec[] = [
    { key: 'a', color: colors.gradientStart, size: 420, top: -150, right: -130, opacity: 0.55, driftX: 26, driftY: 18, duration: 13000 },
    { key: 'b', color: colors.gradientEnd, size: 380, bottom: -130, left: -140, opacity: 0.45, driftX: -22, driftY: 24, duration: 15500 },
    { key: 'c', color: colors.primary, size: 300, top: '38%', left: -150, opacity: 0.32, driftX: 18, driftY: -20, duration: 11000 },
    { key: 'd', color: colors.primaryStrong, size: 260, bottom: '22%', right: -120, opacity: 0.3, driftX: -16, driftY: 16, duration: 17000 },
  ];
  return createElement(
    GlassBackdropContext.Provider,
    { value: target },
    createElement(View, { style: styles.glassRoot }, [
      createElement(
        BlurTargetView,
        { key: 'target', ref: target, style: StyleSheet.absoluteFill, pointerEvents: 'none' as const },
        isGlass ? blobs.map(blob => createElement(GlassBlob, blob)) : null,
      ),
      createElement(Fragment, { key: 'content' }, children),
    ]),
  );
}

export function useGlassBackdropTarget(): RefObject<View | null> | undefined {
  return useContext(GlassBackdropContext) ?? undefined;
}

const styles = StyleSheet.create({
  glassRoot: { flex: 1 },
});

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
