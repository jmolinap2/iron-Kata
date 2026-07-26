import 'react-native-reanimated';

import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { AppNavigator } from './src/navigation/AppNavigator';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { WhatsNewScreen } from './src/screens/WhatsNewScreen';
import { LATEST_CHANGELOG_VERSION } from './src/data/changelog';
import { useAppStore } from './src/store/useAppStore';
import type { Exercise, Profile } from './src/types';
import { createThemedStyleSheet, ThemeProvider, useTheme, useThemePreferences } from './src/theme';

export default function App() {
  const initialize = useAppStore(state => state.initialize);
  const initialized = useAppStore(state => state.initialized);
  const error = useAppStore(state => state.error);
  const profile = useAppStore(state => state.profile);
  const exercises = useAppStore(state => state.exercises);
  const updateProfile = useAppStore(state => state.updateProfile);
  const markChangelogSeen = useAppStore(state => state.markChangelogSeen);

  useEffect(() => { void initialize(); }, [initialize]);

  return (
    <ThemeProvider savedTheme={profile.theme} savedStyle={profile.style}>
      <AppContent
        initialized={initialized}
        error={error}
        profile={profile}
        exercises={exercises}
        onOnboardingComplete={updateProfile}
        onChangelogSeen={() => { void markChangelogSeen(LATEST_CHANGELOG_VERSION); }}
      />
    </ThemeProvider>
  );
}

function AppContent({ initialized, error, profile, exercises, onOnboardingComplete, onChangelogSeen }: {
  initialized: boolean; error: string | null; profile: Profile; exercises: Exercise[];
  onOnboardingComplete: (profile: Profile) => void; onChangelogSeen: () => void;
}) {
  const colors = useTheme();
  const styles = useStyles();
  const { style } = useThemePreferences();
  const statusBarStyle = style === 'Bento' ? 'dark' : 'light';

  if (initialized && !profile.onboarded) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen base={profile} onComplete={onOnboardingComplete} />
        <StatusBar style={statusBarStyle} />
      </SafeAreaProvider>
    );
  }

  if (initialized && profile.onboarded && profile.lastSeenChangelog < LATEST_CHANGELOG_VERSION) {
    return (
      <SafeAreaProvider>
        <WhatsNewScreen sinceVersion={profile.lastSeenChangelog} exercises={exercises} onDismiss={onChangelogSeen} />
        <StatusBar style={statusBarStyle} />
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
        <StatusBar style={statusBarStyle} />
      </SafeAreaProvider>
    );
  }

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <AppNavigator />
        <StatusBar style={statusBarStyle} />
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
