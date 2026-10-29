import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { Card } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { Colors } from '@/constants/Colors';
import type { Book } from '@/types/book';
import type { ProgressEntry } from '@/types/club';
import { currentPage, parsePage, progressPercent } from '@/utils/progress';

interface ProgressMember {
  id: string;
  name: string;
}

interface ProgressCardProps {
  book: Book | null;
  members: ProgressMember[];
  myMembershipId: string | null;
  progress: Record<string, ProgressEntry>;
  onSave: (page: number) => Promise<void>;
}

export function ProgressCard({ book, members, myMembershipId, progress, onSave }: ProgressCardProps) {
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  if (!book) return null;

  const myPage = myMembershipId ? currentPage(progress[myMembershipId], book) : 0;
  // Show your own row first.
  const ordered = [...members].sort(
    (a, b) => Number(b.id === myMembershipId) - Number(a.id === myMembershipId)
  );

  async function save() {
    const parsed = parsePage(input);
    if (!parsed.ok) {
      setFeedback({ ok: false, text: parsed.error });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await onSave(parsed.page);
      setInput('');
      setFeedback({ ok: true, text: 'Progress saved.' });
    } catch {
      setFeedback({ ok: false, text: "Couldn't save your progress. Try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <ThemedText type="label">Reading progress</ThemedText>
      <Card>
        {ordered.map((member) => {
          const page = currentPage(progress[member.id], book);
          const percent = progressPercent(page, book.pageCount);
          return (
            <View key={member.id} style={styles.member}>
              <View style={styles.memberHeader}>
                <Avatar name={member.name} size={28} />
                <ThemedText style={styles.name} numberOfLines={1}>
                  {member.name}
                  {member.id === myMembershipId ? ' (you)' : ''}
                </ThemedText>
                <ThemedText type="muted">
                  {book.pageCount ? `${page} / ${book.pageCount}` : `p. ${page}`}
                  {percent !== null ? `  ·  ${percent}%` : ''}
                </ThemedText>
              </View>
              <ProgressBar percent={percent} />
            </View>
          );
        })}

        {myMembershipId && (
          <View style={styles.update}>
            <ThemedTextInput
              placeholder={myPage > 0 ? `You're on page ${myPage}` : 'Which page are you on?'}
              value={input}
              onChangeText={setInput}
              keyboardType="number-pad"
              onSubmitEditing={save}
            />
            {feedback && (
              <ThemedText style={{ color: feedback.ok ? Colors.success : Colors.danger }}>
                {feedback.text}
              </ThemedText>
            )}
            <Button title="Update my page" onPress={save} loading={saving} />
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  member: { gap: 6 },
  memberHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1 },
  update: { gap: 10, marginTop: 4 },
});
