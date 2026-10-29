import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BookCard } from '@/components/BookCard';
import { Button } from '@/components/Button';
import { Card } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import type { FinishedBook } from '@/types/club';

const PREVIEW_COUNT = 3;

function formatFinished(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function FinishedBooksCard({ books }: { books: FinishedBook[] }) {
  const [showAll, setShowAll] = useState(false);

  if (books.length === 0) return null;
  const shown = showAll ? books : books.slice(0, PREVIEW_COUNT);

  return (
    <View style={styles.wrap}>
      <ThemedText type="label">Finished books · {books.length}</ThemedText>
      <Card>
        {shown.map((book) => (
          <View key={`${book.finishedAt}:${book.title}`} style={styles.item}>
            <BookCard book={book} variant="compact" />
            <ThemedText type="muted">Finished {formatFinished(book.finishedAt)}</ThemedText>
          </View>
        ))}
        {books.length > PREVIEW_COUNT && (
          <Button
            title={showAll ? 'Show fewer' : `Show all ${books.length}`}
            variant="ghost"
            onPress={() => setShowAll((value) => !value)}
          />
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  item: { gap: 6 },
});
