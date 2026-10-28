import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export function ThemedTextInput({ style, ...rest }: TextInputProps) {
  const color = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  return (
    <TextInput
      placeholderTextColor={borderColor}
      style={[styles.input, { color, borderColor }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
});
