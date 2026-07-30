import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { AppScrollView, Card, Screen } from '../components/ui';
import { createThemedStyleSheet, spacing, useTheme } from '../theme';

const topics: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'repeat-outline',
    title: 'Nunca te vas a perder en la secuencia',
    body: 'Iron Kata recuerda cuál fue tu último entrenamiento y siempre te propone el que sigue, en orden. El descanso también es parte de esa fila: cuando lo marcás como cumplido, la app avanza al siguiente entrenamiento solita, como si hubieras entrenado.',
  },
  {
    icon: 'flash-outline',
    title: 'Con poco tiempo, andá por lo rápido',
    body: 'Si un día no llegás a la rutina completa, "Entrenamiento rápido" toma los 3 primeros ejercicios de la que elijas y los registra igual de bien — queda guardado en tu historial como cualquier otro entrenamiento.',
  },
  {
    icon: 'swap-vertical-outline',
    title: 'Tu secuencia se puede cambiar',
    body: 'Las rutinas iniciales son un punto de partida. Desde Entreno podés mantener pulsada una tarjeta para cambiar su posición, editar sus ejercicios u objetivos, crear otras nuevas o eliminar las que no uses. Tus entrenamientos ya guardados no se borran al cambiar la secuencia.',
  },
  {
    icon: 'trophy-outline',
    title: 'Cómo sabemos que mejoraste',
    body: 'Cada vez que cargás una serie, calculamos cuánto podrías levantar en una sola repetición con ese ritmo (por ejemplo: 60 kg × 10 reps te da un estimado bastante más alto que 60 kg × 3). Si ese número supera tu mejor marca anterior en ese ejercicio, queda guardado como récord automáticamente — no tenés que hacer nada.',
  },
  {
    icon: 'bar-chart-outline',
    title: 'Qué músculo estás descuidando',
    body: 'Sumamos cuántas series le hiciste a cada grupo muscular en los últimos 7 días. Si alguno quedó bastante atrás del resto, su barra se pinta de amarillo — una forma rápida de notar qué te falta esta semana antes de que se vuelva un hábito.',
  },
  {
    icon: 'trending-up-outline',
    title: 'Si estás progresando de verdad',
    body: 'Comparamos tu mejor marca de esta semana contra la de la semana pasada, músculo por músculo. Necesitás haber entrenado ese grupo en ambas semanas para que aparezca la comparación — por eso arranca vacío, y se llena solo con el tiempo.',
  },
  {
    icon: 'create-outline',
    title: '¿Te equivocaste al cargar algo?',
    body: 'Todo lo que registrás se puede corregir después. Entrá al detalle de una sesión para editar el peso o las repeticiones de una serie. ¿Te olvidaste de cargar el entrenamiento de ayer? Desde Progreso, "Registrar pasado" permite agregar solamente los ejercicios realizados o cargar una rutina como base.',
  },
  {
    icon: 'archive-outline',
    title: 'Tus datos, siempre a salvo',
    body: 'Desde Perfil → Respaldos podés exportar todo tu historial a un archivo y restaurarlo cuando quieras — útil antes de cambiar de teléfono. Todo se queda en tu dispositivo: nada se sube a ningún servidor.',
  },
];

export function HowItWorksScreen() {
  const navigation = useNavigation();
  const colors = useTheme();
  const styles = useStyles();
  return (
    <Screen>
      <AppScrollView contentStyle={{ paddingTop: spacing.md }}>
        <View style={styles.topbar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={25} color={colors.text} /></Pressable>
          <View><Text style={styles.title}>Cómo funciona Iron Kata</Text><Text style={styles.subtitle}>Lo que no es obvio a simple vista.</Text></View>
        </View>
        {topics.map((topic, index) => (
          <Card key={topic.title} delay={index * 60}>
            <View style={styles.topicHeader}>
              <View style={styles.icon}><Ionicons name={topic.icon} size={26} color={colors.primary} /></View>
              <Text style={styles.topicTitle}>{topic.title}</Text>
            </View>
            <Text style={styles.body}>{topic.body}</Text>
          </Card>
        ))}
      </AppScrollView>
    </Screen>
  );
}

const useStyles = createThemedStyleSheet(colors => ({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 86 }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, title: { color: colors.text, fontSize: 24, fontWeight: '900' }, subtitle: { color: colors.textMuted, marginTop: 3 },
  topicHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primaryDark, borderWidth: 1, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  topicTitle: { color: colors.text, fontWeight: '900', fontSize: 17, flex: 1, lineHeight: 22 },
  body: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
}));
