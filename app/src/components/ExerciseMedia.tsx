import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { exerciseMedia } from '../media';
import { createThemedStyleSheet, radius } from '../theme';

export function ExerciseMedia({ mediaKey, animated = false, style }: { mediaKey: string; animated?: boolean; style?: StyleProp<ViewStyle> }) {
  const [frameWidth, setFrameWidth] = useState(0);
  const styles = useStyles();
  const media = exerciseMedia[mediaKey] ?? exerciseMedia['lat-pulldown'];
  const veilProgress = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;
    veilProgress.value = withRepeat(
      withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
      -1,
      false,
    );
  }, [animated, veilProgress]);

  const veilStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: veilProgress.value * frameWidth * 1.75 },
      { rotate: '12deg' },
    ],
  }));

  return (
    <View style={[styles.frame, style]} onLayout={event => setFrameWidth(event.nativeEvent.layout.width)}>
      <Image
        source={animated ? media.animation : media.thumbnail}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        autoplay={animated}
        transition={180}
      />
      {animated ? (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(0,0,0,0.08)', 'rgba(255,255,255,0.025)', 'rgba(0,0,0,0.06)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View pointerEvents="none" style={[styles.veil, veilStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.04)', 'transparent']}
              locations={[0, 0.43, 0.58, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyleSheet(colors => ({
  frame: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, overflow: 'hidden' },
  veil: { position: 'absolute', width: '58%', top: '-30%', bottom: '-30%', left: '-72%', opacity: 0.42 },
}));
