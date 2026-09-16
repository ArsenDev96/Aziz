import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme/theme';

interface Props {
  children?: ReactNode;
  /** Centers content vertically — used by the big single-message screens. */
  center?: boolean;
  style?: ViewStyle;
}

export const Screen = ({ children, center, style }: Props) => (
  <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
    <View style={[styles.content, center && styles.center, style]}>{children}</View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
  },
  center: {
    justifyContent: 'center',
  },
});
