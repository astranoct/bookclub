import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { Card, Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { Colors } from '@/constants/Colors';
import { AccountError, sendSupportMessage } from '@/services/account';
import {
  buildSupportPayload,
  cooldownRemaining,
  MAX_SUPPORT_LENGTH,
  validateReplyEmail,
  validateSupportMessage,
} from '@/utils/support';

// Kept outside the component so the cooldown survives leaving and reopening the screen.
let lastSentAt: number | null = null;

export default function Contact() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function send() {
    const problem = validateSupportMessage(message) ?? validateReplyEmail(replyEmail);
    if (problem) {
      setError(problem);
      return;
    }
    const wait = cooldownRemaining(lastSentAt, Date.now());
    if (wait > 0) {
      setError(`Please wait ${Math.ceil(wait / 1000)} seconds before sending another message.`);
      return;
    }

    setSending(true);
    setError(null);
    try {
      await sendSupportMessage(
        buildSupportPayload({
          message,
          replyEmail,
          appVersion: Constants.expoConfig?.version ?? 'unknown',
          platform: `${Platform.OS} ${Platform.Version}`,
        })
      );
      lastSentAt = Date.now();
      setSent(true);
    } catch (e) {
      setError(
        e instanceof AccountError && e.kind === 'not-configured'
          ? "Support messages aren't set up in this version of the app yet."
          : 'Could not send your message. Please try again in a moment.'
      );
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <Screen>
        <ThemedText type="title">Thank you</ThemedText>
        <ThemedText type="muted">
          Your message was sent. If you left an email address, we'll reply there.
        </ThemedText>
        <Button title="Done" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText type="title">Contact support</ThemedText>
      <ThemedText type="muted">
        Tell us what went wrong or what you'd like to see. We only receive what you type here, plus
        your app version and device type.
      </ThemedText>

      <Card>
        <ThemedTextInput
          placeholder="What's going on?"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={MAX_SUPPORT_LENGTH}
          style={styles.message}
        />
        <ThemedText type="muted" style={styles.counter}>
          {message.length} / {MAX_SUPPORT_LENGTH}
        </ThemedText>

        <ThemedTextInput
          placeholder="Your email, if you'd like a reply (optional)"
          value={replyEmail}
          onChangeText={setReplyEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        <Button title="Send message" onPress={send} loading={sending} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  message: { height: 160, paddingTop: 14, textAlignVertical: 'top' },
  counter: { textAlign: 'right', fontSize: 13 },
  error: { color: Colors.danger },
});
