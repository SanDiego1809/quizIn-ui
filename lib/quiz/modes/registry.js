export const FALLBACK_MODES = [
  {
    id: "classic",
    label: "Classic Quiz",
    description: "Everyone answers the same questions. Highest score wins.",
    defaultSettings: {
      questionTimeSeconds: 30,
      questionsPerGame: 4,
    },
    settingsFields: [
      {
        key: "questionsPerGame",
        label: "Number of questions",
        type: "number",
        min: 1,
        max: 10,
        step: 1,
      },
      {
        key: "questionTimeSeconds",
        label: "Time per question (seconds)",
        type: "number",
        min: 0,
        max: 300,
        step: 5,
        hint: "0 = no timer",
      },
    ],
  },
];

export function resolveAvailableModes(room) {
  if (room?.availableModes?.length) {
    return room.availableModes;
  }
  return FALLBACK_MODES;
}

export function resolveRoomMode(room) {
  return room?.mode ?? "classic";
}
