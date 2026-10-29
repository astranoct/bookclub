import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card, Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { Colors } from '@/constants/Colors';
import { AccountError, deleteEverything, verifyPassword } from '@/services/account';
import { getCurrentUser } from '@/services/appwrite';
import { DELETE_PHRASE, validateDeleteConfirmation } from '@/utils/account';

function messageFor(e: unknown) {
  if (e instanceof AccountError) {
    switch (e.kind) {
      case 'not-configured':
        return "Account deletion isn't set up in this version of the app yet, so nothing was deleted.";
      case 'wrong-credentials':
        return e.message;
      case 'club':
        return `${e.message} Nothing else was deleted. Please try again.`;
      default:
        return `${e.message} Some of your data may already be removed. Please try again.`;
    }
  }
  return 'Something went wrong, and your account was not deleted. Please try again.';
}

export default function DeleteAccount() {
  const router = useRouter();
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then((user) => {
      setAccountEmail(user?.email || null);
      setLoaded(true);
    });
  }, []);

  function confirm() {
    const problem = validateDeleteConfirmation(accountEmail, { email, password, phrase });
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    Alert.alert(
      'Delete everything?',
      "This permanently deletes your account and all of your information. It can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete everything', style: 'destructive', onPress: () => void run() },
      ]
    );
  }

  async function run() {
    setBusy(true);
    setError(null);
    try {
      if (accountEmail) {
        setStep('Checking your password...');
        await verifyPassword(email.trim(), password);
      }
      await deleteEverything(setStep);
      Alert.alert('Done', 'Your account and information have been deleted.');
      router.replace('/login');
    } catch (e) {
      setError(messageFor(e));
      setBusy(false);
      setStep('');
    }
  }

  if (!loaded) {
    return (
      <Screen>
        <ActivityIndicator color={Colors.accentLight} style={styles.spinner} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText type="title">Delete all my information</ThemedText>

      <Card>
        <ThemedText type="subtitle">What this does</ThemedText>
        <ThemedText type="muted">
          {'•'} Takes you out of every club. Clubs where you're the only member are deleted, and
          ownership of the others passes to another member.
        </ThemedText>
        <ThemedText type="muted">
          {'•'} Deletes your display name, reading progress and suggestions.
        </ThemedText>
        <ThemedText type="muted">
          {'•'} Deletes your account and signs you out. This can't be undone.
        </ThemedText>
      </Card>

      <Card>
        <ThemedText type="subtitle">Confirm it's you</ThemedText>
        {accountEmail ? (
          <>
            <ThemedTextInput
              placeholder="Your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              editable={!busy}
            />
            <ThemedTextInput
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              secureTextEntry
              editable={!busy}
            />
          </>
        ) : (
          <>
            <ThemedText type="muted">
              You're using a guest account, so there's no password. Type {DELETE_PHRASE} to confirm.
            </ThemedText>
            <ThemedTextInput
              placeholder={DELETE_PHRASE}
              value={phrase}
              onChangeText={setPhrase}
              autoCapitalize="characters"
              editable={!busy}
            />
          </>
        )}

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        {busy && (
          <View style={styles.progress}>
            <ActivityIndicator color={Colors.accentLight} />
            <ThemedText type="muted">{step}</ThemedText>
          </View>
        )}
        <Button title="Delete everything" variant="danger" onPress={confirm} disabled={busy} />
      </Card>

      <Button title="Cancel" variant="ghost" onPress={() => router.back()} disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  spinner: { paddingVertical: 48 },
  error: { color: Colors.danger },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
