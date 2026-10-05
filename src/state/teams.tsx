import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loadJson, saveJson, STORAGE_KEYS } from '@/lib/storage';
import { hydrateSavedTeams, type SavedTeams, type TeamAssignments } from '@/lib/teams';

/** Used until the group picks a count; each mode still clamps it to its own rules. */
const DEFAULT_TEAM_COUNT = 2;

interface TeamsValue {
  /** Raw saved count — a mode clamps it to the counts its rules allow. */
  teamCount: number;
  setTeamCount: (count: number) => void;
  assignments: TeamAssignments;
  /** `null` takes the player out of the game. */
  assign: (playerId: string, teamIndex: number | null) => void;
}

const TeamsContext = createContext<TeamsValue | null>(null);

/**
 * The team split shared by every team mode and kept between sessions, so switching from
 * Same Answer to Act It (or reopening the app) keeps the same teams.
 */
export const TeamsProvider = ({ children }: { children: ReactNode }) => {
  const [saved, setSaved] = useState<SavedTeams>({
    teamCount: DEFAULT_TEAM_COUNT,
    assignments: {},
  });

  useEffect(() => {
    let active = true;
    loadJson<unknown>(STORAGE_KEYS.teams, null).then((stored) => {
      if (active && stored !== null) setSaved(hydrateSavedTeams(stored, DEFAULT_TEAM_COUNT));
    });
    return () => {
      active = false;
    };
  }, []);

  const update = useCallback((change: (current: SavedTeams) => SavedTeams) => {
    setSaved((current) => {
      const next = change(current);
      void saveJson(STORAGE_KEYS.teams, next);
      return next;
    });
  }, []);

  const setTeamCount = useCallback(
    (teamCount: number) => update((current) => ({ ...current, teamCount })),
    [update],
  );

  const assign = useCallback(
    (playerId: string, teamIndex: number | null) =>
      update((current) => {
        const assignments = { ...current.assignments };
        if (teamIndex === null) delete assignments[playerId];
        else assignments[playerId] = teamIndex;
        return { ...current, assignments };
      }),
    [update],
  );

  const value = useMemo<TeamsValue>(
    () => ({ teamCount: saved.teamCount, setTeamCount, assignments: saved.assignments, assign }),
    [saved, setTeamCount, assign],
  );

  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>;
};

export const useTeams = (): TeamsValue => {
  const value = useContext(TeamsContext);
  if (!value) throw new Error('useTeams must be used inside TeamsProvider');
  return value;
};
