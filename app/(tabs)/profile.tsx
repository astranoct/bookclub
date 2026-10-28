import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card, Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { Colors } from '@/constants/Colors';
import { getCurrentUser, signOut, updateName } from '@/services/appwrite';
import { displayName, hasRealName, validateName } from '@/utils/people';

interface Profile {
  name: string;
  email: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) {
        setProfile({ name: user.name, email: user.email });
        setName(hasRealName(user.name) ? user.name : '');
      }
      setLoading(false);
    });
  }, []);

  async function save() {
    const problem = validateName(name);
    if (problem) {
      setFeedback({ ok: false, text: problem });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const user = await updateName(name.trim());
      setProfile({ name: user.name, email: user.email });
      setName(hasRealName(user.name) ? user.name : '');
      setFeedback({ ok: true, text: 'Name saved.' });
    } catch {
      setFeedback({ ok: false, text: 'Could not save your name. Try again.' });
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await signOut();
    router.replace('/login');
  }

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={Colors.accentLight} style={styles.spinner} />
      </Screen>
    );
  }

  const isGuest = !profile?.email;
  const currentName = hasRealName(profile?.name) ? profile.name : '';
  const unchanged = name.trim() === currentName;

  return (
    <Screen>
      <View style={styles.hero}>
        <Avatar name={profile?.name} size={88} />
        <ThemedText type="subtitle">{displayName(profile?.name)}</ThemedText>
        <ThemedText type="muted">{isGuest ? 'Guest account' : profile?.email}</ThemedText>
      </View>

      <Card>
        <ThemedText type="label">Display name</ThemedText>
        <ThemedText type="muted">
          This is what other club members see. Your email is never shown to them.
        </ThemedText>
        <ThemedTextInput
          placeholder="Your name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          maxLength={128}
          onSubmitEditing={save}
        />
        {feedback && (
          <ThemedText style={{ color: feedback.ok ? Colors.success : Colors.danger }}>
            {feedback.text}
          </ThemedText>
        )}
        <Button title="Save name" onPress={save} loading={saving} disabled={unchanged} />
      </Card>

      <Card>
        <ThemedText type="label">Account</ThemedText>
        <View style={styles.row}>
          <ThemedText type="muted">Email</ThemedText>
          <ThemedText style={styles.value} numberOfLines={1}>
            {isGuest ? 'None (guest)' : profile?.email}
          </ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText type="muted">Type</ThemedText>
          <ThemedText style={styles.value}>{isGuest ? 'Guest' : 'Email and password'}</ThemedText>
        </View>
        {isGuest && (
          <ThemedText type="muted">
            Guest accounts are lost when you sign out. Create an account on the sign-in screen to
            keep your clubs.
          </ThemedText>
        )}
      </Card>

      <Button title="Sign out" variant="danger" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  spinner: { paddingVertical: 48 },
  hero: { alignItems: 'center', gap: 6, paddingVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  value: { flexShrink: 1, textAlign: 'right' },
});
