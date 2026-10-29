import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BookCard } from '@/components/BookCard';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { Card, Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { getCurrentUser, getMyClubs, syncMyProfiles, type MyClub } from '@/services/appwrite';
import { getClubPrefs, getProgress } from '@/services/clubData';
import type { ClubPrefs } from '@/types/club';
import { formatMeeting, isUpcoming } from '@/utils/meeting';
import { firstName, hasRealName } from '@/utils/people';
import { currentPage, progressPercent } from '@/utils/progress';

interface ClubSummary {
  club: MyClub;
  prefs: ClubPrefs;
  myPage: number;
}

export default function Home() {
  const router = useRouter();
  const [clubs, setClubs] = useState<ClubSummary[] | null>(null);
  const [greeting, setGreeting] = useState('Welcome back');
  const [needsName, setNeedsName] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [myClubs, user] = await Promise.all([getMyClubs(), getCurrentUser()]);
      const name = firstName(user?.name);
      setGreeting(name ? `Hi, ${name}` : 'Welcome back');
      setNeedsName(!!user && !hasRealName(user.name));
      if (user) syncMyProfiles({ id: user.$id, name: user.name }, myClubs);

      const summaries = await Promise.all(
        myClubs.map(async (club): Promise<ClubSummary> => {
          const prefs = await getClubPrefs(club.id).catch(() => ({}) as ClubPrefs);
          let myPage = 0;
          if (club.membershipId && prefs.currentBook) {
            const mine = await getProgress([club.membershipId]);
            myPage = currentPage(mine[club.membershipId], prefs.currentBook);
          }
          return { club, prefs, myPage };
        })
      );
      setClubs(summaries);
    } catch {
      setError('Could not load your clubs. Switch tabs to retry.');
      setClubs((current) => current ?? []);
    }
  }, []);

  // Reload on focus so changes made on a club's page or from the book search show up here.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function chooseBook(clubId: string) {
    router.push({ pathname: '/search', params: { clubId } });
  }

  function openClub(id: string) {
    router.push({ pathname: '/club/[id]', params: { id } });
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
      <View>
        <ThemedText type="title">{greeting}</ThemedText>
        <ThemedText type="muted">
          {clubs.length > 0 ? "Here's what your clubs are reading." : 'Start or join a club to begin.'}
        </ThemedText>
      </View>

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      {needsName && (
        <Card>
          <ThemedText type="subtitle">Add your name</ThemedText>
          <ThemedText type="muted">
            Other members see you as "Unnamed reader" until you set a display name.
          </ThemedText>
          <Button title="Set display name" variant="secondary" onPress={() => router.push('/profile')} />
        </Card>
      )}

      {clubs.length === 0 ? (
        <Card>
          <ThemedText type="subtitle">No clubs yet</ThemedText>
          <ThemedText type="muted">
            Create a book club, then pick the first book to read together.
          </ThemedText>
          <Button title="Create a club" onPress={() => router.push('/clubs')} />
        </Card>
      ) : (
        clubs.map(({ club, prefs, myPage }) => {
          const book = prefs.currentBook ?? null;
          const percent = book ? progressPercent(myPage, book.pageCount) : null;
          const meeting = isUpcoming(prefs.meeting) ? prefs.meeting : null;

          return (
            <Card key={club.id}>
              <View style={styles.header}>
                <ThemedText type="subtitle" style={styles.clubName} numberOfLines={1}>
                  {club.name}
                </ThemedText>
                <ThemedText type="muted">
                  {club.memberCount} {club.memberCount === 1 ? 'member' : 'members'}
                </ThemedText>
              </View>

              <ThemedText type="label">Currently reading</ThemedText>
              {book ? (
                <BookCard book={book} variant={clubs.length === 1 ? 'featured' : 'compact'} />
              ) : (
                <ThemedText type="muted">No book chosen yet.</ThemedText>
              )}

              {book && (
                <View style={styles.progress}>
                  <ThemedText type="muted">
                    {myPage > 0
                      ? `You're on page ${myPage}${book.pageCount ? ` of ${book.pageCount}` : ''}${percent !== null ? ` · ${percent}%` : ''}`
                      : "You haven't logged any progress yet."}
                  </ThemedText>
                  <ProgressBar percent={percent} />
                </View>
              )}

              {meeting && (
                <View style={styles.meeting}>
                  <MaterialIcons name="event" size={18} color={Colors.accentLight} />
                  <ThemedText style={styles.meetingText}>
                    Next meeting: {formatMeeting(meeting.at)}
                  </ThemedText>
                </View>
              )}

              {club.isOwner && (
                <Button
                  title={book ? 'Change book' : 'Choose a book'}
                  variant={book ? 'secondary' : 'primary'}
                  onPress={() => chooseBook(club.id)}
                />
              )}
              <Button
                title="Open club"
                variant={club.isOwner ? 'ghost' : 'secondary'}
                onPress={() => openClub(club.id)}
              />
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  spinner: { paddingVertical: 48 },
  error: { color: Colors.danger },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  clubName: { flexShrink: 1 },
  progress: { gap: 6 },
  meeting: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meetingText: { flex: 1, fontSize: 15, lineHeight: 22 },
});
