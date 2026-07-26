import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { ActionButton, AppScrollView, Card, Header, Screen, SectionTitle } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import type { AppStyle, AppTheme, Profile, ProfileGoal } from '../types';
import { createThemedStyleSheet, getStyleBaseColors, getThemePalette, radius, spacing, styleOptions, themeOptions, useTheme, useThemePreferences } from '../theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
const levels: Profile['experience'][] = ['Principiante', 'Intermedio', 'Avanzado'];
const sexes: Profile['sex'][] = ['Hombre', 'Mujer'];
const goals: ProfileGoal[] = ['Ganar fuerza y masa muscular', 'Perder grasa', 'Mantenimiento', 'Resistencia'];

export function ProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const colors = useTheme();
  const styles = useStyles();
  const { setPreviewTheme, clearPreviewTheme, setPreviewStyle, clearPreviewStyle } = useThemePreferences();
  const stored = useAppStore(state => state.profile);
  const updateProfile = useAppStore(state => state.updateProfile);
  const [profile, setProfile] = useState(stored);

  useFocusEffect(useCallback(() => {
    setProfile(stored);
    return () => { clearPreviewTheme(); clearPreviewStyle(); };
  }, [clearPreviewTheme, clearPreviewStyle, stored]));

  const save = async () => { await updateProfile(profile); clearPreviewTheme(); clearPreviewStyle(); Alert.alert('Perfil guardado', 'Tus preferencias se aplicaron correctamente.'); };
  const cycleLevel = () => setProfile(value => ({ ...value, experience: levels[(levels.indexOf(value.experience) + 1) % levels.length] }));
  const cycleSex = () => setProfile(value => ({ ...value, sex: sexes[(sexes.indexOf(value.sex) + 1) % sexes.length] }));
  const cycleGoal = () => setProfile(value => ({ ...value, goal: goals[(goals.indexOf(value.goal) + 1) % goals.length] }));
  const selectTheme = (theme: AppTheme) => { setProfile(value => ({ ...value, theme })); setPreviewTheme(theme); };
  const selectStyle = (style: AppStyle) => { setProfile(value => ({ ...value, style })); setPreviewStyle(style); };

  return (
    <Screen><AppScrollView>
      <Header title="Perfil" subtitle="Tu entrenamiento y la apariencia de Iron Kata." />
      <Card>
        <SectionTitle title="Datos básicos" />
        <Field label="Nombre"><TextInput style={styles.input} value={profile.name} onChangeText={name => setProfile(value => ({ ...value, name }))} /></Field>
        <Field label="Sexo"><Pressable style={styles.select} onPress={cycleSex}><Text style={styles.selectText}>{profile.sex}</Text><Ionicons name="chevron-down" color={colors.textMuted} size={18} /></Pressable></Field>
        <Field label="Objetivo principal"><Pressable style={styles.select} onPress={cycleGoal}><Text style={styles.selectText}>{profile.goal}</Text><Ionicons name="chevron-down" color={colors.textMuted} size={18} /></Pressable></Field>
        <Field label="Nivel de experiencia"><Pressable style={styles.select} onPress={cycleLevel}><Text style={styles.selectText}>{profile.experience}</Text><Ionicons name="chevron-down" color={colors.textMuted} size={18} /></Pressable></Field>
      </Card>
      <Card><SectionTitle title="Disponibilidad" /><Counter label="Días disponibles" value={profile.availableDays} suffix="días" min={1} max={7} step={1} onChange={availableDays => setProfile(value => ({ ...value, availableDays }))} /><Counter label="Duración aproximada" value={profile.durationMinutes} suffix="min" min={30} max={120} step={5} onChange={durationMinutes => setProfile(value => ({ ...value, durationMinutes }))} /></Card>
      <Card><SectionTitle title="Preferencias" /><Pressable style={styles.preference} onPress={() => setProfile(value => ({ ...value, unit: value.unit === 'kg' ? 'lb' : 'kg' }))}><View><Text style={styles.preferenceLabel}>Unidad de peso</Text><Text style={styles.preferenceHint}>Se usa en todas las series y récords</Text></View><Text style={styles.preferenceValue}>{profile.unit}</Text></Pressable></Card>
      <Card>
        <SectionTitle title="Apariencia" />
        <Text style={styles.personalizationIntro}>La vista previa se aplica al instante en toda la app. Guarda para conservarla.</Text>
        <Text style={styles.subheading}>Estilo</Text>
        <View style={styles.themeList}>
          {styleOptions.map(option => (
            <StyleChoice
              key={option.name}
              style={option.name}
              accent={profile.theme}
              label={option.label}
              description={option.description}
              selected={profile.style === option.name}
              onPress={() => selectStyle(option.name)}
            />
          ))}
        </View>
        <Text style={[styles.subheading, { marginTop: spacing.lg }]}>Acento de color</Text>
        <View style={styles.themeList}>
          {themeOptions.map(option => (
            <ThemeChoice
              key={option.name}
              theme={option.name}
              label={option.label}
              description={option.description}
              selected={profile.theme === option.name}
              onPress={() => selectTheme(option.name)}
            />
          ))}
        </View>
      </Card>
      <ActionButton label="Guardar perfil" icon="save-outline" onPress={() => { void save(); }} />
      <Card>
        <SectionTitle title="Datos locales" />
        <Pressable style={styles.link} onPress={() => navigation.navigate('Backup')}><View style={styles.linkIcon}><Ionicons name="archive-outline" size={23} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.linkTitle}>Respaldos</Text><Text style={styles.linkBody}>Exportar o restaurar todos tus datos</Text></View><Ionicons name="chevron-forward" color={colors.textDim} size={21} /></Pressable>
      </Card>
      <Card><Pressable style={styles.link} onPress={() => navigation.navigate('HowItWorks')}><View style={styles.linkIcon}><Ionicons name="help-circle-outline" size={23} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.linkTitle}>Cómo funciona Iron Kata</Text><Text style={styles.linkBody}>Explicación de la secuencia, el 1RM y otros conceptos</Text></View><Ionicons name="chevron-forward" color={colors.textDim} size={21} /></Pressable></Card>
    </AppScrollView></Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { const styles = useStyles(); return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text>{children}</View>; }
