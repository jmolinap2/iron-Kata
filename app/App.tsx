import 'react-native-reanimated';

import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { AppNavigator } from './src/navigation/AppNavigator';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { useAppStore } from './src/store/useAppStore';
import type { Profile } from './src/types';
import { createThemedStyleSheet, ThemeProvider, useTheme } from './src/theme';

export default function App() {
  const initialize = useAppStore(state => state.initialize);
  const initialized = useAppStore(state => state.initialized);
  const error = useAppStore(state => state.error);
  const profile = useAppStore(state => state.profile);
  const updateProfile = useAppStore(state => state.updateProfile);

  useEffect(() => { void initialize(); }, [initialize]);

  return (
    <ThemeProvider savedTheme={profile.theme}>
      <AppContent initialized={initialized} error={error} profile={profile} onOnboardingComplete={updateProfile} />
    </ThemeProvider>
  );
}

function AppContent({ initialized, error, profile, onOnboardingComplete }: { initialized: boolean; error: string | null; profile: Profile; onOnboardingComplete: (profile: Profile) => void }) {
  const colors = useTheme();
  const styles = useStyles();

  if (initialized && !profile.onboarded) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen base={profile} onComplete={onOnboardingComplete} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  if (!initialized) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          <View style={styles.logoMark}><Text style={styles.logoText}>IK</Text></View>
          <Text style={styles.loadingTitle}>IRON KATA</Text>
          {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={colors.primary} size="large" />}
        </View>
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <AppNavigator />
        <StatusBar style="light" />
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

const useStyles = createThemedStyleSheet(colors => ({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: 18 },
  logoMark: { width: 78, height: 78, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: colors.black, fontSize: 28, fontWeight: '900' },
  loadingTitle: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: 4 },
  error: { color: colors.danger, textAlign: 'center', paddingHorizontal: 28 },
}));
