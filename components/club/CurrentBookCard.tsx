import { Alert, StyleSheet, View } from 'react-native';

import { BookCard } from '@/components/BookCard';
import { Button } from '@/components/Button';
import { Card } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import type { Book } from '@/types/book';

interface CurrentBookCardProps {
  book: Book | null;
  isOwner: boolean;
  onChangeBook: () => void;
  onFinish: () => Promise<void>;
}

export function CurrentBookCard({ book, isOwner, onChangeBook, onFinish }: CurrentBookCardProps) {
  function confirmFinish() {
    if (!book) return;
    Alert.alert(
      `Finish "${book.title}"?`,
      'It moves to your list of finished books and the club has no current book until you choose the next one.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Finish book', onPress: () => void onFinish() },
      ]
    );
  }

  return (
    <View style={styles.wrap}>
      <ThemedText type="label">Currently reading</ThemedText>
      <Card>
        {book ? (
          <BookCard book={book} />
        ) : (
          <ThemedText type="muted">
            {isOwner
              ? 'No book chosen yet. Pick one from the suggestions below or search for one.'
              : "The club hasn't chosen a book yet. You can suggest one below."}
          </ThemedText>
        )}

        {isOwner && (
          <View style={styles.actions}>
            <Button
              title={book ? 'Change book' : 'Choose a book'}
              variant={book ? 'secondary' : 'primary'}
              onPress={onChangeBook}
            />
            {book && <Button title="Finish this book" variant="ghost" onPress={confirmFinish} />}
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  actions: { gap: 4 },
});
