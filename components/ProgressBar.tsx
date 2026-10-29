import { StyleSheet, View } from 'react-native';

import { Colors, Radius } from '@/constants/Colors';

/** A thin bar showing how far through a book someone is. Renders nothing without a percentage. */
export function ProgressBar({ percent }: { percent: number | null }) {
  if (percent === null) return null;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={styles.track}>
      <View style={[styles.fill, { width: `${percent}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceRaised,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
  },
});
