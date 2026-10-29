import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { BookCard } from '@/components/BookCard';
import { Button } from '@/components/Button';
import { Card, Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { Colors, Radius } from '@/constants/Colors';
import { getMyClubs, type MyClub } from '@/services/appwrite';
import { getClubPrefs, saveSuggestion, setCurrentBook } from '@/services/clubData';
import { searchForBook } from '@/services/openLibrary';
import type { Book, SearchResult } from '@/types/book';
import { resolveShareTarget, shareButtons } from '@/utils/clubs';

interface ClubOption extends MyClub {
  book: Book | null;
}

export default function BookSearch() {
  const router = useRouter();
  const navigation = useNavigation();
  // Set when arriving from a club's own page or card, which means the club is already chosen.
  // `mode=suggest` comes from a "suggest a book" button and means never replace the current book.
  const { clubId, mode } = useLocalSearchParams<{ clubId?: string; mode?: string }>();
  const suggestOnly = mode === 'suggest';
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [selected, setSelected] = useState<Book | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [findingClubs, setFindingClubs] = useState(false);
  const [picker, setPicker] = useState<ClubOption[] | null>(null);
  const [pickerSuggests, setPickerSuggests] = useState(false);
  const [myClubs, setMyClubs] = useState<MyClub[]>([]);

  // Know your roles up front so the button can say "set" or "suggest" before it is pressed.
  useFocusEffect(
    useCallback(() => {
      getMyClubs()
        .then(setMyClubs)
        .catch(() => setMyClubs([]));

      // Forget where we were sent from once we leave, so the tab doesn't reuse it later.
      return () => navigation.setParams({ clubId: undefined, mode: undefined } as never);
    }, [navigation])
  );

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

  /** Owners set the club's book unless asked to suggest. Everyone else suggests it. */
  async function applyBook(book: Book, club: MyClub, suggest: boolean) {
    try {
      if (club.isOwner && !suggest) {
        await setCurrentBook(club.id, book);
        setMessage(`"${book.title}" is now the book for ${club.name}.`);
      } else if (club.membershipId) {
        await saveSuggestion(
          { membershipId: club.membershipId, userId: club.userId, clubId: club.id },
          book
        );
        setMessage(`Suggested "${book.title}" to ${club.name}.`);
      } else {
        setMessage(`You're not a member of ${club.name} yet.`);
        return;
      }

      setPicker(null);
      if (clubId) {
        // Clear the target so later visits to this tab don't silently reuse it.
        router.setParams({ clubId: undefined, mode: undefined });
        router.navigate({ pathname: '/club/[id]', params: { id: club.id } });
      }
    } catch {
      setMessage(
        club.isOwner && !suggest
          ? 'Could not update the club book. Try again.'
          : "Could not save your suggestion. Check that the club's suggestions table is set up."
      );
    }
  }

  /** Applies the book straight away when the club is obvious, otherwise asks which one. */
  async function requestShare(book: Book, suggest: boolean) {
    setFindingClubs(true);
    setMessage(null);
    setPicker(null);
    setPickerSuggests(suggest);
    try {
      const clubs = await getMyClubs();
      setMyClubs(clubs);
      const target = resolveShareTarget(clubs, clubId);

      if (target.kind === 'none') {
        setMessage('Create or join a club first (Clubs tab).');
      } else if (target.kind === 'direct') {
        await applyBook(book, target.club, suggest);
      } else {
        const options = await Promise.all(
          clubs.map(async (club) => ({
            ...club,
            book: (await getClubPrefs(club.id).catch(() => null))?.currentBook ?? null,
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

  const buttons = shareButtons(myClubs, clubId, suggestOnly);

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
            title={buttons.primary}
            onPress={() => requestShare(selected, suggestOnly)}
            loading={findingClubs}
          />
          {buttons.secondary && (
            <Button
              title={buttons.secondary}
              variant="secondary"
              disabled={findingClubs}
              onPress={() => requestShare(selected, true)}
            />
          )}
          {picker && (
            <Card>
              <ThemedText type="subtitle">Which club?</ThemedText>
              <ThemedText type="muted">{`Choose where "${selected.title}" goes.`}</ThemedText>
              {picker.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => applyBook(selected, option, pickerSuggests)}
                  style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                  <View style={styles.optionText}>
                    <ThemedText style={styles.optionName} numberOfLines={1}>
                      {option.name}
                    </ThemedText>
                    <ThemedText type="muted" numberOfLines={1}>
                      {option.book ? `Reading: ${option.book.title}` : 'No book yet'}
                    </ThemedText>
                    <ThemedText style={styles.optionAction} numberOfLines={1}>
                      {option.isOwner && !pickerSuggests ? 'Set as the club book' : 'Suggest to the club'}
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
  optionAction: { color: Colors.accentLight, fontSize: 13, lineHeight: 18 },
});