function Counter({ label, value, suffix, min, max, step, onChange }: { label: string; value: number; suffix: string; min: number; max: number; step: number; onChange: (value: number) => void }) { const colors = useTheme(); const styles = useStyles(); return <View style={styles.counter}><Text style={styles.preferenceLabel}>{label}</Text><View style={styles.counterControls}><Pressable style={styles.round} onPress={() => onChange(Math.max(min, value - step))}><Ionicons name="remove" size={20} color={colors.textMuted} /></Pressable><Text style={styles.counterValue}>{value} {suffix}</Text><Pressable style={styles.round} onPress={() => onChange(Math.min(max, value + step))}><Ionicons name="add" size={20} color={colors.primary} /></Pressable></View></View>; }

function ThemeChoice({ theme, label, description, selected, onPress }: { theme: AppTheme; label: string; description: string; selected: boolean; onPress: () => void }) {
  const colors = useTheme();
  const styles = useStyles();
  const { style } = useThemePreferences();
  const palette = getThemePalette(theme, style);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.themeChoice,
        selected && { borderColor: palette.primary, backgroundColor: palette.primarySoftBackground },
      ]}
    >
      <View style={[styles.themePreview, { backgroundColor: palette.primaryDark, borderColor: palette.primaryBorder }]}>
        <View style={[styles.themeDotLarge, { backgroundColor: palette.primary }]} />
        <View style={[styles.themeDotSmall, { backgroundColor: palette.gradientStart }]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.themeLabel}>{label}</Text>
        <Text style={styles.themeDescription}>{description}</Text>
      </View>
      <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} color={selected ? palette.primary : colors.textDim} size={24} />
    </Pressable>
  );
}

function StyleChoice({ style, accent, label, description, selected, onPress }: { style: AppStyle; accent: AppTheme; label: string; description: string; selected: boolean; onPress: () => void }) {
  const colors = useTheme();
  const styles = useStyles();
  const base = getStyleBaseColors(style);
  const palette = getThemePalette(accent, style);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.themeChoice, selected && { borderColor: colors.primary, backgroundColor: colors.primarySoftBackground }]}
    >
      <View style={[styles.themePreview, { backgroundColor: base.background, borderColor: base.border, overflow: 'hidden' }]}>
        {style === 'Vidrio' ? (
          <LinearGradient colors={[palette.gradientStart, palette.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.styleSwatchGlass}>
            <View style={styles.styleSwatchGlassSheen} />
          </LinearGradient>
        ) : (
          <View style={[styles.styleSwatchCard, { backgroundColor: base.surface, borderColor: base.border }]} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.themeLabel}>{label}</Text>
        <Text style={styles.themeDescription}>{description}</Text>
      </View>
      <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} color={selected ? colors.primary : colors.textDim} size={24} />
    </Pressable>
  );
}

const useStyles = createThemedStyleSheet(colors => ({
  field: { marginTop: spacing.lg }, fieldLabel: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.sm }, input: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundSoft, color: colors.text, paddingHorizontal: spacing.md, fontSize: 15 },
  select: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundSoft, paddingHorizontal: spacing.md }, selectText: { color: colors.text, fontWeight: '700' },
  counter: { minHeight: 74, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }, counterControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, round: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, counterValue: { color: colors.text, minWidth: 72, textAlign: 'center', fontWeight: '800' },
  preference: { minHeight: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }, preferenceLabel: { color: colors.text, fontWeight: '700' }, preferenceHint: { color: colors.textMuted, fontSize: 11, marginTop: 3 }, preferenceValue: { color: colors.primary, textTransform: 'uppercase', fontWeight: '900' },
  personalizationIntro: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: spacing.sm },
  subheading: { color: colors.textDim, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: spacing.lg, marginBottom: spacing.sm },
  themeList: { gap: spacing.sm },
  themeChoice: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundSoft },
  themePreview: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  styleSwatchCard: { width: 30, height: 22, borderRadius: 7, borderWidth: 1 },
  styleSwatchGlass: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  styleSwatchGlassSheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(255,255,255,0.25)' },
  themeDotLarge: { width: 21, height: 21, borderRadius: 11 },
  themeDotSmall: { position: 'absolute', width: 10, height: 10, borderRadius: 5, right: 8, top: 8 },
  themeLabel: { color: colors.text, fontSize: 14, fontWeight: '800' },
  themeDescription: { color: colors.textMuted, fontSize: 10, lineHeight: 14, marginTop: 3 },
  link: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg }, linkIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' }, linkTitle: { color: colors.text, fontWeight: '800' }, linkBody: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
}));
