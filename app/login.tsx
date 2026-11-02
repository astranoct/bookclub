import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card, Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { Colors, Radius } from '@/constants/Colors';
import { register, signIn, signInAnonymously } from '@/services/appwrite';

export default function Login() {
  const router = useRouter();
  // Set by the forgot-password screen once a new password has been saved.
  const { reset } = useLocalSearchParams<{ reset?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

        {reset === '1' && !error && (
          <ThemedText style={styles.success}>Password updated. Sign in with your new password.</ThemedText>
        )}
        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        <Button title="Sign in" loading={busy} onPress={() => run(() => signIn(email, password))} />
        <Button
          title="Create account"
          variant="secondary"
          disabled={busy}
          onPress={() => run(() => register(email, password))}
        />
        <Button
          title="Forgot password?"
          variant="ghost"
          disabled={busy}
          onPress={() => router.push({ pathname: '/forgot-password', params: { email } })}
        />
      </Card>

      <Button
        title="Continue as guest"
        variant="ghost"
        disabled={busy}
        onPress={() => run(signInAnonymously)}
      />
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
  success: { color: Colors.success, fontSize: 14, lineHeight: 20 },
});
