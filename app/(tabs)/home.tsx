import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BookCard } from '@/components/BookCard';
import { Button } from '@/components/Button';
import { Card, Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { getClubs, getCurrentBook, getCurrentUser } from '@/services/appwrite';
import type { Book } from '@/types/book';
import { firstName, hasRealName } from '@/utils/people';

interface ClubSummary {
  id: string;
  name: string;
  memberCount: number;
  book: Book | null;
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
      const [teamList, user] = await Promise.all([getClubs(), getCurrentUser()]);
      const name = firstName(user?.name);
      setGreeting(name ? `Hi, ${name}` : 'Welcome back');
      setNeedsName(!!user && !hasRealName(user.name));

      const summaries = await Promise.all(
        teamList.map(async (team) => ({
          id: team.$id,
          name: team.name,
          memberCount: team.total,
          book: await getCurrentBook(team.$id).catch(() => null),
        }))
      );
      setClubs(summaries);
    } catch {
      setError('Could not load your clubs. Switch tabs to retry.');
      setClubs((current) => current ?? []);
    }
  }, []);

  // Reload on focus so a book picked on the Search tab shows up here straight away.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function chooseBook(clubId: string) {
    router.push({ pathname: '/search', params: { clubId } });
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
        clubs.map((club) => (
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
            {club.book ? (
              <BookCard book={club.book} variant={clubs.length === 1 ? 'featured' : 'compact'} />
            ) : (
              <ThemedText type="muted">No book chosen yet.</ThemedText>
            )}

            <Button
              title={club.book ? 'Change book' : 'Choose a book'}
              variant={club.book ? 'secondary' : 'primary'}
              onPress={() => chooseBook(club.id)}
            />
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  spinner: { paddingVertical: 48 },
  error: { color: Colors.danger },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  clubName: { flexShrink: 1 },
});
