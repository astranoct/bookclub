import { MaterialIcons } from '@expo/vector-icons';
import { Image, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Radius } from '@/constants/Colors';
import { coverUrl } from '@/services/openLibrary';
import type { Book } from '@/types/book';

type BookCardProps = {
  book: Book;
  variant?: 'featured' | 'compact';
};

function Cover({ book, large }: { book: Book; large: boolean }) {
  const uri = coverUrl(book.coverId, large ? 'L' : 'M');
  const size = large ? styles.coverLarge : styles.coverSmall;

  if (!uri) {
    return (
      <View style={[size, styles.noCover]}>
        <MaterialIcons name="menu-book" size={large ? 56 : 28} color={Colors.textMuted} />
      </View>
    );
  }
  return <Image source={{ uri }} style={[size, large && styles.coverShadow]} />;
}

function Chip({ icon, label, color }: { icon: 'insert-drive-file' | 'event' | 'star'; label: string; color?: string }) {
  return (
    <View style={styles.chip}>
      <MaterialIcons name={icon} size={14} color={color ?? Colors.textMuted} />
      <ThemedText style={styles.chipText}>{label}</ThemedText>
    </View>
  );
}

function Chips({ book }: { book: Book }) {
  return (
    <View style={styles.chips}>
      {book.pageCount !== undefined && (
        <Chip icon="insert-drive-file" label={`${book.pageCount} pages`} />
      )}
      {book.firstPublishYear !== undefined && (
        <Chip icon="event" label={String(book.firstPublishYear)} />
      )}
      {book.ratingsAverage !== undefined && (
        <Chip icon="star" label={book.ratingsAverage.toFixed(1)} color={Colors.star} />
      )}
    </View>
  );
}

export function BookCard({ book, variant = 'featured' }: BookCardProps) {
  if (variant === 'compact') {
    return (
      <View style={styles.compact}>
        <Cover book={book} large={false} />
        <View style={styles.compactDetails}>
          <ThemedText type="subtitle" numberOfLines={2} style={styles.compactTitle}>
            {book.title}
          </ThemedText>
          <ThemedText type="muted" numberOfLines={1}>
            {book.author}
          </ThemedText>
          <Chips book={book} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.featured}>
      <Cover book={book} large />
      <View style={styles.featuredDetails}>
        <ThemedText type="title" style={styles.center}>
          {book.title}
        </ThemedText>
        <ThemedText type="muted" style={styles.center}>
          by {book.author}
        </ThemedText>
      </View>
      <Chips book={book} />
    </View>
  );
}

const styles = StyleSheet.create({
  featured: { alignItems: 'center', gap: 16 },
  featuredDetails: { alignItems: 'center', gap: 4 },
  center: { textAlign: 'center' },
  coverLarge: { width: 180, height: 270, borderRadius: Radius.md },
  coverSmall: { width: 64, height: 96, borderRadius: Radius.sm },
  coverShadow: {
    shadowColor: Colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  noCover: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { flexDirection: 'row', gap: 14 },
  compactDetails: { flex: 1, gap: 4, justifyContent: 'center' },
  compactTitle: { fontSize: 17, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceRaised,
  },
  chipText: { fontSize: 13, lineHeight: 18, color: Colors.text },
});
