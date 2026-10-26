/** Remaining roles among living players (from settings − revealed eliminations). */
export function remainingRoleCounts(room) {
  const players = room?.players || [];
  const settings = room?.settings || {};
  const revealed = room?.revealedRolesByPlayerId || {};

  const undercover = Number(settings.undercoverCount) || 0;
  const mrWhite = Number(settings.mrWhiteCount) || 0;
  const fool = Number(settings.foolCount) || 0;
  const detective = Number(settings.detectiveCount) || 0;
  const special = undercover + mrWhite + fool + detective;
  const civilians = Math.max(0, players.length - special);

  let left = {
    civilians: civilians + fool + detective,
    undercover,
    mr_white: mrWhite,
  };

  for (const role of Object.values(revealed)) {
    if (role === "undercover") {
      left.undercover = Math.max(0, left.undercover - 1);
    } else if (role === "mr_white") {
      left.mr_white = Math.max(0, left.mr_white - 1);
    } else if (
      role === "civilian" ||
      role === "fool" ||
      role === "detective"
    ) {
      left.civilians = Math.max(0, left.civilians - 1);
    }
  }

  return left;
}
