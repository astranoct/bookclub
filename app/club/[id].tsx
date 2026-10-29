import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { CurrentBookCard } from '@/components/club/CurrentBookCard';
import { FinishedBooksCard } from '@/components/club/FinishedBooksCard';
import { MeetingCard } from '@/components/club/MeetingCard';
import { ProgressCard } from '@/components/club/ProgressCard';
import { SuggestionsCard } from '@/components/club/SuggestionsCard';
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
import {
  finishCurrentBook,
  getClubPrefs,
  getProgress,
  getSuggestions,
  removeSuggestion,
  saveProgress,
  setCurrentBook,
  setMeeting,
} from '@/services/clubData';
import type { Book } from '@/types/book';
import type { ClubPrefs, Meeting, ProgressEntry } from '@/types/club';
import { isOwner, planLeave } from '@/utils/clubs';
import { isValidEmail } from '@/utils/invites';
import { bookKey } from '@/utils/progress';
import { visibleSuggestions, type Suggestion } from '@/utils/suggestions';

type Feedback = { ok: boolean; text: string } | null;

export default function ClubDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [clubName, setClubName] = useState<string | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<ClubPrefs>({});
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({});
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<Feedback>(null);
  const [leaving, setLeaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [club, memberList, me, clubPrefs] = await Promise.all([
        getClubById(id),
        getClubMembers(id),
        getCurrentUser(),
        getClubPrefs(id).catch(() => ({}) as ClubPrefs),
      ]);
      const joinedIds = memberList.filter((m) => m.confirmed).map((m) => m.id);
      const [progressMap, suggestionList] = await Promise.all([
        getProgress(joinedIds),
        getSuggestions(joinedIds),
      ]);

      setClubName(club.name);
      setMembers(memberList);
      setMyId(me?.$id ?? null);
      setPrefs(clubPrefs);
      setProgress(progressMap);
      setSuggestions(suggestionList);
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
  const book = prefs.currentBook ?? null;

  const nameOf = (membershipId: string) =>
    members.find((m) => m.id === membershipId)?.name ?? 'a member';

  function findBook() {
    router.push({ pathname: '/search', params: { clubId: id } });
  }

  async function saveMyProgress(page: number) {
    if (!me || !myId || !book) return;
    await saveProgress({ membershipId: me.id, userId: myId, clubId: id }, book, page);
    setProgress((current) => ({ ...current, [me.id]: { page, bookKey: bookKey(book) } }));
  }

  async function saveMeeting(meeting: Meeting | null) {
    await setMeeting(id, meeting);
    setPrefs((current) => ({ ...current, meeting }));
  }

  async function finishBook() {
    try {
      await finishCurrentBook(id);
      await load();
    } catch {
      Alert.alert('Could not finish the book', 'Please try again in a moment.');
    }
  }

  async function chooseSuggestion(chosen: Book) {
    await setCurrentBook(id, chosen);
    await load();
  }

  async function removeMySuggestion() {
    if (!me) return;
    await removeSuggestion(me.id);
    setSuggestions((current) => current.filter((s) => s.membershipId !== me.id));
  }

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

      <CurrentBookCard
        book={book}
        isOwner={iAmOwner}
        onChangeBook={findBook}
        onFinish={finishBook}
      />

      <MeetingCard meeting={prefs.meeting} canEdit={iAmOwner} onSave={saveMeeting} />

      <ProgressCard
        book={book}
        members={joined}
        myMembershipId={me?.id ?? null}
        progress={progress}
        onSave={saveMyProgress}
      />

      <SuggestionsCard
        suggestions={visibleSuggestions(suggestions, prefs)}
        nameOf={nameOf}
        myMembershipId={me?.id ?? null}
        isOwner={iAmOwner}
        hasCurrentBook={!!book}
        onChoose={chooseSuggestion}
        onRemoveMine={removeMySuggestion}
        onFindBook={findBook}
      />

      <FinishedBooksCard books={prefs.finishedBooks ?? []} />

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
              We'll email them a link to join this club. Members only see each other's display
              names.
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
