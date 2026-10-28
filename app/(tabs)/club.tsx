import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BookCard } from '@/components/BookCard';
import { Button } from '@/components/Button';
import { Card, Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { Colors } from '@/constants/Colors';
import {
  createClub,
  getClub,
  getClubMembers,
  getCurrentBook,
  signOut,
} from '@/services/appwrite';
import type { Book } from '@/types/book';

interface ClubState {
  id: string;
  name: string;
  members: string[];
  book: Book | null;
}

function Avatar({ name }: { name: string }) {
  return (
    <View style={styles.avatar}>
      <ThemedText style={styles.avatarText}>{name.trim().charAt(0).toUpperCase() || '?'}</ThemedText>
    </View>
  );
}

export default function ClubScreen() {
  const router = useRouter();
  const [club, setClub] = useState<ClubState | null>(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const found = await getClub();
      if (!found) {
        setClub(null);
        return;
      }
      const [members, book] = await Promise.all([
        getClubMembers(found.$id),
        getCurrentBook(found.$id),
      ]);
      setClub({
        id: found.$id,
        name: found.name,
        members: members.map((m) => m.userName || m.userEmail || 'Guest reader'),
        book,
      });
    } catch {
      setError('Could not load your club. Switch tabs to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever the tab gains focus so a book picked on the search tab shows up.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function create() {
    if (!newName.trim()) return;
    setError(null);
    try {
      await createClub(newName.trim());
      setNewName('');
      await load();
    } catch {
      setError('Could not create the club. Try again.');
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

  return (
    <Screen>
      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      {club ? (
        <>
          <View>
            <ThemedText type="label">Your club</ThemedText>
            <ThemedText type="title">{club.name}</ThemedText>
          </View>

          <ThemedText type="label">Currently reading</ThemedText>
          <Card>
            {club.book ? (
              <BookCard book={club.book} />
            ) : (
              <ThemedText type="muted">No book chosen yet. Find one on the Search tab.</ThemedText>
            )}
          </Card>

          <ThemedText type="label">Members · {club.members.length}</ThemedText>
          <Card>
            {club.members.map((name, i) => (
              <View key={`${i}:${name}`} style={styles.member}>
                <Avatar name={name} />
                <ThemedText>{name}</ThemedText>
              </View>
            ))}
          </Card>
        </>
      ) : (
        <Card>
          <ThemedText type="subtitle">Start a book club</ThemedText>
          <ThemedText type="muted">You are not in a club yet. Name one to get started.</ThemedText>
          <ThemedTextInput placeholder="Club name" value={newName} onChangeText={setNewName} />
          <Button title="Create club" onPress={create} />
        </Card>
      )}

      <Button title="Sign out" variant="danger" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  spinner: { paddingVertical: 48 },
  error: { color: Colors.danger },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.accentLight, fontWeight: '700', fontSize: 15, lineHeight: 20 },
});
