import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card, Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { Colors, Radius } from '@/constants/Colors';
import { pingAppwrite, register, signIn, signInAnonymously } from '@/services/appwrite';

type PingStatus = { ok: boolean; message: string } | null;

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pingStatus, setPingStatus] = useState<PingStatus>(null);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      router.replace('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function checkConnection() {
    setPingStatus({ ok: true, message: 'Checking...' });
    try {
      await pingAppwrite();
      setPingStatus({ ok: true, message: 'Connected to Appwrite' });
    } catch (e) {
      setPingStatus({
        ok: false,
        message: e instanceof Error ? e.message : 'Could not reach Appwrite.',
      });
    }
  }

  return (
    <Screen topInset>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <MaterialIcons name="auto-stories" size={34} color={Colors.accentLight} />
        </View>
        <ThemedText type="title">Book Club</ThemedText>
        <ThemedText type="muted">Pick a book with your friends and read it together.</ThemedText>
      </View>

      <Card>
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

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        <Button title="Sign in" loading={busy} onPress={() => run(() => signIn(email, password))} />
        <Button
          title="Create account"
          variant="secondary"
          disabled={busy}
          onPress={() => run(() => register(email, password))}
        />
      </Card>

      <Button
        title="Continue as guest"
        variant="ghost"
        disabled={busy}
        onPress={() => run(signInAnonymously)}
      />

      <View style={styles.footer}>
        <Button title="Check Appwrite connection" variant="ghost" onPress={checkConnection} />
        {pingStatus && (
          <View style={styles.status}>
            <View
              style={[
                styles.dot,
                { backgroundColor: pingStatus.ok ? Colors.success : Colors.danger },
              ]}
            />
            <ThemedText type="muted" style={styles.statusText}>
              {pingStatus.message}
            </ThemedText>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  error: { color: Colors.danger, fontSize: 14, lineHeight: 20 },
  footer: { alignItems: 'center', gap: 4 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  statusText: { flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
