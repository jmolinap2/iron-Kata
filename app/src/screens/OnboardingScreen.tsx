import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, AppScrollView } from '../components/ui';
import type { Profile, ProfileGoal } from '../types';
import { createThemedStyleSheet, radius, spacing, useTheme } from '../theme';

const sexOptions: { value: Profile['sex']; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'Hombre', icon: 'male' },
  { value: 'Mujer', icon: 'female' },
];
const goalOptions: { value: ProfileGoal; icon: keyof typeof Ionicons.glyphMap; hint: string }[] = [
  { value: 'Ganar fuerza y masa muscular', icon: 'barbell-outline', hint: 'Priorizar peso y progresión' },
  { value: 'Perder grasa', icon: 'flame-outline', hint: 'Priorizar constancia y déficit' },
  { value: 'Mantenimiento', icon: 'shield-checkmark-outline', hint: 'Sostener lo que ya lograste' },
  { value: 'Resistencia', icon: 'infinite-outline', hint: 'Priorizar repeticiones y volumen' },
];
const levelOptions: { value: Profile['experience']; hint: string }[] = [
  { value: 'Principiante', hint: 'Recién empezando o volviendo' },
  { value: 'Intermedio', hint: 'Ya tenés rutina y técnica' },
  { value: 'Avanzado', hint: 'Entrenás con regularidad hace años' },
];

const TOTAL_STEPS = 6;

export function OnboardingScreen({ base, onComplete }: { base: Profile; onComplete: (profile: Profile) => void }) {
  const colors = useTheme();
  const styles = useStyles();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>(base);

  const next = () => {
    if (step === 0 && !profile.name.trim()) { Alert.alert('Falta tu nombre', 'Escribe cómo querés que te llamemos.'); return; }
    if (step === TOTAL_STEPS - 1) { onComplete({ ...profile, name: profile.name.trim(), onboarded: true }); return; }
    setStep(value => value + 1);
  };
  const back = () => setStep(value => Math.max(0, value - 1));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <AppScrollView contentStyle={styles.scrollContent}>
        <View style={styles.dots}>
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <View key={index} style={[styles.dot, index === step && styles.dotActive, index < step && styles.dotDone]} />
          ))}
        </View>

        <Animated.View key={step} entering={FadeInDown.duration(260)} exiting={FadeOut.duration(120)} style={styles.stepBody}>
          {step === 0 ? (
            <Step icon="hand-left-outline" title="¿Cómo te llamamos?" subtitle="Así vas a verte reflejado en toda la app.">
              <TextInput style={styles.input} value={profile.name} onChangeText={name => setProfile(value => ({ ...value, name }))} placeholder="Tu nombre" placeholderTextColor={colors.textDim} autoFocus />
            </Step>
          ) : null}

          {step === 1 ? (
            <Step icon="body-outline" title="¿Cuál es tu sexo?" subtitle="Lo usamos para mostrarte la imagen de portada correcta.">
              <View style={styles.optionRow}>
                {sexOptions.map(option => (
                  <OptionCard key={option.value} icon={option.icon} label={option.value} selected={profile.sex === option.value} onPress={() => setProfile(value => ({ ...value, sex: option.value }))} style={{ flex: 1 }} />
                ))}
              </View>
            </Step>
          ) : null}

          {step === 2 ? (
            <Step icon="flag-outline" title="¿Cuál es tu objetivo principal?" subtitle="Ajustamos tus metas de calorías y proteína según esto.">
              {goalOptions.map(option => (
                <OptionCard key={option.value} icon={option.icon} label={option.value} hint={option.hint} selected={profile.goal === option.value} onPress={() => setProfile(value => ({ ...value, goal: option.value }))} />
              ))}
            </Step>
          ) : null}

          {step === 3 ? (
            <Step icon="trending-up-outline" title="¿Cuál es tu nivel de experiencia?" subtitle="Nos ayuda a calibrar tus recomendaciones.">
              {levelOptions.map(option => (
                <OptionCard key={option.value} label={option.value} hint={option.hint} selected={profile.experience === option.value} onPress={() => setProfile(value => ({ ...value, experience: option.value }))} />
              ))}
            </Step>
          ) : null}

          {step === 4 ? (
            <Step icon="calendar-outline" title="¿Con qué frecuencia entrenás?" subtitle="Podés cambiarlo cuando quieras desde Perfil.">
              <Counter label="Días disponibles por semana" value={profile.availableDays} suffix="días" min={1} max={7} step={1} onChange={availableDays => setProfile(value => ({ ...value, availableDays }))} />
              <Counter label="Duración aproximada por sesión" value={profile.durationMinutes} suffix="min" min={30} max={120} step={5} onChange={durationMinutes => setProfile(value => ({ ...value, durationMinutes }))} />
            </Step>
          ) : null}

          {step === 5 ? (
            <Step icon="checkmark-circle-outline" title={`Listo, ${profile.name.trim() || 'atleta'}`} subtitle="Así queda armado tu perfil — lo podés ajustar después desde Perfil.">
              <View style={styles.summary}>
                <SummaryRow label="Sexo" value={profile.sex} />
                <SummaryRow label="Objetivo" value={profile.goal} />
                <SummaryRow label="Experiencia" value={profile.experience} />
                <SummaryRow label="Frecuencia" value={`${profile.availableDays} días · ${profile.durationMinutes} min`} />
              </View>
            </Step>
          ) : null}
        </Animated.View>

        <View style={styles.actions}>
          {step > 0 ? <Pressable style={styles.backButton} onPress={back}><Ionicons name="arrow-back" size={22} color={colors.text} /></Pressable> : null}
          <ActionButton label={step === TOTAL_STEPS - 1 ? 'Comenzar' : 'Continuar'} icon={step === TOTAL_STEPS - 1 ? 'play' : 'arrow-forward'} onPress={next} style={{ flex: 1 }} />
        </View>
      </AppScrollView>
    </SafeAreaView>
  );
}

