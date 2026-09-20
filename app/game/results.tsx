import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AzizButton } from '@/components/AzizButton';
import { Screen } from '@/components/Screen';
import { format } from '@/locales';
import { standings } from '@/modes/wrong-answer/engine';
import { useGame } from '@/state/game';
import { useStrings } from '@/state/settings';
import { colors, font, radius, spacing } from '@/theme/theme';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function ResultsScreen() {
  const strings = useStrings();
  const { state, startGame, quit } = useGame();

  if (!state || state.phase !== 'results') return <Redirect href="/" />;

  const table = standings(state);
  const winners = state.players
    .filter((player) => state.winnerIds.includes(player.id))
    .map((player) => player.name);

  return (
    <Screen>
      <Text style={styles.title}>{strings.results.title}</Text>
      <Text style={styles.winner}>
        {winners.length === 1
          ? format(strings.results.winner, { name: winners[0] })
          : format(strings.results.winners, { names: winners.join(', ') })}
      </Text>

      <ScrollView contentContainerStyle={styles.list}>
        {table.map((row, index) => (
          <Animated.View
            key={row.player.id}
            entering={FadeInDown.delay(index * 70).duration(300)}
            style={[styles.row, row.rank === 1 && styles.rowWinner]}
          >
            <Text style={styles.medal}>{MEDALS[row.rank - 1] ?? `${row.rank}.`}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {row.player.name}
            </Text>
            <Text style={styles.score}>
              {row.score} {strings.results.points}
            </Text>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.actions}>
        <AzizButton
          label={strings.results.playAgain}
          onPress={() => {
            startGame();
            router.replace('/game/play');
          }}
        />
        <AzizButton
          label={strings.results.home}
          variant="ghost"
          onPress={() => {
            quit();
            router.replace('/');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textMuted,
    fontSize: font.label,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  winner: {
    color: colors.accent,
    fontSize: font.title,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: spacing(1),
  },
  list: {
    paddingVertical: spacing(3),
    gap: spacing(1),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing(2),
  },
  rowWinner: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  medal: {
    color: colors.text,
    fontSize: font.body,
    width: spacing(4),
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: font.body,
    fontWeight: '700',
  },
  score: {
    color: colors.textMuted,
    fontSize: font.label,
    fontWeight: '700',
  },
  actions: {
    gap: spacing(1.5),
  },
});
