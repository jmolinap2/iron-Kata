import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { exerciseMedia } from '../media';
import { colors, radius } from '../theme';

export function ExerciseMedia({ mediaKey, animated = false, style }: { mediaKey: string; animated?: boolean; style?: StyleProp<ViewStyle> }) {
  const media = exerciseMedia[mediaKey] ?? exerciseMedia['lat-pulldown'];
  return (
    <View style={[styles.frame, style]}>
      <Image
        source={animated ? media.animation : media.thumbnail}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        autoplay={animated}
        transition={180}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, overflow: 'hidden' },
});
