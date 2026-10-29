import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { Colors, Radius } from '@/constants/Colors';
import { combineDateAndTime, formatMeeting, parseLocalDateTime } from '@/utils/meeting';

interface DateTimeFieldProps {
  value: Date | null;
  onChange: (value: Date) => void;
}

/**
 * Picks a date and a time. Android shows its native date dialog and then its time dialog,
 * iOS shows a compact picker, and the web (which has neither) takes "YYYY-MM-DD HH:mm".
 */
export function DateTimeField({ value, onChange }: DateTimeFieldProps) {
  const [webText, setWebText] = useState('');

  if (Platform.OS === 'web') {
    return (
      <ThemedTextInput
        placeholder="YYYY-MM-DD HH:mm"
        value={webText}
        onChangeText={(text) => {
          setWebText(text);
          const parsed = parseLocalDateTime(text);
          if (parsed) onChange(parsed);
        }}
      />
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.iosRow}>
        <ThemedText type="muted">When</ThemedText>
        <DateTimePicker
          value={value ?? new Date()}
          mode="datetime"
          display="compact"
          themeVariant="dark"
          onChange={(_, date) => date && onChange(date)}
        />
      </View>
    );
  }

  function pickOnAndroid() {
    const base = value ?? new Date();
    DateTimePickerAndroid.open({
      value: base,
      mode: 'date',
      onChange: (dateEvent, pickedDate) => {
        if (dateEvent.type !== 'set' || !pickedDate) return;
        DateTimePickerAndroid.open({
          value: base,
          mode: 'time',
          onChange: (timeEvent, pickedTime) => {
            if (timeEvent.type !== 'set' || !pickedTime) return;
            onChange(combineDateAndTime(pickedDate, pickedTime));
          },
        });
      },
    });
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={pickOnAndroid}
      style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
      <MaterialIcons name="event" size={22} color={Colors.textMuted} />
      <ThemedText style={value ? undefined : styles.placeholder}>
        {value ? formatMeeting(value.toISOString()) : 'Pick a date and time'}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  placeholder: { color: Colors.textMuted },
  pressed: { opacity: 0.8 },
  iosRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
