import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AzizButton } from '@/components/AzizButton';
import { Screen } from '@/components/Screen';
import { format } from '@/locales';
import { standings, teamPlayers } from '@/modes/act-it/engine';
import { useActIt } from '@/state/act-it';
import { useStrings } from '@/state/settings';
import { colors, font, radius, spacing, teamColor } from '@/theme/theme';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function ActItResultsScreen() {
  const strings = useStrings();
  const { state, playAgain, quit } = useActIt();

  if (!state || state.phase !== 'results') return <Redirect href="/" />;

  const copy = strings.actIt;
  const table = standings(state);
  const winners = state.teams
    .filter((team) => state.winnerTeamIds.includes(team.id))
    .map((team) => format(copy.team, { number: team.number }));

  return (
    <Screen>
      <Text style={styles.title}>{strings.results.title}</Text>
      <Text style={styles.winner}>
        {winners.length === 1
          ? format(strings.results.winner, { name: winners[0] })
          : format(strings.results.winners, { names: winners.join(', ') })}
      </Text>

      <ScrollView contentContainerStyle={styles.list}>
        {table.map((row, index) => {
          const palette = teamColor(row.team.number - 1);
          return (
            <Animated.View
              key={row.team.id}
              entering={FadeInDown.delay(index * 70).duration(300)}
              style={[styles.row, { borderColor: palette.bg }, row.rank === 1 && styles.rowWinner]}
            >
              <Text style={styles.medal}>{MEDALS[row.rank - 1] ?? `${row.rank}.`}</Text>
              <View style={styles.teamColumn}>
                <Text style={[styles.name, { color: palette.bg }]} numberOfLines={1}>
                  {format(copy.team, { number: row.team.number })}
                </Text>
                <Text style={styles.members} numberOfLines={2}>
                  {teamPlayers(state, row.team)
                    .map((player) => player.name)
                    .join(' · ')}
                </Text>
              </View>
              <Text style={styles.score}>
                {row.score} {strings.results.points}
              </Text>
            </Animated.View>
          );
        })}
      </ScrollView>

      <View style={styles.actions}>
        <AzizButton
          label={strings.results.playAgain}
          onPress={() => {
            playAgain();
            router.replace('/act-it/play');
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
    fontFamily: font.family,
    fontSize: font.label,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  winner: {
    color: colors.pass,
    fontFamily: font.family,
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
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(2),
  },
  rowWinner: {
    backgroundColor: colors.surfaceAlt,
  },
  medal: {
    // Fourth place has no medal emoji, only "4." — it needs an explicit color on the dark bg.
    color: colors.text,
    fontFamily: font.family,
    fontSize: font.body,
    width: spacing(4),
  },
  teamColumn: {
    flex: 1,
    gap: spacing(0.25),
  },
  name: {
    fontFamily: font.family,
    fontSize: font.body,
    fontWeight: '900',
  },
  members: {
    color: colors.textMuted,
    fontFamily: font.family,
    fontSize: font.label,
  },
  score: {
    color: colors.text,
    fontFamily: font.family,
    fontSize: font.body,
    fontWeight: '900',
  },
  actions: {
    gap: spacing(1.5),
  },
});
