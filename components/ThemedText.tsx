import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors } from '@/constants/Colors';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'muted' | 'label' | 'link';
};

export function ThemedText({ style, type = 'default', ...rest }: ThemedTextProps) {
  return <Text style={[styles.base, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  base: { color: Colors.text },
  default: { fontSize: 16, lineHeight: 24 },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.2 },
  muted: { fontSize: 15, lineHeight: 22, color: Colors.textMuted },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  link: { fontSize: 15, lineHeight: 22, color: Colors.accentLight },
});
