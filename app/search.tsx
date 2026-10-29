import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { BookCard } from '@/components/BookCard';
import { Button } from '@/components/Button';
import { Card, Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { Colors } from '@/constants/Colors';
import { getMyClub, type MyClub } from '@/services/appwrite';
import { saveSuggestion, setCurrentBook } from '@/services/clubData';
import { searchForBook } from '@/services/openLibrary';
import type { Book, SearchResult } from '@/types/book';
import { shareActions, type ShareAction } from '@/utils/clubs';

const LABELS: Record<ShareAction, string> = {
  set: 'Set as club book',
  suggest: 'Suggest to club',
};

/**
 * Finds a book for one club. It is only opened from a club's page or card, with the club's ID
 * in the route, either to set the club's book (owners) or to suggest one (everyone).
 * `mode=suggest` means the book is only ever a suggestion, so it can't replace the current one.
 */
export default function BookSearch() {
  const router = useRouter();
  const { clubId, mode } = useLocalSearchParams<{ clubId?: string; mode?: string }>();
  const suggestOnly = mode === 'suggest';

  const [club, setClub] = useState<MyClub | null>(null);
  const [clubLoaded, setClubLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [selected, setSelected] = useState<Book | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<ShareAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId) {
      setClubLoaded(true);
      return;
    }
    getMyClub(clubId).then((found) => {
      setClub(found);
      setClubLoaded(true);
    });
  }, [clubId]);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setMessage(null);
    setShowAlternatives(false);
    try {
      const found = await searchForBook(query.trim());
      setResult(found);
      setSelected(found?.best ?? null);
      if (!found) setMessage('No books found. Try a different title.');
    } catch {
      setMessage('Search failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function apply(book: Book, action: ShareAction) {
    if (!club) return;
    setSaving(action);
    setMessage(null);
    try {
      if (action === 'set') {
        await setCurrentBook(club.id, book);
      } else if (club.membershipId) {
        await saveSuggestion(
          { membershipId: club.membershipId, userId: club.userId, clubId: club.id },
          book
        );
      }
      // Go back to the club's page, where the result shows up.
      router.dismissTo({ pathname: '/club/[id]', params: { id: club.id } });
    } catch {
      setMessage(
        action === 'set'
          ? 'Could not update the club book. Try again.'
          : "Could not save your suggestion. Check that the club's suggestions table is set up."
      );
      setSaving(null);
    }
  }

  function choose(book: Book) {
    setSelected(book);
    setShowAlternatives(false);
  }

  if (!clubLoaded) {
    return (
      <Screen>
        <ActivityIndicator color={Colors.accentLight} style={styles.spinner} />
      </Screen>
    );
  }

  if (!club) {
    return (
      <Screen>
        <ThemedText type="subtitle">Open a club first</ThemedText>
        <ThemedText type="muted">
          Books are chosen or suggested from a club's page. Open one of your clubs and try again.
        </ThemedText>
        <Button title="Go to my clubs" variant="secondary" onPress={() => router.replace('/clubs')} />
      </Screen>
    );
  }

  const actions = shareActions(club.isOwner, suggestOnly);

  return (
    <Screen>
      <View>
        <ThemedText type="label">
          {actions.primary === 'suggest' ? 'Suggesting a book to' : 'Choosing a book for'}
        </ThemedText>
        <ThemedText type="title">{club.name}</ThemedText>
      </View>

      <View style={styles.searchRow}>
        <MaterialIcons name="search" size={22} color={Colors.textMuted} style={styles.searchIcon} />
        <ThemedTextInput
          placeholder="Search for a book title"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
          style={styles.input}
        />
      </View>
      <Button title="Search" onPress={search} loading={loading} />

      {message && (
        <View style={styles.message}>
          <ThemedText type="muted" style={styles.messageText}>
            {message}
          </ThemedText>
        </View>
      )}

      {!selected && !loading && !message && (
        <View style={styles.empty}>
          <MaterialIcons name="menu-book" size={56} color={Colors.border} />
          <ThemedText type="muted" style={styles.messageText}>
            Search for a title to find your next read.
          </ThemedText>
        </View>
      )}

      {loading && <ActivityIndicator color={Colors.accentLight} style={styles.spinner} />}

      {selected && (
        <>
          <Card>
            <BookCard book={selected} />
          </Card>
          <Button
            title={LABELS[actions.primary]}
            onPress={() => apply(selected, actions.primary)}
            loading={saving === actions.primary}
            disabled={saving !== null}
          />
          {actions.secondary && (
            <Button
              title="Suggest instead"
              variant="secondary"
              onPress={() => apply(selected, actions.secondary as ShareAction)}
              loading={saving === actions.secondary}
              disabled={saving !== null}
            />
          )}
        </>
      )}

      {result && result.alternatives.length > 0 && (
        <>
          <Button
            title={showAlternatives ? 'Hide other matches' : 'Wrong book?'}
            variant="ghost"
            onPress={() => setShowAlternatives((shown) => !shown)}
          />
          {showAlternatives && (
            <>
              <ThemedText type="label">Other matches</ThemedText>
              {[result.best, ...result.alternatives].map((book, i) => (
                <Pressable
                  key={`${i}:${book.title}`}
                  onPress={() => choose(book)}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <Card>
                    <BookCard book={book} variant="compact" />
                  </Card>
                </Pressable>
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow: { justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
  input: { paddingLeft: 44 },
  message: { paddingVertical: 4 },
  messageText: { textAlign: 'center' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  spinner: { paddingVertical: 24 },
  pressed: { opacity: 0.8 },
});
