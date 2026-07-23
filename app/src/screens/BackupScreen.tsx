import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { ActionButton, AppScrollView, Card, Screen } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing } from '../theme';

export function BackupScreen() {
  const navigation = useNavigation();
  const createBackup = useAppStore(state => state.createBackup);
  const restoreBackup = useAppStore(state => state.restoreBackup);
  const [busy, setBusy] = useState(false);

  const exportData = async () => {
    setBusy(true);
    try {
      const data = await createBackup();
      const date = new Date().toISOString().slice(0, 10);
      const uri = `${FileSystem.cacheDirectory}iron-kata-respaldo-${date}.json`;
      await FileSystem.writeAsStringAsync(uri, data, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Guardar respaldo de Iron Kata' });
      else Alert.alert('Respaldo creado', uri);
    } catch (error) { Alert.alert('No se pudo exportar', error instanceof Error ? error.message : 'Intenta nuevamente.'); }
    finally { setBusy(false); }
  };

  const importData = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true, multiple: false });
    if (result.canceled) return;
    setBusy(true);
    try {
      const raw = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
      await restoreBackup(raw);
      Alert.alert('Respaldo restaurado', 'Las rutinas y registros se cargaron correctamente.');
    } catch (error) { Alert.alert('No se pudo restaurar', error instanceof Error ? error.message : 'El archivo no es válido.'); }
    finally { setBusy(false); }
  };

  return <Screen><AppScrollView contentStyle={{ paddingTop: spacing.md }}>
    <View style={styles.topbar}><Pressable onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={25} color={colors.text}/></Pressable><View><Text style={styles.title}>Respaldos</Text><Text style={styles.subtitle}>Tus datos siguen siendo locales.</Text></View></View>
    <Card><View style={styles.icon}><Ionicons name="download-outline" size={31} color={colors.primary}/></View><Text style={styles.cardTitle}>Exportar datos</Text><Text style={styles.body}>Crea un archivo JSON con perfil, rutinas, sesiones, series, peso, nutrición y récords.</Text><ActionButton label="Exportar respaldo" icon="share-outline" loading={busy} onPress={() => { void exportData(); }}/></Card>
    <Card><View style={styles.icon}><Ionicons name="cloud-upload-outline" size={31} color={colors.primary}/></View><Text style={styles.cardTitle}>Restaurar datos</Text><Text style={styles.body}>Selecciona un respaldo de Iron Kata. La información actual será sustituida dentro de una transacción local.</Text><ActionButton label="Seleccionar archivo" icon="folder-open-outline" variant="outline" loading={busy} onPress={() => { void importData(); }}/></Card>
    <View style={styles.notice}><Ionicons name="shield-checkmark-outline" size={20} color={colors.primary}/><Text style={styles.noticeText}>No se envía información a ningún servidor.</Text></View>
  </AppScrollView></Screen>;
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 86 }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, title: { color: colors.text, fontSize: 29, fontWeight: '900' }, subtitle: { color: colors.textMuted, marginTop: 3 },
  icon: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }, cardTitle: { color: colors.text, fontSize: 19, fontWeight: '900' }, body: { color: colors.textMuted, lineHeight: 20, marginVertical: spacing.md }, notice: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm }, noticeText: { color: colors.textMuted, fontSize: 12 },
});
