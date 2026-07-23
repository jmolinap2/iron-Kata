import { Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../theme';

type State = { error: Error | null };

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Iron Kata render error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.container}>
        <View style={styles.badge}><Text style={styles.badgeText}>!</Text></View>
        <Text style={styles.title}>No pudimos abrir esta pantalla</Text>
        <Text style={styles.body}>Iron Kata sigue instalada. Comparte este detalle para corregirlo:</Text>
        <Text selectable style={styles.error}>{this.state.error.message || String(this.state.error)}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: spacing.xxl },
  badge: { width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger },
  badgeText: { color: colors.text, fontSize: 36, fontWeight: '900' },
  title: { color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: spacing.xl },
  body: { color: colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: spacing.md },
  error: { width: '100%', color: colors.danger, backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg, marginTop: spacing.lg, fontSize: 12 },
});
