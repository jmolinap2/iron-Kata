import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { ActionButton, AppScrollView, Card, Header, Screen, SectionTitle } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import type { Profile } from '../types';
import { colors, radius, spacing } from '../theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
const levels: Profile['experience'][] = ['Principiante', 'Intermedio', 'Avanzado'];

export function ProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const stored = useAppStore(state => state.profile);
  const updateProfile = useAppStore(state => state.updateProfile);
  const [profile, setProfile] = useState(stored);

  const save = async () => { await updateProfile(profile); Alert.alert('Perfil guardado', 'Tus preferencias se aplicaron correctamente.'); };
  const cycleLevel = () => setProfile(value => ({ ...value, experience: levels[(levels.indexOf(value.experience) + 1) % levels.length] }));

  return (
    <Screen><AppScrollView>
      <Header title="Perfil" subtitle="Solo las preferencias que cambian tu entrenamiento." />
      <Card>
        <SectionTitle title="Datos básicos" />
        <Field label="Nombre"><TextInput style={styles.input} value={profile.name} onChangeText={name => setProfile(value => ({ ...value, name }))} /></Field>
        <Field label="Objetivo principal"><TextInput style={styles.input} value={profile.goal} onChangeText={goal => setProfile(value => ({ ...value, goal }))} /></Field>
        <Field label="Nivel de experiencia"><Pressable style={styles.select} onPress={cycleLevel}><Text style={styles.selectText}>{profile.experience}</Text><Ionicons name="chevron-down" color={colors.textMuted} size={18} /></Pressable></Field>
      </Card>
      <Card><SectionTitle title="Disponibilidad" /><Counter label="Días disponibles" value={profile.availableDays} suffix="días" min={1} max={7} step={1} onChange={availableDays => setProfile(value => ({ ...value, availableDays }))} /><Counter label="Duración aproximada" value={profile.durationMinutes} suffix="min" min={30} max={120} step={5} onChange={durationMinutes => setProfile(value => ({ ...value, durationMinutes }))} /></Card>
      <Card><SectionTitle title="Preferencias" /><Pressable style={styles.preference} onPress={() => setProfile(value => ({ ...value, unit: value.unit === 'kg' ? 'lb' : 'kg' }))}><View><Text style={styles.preferenceLabel}>Unidad de peso</Text><Text style={styles.preferenceHint}>Se usa en todas las series y récords</Text></View><Text style={styles.preferenceValue}>{profile.unit}</Text></Pressable><View style={styles.preference}><View><Text style={styles.preferenceLabel}>Tema visual</Text><Text style={styles.preferenceHint}>Tema inicial de alto contraste</Text></View><Text style={styles.preferenceValue}>Oscuro</Text></View></Card>
      <ActionButton label="Guardar perfil" icon="save-outline" onPress={() => { void save(); }} />
      <Card><SectionTitle title="Datos locales" /><Pressable style={styles.link} onPress={() => navigation.navigate('Backup')}><View style={styles.linkIcon}><Ionicons name="archive-outline" size={23} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.linkTitle}>Respaldos</Text><Text style={styles.linkBody}>Exportar o restaurar todos tus datos</Text></View><Ionicons name="chevron-forward" color={colors.textDim} size={21} /></Pressable></Card>
    </AppScrollView></Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text>{children}</View>; }
function Counter({ label, value, suffix, min, max, step, onChange }: { label: string; value: number; suffix: string; min: number; max: number; step: number; onChange: (value: number) => void }) { return <View style={styles.counter}><Text style={styles.preferenceLabel}>{label}</Text><View style={styles.counterControls}><Pressable style={styles.round} onPress={() => onChange(Math.max(min, value - step))}><Ionicons name="remove" size={20} color={colors.textMuted} /></Pressable><Text style={styles.counterValue}>{value} {suffix}</Text><Pressable style={styles.round} onPress={() => onChange(Math.min(max, value + step))}><Ionicons name="add" size={20} color={colors.primary} /></Pressable></View></View>; }

const styles = StyleSheet.create({
  field: { marginTop: spacing.lg }, fieldLabel: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.sm }, input: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundSoft, color: colors.text, paddingHorizontal: spacing.md, fontSize: 15 },
  select: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundSoft, paddingHorizontal: spacing.md }, selectText: { color: colors.text, fontWeight: '700' },
  counter: { minHeight: 74, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }, counterControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, round: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, counterValue: { color: colors.text, minWidth: 72, textAlign: 'center', fontWeight: '800' },
  preference: { minHeight: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }, preferenceLabel: { color: colors.text, fontWeight: '700' }, preferenceHint: { color: colors.textMuted, fontSize: 11, marginTop: 3 }, preferenceValue: { color: colors.primary, textTransform: 'uppercase', fontWeight: '900' },
  link: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg }, linkIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' }, linkTitle: { color: colors.text, fontWeight: '800' }, linkBody: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
});