function Step({ icon, title, subtitle, children }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; children: React.ReactNode }) {
  const colors = useTheme();
  const styles = useStyles();
  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.stepIcon}><Ionicons name={icon} size={26} color={colors.primary} /></View>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>{children}</View>
    </View>
  );
}

function OptionCard({ icon, label, hint, selected, onPress, style }: { icon?: keyof typeof Ionicons.glyphMap; label: string; hint?: string; selected: boolean; onPress: () => void; style?: object }) {
  const colors = useTheme();
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.option, selected && styles.optionSelected, style]}>
      {icon ? <Ionicons name={icon} size={22} color={selected ? colors.primary : colors.textMuted} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, selected && { color: colors.primary }]}>{label}</Text>
        {hint ? <Text style={styles.optionHint}>{hint}</Text> : null}
      </View>
      <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={selected ? colors.primary : colors.textDim} />
    </Pressable>
  );
}

function Counter({ label, value, suffix, min, max, step, onChange }: { label: string; value: number; suffix: string; min: number; max: number; step: number; onChange: (value: number) => void }) {
  const colors = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.counter}>
      <Text style={styles.counterLabel}>{label}</Text>
      <View style={styles.counterControls}>
        <Pressable style={styles.round} onPress={() => onChange(Math.max(min, value - step))}><Ionicons name="remove" size={20} color={colors.textMuted} /></Pressable>
        <Text style={styles.counterValue}>{value} {suffix}</Text>
        <Pressable style={styles.round} onPress={() => onChange(Math.min(max, value + step))}><Ionicons name="add" size={20} color={colors.primary} /></Pressable>
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>;
}

const useStyles = createThemedStyleSheet(colors => ({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingTop: spacing.xl, paddingBottom: spacing.xxl, flexGrow: 1, justifyContent: 'space-between' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.xxl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surfaceMuted },
  dotActive: { width: 22, backgroundColor: colors.primary },
  dotDone: { backgroundColor: colors.primaryBorder },
  stepBody: { flexGrow: 1 },
  stepIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.6 },
  stepSubtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  input: { minHeight: 56, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundSoft, color: colors.text, paddingHorizontal: spacing.md, fontSize: 18, fontWeight: '700' },
  optionRow: { flexDirection: 'row', gap: spacing.md },
  option: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundSoft, paddingHorizontal: spacing.md },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoftBackground },
  optionLabel: { color: colors.text, fontWeight: '800', fontSize: 14 },
  optionHint: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  counter: { minHeight: 74, justifyContent: 'center', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingTop: spacing.md },
  counterLabel: { color: colors.textMuted, fontSize: 13 },
  counterControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  round: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  counterValue: { color: colors.text, minWidth: 100, textAlign: 'center', fontWeight: '800', fontSize: 16 },
  summary: { gap: spacing.sm, backgroundColor: colors.backgroundSoft, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: colors.textMuted, fontSize: 13 },
  summaryValue: { color: colors.text, fontWeight: '700', fontSize: 13 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xxl },
  backButton: { width: 58, height: 58, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
}));
