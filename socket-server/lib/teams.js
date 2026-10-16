const TEAM_IDS = ["blue", "red"];
const TEAM_META = {
  blue: { id: "blue", name: "Blue" },
  red: { id: "red", name: "Red" },
};

function sanitizeTeamKey(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return TEAM_IDS.includes(normalized) ? normalized : null;
}

function isTeamsSettings(settings) {
  const variant = String(settings?.variant || "")
    .trim()
    .toLowerCase();
  return variant === "teams" || variant === "versus";
}

function buildTeamsFromPlayers(players) {
  return TEAM_IDS.map((teamId) => ({
    id: TEAM_META[teamId].id,
    name: TEAM_META[teamId].name,
    playerIds: players
      .filter((player) => sanitizeTeamKey(player.teamKey) === teamId)
      .map((player) => player.id),
  }));
}

function previewTeams(players) {
  const teams = buildTeamsFromPlayers(players);
  return teams.some((team) => team.playerIds.length) ? teams : null;
}

function validateTeamsReady(players) {
  const teams = buildTeamsFromPlayers(players);
  const blueCount =
    teams.find((team) => team.id === "blue")?.playerIds.length || 0;
  const redCount =
    teams.find((team) => team.id === "red")?.playerIds.length || 0;
  const unassigned = players.filter(
    (player) => !sanitizeTeamKey(player.teamKey)
  ).length;

  if (blueCount < 1 || redCount < 1) {
    return {
      ok: false,
      message:
        "Teams mode needs at least one player on Blue and one on Red before starting.",
    };
  }
  if (unassigned > 0) {
    return {
      ok: false,
      message: "Every player must pick Blue or Red before starting.",
    };
  }
  return { ok: true };
}

function participatingPlayers(room, teams) {
  if (!teams?.length) return room.players;
  return room.players.filter((player) =>
    teams.some((team) => team.playerIds.includes(player.id))
  );
}

function buildTeamRankings(room, state) {
  if (!state.teams?.length) return null;

  return state.teams
    .map((team) => {
      const members = team.playerIds.map((playerId) => {
        const player = room.players.find((entry) => entry.id === playerId);
        return {
          playerId,
          name: player?.name ?? "Player",
          score: state.scores[playerId] || 0,
        };
      });
      const score = members.reduce((sum, member) => sum + member.score, 0);
      return {
        teamId: team.id,
        name: team.name,
        score,
        members,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function buildFinalResult(room, state, { totalQuestions, pointsPerWin }) {
  const teamRankings = buildTeamRankings(room, state);
  const rankings = room.players
    .map((player) => ({
      playerId: player.id,
      name: player.name,
      score: state.scores[player.id] || 0,
      teamId:
        state.teams?.find((team) => team.playerIds.includes(player.id))?.id ??
        null,
    }))
    .sort((a, b) => b.score - a.score);

  let celebrationRankings = rankings;
  if (teamRankings?.length) {
    const winningTeam = teamRankings[0];
    const topOnTeam = [...winningTeam.members].sort(
      (a, b) => b.score - a.score
    )[0];
    celebrationRankings = [
      {
        playerId: topOnTeam.playerId,
        name: `${winningTeam.name} · ${topOnTeam.name}`,
        score: winningTeam.score,
        teamId: winningTeam.teamId,
      },
      ...rankings.filter((entry) => entry.playerId !== topOnTeam.playerId),
    ];
  }

  return {
    rankings: celebrationRankings,
    playerRankings: rankings,
    teamRankings,
    versus: Boolean(teamRankings?.length),
    totalQuestions,
    maxScore: totalQuestions * pointsPerWin * (teamRankings ? 2 : 1),
  };
}

module.exports = {
  TEAM_IDS,
  TEAM_META,
  sanitizeTeamKey,
  isTeamsSettings,
  buildTeamsFromPlayers,
  previewTeams,
  validateTeamsReady,
  participatingPlayers,
  buildTeamRankings,
  buildFinalResult,
};
