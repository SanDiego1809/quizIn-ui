export function layoutPlayersForArc(players, yourPlayerId) {
  if (!players.length) return [];

  const you = players.find((player) => player.id === yourPlayerId);
  const others = players.filter((player) => player.id !== yourPlayerId);
  const leftCount = Math.floor(others.length / 2);
  const ordered = [
    ...others.slice(0, leftCount),
    ...(you ? [you] : []),
    ...others.slice(leftCount),
  ];

  const count = ordered.length;
  const radius = 1.8 + count * 0.5;
  const spread = count === 1 ? 0 : Math.min(Math.PI * 0.82, 0.48 * (count - 1));

  return ordered.map((player, index) => {
    const t = count === 1 ? 0 : (index / (count - 1) - 0.5) * 2;
    const angle = -t * spread;
    const x = Math.sin(angle) * radius;
    const z = -Math.cos(angle) * radius;

    return {
      player,
      x,
      z,
      rotationY: Math.atan2(-x, -z),
    };
  });
}
