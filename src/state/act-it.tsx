import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getActItCardMap, getActItCards, type Card } from '@/content/act-it';
import { buildTeamSetup, type TeamAssignments } from '@/lib/teams';
import {
  createGame,
  currentActors,
  currentGuesser,
  currentTeam,
  go as goTurn,
  markCorrect as markTurnCorrect,
  next as nextTurn,
  ready as readyTurn,
  restartGame,
  skip as skipCard,
  timeUp as turnTimeUp,
  validateSetup,
  type ActItState,
  type Player,
  type SetupError,
  type Team,
  type TeamSetup,
} from '@/modes/act-it/engine';
import { ACT_IT_RULES } from '@/modes/act-it/rules';
import { useGame } from '@/state/game';
import { useSettings } from '@/state/settings';

interface ActItValue {
  /** The shared AZIZ roster — the same names the other modes use. */
  players: Player[];
  teamCount: number;
  setTeamCount: (count: number) => void;
  assignments: TeamAssignments;
  /** `null` takes the player out of the game. */
  assign: (playerId: string, teamIndex: number | null) => void;
  setup: TeamSetup;
  setupErrors: SetupError[];
  canStart: boolean;
  state: ActItState | null;
  /** The card the actors are showing, in the active language, or null between cards. */
  card: Card | null;
  /** Who is up this turn — derived from the schedule, null between games. */
  team: Team | null;
  guesser: Player | null;
  actors: Player[];
  startGame: () => void;
  /** Same teams in the same order, scores reset, fresh deck. */
  playAgain: () => void;
  ready: () => void;
  go: () => void;
  markCorrect: () => void;
  skip: () => void;
  timeUp: () => void;
  next: () => void;
  quit: () => void;
}

const ActItContext = createContext<ActItValue | null>(null);

const clampTeamCount = (count: number) =>
  Math.min(Math.max(count, ACT_IT_RULES.minTeams), ACT_IT_RULES.maxTeams);

export const ActItProvider = ({ children }: { children: ReactNode }) => {
  const { settings } = useSettings();
  const { players } = useGame();
  const [teamCount, setTeamCountRaw] = useState<number>(ACT_IT_RULES.minTeams);
  const [assignments, setAssignments] = useState<TeamAssignments>({});
  const [state, setState] = useState<ActItState | null>(null);

  const setTeamCount = useCallback((count: number) => setTeamCountRaw(clampTeamCount(count)), []);

  const assign = useCallback((playerId: string, teamIndex: number | null) => {
    setAssignments((current) => {
      const updated = { ...current };
      if (teamIndex === null) delete updated[playerId];
      else updated[playerId] = teamIndex;
      return updated;
    });
  }, []);

  // Derived rather than stored: a player removed from the roster, or a team that no
  // longer exists after the count went down, simply drops out of the setup.
  const setup = useMemo(
    () =>
      buildTeamSetup(
        players.map((player) => player.id),
        assignments,
        teamCount,
      ),
    [players, assignments, teamCount],
  );
  const setupErrors = useMemo(() => validateSetup(setup), [setup]);

  const cardIds = useCallback(
    () => getActItCards(settings.language).map((card) => card.id),
    [settings.language],
  );

  const startGame = useCallback(() => {
    setState(createGame(players, setup, cardIds()));
  }, [players, setup, cardIds]);

  const playAgain = useCallback(() => {
    setState((current) => (current ? restartGame(current, cardIds()) : current));
  }, [cardIds]);

  const ready = useCallback(() => setState((s) => (s ? readyTurn(s) : s)), []);
  const go = useCallback(() => setState((s) => (s ? goTurn(s) : s)), []);
  const markCorrect = useCallback(() => setState((s) => (s ? markTurnCorrect(s) : s)), []);
  const skip = useCallback(() => setState((s) => (s ? skipCard(s) : s)), []);
  const timeUp = useCallback(() => setState((s) => (s ? turnTimeUp(s) : s)), []);
  const next = useCallback(() => setState((s) => (s ? nextTurn(s) : s)), []);
  const quit = useCallback(() => setState(null), []);

  const cards = useMemo(() => getActItCardMap(settings.language), [settings.language]);
  const card = useMemo(
    () => (state?.cardId ? (cards[state.cardId] ?? null) : null),
    [state, cards],
  );
  const team = useMemo(() => (state ? (currentTeam(state) ?? null) : null), [state]);
  const guesser = useMemo(() => (state ? (currentGuesser(state) ?? null) : null), [state]);
  const actors = useMemo(() => (state ? currentActors(state) : []), [state]);

  const value = useMemo<ActItValue>(
    () => ({
      players,
      teamCount,
      setTeamCount,
      assignments,
      assign,
      setup,
      setupErrors,
      canStart: setupErrors.length === 0,
      state,
      card,
      team,
      guesser,
      actors,
      startGame,
      playAgain,
      ready,
      go,
      markCorrect,
      skip,
      timeUp,
      next,
      quit,
    }),
    [
      players,
      teamCount,
      setTeamCount,
      assignments,
      assign,
      setup,
      setupErrors,
      state,
      card,
      team,
      guesser,
      actors,
      startGame,
      playAgain,
      ready,
      go,
      markCorrect,
      skip,
      timeUp,
      next,
      quit,
    ],
  );

  return <ActItContext.Provider value={value}>{children}</ActItContext.Provider>;
};

export const useActIt = (): ActItValue => {
  const value = useContext(ActItContext);
  if (!value) throw new Error('useActIt must be used inside ActItProvider');
  return value;
};
