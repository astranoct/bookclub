import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { BookCard } from '@/components/BookCard';
import { Button } from '@/components/Button';
import { Card } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import type { Book } from '@/types/book';
import type { Suggestion } from '@/utils/suggestions';

interface SuggestionsCardProps {
  suggestions: Suggestion[];
  nameOf: (membershipId: string) => string;
  myMembershipId: string | null;
  isOwner: boolean;
  hasCurrentBook: boolean;
  onChoose: (book: Book) => Promise<void>;
  onRemoveMine: () => Promise<void>;
  onFindBook: () => void;
}

export function SuggestionsCard({
  suggestions,
  nameOf,
  myMembershipId,
  isOwner,
  hasCurrentBook,
  onChoose,
  onRemoveMine,
  onFindBook,
}: SuggestionsCardProps) {
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch {
      Alert.alert('Something went wrong', 'Please try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  function choose(book: Book) {
    if (!hasCurrentBook) {
      void run(() => onChoose(book));
      return;
    }
    Alert.alert(
      `Read "${book.title}" next?`,
      'This replaces the current book. Finish the current book first if you want it kept in your finished list.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace it', style: 'destructive', onPress: () => void run(() => onChoose(book)) },
      ]
    );
  }

  return (
    <View style={styles.wrap}>
      <ThemedText type="label">Suggestions · {suggestions.length}</ThemedText>
      <Card>
        {suggestions.length === 0 && (
          <ThemedText type="muted">
            No suggestions yet. Anyone in the club can suggest one book at a time.
          </ThemedText>
        )}

        {suggestions.map((s) => {
          const mine = s.membershipId === myMembershipId;
          return (
            <View key={s.membershipId} style={styles.item}>
              <ThemedText type="muted">{mine ? 'Your suggestion' : `Suggested by ${nameOf(s.membershipId)}`}</ThemedText>
              <BookCard book={s.book} variant="compact" />
              {isOwner && (
                <Button
                  title="Read this next"
                  variant="secondary"
                  disabled={busy}
                  onPress={() => choose(s.book)}
                />
              )}
              {mine && (
                <Button
                  title="Remove my suggestion"
                  variant="ghost"
                  disabled={busy}
                  onPress={() => void run(onRemoveMine)}
                />
              )}
            </View>
          );
        })}

        <Button title="Find a book to suggest" variant="ghost" onPress={onFindBook} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  item: { gap: 8 },
});
