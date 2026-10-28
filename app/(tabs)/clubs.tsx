import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card, Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { Colors } from '@/constants/Colors';
import { acceptInvite, createClub, getClubs } from '@/services/appwrite';
import { parseInviteLink } from '@/utils/invites';
import { MAX_NAME_LENGTH } from '@/utils/people';

interface ClubItem {
  id: string;
  name: string;
  memberCount: number;
}

type Feedback = { ok: boolean; text: string } | null;

function messageOf(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

export default function Clubs() {
  const router = useRouter();
  const [clubs, setClubs] = useState<ClubItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createFeedback, setCreateFeedback] = useState<Feedback>(null);

  const [inviteLink, setInviteLink] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinFeedback, setJoinFeedback] = useState<Feedback>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const teams = await getClubs();
      setClubs(teams.map((t) => ({ id: t.$id, name: t.name, memberCount: t.total })));
    } catch {
      setLoadError('Could not load your clubs. Switch tabs to retry.');
      setClubs((current) => current ?? []);
    }
  }, []);

  // Reload on focus so leaving a club or accepting an invite is reflected here.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openClub(id: string) {
    router.push({ pathname: '/club/[id]', params: { id } });
  }

  async function create() {
    const name = newName.trim();
    if (!name) {
      setCreateFeedback({ ok: false, text: 'Give your club a name.' });
      return;
    }
    setCreating(true);
    setCreateFeedback(null);
    try {
      const club = await createClub(name);
      setNewName('');
      openClub(club.$id);
    } catch (e) {
      setCreateFeedback({ ok: false, text: messageOf(e, 'Could not create the club.') });
    } finally {
      setCreating(false);
    }
  }

  async function join() {
    const params = parseInviteLink(inviteLink);
    if (!params) {
      setJoinFeedback({ ok: false, text: "That doesn't look like an invite link." });
      return;
    }
    setJoining(true);
    setJoinFeedback(null);
    try {
      await acceptInvite(params);
      setInviteLink('');
      setJoinFeedback({ ok: true, text: "You're in! The club is now in your list." });
      await load();
    } catch (e) {
      setJoinFeedback({ ok: false, text: messageOf(e, 'Could not accept the invite.') });
    } finally {
      setJoining(false);
    }
  }

  if (clubs === null) {
    return (
      <Screen>
        <ActivityIndicator color={Colors.accentLight} style={styles.spinner} />
      </Screen>
    );
  }

  return (
    <Screen>
      {loadError && <ThemedText style={styles.error}>{loadError}</ThemedText>}

      <ThemedText type="label">Your clubs · {clubs.length}</ThemedText>
      {clubs.length === 0 ? (
        <Card>
          <ThemedText type="muted">You're not in any clubs yet. Create one below.</ThemedText>
        </Card>
      ) : (
        clubs.map((club) => (
          <Pressable
            key={club.id}
            onPress={() => openClub(club.id)}
            style={({ pressed }) => pressed && styles.pressed}>
            <Card>
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <ThemedText type="subtitle" numberOfLines={1}>
                    {club.name}
                  </ThemedText>
                  <ThemedText type="muted">
                    {club.memberCount} {club.memberCount === 1 ? 'member' : 'members'}
                  </ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={26} color={Colors.textMuted} />
              </View>
            </Card>
          </Pressable>
        ))
      )}

      <Card>
        <ThemedText type="subtitle">Create a club</ThemedText>
        <ThemedTextInput
          placeholder="Club name"
          value={newName}
          onChangeText={setNewName}
          maxLength={MAX_NAME_LENGTH}
          onSubmitEditing={create}
        />
        {createFeedback && (
          <ThemedText style={{ color: createFeedback.ok ? Colors.success : Colors.danger }}>
            {createFeedback.text}
          </ThemedText>
        )}
        <Button title="Create club" onPress={create} loading={creating} />
      </Card>

      <Card>
        <ThemedText type="subtitle">Join with an invite link</ThemedText>
        <ThemedText type="muted">
          Got an invite email? Open the link on this device, or paste it here.
        </ThemedText>
        <ThemedTextInput
          placeholder="Paste invite link"
          value={inviteLink}
          onChangeText={setInviteLink}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {joinFeedback && (
          <ThemedText style={{ color: joinFeedback.ok ? Colors.success : Colors.danger }}>
            {joinFeedback.text}
          </ThemedText>
        )}
        <Button title="Join club" variant="secondary" onPress={join} loading={joining} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  spinner: { paddingVertical: 48 },
  error: { color: Colors.danger },
  pressed: { opacity: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, gap: 2 },
});
