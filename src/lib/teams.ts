/**
 * Team setup shared by the team modes. Pure: no React, no storage, no Expo.
 * A mode passes its own limits from its rules.ts; the shape of a setup is the same everywhere.
 */

/** What a setup screen hands over: who is playing and how they are split up. */
export interface TeamSetup {
  selectedPlayerIds: string[];
  /** One entry per team, each a list of player ids, in rotation order. */
  teams: string[][];
}

export type TeamSetupError =
  | 'tooFewPlayers'
  | 'tooManyPlayers'
  | 'tooFewTeams'
  | 'tooManyTeams'
  | 'teamTooSmall'
  | 'unassignedPlayer'
  | 'duplicatePlayer';

export interface TeamLimits {
  minPlayers: number;
  maxPlayers: number;
  minTeams: number;
  maxTeams: number;
  minPlayersPerTeam: number;
}

/** Player id → 0-based team index. Players missing from the map sit this game out. */
export type TeamAssignments = Record<string, number>;

/** Every reason the setup can't start, in the order the screen should report them. */
export const validateTeamSetup = (setup: TeamSetup, limits: TeamLimits): TeamSetupError[] => {
  const errors: TeamSetupError[] = [];
  const selected = new Set(setup.selectedPlayerIds);

  if (selected.size < limits.minPlayers) errors.push('tooFewPlayers');
  if (selected.size > limits.maxPlayers) errors.push('tooManyPlayers');
  if (setup.teams.length < limits.minTeams) errors.push('tooFewTeams');
  if (setup.teams.length > limits.maxTeams) errors.push('tooManyTeams');
  if (setup.teams.some((team) => team.length < limits.minPlayersPerTeam)) {
    errors.push('teamTooSmall');
  }

  const assigned = setup.teams.flat();
  const seen = new Set<string>();
  let duplicate = false;
  for (const playerId of assigned) {
    if (seen.has(playerId)) duplicate = true;
    seen.add(playerId);
  }
  if (duplicate) errors.push('duplicatePlayer');
  if ([...selected].some((playerId) => !seen.has(playerId))) errors.push('unassignedPlayer');

  return errors;
};

/**
 * Turns the setup screen's chip taps into a setup. Team order is 1, 2, 3, 4 and the order
 * inside a team is roster order — nothing is shuffled, so the game stays easy to follow.
 * A player on a team that no longer exists (count went down) simply drops out.
 */
export const buildTeamSetup = (
  playerIds: string[],
  assignments: TeamAssignments,
  teamCount: number,
): TeamSetup => {
  const teams: string[][] = Array.from({ length: teamCount }, () => []);
  for (const playerId of playerIds) {
    const teamIndex = assignments[playerId];
    if (teamIndex !== undefined && teamIndex < teamCount) teams[teamIndex].push(playerId);
  }
  return { selectedPlayerIds: teams.flat(), teams };
};
