import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { initialOf } from '@/utils/people';

export function Avatar({ name, size = 36 }: { name?: string | null; size?: number }) {
  return (
    <View
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <ThemedText
        style={[styles.text, { fontSize: size * 0.42, lineHeight: size * 0.55 }]}>
        {initialOf(name)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: Colors.accentLight, fontWeight: '700' },
});
