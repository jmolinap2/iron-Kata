import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppScrollView, Card, EmptyState, Header, ProgressBar, Screen, SectionTitle } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { createThemedStyleSheet, radius, spacing, useTheme } from '../theme';
import { isSameDay } from '../utils/format';

export function NutritionScreen() {
  const colors = useTheme();
  const styles = useStyles();
  const profile = useAppStore(state => state.profile);
  const foods = useAppStore(state => state.foods);
  const addFood = useAppStore(state => state.addFood);
  const today = useMemo(() => foods.filter(item => isSameDay(item.date, new Date())), [foods]);
  const calories = today.reduce((sum, item) => sum + item.calories, 0);
  const protein = today.reduce((sum, item) => sum + item.protein, 0);
  const [name, setName] = useState(''); const [calorieInput, setCalorieInput] = useState(''); const [proteinInput, setProteinInput] = useState('');

  const save = async () => {
    const kcal = Number(calorieInput); const grams = Number(proteinInput.replace(',', '.'));
    if (!name.trim() || !Number.isFinite(kcal) || kcal <= 0 || !Number.isFinite(grams) || grams < 0) { Alert.alert('Datos incompletos', 'Escribe alimento, calorías y proteína válidos.'); return; }
    await addFood(name.trim(), kcal, grams); setName(''); setCalorieInput(''); setProteinInput('');
  };

  return (
    <Screen><AppScrollView>
      <Header title="Nutrición" subtitle="Registro diario simple, sin planes avanzados." />
      <Card style={styles.summary}>
        <Macro icon="flame-outline" color={colors.primary} value={`${calories}`} suffix={`/ ${profile.calorieTarget} kcal`} progress={calories / profile.calorieTarget} />
        <View style={styles.macroDivider} />
        <Macro icon="fitness-outline" color={colors.warning} value={`${protein}`} suffix={`/ ${profile.proteinTarget} g proteína`} progress={protein / profile.proteinTarget} />
      </Card>
      <Card>
        <SectionTitle title="Registrar alimento" />
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ej. Yogur con avena" placeholderTextColor={colors.textDim} />
        <View style={styles.inputRow}><TextInput style={[styles.input, { flex: 1 }]} value={calorieInput} onChangeText={setCalorieInput} keyboardType="number-pad" placeholder="Calorías" placeholderTextColor={colors.textDim} /><TextInput style={[styles.input, { flex: 1 }]} value={proteinInput} onChangeText={setProteinInput} keyboardType="decimal-pad" placeholder="Proteína (g)" placeholderTextColor={colors.textDim} /></View>
        <Pressable onPress={() => { void save(); }} style={styles.add}><Ionicons name="add-circle" size={22} color={colors.black} /><Text style={styles.addText}>Añadir al día</Text></Pressable>
      </Card>
      <Card><SectionTitle title="Hoy" />{today.length ? today.map(item => <View key={item.id} style={styles.foodRow}><View style={styles.foodIcon}><Ionicons name="restaurant-outline" size={19} color={colors.primary} /></View><Text style={styles.foodName}>{item.name}</Text><View><Text style={styles.foodCalories}>{item.calories} kcal</Text><Text style={styles.foodProtein}>{item.protein} g proteína</Text></View></View>) : <EmptyState icon="restaurant-outline" title="Aún no registraste alimentos" body="Añade solo lo necesario para controlar calorías y proteína." />}</Card>
    </AppScrollView></Screen>
  );
}

function Macro({ icon, color, value, suffix, progress }: { icon: keyof typeof Ionicons.glyphMap; color: string; value: string; suffix: string; progress: number }) { const styles = useStyles(); return <View style={styles.macro}><View style={styles.macroTop}><Ionicons name={icon} size={24} color={color} /><Text style={styles.macroValue}>{value}</Text><Text style={styles.macroSuffix}>{suffix}</Text></View><ProgressBar progress={progress} color={color} /></View>; }

const useStyles = createThemedStyleSheet(colors => ({
  summary: { gap: spacing.lg }, macro: { gap: spacing.md }, macroTop: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }, macroValue: { color: colors.text, fontSize: 28, fontWeight: '900' }, macroSuffix: { color: colors.textMuted, fontSize: 12 }, macroDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  input: { minHeight: 50, marginTop: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSoft }, inputRow: { flexDirection: 'row', gap: spacing.sm },
  add: { minHeight: 50, marginTop: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }, addText: { color: colors.black, fontWeight: '900' },
  foodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 64, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }, foodIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' }, foodName: { color: colors.text, fontWeight: '700', flex: 1 }, foodCalories: { color: colors.text, fontWeight: '800', textAlign: 'right' }, foodProtein: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
}));
