import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGlassBackdropTarget, useTheme, useThemePreferences } from '../theme';
import type { MainTabsParamList, RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { TrainingScreen } from '../screens/TrainingScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { NutritionScreen } from '../screens/NutritionScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RoutineDetailScreen } from '../screens/RoutineDetailScreen';
import { ActiveExerciseScreen } from '../screens/ActiveExerciseScreen';
import { WorkoutSummaryScreen } from '../screens/WorkoutSummaryScreen';
import { RoutineEditorScreen } from '../screens/RoutineEditorScreen';
import { QuickWorkoutScreen } from '../screens/QuickWorkoutScreen';
import { BackupScreen } from '../screens/BackupScreen';
import { SessionDetailScreen } from '../screens/SessionDetailScreen';
import { LogPastWorkoutScreen } from '../screens/LogPastWorkoutScreen';
import { HowItWorksScreen } from '../screens/HowItWorksScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabsParamList>();

const tabIcons: Record<keyof MainTabsParamList, keyof typeof Ionicons.glyphMap> = {
  Inicio: 'home', Entreno: 'barbell', Progreso: 'stats-chart', Nutrición: 'restaurant', Perfil: 'person-outline',
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { style } = useThemePreferences();
  const blurTarget = useGlassBackdropTarget();
  const isGlass = style === 'Vidrio';
  const safeBottom = Math.max(insets.bottom, 8);

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'shift',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: isGlass ? 'transparent' : colors.navigation,
          borderTopColor: isGlass ? colors.primaryBorder : colors.borderSoft,
          position: isGlass ? 'absolute' : undefined,
          height: 66 + safeBottom,
          paddingTop: 9,
          paddingBottom: safeBottom,
        },
        tabBarBackground: isGlass
          ? () => <BlurView intensity={55} tint="dark" blurMethod="dimezisBlurView" blurTarget={blurTarget} style={StyleSheet.absoluteFill} />
          : undefined,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => (
          isGlass && focused ? (
            <View style={{ width: 46, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoftBackground, borderWidth: 1, borderColor: colors.primaryBorder }}>
              <Ionicons name={tabIcons[route.name]} color={color} size={size + 2} />
            </View>
          ) : (
            <Ionicons name={tabIcons[route.name]} color={color} size={size + 2} />
          )
        ),
      })}
    >
      <Tabs.Screen name="Inicio" component={HomeScreen} />
      <Tabs.Screen name="Entreno" component={TrainingScreen} />
      <Tabs.Screen name="Progreso" component={ProgressScreen} />
      <Tabs.Screen name="Nutrición" component={NutritionScreen} />
      <Tabs.Screen name="Perfil" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export function AppNavigator() {
  const colors = useTheme();
  const { style } = useThemePreferences();
  const base = style === 'Bento' ? DefaultTheme : DarkTheme;
  const navigationTheme = {
    ...base,
    colors: { ...base.colors, primary: colors.primary, background: colors.background, card: colors.background, border: colors.border, text: colors.text },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
        <Stack.Screen name="ActiveExercise" component={ActiveExerciseScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="RoutineEditor" component={RoutineEditorScreen} />
        <Stack.Screen name="QuickWorkout" component={QuickWorkoutScreen} />
        <Stack.Screen name="Backup" component={BackupScreen} />
        <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
        <Stack.Screen name="LogPastWorkout" component={LogPastWorkoutScreen} />
        <Stack.Screen name="HowItWorks" component={HowItWorksScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
