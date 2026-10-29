import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { acceptInvite } from '@/services/appwrite';

type Status = 'working' | 'done' | 'error';

/** Opened from the link in an invite email: bookclub://invite?teamId=...&secret=... */
export default function Invite() {
  const router = useRouter();
  const { teamId, membershipId, userId, secret } = useLocalSearchParams<{
    teamId?: string;
    membershipId?: string;
    userId?: string;
    secret?: string;
  }>();

  const [status, setStatus] = useState<Status>('working');
  const [message, setMessage] = useState('');
  const started = useRef(false);

  useEffect(() => {
    // The link params can re-render this screen; only ever accept once.
    if (started.current) return;
    started.current = true;

    if (!teamId || !membershipId || !userId || !secret) {
      setStatus('error');
      setMessage('This invite link is incomplete. Ask for a new one.');
      return;
    }

    acceptInvite({ teamId, membershipId, userId, secret })
      .then(() => setStatus('done'))
      .catch((e) => {
        setStatus('error');
        setMessage(
          e instanceof Error && e.message ? e.message : 'Could not accept this invite.'
        );
      });
  }, [teamId, membershipId, userId, secret]);

  return (
    <Screen topInset>
      <View style={styles.center}>
        {status === 'working' && (
          <>
            <ActivityIndicator size="large" color={Colors.accentLight} />
            <ThemedText type="muted">Joining the club...</ThemedText>
          </>
        )}

        {status === 'done' && (
          <>
            <ThemedText type="title">You're in!</ThemedText>
            <ThemedText type="muted">The club has been added to your list.</ThemedText>
            <Button title="Go to Home" onPress={() => router.replace('/home')} />
          </>
        )}

        {status === 'error' && (
          <>
            <ThemedText type="title">Couldn't join</ThemedText>
            <ThemedText style={styles.error}>{message}</ThemedText>
            <Button title="Back to the app" variant="secondary" onPress={() => router.replace('/')} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 16, paddingVertical: 48 },
  error: { color: Colors.danger, textAlign: 'center' },
});
