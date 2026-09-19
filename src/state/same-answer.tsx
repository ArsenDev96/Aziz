import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getSameAnswerPromptMap, getSameAnswerPrompts, type Prompt } from '@/content/same-answer';
import {
  createGame,
  next as nextTurn,
  ready as readyTurn,
  recordMatch as recordTurnMatch,
  restartGame,
  revealDone as revealTurnDone,
  sayItDone as sayItTurnDone,
  thinkDone as thinkTurnDone,
  validateSetup,
  type Player,
  type SameAnswerState,
  type SetupError,
  type TeamSetup,
} from '@/modes/same-answer/engine';
import { SAME_ANSWER_RULES } from '@/modes/same-answer/rules';
import { useGame } from '@/state/game';
import { useSettings } from '@/state/settings';

/** Player id → 0-based team index. Players missing from the map sit this game out. */
type Assignments = Record<string, number>;

interface SameAnswerValue {
  /** The shared AZIZ roster — the same names Wrong Answer Only uses. */
  players: Player[];
  teamCount: number;
  setTeamCount: (count: number) => void;
  assignments: Assignments;
  /** `null` takes the player out of the game. */
  assign: (playerId: string, teamIndex: number | null) => void;
  setup: TeamSetup;
  setupErrors: SetupError[];
  canStart: boolean;
  state: SameAnswerState | null;
  /** The current prompt in the active language, or null between games. */
  prompt: Prompt | null;
  startGame: () => void;
  /** Same teams, fresh deck. */
  playAgain: () => void;
  ready: () => void;
  thinkDone: () => void;
  revealDone: () => void;
  sayItDone: () => void;
  recordMatch: (matched: number) => void;
  next: () => void;
  quit: () => void;
}

const SameAnswerContext = createContext<SameAnswerValue | null>(null);

const clampTeamCount = (count: number) =>
  Math.min(Math.max(count, SAME_ANSWER_RULES.minTeams), SAME_ANSWER_RULES.maxTeams);

export const SameAnswerProvider = ({ children }: { children: ReactNode }) => {
  const { settings } = useSettings();
  const { players } = useGame();
  const [teamCount, setTeamCountRaw] = useState<number>(SAME_ANSWER_RULES.minTeams);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [state, setState] = useState<SameAnswerState | null>(null);

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
  const setup = useMemo<TeamSetup>(() => {
    const teams: string[][] = Array.from({ length: teamCount }, () => []);
    for (const player of players) {
      const teamIndex = assignments[player.id];
      if (teamIndex !== undefined && teamIndex < teamCount) teams[teamIndex].push(player.id);
    }
    return { selectedPlayerIds: teams.flat(), teams };
  }, [players, assignments, teamCount]);

  const setupErrors = useMemo(() => validateSetup(setup), [setup]);

  const promptIds = useCallback(
    () => getSameAnswerPrompts(settings.language).map((prompt) => prompt.id),
    [settings.language],
  );

  const startGame = useCallback(() => {
    setState(createGame(players, setup, promptIds()));
  }, [players, setup, promptIds]);

  const playAgain = useCallback(() => {
    setState((current) => (current ? restartGame(current, promptIds()) : current));
  }, [promptIds]);

  const ready = useCallback(() => setState((s) => (s ? readyTurn(s) : s)), []);
  const thinkDone = useCallback(() => setState((s) => (s ? thinkTurnDone(s) : s)), []);
  const revealDone = useCallback(() => setState((s) => (s ? revealTurnDone(s) : s)), []);
  const sayItDone = useCallback(() => setState((s) => (s ? sayItTurnDone(s) : s)), []);
  const recordMatch = useCallback(
    (matched: number) => setState((s) => (s ? recordTurnMatch(s, matched) : s)),
    [],
  );
  const next = useCallback(() => setState((s) => (s ? nextTurn(s) : s)), []);
  const quit = useCallback(() => setState(null), []);

  const prompts = useMemo(() => getSameAnswerPromptMap(settings.language), [settings.language]);
  const prompt = useMemo(() => {
    const turn = state?.turns[state.turnIndex];
    return turn ? (prompts[turn.promptId] ?? null) : null;
  }, [state, prompts]);

  const value = useMemo<SameAnswerValue>(
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
      prompt,
      startGame,
      playAgain,
      ready,
      thinkDone,
      revealDone,
      sayItDone,
      recordMatch,
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
      prompt,
      startGame,
      playAgain,
      ready,
      thinkDone,
      revealDone,
      sayItDone,
      recordMatch,
      next,
      quit,
    ],
  );

  return <SameAnswerContext.Provider value={value}>{children}</SameAnswerContext.Provider>;
};

export const useSameAnswer = (): SameAnswerValue => {
  const value = useContext(SameAnswerContext);
  if (!value) throw new Error('useSameAnswer must be used inside SameAnswerProvider');
  return value;
};
