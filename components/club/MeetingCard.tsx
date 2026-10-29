import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { DateTimeField } from '@/components/DateTimeField';
import { Card } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { Colors } from '@/constants/Colors';
import type { Meeting } from '@/types/club';
import { formatMeeting, isUpcoming, MAX_MEETING_NOTE, validateMeeting } from '@/utils/meeting';

interface MeetingCardProps {
  meeting: Meeting | null | undefined;
  canEdit: boolean;
  onSave: (meeting: Meeting | null) => Promise<void>;
}

export function MeetingCard({ meeting, canEdit, onSave }: MeetingCardProps) {
  const upcoming = isUpcoming(meeting) ? meeting : null;

  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState<Date | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setDate(upcoming ? new Date(upcoming.at) : null);
    setNote(upcoming?.note ?? '');
    setError(null);
    setEditing(true);
  }

  async function run(action: () => Promise<void>) {
    setSaving(true);
    setError(null);
    try {
      await action();
      setEditing(false);
    } catch {
      setError("Couldn't save the meeting. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function save() {
    const problem = validateMeeting(date, note);
    if (problem || !date) {
      setError(problem);
      return;
    }
    const trimmed = note.trim();
    void run(() => onSave({ at: date.toISOString(), ...(trimmed ? { note: trimmed } : {}) }));
  }

  return (
    <View style={styles.wrap}>
      <ThemedText type="label">Next meeting</ThemedText>
      <Card>
        {editing ? (
          <>
            <DateTimeField value={date} onChange={setDate} />
            <ThemedTextInput
              placeholder="Where or how? (optional)"
              value={note}
              onChangeText={setNote}
              maxLength={MAX_MEETING_NOTE}
            />
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
            <Button title="Save meeting" onPress={save} loading={saving} />
            {upcoming && (
              <Button
                title="Cancel the meeting"
                variant="danger"
                disabled={saving}
                onPress={() => void run(() => onSave(null))}
              />
            )}
            <Button
              title="Close"
              variant="ghost"
              disabled={saving}
              onPress={() => setEditing(false)}
            />
          </>
        ) : upcoming ? (
          <View style={styles.row}>
            <MaterialIcons name="event" size={24} color={Colors.accentLight} />
            <View style={styles.rowText}>
              <ThemedText type="subtitle">{formatMeeting(upcoming.at)}</ThemedText>
              {upcoming.note && <ThemedText type="muted">{upcoming.note}</ThemedText>}
            </View>
          </View>
        ) : (
          <ThemedText type="muted">
            {canEdit ? 'No meeting scheduled yet.' : 'No meeting scheduled.'}
          </ThemedText>
        )}

        {canEdit && !editing && (
          <Button
            title={upcoming ? 'Change meeting' : 'Schedule a meeting'}
            variant={upcoming ? 'secondary' : 'primary'}
            onPress={startEditing}
          />
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, gap: 2 },
  error: { color: Colors.danger },
});
