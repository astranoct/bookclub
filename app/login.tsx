import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button } from 'react-native';

import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { pingAppwrite, register, signIn, signInAnonymously } from '@/services/appwrite';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      router.replace('/search');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function checkConnection() {
    setPingStatus('Checking...');
    try {
      await pingAppwrite();
      setPingStatus('Connected to Appwrite.');
    } catch (e) {
      setPingStatus(e instanceof Error ? e.message : 'Could not reach Appwrite.');
    }
  }

  return (
    <Screen>
      <ThemedText type="title">Book Club</ThemedText>
      <ThemedText>Pick a book with your friends and read it together.</ThemedText>

      <ThemedTextInput
        placeholder="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <ThemedTextInput
        placeholder="Password"
        autoCapitalize="none"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <ThemedText style={{ color: '#c0392b' }}>{error}</ThemedText>}

      <Button title="Sign in" disabled={busy} onPress={() => run(() => signIn(email, password))} />
      <Button
        title="Create account"
        disabled={busy}
        onPress={() => run(() => register(email, password))}
      />
      <Button
        title="Continue as guest"
        disabled={busy}
        onPress={() => run(signInAnonymously)}
      />

      <Button title="Check Appwrite connection" onPress={checkConnection} />
      {pingStatus && <ThemedText>{pingStatus}</ThemedText>}
    </Screen>
  );
}
