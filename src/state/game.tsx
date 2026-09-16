import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getQuestionMap, getWrongAnswerQuestions, type Question } from '@/content/wrong-answer';
import { loadJson, saveJson, STORAGE_KEYS } from '@/lib/storage';
import { useSettings } from '@/state/settings';
import {
  createGame,
  judgeTurn,
  startQuestion,
  timeUp,
  type GameState,
  type Player,
  type Verdict,
} from '@/modes/wrong-answer/engine';
import { WRONG_ANSWER_RULES } from '@/modes/wrong-answer/rules';

export type AddPlayerResult =
  | { ok: true }
  | { ok: false; reason: 'empty' | 'duplicate' | 'full' };

interface GameValue {
  /** The roster, kept between sessions so a group doesn't retype names every night. */
  players: Player[];
  addPlayer: (name: string) => AddPlayerResult;
  removePlayer: (id: string) => void;
  canStart: boolean;
  state: GameState | null;
  /** The current question in the active language, or null between games. */
  question: Question | null;
  startGame: () => void;
  beginQuestion: () => void;
  endQuestion: () => void;
  judge: (verdict: Verdict) => void;
  quit: () => void;
}

const GameContext = createContext<GameValue | null>(null);

const normalize = (name: string) => name.trim().replace(/\s+/g, ' ');

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const { settings } = useSettings();
  const [players, setPlayers] = useState<Player[]>([]);
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => {
    let active = true;
    loadJson<Player[]>(STORAGE_KEYS.players, []).then((stored) => {
      if (active && Array.isArray(stored)) setPlayers(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((next: Player[]) => {
    setPlayers(next);
    void saveJson(STORAGE_KEYS.players, next);
  }, []);

  const addPlayer = useCallback(
    (rawName: string): AddPlayerResult => {
      const name = normalize(rawName);
      if (!name) return { ok: false, reason: 'empty' };
      if (players.length >= WRONG_ANSWER_RULES.maxPlayers) return { ok: false, reason: 'full' };
      if (players.some((player) => player.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
        return { ok: false, reason: 'duplicate' };
      }
      persist([...players, { id: `p${Date.now()}${players.length}`, name }]);
      return { ok: true };
    },
    [players, persist],
  );

  const removePlayer = useCallback(
    (id: string) => persist(players.filter((player) => player.id !== id)),
    [players, persist],
  );

  const startGame = useCallback(() => {
    const questionIds = getWrongAnswerQuestions(settings.language).map((item) => item.id);
    setState(createGame(players, questionIds, undefined, settings.timerSeconds));
  }, [players, settings.language, settings.timerSeconds]);

  const beginQuestion = useCallback(
    () => setState((current) => (current ? startQuestion(current) : current)),
    [],
  );

  const endQuestion = useCallback(
    () => setState((current) => (current ? timeUp(current) : current)),
    [],
  );

  const judge = useCallback(
    (verdict: Verdict) =>
      setState((current) => (current ? judgeTurn(current, verdict) : current)),
    [],
  );

  const quit = useCallback(() => setState(null), []);

  const questions = useMemo(() => getQuestionMap(settings.language), [settings.language]);
  const question = useMemo(() => {
    const turn = state?.turns[state.turnIndex];
    return turn ? (questions[turn.questionId] ?? null) : null;
  }, [state, questions]);

  const value = useMemo<GameValue>(
    () => ({
      players,
      addPlayer,
      removePlayer,
      canStart:
        players.length >= WRONG_ANSWER_RULES.minPlayers &&
        players.length <= WRONG_ANSWER_RULES.maxPlayers,
      state,
      question,
      startGame,
      beginQuestion,
      endQuestion,
      judge,
      quit,
    }),
    [
      players,
      addPlayer,
      removePlayer,
      state,
      question,
      startGame,
      beginQuestion,
      endQuestion,
      judge,
      quit,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = (): GameValue => {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGame must be used inside GameProvider');
  return value;
};
