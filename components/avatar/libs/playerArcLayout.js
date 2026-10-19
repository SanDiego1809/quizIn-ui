export function layoutPlayersForArc(players, yourPlayerId, options = {}) {
  if (!players.length) return [];

  const stageLine = Boolean(options.stageLine);
  const you = players.find((player) => player.id === yourPlayerId);
  const others = players.filter((player) => player.id !== yourPlayerId);
  const leftCount = Math.floor(others.length / 2);
  const ordered = [
    ...others.slice(0, leftCount),
    ...(you ? [you] : []),
    ...others.slice(leftCount),
  ];

  const count = ordered.length;
  const radius = stageLine
    ? 2.4 + count * 0.22
    : 1.8 + count * 0.5;
  const spread = count === 1
    ? 0
    : Math.min(
        stageLine ? Math.PI * 0.42 : Math.PI * 0.82,
        (stageLine ? 0.32 : 0.48) * (count - 1)
      );

  return ordered.map((player, index) => {
    const t = count === 1 ? 0 : (index / (count - 1) - 0.5) * 2;
    const angle = -t * spread;
    const x = Math.sin(angle) * radius;
    // Keep stage contestants on a shallow line so they sit on the photo floor.
    const z = stageLine
      ? -Math.cos(angle) * radius * 0.22
      : -Math.cos(angle) * radius;

    // Stage: slight inward yaw so side seats face the camera/host.
    const faceCamera = stageLine ? -angle * 0.65 : Math.atan2(-x, -z);

    return {
      player,
      x,
      z,
      rotationY: faceCamera,
    };
  });
}
