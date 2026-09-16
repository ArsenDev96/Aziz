import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { AzizButton } from '@/components/AzizButton';
import { Screen } from '@/components/Screen';
import { TimerPicker } from '@/components/TimerPicker';
import { format } from '@/locales';
import { WRONG_ANSWER_RULES } from '@/modes/wrong-answer/rules';
import { useGame } from '@/state/game';
import { useSettings } from '@/state/settings';
import { colors, font, radius, spacing } from '@/theme/theme';

export default function PlayersScreen() {
  const { settings, strings, setTimerSeconds } = useSettings();
  const { players, addPlayer, removePlayer, canStart } = useGame();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const result = addPlayer(name);
    if (result.ok) {
      setName('');
      setError(null);
      return;
    }
    setError(
      result.reason === 'empty'
        ? strings.players.errorEmpty
        : result.reason === 'duplicate'
          ? strings.players.errorDuplicate
          : format(strings.players.errorTooMany, { max: WRONG_ANSWER_RULES.maxPlayers }),
    );
  };

  const start = () => {
    if (!canStart) {
      setError(format(strings.players.errorTooFew, { min: WRONG_ANSWER_RULES.minPlayers }));
      return;
    }
    router.push('/game/intro');
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>{strings.players.title}</Text>
        <Text style={styles.subtitle}>
          {format(strings.players.subtitle, {
            min: WRONG_ANSWER_RULES.minPlayers,
            max: WRONG_ANSWER_RULES.maxPlayers,
          })}
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              setError(null);
            }}
            placeholder={strings.players.placeholder}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            returnKeyType="done"
            maxLength={16}
            autoCorrect={false}
            onSubmitEditing={submit}
          />
          <AzizButton
            label={strings.players.add}
            variant="accent"
            onPress={submit}
            style={styles.addButton}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        >
          {players.map((player, index) => (
            <Animated.View
              key={player.id}
              entering={FadeIn.duration(200)}
              layout={LinearTransition.duration(200)}
              style={styles.playerRow}
            >
              <Text style={styles.playerIndex}>{index + 1}</Text>
              <Text style={styles.playerName} numberOfLines={1}>
                {player.name}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={format(strings.players.remove, { name: player.name })}
                onPress={() => removePlayer(player.id)}
                hitSlop={12}
                style={styles.remove}
              >
                <Text style={styles.removeLabel}>✕</Text>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>

        <TimerPicker
          value={settings.timerSeconds}
          onChange={setTimerSeconds}
          style={styles.timer}
        />
        <AzizButton label={strings.players.start} onPress={start} disabled={!canStart} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  title: {
    fontSize: font.title,
    fontWeight: '900',
    color: colors.text,
  },
  subtitle: {
    fontSize: font.label,
    color: colors.textMuted,
    marginTop: spacing(0.5),
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing(1),
    marginTop: spacing(3),
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(2),
    color: colors.text,
    fontSize: font.body,
  },
  addButton: {
    paddingHorizontal: spacing(3),
  },
  error: {
    color: colors.fail,
    fontSize: font.label,
    marginTop: spacing(1),
  },
  list: {
    paddingVertical: spacing(2),
    gap: spacing(1),
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(2),
  },
  playerIndex: {
    color: colors.textMuted,
    fontSize: font.label,
    width: spacing(3),
  },
  playerName: {
    flex: 1,
    color: colors.text,
    fontSize: font.body,
    fontWeight: '700',
  },
  remove: {
    padding: spacing(0.5),
  },
  removeLabel: {
    color: colors.textMuted,
    fontSize: font.body,
  },
  timer: {
    marginBottom: spacing(2),
  },
});
