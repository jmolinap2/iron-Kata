import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme';
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

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabsParamList>();

const tabIcons: Record<keyof MainTabsParamList, keyof typeof Ionicons.glyphMap> = {
  Inicio: 'home', Entreno: 'barbell', Progreso: 'stats-chart', Nutrición: 'restaurant', Perfil: 'person-outline',
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const safeBottom = Math.max(insets.bottom, 8);

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.navigation,
          borderTopColor: colors.borderSoft,
          height: 66 + safeBottom,
          paddingTop: 9,
          paddingBottom: safeBottom,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => <Ionicons name={tabIcons[route.name]} color={color} size={size + 2} />,
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
  const navigationTheme = {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, primary: colors.primary, background: colors.background, card: colors.background, border: colors.border, text: colors.text },
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
