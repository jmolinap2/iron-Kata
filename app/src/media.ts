import type { ImageSourcePropType } from 'react-native';

type MediaAsset = { animation: ImageSourcePropType; thumbnail: ImageSourcePropType };

export const exerciseMedia: Record<string, MediaAsset> = {
  'lat-pulldown': {
    animation: require('../assets/motion/lat-pulldown.webp'),
    thumbnail: require('../assets/motion/lat-pulldown-thumb.webp'),
  },
  'barbell-row': {
    animation: require('../assets/motion/barbell-row.webp'),
    thumbnail: require('../assets/motion/barbell-row-thumb.webp'),
  },
  'seated-row': {
    animation: require('../assets/motion/seated-row.webp'),
    thumbnail: require('../assets/motion/seated-row-thumb.webp'),
  },
  'barbell-curl': {
    animation: require('../assets/motion/barbell-curl.webp'),
    thumbnail: require('../assets/motion/barbell-curl-thumb.webp'),
  },
  'hammer-curl': {
    animation: require('../assets/motion/hammer-curl.webp'),
    thumbnail: require('../assets/motion/hammer-curl-thumb.webp'),
  },
  'bench-press': {
    animation: require('../assets/motion/bench-press.webp'),
    thumbnail: require('../assets/motion/bench-press-thumb.webp'),
  },
  'triceps-pushdown': {
    animation: require('../assets/motion/triceps-pushdown.webp'),
    thumbnail: require('../assets/motion/triceps-pushdown-thumb.webp'),
  },
  'back-squat': {
    animation: require('../assets/motion/back-squat.webp'),
    thumbnail: require('../assets/motion/back-squat-thumb.webp'),
  },
  'leg-press': {
    animation: require('../assets/motion/leg-press.webp'),
    thumbnail: require('../assets/motion/leg-press-thumb.webp'),
  },
  'romanian-deadlift': {
    animation: require('../assets/motion/romanian-deadlift.webp'),
    thumbnail: require('../assets/motion/romanian-deadlift-thumb.webp'),
  },
  'overhead-press': {
    animation: require('../assets/motion/overhead-press.webp'),
    thumbnail: require('../assets/motion/overhead-press-thumb.webp'),
  },
  'lateral-raise': {
    animation: require('../assets/motion/lateral-raise.webp'),
    thumbnail: require('../assets/motion/lateral-raise-thumb.webp'),
  },
};

export const heroPull = require('../assets/images/hero-pull.png');
