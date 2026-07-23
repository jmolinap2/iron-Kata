import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing, typography } from '../theme';

export function Screen({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <SafeAreaView edges={['top']} style={[styles.screen, style]}>{children}</SafeAreaView>;
}

export function AppScrollView({ children, contentStyle }: PropsWithChildren<{ contentStyle?: StyleProp<ViewStyle> }>) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, contentStyle]}>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style, delay = 0 }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; delay?: number }>) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(360)} style={[styles.card, style]}>
      {children}
    </Animated.View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'muted';
  style?: StyleProp<ViewStyle>;
};

export function ActionButton({ label, onPress, icon = 'play', disabled, loading, variant = 'primary', style }: ButtonProps) {
  const pressed = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressed.value }] }));
  const content = (
    <View style={styles.buttonContent}>
      {loading ? <ActivityIndicator color={variant === 'primary' ? colors.black : colors.primary} /> : (
        <>
          <View style={[styles.buttonIcon, variant !== 'primary' && styles.buttonIconOutline]}>
            <Ionicons name={icon} size={19} color={variant === 'primary' ? colors.primary : colors.primary} />
          </View>
          <Text style={[styles.buttonText, variant !== 'primary' && styles.buttonTextOutline]}>{label}</Text>
        </>
      )}
    </View>
  );
  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={() => { pressed.value = withTiming(0.97, { duration: 90 }); }}
        onPressOut={() => { pressed.value = withTiming(1, { duration: 130 }); }}
        style={({ pressed: isPressed }) => [styles.button, variant !== 'primary' && styles.buttonOutline, variant === 'muted' && styles.buttonMuted, (disabled || isPressed) && styles.buttonDisabled]}
      >
        {variant === 'primary' ? (
          <LinearGradient colors={['#B8FF18', '#8CE600']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        ) : null}
        {content}
      </Pressable>
    </Animated.View>
  );
}

export function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}><Text style={styles.sectionAction}>{action}  ›</Text></Pressable>
      ) : null}
    </View>
  );
}

export function ProgressBar({ progress, color = colors.primary }: { progress: number; color?: string }) {
  const clamped = Math.max(0, Math.min(1, progress));
  return <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${clamped * 100}%`, backgroundColor: color }]} /></View>;
}

export function EmptyState({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={30} color={colors.textDim} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

export function Pill({ icon, label, color = colors.primary }: { icon: keyof typeof Ionicons.glyphMap; label: string; color?: string }) {
  return (
    <View style={styles.pill}><Ionicons name={icon} color={color} size={17} /><Text style={styles.pillText}>{label}</Text></View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 118, gap: spacing.lg },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, padding: spacing.lg, overflow: 'hidden', ...shadow },
  button: { minHeight: 58, borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary },
  buttonOutline: { backgroundColor: colors.backgroundSoft },
  buttonMuted: { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
  buttonDisabled: { opacity: 0.55 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  buttonIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.black },
  buttonIconOutline: { borderWidth: 1, borderColor: colors.primary, backgroundColor: 'transparent' },
  buttonText: { color: colors.black, fontSize: 18, fontWeight: '800' },
  buttonTextOutline: { color: colors.text },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 90, paddingTop: spacing.md },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { color: colors.textMuted, fontSize: typography.body, marginTop: spacing.xs },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: typography.subheading, fontWeight: '800' },
  sectionAction: { color: colors.primary, fontSize: typography.small, fontWeight: '600' },
  progressTrack: { height: 5, backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.pill },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: typography.body, fontWeight: '700', marginTop: spacing.md },
  emptyBody: { color: colors.textMuted, fontSize: typography.small, textAlign: 'center', marginTop: spacing.xs, lineHeight: 19 },
  pill: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', borderColor: colors.border, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pillText: { color: colors.text, fontSize: typography.small, fontWeight: '700' },
});
