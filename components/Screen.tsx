import { ScrollView, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';

import { ThemedView } from '@/components/ThemedView';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <ThemedView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, gap: 16 },
});
