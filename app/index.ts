import { createElement, type ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { registerRootComponent } from 'expo';

let Root: ComponentType;

try {
  Root = require('./App').default as ComponentType;
} catch (cause) {
  const detail = cause instanceof Error ? cause.message : String(cause);
  Root = function BootError() {
    return createElement(
      View,
      { style: styles.container },
      createElement(Text, { style: styles.title }, 'Iron Kata no pudo iniciar'),
      createElement(Text, { style: styles.body }, 'Comparte este mensaje para poder corregirlo:'),
      createElement(Text, { selectable: true, style: styles.error }, detail),
    );
  };
}

registerRootComponent(Root);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#050708', padding: 28 },
  title: { color: '#F7F8F8', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  body: { color: '#A9ADB2', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 12 },
  error: { width: '100%', color: '#FF6B6B', backgroundColor: '#121619', borderRadius: 12, padding: 16, marginTop: 18, fontSize: 12 },
});
