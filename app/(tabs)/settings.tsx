import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { Card, Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { DONATE_URL } from '@/constants/links';

export default function Settings() {
  const router = useRouter();
  const [donateError, setDonateError] = useState(false);

  async function openDonate() {
    setDonateError(false);
    try {
      await Linking.openURL(DONATE_URL);
    } catch {
      setDonateError(true);
    }
  }

  return (
    <Screen>
      <ThemedText type="label">Support</ThemedText>
      <Card>
        <ThemedText type="subtitle">Contact support</ThemedText>
        <ThemedText type="muted">
          Found a bug, or something confusing? Send us a note and we'll take a look.
        </ThemedText>
        <Button title="Send a message" onPress={() => router.push('/contact')} />
      </Card>

      <Card>
        <ThemedText type="subtitle">Support Book Club</ThemedText>
        <ThemedText type="muted">
          Book Club is free and built in spare time. If you enjoy it, you can chip in on Ko-fi.
        </ThemedText>
        <Button title="Donate on Ko-fi" variant="secondary" onPress={openDonate} />
        {donateError && (
          <ThemedText style={styles.error}>Couldn't open the link. Try again in a moment.</ThemedText>
        )}
      </Card>

      <ThemedText type="label">Your data</ThemedText>
      <Card>
        <ThemedText type="subtitle">Delete all my information</ThemedText>
        <ThemedText type="muted">
          Removes your account, your name, your reading progress and suggestions, and takes you out
          of every club. This can't be undone.
        </ThemedText>
        <Button
          title="Delete all my information"
          variant="danger"
          onPress={() => router.push('/delete-account')}
        />
      </Card>

      <ThemedText type="muted" style={styles.version}>
        Book Club {Constants.expoConfig?.version ?? ''}
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: Colors.danger },
  version: { textAlign: 'center', fontSize: 13 },
});
