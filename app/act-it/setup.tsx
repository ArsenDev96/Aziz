import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AzizButton } from '@/components/AzizButton';
import { Screen } from '@/components/Screen';
import { TeamSetup } from '@/components/TeamSetup';
import { format, type Strings } from '@/locales';
import type { Player, SetupError } from '@/modes/act-it/engine';
import { ACT_IT_RULES } from '@/modes/act-it/rules';
import { WRONG_ANSWER_RULES } from '@/modes/wrong-answer/rules';
import { useActIt } from '@/state/act-it';
import { useGame } from '@/state/game';
import { useSettings } from '@/state/settings';
import { colors, font, radius, spacing } from '@/theme/theme';

const TEAM_COUNTS = Array.from(
  { length: ACT_IT_RULES.maxTeams - ACT_IT_RULES.minTeams + 1 },
  (_, i) => ACT_IT_RULES.minTeams + i,
);

const errorMessage = (error: SetupError, strings: Strings['actIt']): string => {
  switch (error) {
    case 'tooFewPlayers':
      return format(strings.errorTooFewPlayers, { min: ACT_IT_RULES.minPlayers });
    case 'tooManyPlayers':
      return format(strings.errorTooManyPlayers, { max: ACT_IT_RULES.maxPlayers });
    case 'tooFewTeams':
      return format(strings.errorTooFewTeams, { min: ACT_IT_RULES.minTeams });
    case 'tooManyTeams':
      return format(strings.errorTooManyTeams, { max: ACT_IT_RULES.maxTeams });
    case 'teamTooSmall':
      return format(strings.errorTeamTooSmall, { min: ACT_IT_RULES.minPlayersPerTeam });
    case 'unassignedPlayer':
      return strings.errorUnassigned;
    case 'duplicatePlayer':
      return strings.errorDuplicate;
  }
};

export default function ActItSetupScreen() {
  const { strings } = useSettings();
  // The roster (and its persistence) is shared with the other modes.
  const { addPlayer, removePlayer } = useGame();
  const { players, teamCount, setTeamCount, assignments, assign, setup, setupErrors, canStart } =
    useActIt();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const copy = strings.actIt;

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

  const confirmRemove = (player: Player) =>
    Alert.alert(format(strings.players.removeTitle, { name: player.name }), strings.players.removeBody, [
      { text: strings.common.cancel, style: 'cancel' },
      {
        text: strings.players.removeConfirm,
        style: 'destructive',
        onPress: () => {
          removePlayer(player.id);
          setError(null);
        },
      },
    ]);

  const start = () => {
    if (!canStart) {
      setError(errorMessage(setupErrors[0], copy));
      return;
    }
    router.push('/act-it/intro');
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.kicker}>{strings.modes.actIt.name}</Text>
        <Text style={styles.title}>{copy.setupTitle}</Text>
        <Text style={styles.subtitle}>
          {format(copy.setupSubtitle, {
            minPlayers: ACT_IT_RULES.minPlayers,
            maxPlayers: ACT_IT_RULES.maxPlayers,
            minTeams: ACT_IT_RULES.minTeams,
            maxTeams: ACT_IT_RULES.maxTeams,
            minPerTeam: ACT_IT_RULES.minPlayersPerTeam,
          })}
        </Text>

        <TeamSetup
          players={players}
          teamCounts={TEAM_COUNTS}
          teamCount={teamCount}
          onTeamCount={setTeamCount}
          assignments={assignments}
          onAssign={assign}
          onRemove={confirmRemove}
          teams={setup.teams}
          minPerTeam={ACT_IT_RULES.minPlayersPerTeam}
          copy={copy}
          removeA11y={strings.players.remove}
          onInteract={() => setError(null)}
        >
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
        </TeamSetup>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AzizButton label={copy.start} onPress={start} disabled={!canStart} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  kicker: {
    color: colors.pass,
    fontSize: font.label,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing(0.5),
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
    marginTop: spacing(1.5),
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    color: colors.text,
    fontSize: font.body,
  },
  addButton: {
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1.5),
  },
  error: {
    color: colors.fail,
    fontSize: font.label,
    marginBottom: spacing(1),
  },
});
