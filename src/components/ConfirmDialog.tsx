import { createContext, useContext, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AzizButton } from '@/components/AzizButton';
import { colors, font, radius, spacing } from '@/theme/theme';

export interface ConfirmOptions {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
}

const ConfirmContext = createContext<((options: ConfirmOptions) => void) | null>(null);

/**
 * AZIZ-styled replacement for the system Alert on yes/no questions. Mounted once at the root;
 * screens call `useConfirm()` and pass already-localised strings.
 *
 * Cancel, a tap on the backdrop and Android Back (delivered to the Modal as `onRequestClose`,
 * never to the screen's BackHandler) all just close the dialog. Confirm closes it first, then
 * runs `onConfirm`, so a navigation inside it never leaves a dialog floating over the next screen.
 */
export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const cancel = () => setOptions(null);
  const confirm = () => {
    const pending = options;
    setOptions(null);
    pending?.onConfirm();
  };

  return (
    <ConfirmContext.Provider value={setOptions}>
      {children}
      <Modal
        visible={options !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={cancel}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={cancel} accessible={false} />
          {options && (
            <View style={styles.card} accessibilityViewIsModal>
              <Text style={styles.title} accessibilityRole="header">
                {options.title}
              </Text>
              <Text style={styles.body}>{options.body}</Text>
              <View style={styles.actions}>
                <AzizButton label={options.confirmLabel} variant="primary" onPress={confirm} />
                <AzizButton label={options.cancelLabel} variant="ghost" onPress={cancel} />
              </View>
            </View>
          )}
        </View>
      </Modal>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return confirm;
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing(3),
    backgroundColor: colors.scrim,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing(3),
    gap: spacing(1.5),
  },
  title: {
    color: colors.text,
    fontFamily: font.family,
    fontSize: font.verdict,
    fontWeight: '900',
    textAlign: 'center',
  },
  body: {
    color: colors.textMuted,
    fontFamily: font.family,
    fontSize: font.body,
    textAlign: 'center',
  },
  actions: {
    // Stacked rather than side by side: the Armenian labels don't fit two-up at 360dp.
    marginTop: spacing(1),
    gap: spacing(1),
  },
});
