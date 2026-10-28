import { useState } from 'react';
import { ActivityIndicator, Button } from 'react-native';

import { BookCard } from '@/components/BookCard';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { ThemedView } from '@/components/ThemedView';
import { getClub, setCurrentBook } from '@/services/appwrite';
import { searchForBook } from '@/services/openLibrary';
import type { Book, SearchResult } from '@/types/book';

export default function BookSearch() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [selected, setSelected] = useState<Book | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  async function shareWithClub(book: Book) {
    try {
      const club = await getClub();
      if (!club) {
        setMessage('Join or create a club first (Club tab).');
        return;
      }
      await setCurrentBook(club.$id, book);
      setMessage(`"${book.title}" is now your club's book.`);
    } catch {
      setMessage('Could not update the club book. Try again.');
    }
  }

  function choose(book: Book) {
    setSelected(book);
    setShowAlternatives(false);
  }

  return (
    <Screen>
      <ThemedTextInput
        placeholder="Search for a book title"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={search}
        returnKeyType="search"
      />
      <Button title="Search" onPress={search} disabled={loading} />

      {loading && <ActivityIndicator />}
      {message && <ThemedText>{message}</ThemedText>}

      {selected && (
        <>
          <BookCard book={selected} />
          <Button title="Set as club book" onPress={() => shareWithClub(selected)} />
        </>
      )}

      {result && result.alternatives.length > 0 && (
        <>
          <Button
            title={showAlternatives ? 'Hide other matches' : 'Wrong book?'}
            onPress={() => setShowAlternatives((shown) => !shown)}
          />
          {showAlternatives &&
            [result.best, ...result.alternatives].map((book, i) => (
              <ThemedView key={`${i}:${book.title}`} style={{ gap: 8 }}>
                <BookCard book={book} />
                <Button title="Select" onPress={() => choose(book)} />
              </ThemedView>
            ))}
        </>
      )}
    </Screen>
  );
}
