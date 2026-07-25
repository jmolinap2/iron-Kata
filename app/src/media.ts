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
  'incline-bench-press': {
    animation: require('../assets/motion/incline-bench-press.webp'),
    thumbnail: require('../assets/motion/incline-bench-press-thumb.webp'),
  },
  'rear-delt-fly': {
    animation: require('../assets/motion/rear-delt-fly.webp'),
    thumbnail: require('../assets/motion/rear-delt-fly-thumb.webp'),
  },
  'leg-extension': {
    animation: require('../assets/motion/leg-extension.webp'),
    thumbnail: require('../assets/motion/leg-extension-thumb.webp'),
  },
  'pec-deck-fly': {
    animation: require('../assets/motion/pec-deck-fly.webp'),
    thumbnail: require('../assets/motion/pec-deck-fly-thumb.webp'),
  },
  'dumbbell-fly': {
    animation: require('../assets/motion/dumbbell-fly.webp'),
    thumbnail: require('../assets/motion/dumbbell-fly-thumb.webp'),
  },
  'bench-dips': {
    animation: require('../assets/motion/bench-dips.webp'),
    thumbnail: require('../assets/motion/bench-dips-thumb.webp'),
  },
  'femoral-echado': {
    animation: require('../assets/motion/femoral-echado.webp'),
    thumbnail: require('../assets/motion/femoral-echado-thumb.webp'),
  },
  'hip-adductor': {
    animation: require('../assets/motion/hip-adductor.webp'),
    thumbnail: require('../assets/motion/hip-adductor-thumb.webp'),
  },
  'hip-abductor': {
    animation: require('../assets/motion/hip-abductor.webp'),
    thumbnail: require('../assets/motion/hip-abductor-thumb.webp'),
  },
  'calf-raise': {
    animation: require('../assets/motion/calf-raise.webp'),
    thumbnail: require('../assets/motion/calf-raise-thumb.webp'),
  },
  'hip-thrust': {
    animation: require('../assets/motion/hip-thrust.webp'),
    thumbnail: require('../assets/motion/hip-thrust-thumb.webp'),
  },
  'roman-chair-situp': {
    animation: require('../assets/motion/roman-chair-situp.webp'),
    thumbnail: require('../assets/motion/roman-chair-situp-thumb.webp'),
  },
};

export const heroPullMale = require('../assets/images/hero-pull.png');
export const heroPullFemale = require('../assets/images/hero-pull-XX.png');
