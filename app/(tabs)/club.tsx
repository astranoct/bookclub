import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Button } from 'react-native';

import { BookCard } from '@/components/BookCard';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
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
        members: members.map((m) => m.userName || m.userEmail),
        book,
      });
    } catch {
      setError('Could not load your club. Pull to retry by switching tabs.');
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
        <ActivityIndicator />
      </Screen>
    );
  }

  return (
    <Screen>
      {error && <ThemedText>{error}</ThemedText>}

      {club ? (
        <>
          <ThemedText type="title">{club.name}</ThemedText>

          <ThemedText type="subtitle">Currently reading</ThemedText>
          {club.book ? (
            <BookCard book={club.book} />
          ) : (
            <ThemedText>No book chosen yet. Find one on the Search tab.</ThemedText>
          )}

          <ThemedText type="subtitle">Members</ThemedText>
          {club.members.map((name, i) => (
            <ThemedText key={`${i}:${name}`}>{name}</ThemedText>
          ))}
        </>
      ) : (
        <>
          <ThemedText type="subtitle">You are not in a club yet.</ThemedText>
          <ThemedTextInput placeholder="Club name" value={newName} onChangeText={setNewName} />
          <Button title="Create club" onPress={create} />
        </>
      )}

      <Button title="Sign out" onPress={logout} />
    </Screen>
  );
}
