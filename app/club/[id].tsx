import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card, Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { Colors, Radius } from '@/constants/Colors';
import {
  getClubById,
  getClubMembers,
  getCurrentUser,
  inviteToClub,
  leaveClub,
  type ClubMember,
} from '@/services/appwrite';
import { isOwner, planLeave } from '@/utils/clubs';
import { isValidEmail } from '@/utils/invites';

type Feedback = { ok: boolean; text: string } | null;

export default function ClubDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [clubName, setClubName] = useState<string | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<Feedback>(null);
  const [leaving, setLeaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [club, memberList, me] = await Promise.all([
        getClubById(id),
        getClubMembers(id),
        getCurrentUser(),
      ]);
      setClubName(club.name);
      setMembers(memberList);
      setMyId(me?.$id ?? null);
      setError(null);
    } catch {
      setError('Could not load this club. It may have been deleted.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const joined = members.filter((m) => m.confirmed);
  const pendingCount = members.length - joined.length;
  const me = joined.find((m) => m.userId === myId);
  const iAmOwner = me ? isOwner(me) : false;

  async function sendInvite() {
    if (!isValidEmail(email)) {
      setInviteFeedback({ ok: false, text: 'Enter a valid email address.' });
      return;
    }
    setInviting(true);
    setInviteFeedback(null);
    try {
      await inviteToClub(id, email);
      setInviteFeedback({ ok: true, text: `Invite sent to ${email.trim()}.` });
      setEmail('');
      await load();
    } catch (e) {
      setInviteFeedback({
        ok: false,
        text: e instanceof Error && e.message ? e.message : 'Could not send the invite.',
      });
    } finally {
      setInviting(false);
    }
  }

  function confirmLeave() {
    if (!myId) return;
    const plan = planLeave(members, myId);

    let message = 'You can only rejoin if someone invites you again.';
    let action = 'Leave';
    if (plan.action === 'delete-club') {
      message = "You're the only member, so leaving will delete this club.";
      action = 'Delete club';
    } else if (plan.promoteMembershipId) {
      const heir = members.find((m) => m.id === plan.promoteMembershipId);
      message = `You're the only owner, so ${heir?.name ?? 'another member'} will become the owner.`;
    }

    Alert.alert(`Leave ${clubName ?? 'this club'}?`, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: action, style: 'destructive', onPress: leave },
    ]);
  }

  async function leave() {
    setLeaving(true);
    try {
      await leaveClub(id);
      router.replace('/clubs');
    } catch (e) {
      setLeaving(false);
      Alert.alert('Could not leave', e instanceof Error ? e.message : 'Try again in a moment.');
    }
  }

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={Colors.accentLight} style={styles.spinner} />
      </Screen>
    );
  }

  if (error || !clubName) {
    return (
      <Screen>
        <ThemedText style={styles.error}>{error ?? 'Club not found.'}</ThemedText>
        <Button title="Back to clubs" variant="secondary" onPress={() => router.replace('/clubs')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText type="title">{clubName}</ThemedText>

      <ThemedText type="label">Members · {joined.length}</ThemedText>
      <Card>
        {joined.map((member) => (
          <View key={member.id} style={styles.member}>
            <Avatar name={member.name} />
            <ThemedText style={styles.memberName} numberOfLines={1}>
              {member.name}
            </ThemedText>
            {member.userId === myId && <ThemedText type="muted">You</ThemedText>}
            {isOwner(member) && (
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>Owner</ThemedText>
              </View>
            )}
          </View>
        ))}
        {pendingCount > 0 && (
          <ThemedText type="muted">
            {pendingCount} pending {pendingCount === 1 ? 'invite' : 'invites'}
          </ThemedText>
        )}
      </Card>

      <Card>
        <ThemedText type="subtitle">Invite someone</ThemedText>
        {iAmOwner ? (
          <>
            <ThemedText type="muted">
              We'll email them a link to join this club. They'll only ever appear to others by
              their display name.
            </ThemedText>
            <ThemedTextInput
              placeholder="friend@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onSubmitEditing={sendInvite}
            />
            {inviteFeedback && (
              <ThemedText style={{ color: inviteFeedback.ok ? Colors.success : Colors.danger }}>
                {inviteFeedback.text}
              </ThemedText>
            )}
            <Button title="Send invite" onPress={sendInvite} loading={inviting} />
          </>
        ) : (
          <ThemedText type="muted">Only club owners can send invites.</ThemedText>
        )}
      </Card>

      <Button title="Leave club" variant="danger" onPress={confirmLeave} loading={leaving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  spinner: { paddingVertical: 48 },
  error: { color: Colors.danger },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberName: { flexShrink: 1 },
  badge: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accentSoft,
  },
  badgeText: { color: Colors.accentLight, fontSize: 12, lineHeight: 16, fontWeight: '700' },
});
