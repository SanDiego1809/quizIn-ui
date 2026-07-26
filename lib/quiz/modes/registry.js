export const FALLBACK_MODES = [
  {
    id: "classic",
    label: "Classic Quiz",
    description:
      "Everyone answers the same questions. Fastest correct answers earn the most points.",
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
  {
    id: "geography",
    label: "Geography Quiz",
    description:
      "A country name is shown — click it on the world map before anyone else.",
    defaultSettings: {
      questionTimeSeconds: 20,
      questionsPerGame: 8,
    },
    settingsFields: [
      {
        key: "questionsPerGame",
        label: "Number of countries",
        type: "number",
        min: 1,
        max: 172,
        step: 1,
      },
      {
        key: "questionTimeSeconds",
        label: "Time per country (seconds)",
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
