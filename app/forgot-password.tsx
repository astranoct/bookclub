import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card, Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { Colors, Radius } from '@/constants/Colors';
import {
  AccountError,
  requestPasswordRecovery,
  resetPassword,
  type PasswordRecovery,
} from '@/services/account';
import { isValidEmail } from '@/utils/invites';
import {
  isCompleteRecoveryCode,
  normalizeRecoveryCode,
  RECOVERY_CODE_LENGTH,
  validateNewPassword,
} from '@/utils/password';

function messageOf(e: unknown, fallback: string) {
  return e instanceof AccountError ? e.message : fallback;
}

/**
 * Two steps on one screen: ask for a 6-digit code by email, then enter that code with a new
 * password. Using a code rather than an emailed link means it works in any email app.
 */
export default function ForgotPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(params.email ?? '');
  const [recovery, setRecovery] = useState<PasswordRecovery | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    if (!isValidEmail(email)) {
      setError('Enter the email address you signed up with.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setRecovery(await requestPasswordRecovery(email));
    } catch (e) {
      setError(messageOf(e, 'Something went wrong. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!recovery) return;
    if (!isCompleteRecoveryCode(code)) {
      setError(`Enter the ${RECOVERY_CODE_LENGTH}-digit code from the email.`);
      return;
    }
    const problem = validateNewPassword(password, confirmation);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetPassword(recovery.userId, code, password);
      router.replace({ pathname: '/login', params: { reset: '1' } });
    } catch (e) {
      setError(messageOf(e, 'Something went wrong. Please try again.'));
      setBusy(false);
    }
  }

  function startOver() {
    setRecovery(null);
    setCode('');
    setPassword('');
    setConfirmation('');
    setError(null);
  }

  if (!recovery) {
    return (
      <Screen>
        <ThemedText type="title">Forgot your password?</ThemedText>
        <ThemedText type="muted">
          Enter your email and we'll send you a {RECOVERY_CODE_LENGTH}-digit code to set a new one.
        </ThemedText>

        <Card>
          <ThemedTextInput
            placeholder="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={sendCode}
            editable={!busy}
          />
          {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          <Button title="Send code" onPress={sendCode} loading={busy} />
        </Card>

        <Button title="Back to sign in" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText type="title">Check your email</ThemedText>
      <ThemedText type="muted">
        If there's an account for {email.trim()}, we've sent a {RECOVERY_CODE_LENGTH}-digit code. It
        expires after 15 minutes.
      </ThemedText>

      {recovery.phrase && (
        <View style={styles.phrase}>
          <ThemedText type="label">Security phrase</ThemedText>
          <ThemedText type="subtitle">{recovery.phrase}</ThemedText>
          <ThemedText type="muted">
            The email should show this same phrase. If it doesn't, don't use the code.
          </ThemedText>
        </View>
      )}

      <Card>
        <ThemedTextInput
          placeholder={`${RECOVERY_CODE_LENGTH}-digit code`}
          value={code}
          onChangeText={(text) => setCode(normalizeRecoveryCode(text))}
          keyboardType="number-pad"
          maxLength={RECOVERY_CODE_LENGTH + 1}
          editable={!busy}
        />
        <ThemedTextInput
          placeholder="New password"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          secureTextEntry
          editable={!busy}
        />
        <ThemedTextInput
          placeholder="Confirm new password"
          value={confirmation}
          onChangeText={setConfirmation}
          autoCapitalize="none"
          secureTextEntry
          editable={!busy}
          onSubmitEditing={submit}
        />
        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        <Button title="Set new password" onPress={submit} loading={busy} />
      </Card>

      <Button
        title="Use a different email or send a new code"
        variant="ghost"
        onPress={startOver}
        disabled={busy}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: Colors.danger },
  phrase: {
    gap: 4,
    padding: 16,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentSoft,
  },
});
