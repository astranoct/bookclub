import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Page not found</ThemedText>
      <ThemedText type="muted">This screen doesn't exist.</ThemedText>
      <Link href="/" style={styles.link}>
        <ThemedText type="link">Back to the start</ThemedText>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
    backgroundColor: Colors.background,
  },
  link: { marginTop: 12, paddingVertical: 12 },
});
