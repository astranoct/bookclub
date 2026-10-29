import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { BookCard } from '@/components/BookCard';
import { Button } from '@/components/Button';
import { Card, Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { Colors, Radius } from '@/constants/Colors';
import { getClubs, getCurrentBook, setCurrentBook } from '@/services/appwrite';
import { searchForBook } from '@/services/openLibrary';
import type { Book, SearchResult } from '@/types/book';
import { resolveShareTarget } from '@/utils/clubs';

interface ClubOption {
  id: string;
  name: string;
  book: Book | null;
}

export default function BookSearch() {
  const router = useRouter();
  // Set when arriving from a club card on Home, which means the club is already chosen.
  const { clubId } = useLocalSearchParams<{ clubId?: string }>();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [selected, setSelected] = useState<Book | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [findingClubs, setFindingClubs] = useState(false);
  const [picker, setPicker] = useState<ClubOption[] | null>(null);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setMessage(null);
    setPicker(null);
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

  async function setBookFor(book: Book, club: { id: string; name: string }) {
    try {
      await setCurrentBook(club.id, book);
      setPicker(null);
      setMessage(`"${book.title}" is now the book for ${club.name}.`);
      if (clubId) {
        // Clear the target so later visits to this tab don't silently reuse it.
        router.setParams({ clubId: undefined });
        router.navigate('/home');
      }
    } catch {
      setMessage('Could not update the club book. Try again.');
    }
  }

  /** Applies the book straight away when the club is obvious, otherwise asks which one. */
  async function requestShare(book: Book) {
    setFindingClubs(true);
    setMessage(null);
    setPicker(null);
    try {
      const clubs = (await getClubs()).map((c) => ({ id: c.$id, name: c.name }));
      const target = resolveShareTarget(clubs, clubId);

      if (target.kind === 'none') {
        setMessage('Create or join a club first (Clubs tab).');
      } else if (target.kind === 'direct') {
        await setBookFor(book, target.club);
      } else {
        const options = await Promise.all(
          clubs.map(async (club) => ({
            ...club,
            book: await getCurrentBook(club.id).catch(() => null),
          }))
        );
        setPicker(options);
      }
    } catch {
      setMessage('Could not load your clubs. Try again.');
    } finally {
      setFindingClubs(false);
    }
  }

  function choose(book: Book) {
    setSelected(book);
    setPicker(null);
    setShowAlternatives(false);
  }

  return (
    <Screen>
      <View style={styles.searchRow}>
        <View style={styles.inputWrap}>
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
            title="Set as club book"
            onPress={() => requestShare(selected)}
            loading={findingClubs}
          />
          {picker && (
            <Card>
              <ThemedText type="subtitle">Which club?</ThemedText>
              <ThemedText type="muted">{`Choose where "${selected.title}" goes.`}</ThemedText>
              {picker.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => setBookFor(selected, option)}
                  style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                  <View style={styles.optionText}>
                    <ThemedText style={styles.optionName} numberOfLines={1}>
                      {option.name}
                    </ThemedText>
                    <ThemedText type="muted" numberOfLines={1}>
                      {option.book ? `Reading: ${option.book.title}` : 'No book yet'}
                    </ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={Colors.textMuted} />
                </Pressable>
              ))}
              <Button title="Cancel" variant="ghost" onPress={() => setPicker(null)} />
            </Card>
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
  searchRow: { flexDirection: 'row' },
  inputWrap: { flex: 1, justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
  input: { paddingLeft: 44 },
  message: { paddingVertical: 4 },
  messageText: { textAlign: 'center' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  spinner: { paddingVertical: 24 },
  pressed: { opacity: 0.8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceRaised,
  },
  optionText: { flex: 1, gap: 2 },
  optionName: { fontWeight: '700' },
});
