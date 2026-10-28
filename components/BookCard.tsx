import { Image, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { coverUrl } from '@/services/openLibrary';
import type { Book } from '@/types/book';

export function BookCard({ book }: { book: Book }) {
  const cover = coverUrl(book.coverId);

  return (
    <ThemedView style={styles.card}>
      {cover ? (
        <Image source={{ uri: cover }} style={styles.cover} />
      ) : (
        <ThemedView style={[styles.cover, styles.noCover]} />
      )}
      <ThemedView style={styles.details}>
        <ThemedText type="subtitle">{book.title}</ThemedText>
        <ThemedText>by {book.author}</ThemedText>
        {book.firstPublishYear !== undefined && (
          <ThemedText>First published {book.firstPublishYear}</ThemedText>
        )}
        {book.pageCount !== undefined && <ThemedText>{book.pageCount} pages</ThemedText>}
        {book.ratingsAverage !== undefined && (
          <ThemedText>Rating {book.ratingsAverage.toFixed(1)} / 5</ThemedText>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 16,
  },
  cover: {
    width: 100,
    height: 150,
    borderRadius: 6,
    resizeMode: 'cover',
  },
  noCover: {
    backgroundColor: '#8884',
  },
  details: {
    flex: 1,
    gap: 4,
  },
});
