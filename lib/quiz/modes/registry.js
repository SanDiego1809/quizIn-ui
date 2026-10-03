export const FALLBACK_MODES = [
  {
    id: "classic",
    label: "Classic Quiz",
    labelKey: "modes.classic.name",
    description: "Everyone answers the same questions. Fastest correct answers earn the most points.",
    descriptionKey: "modes.classic.description",
    defaultSettings: {
      questionTimeSeconds: 30,
      questionsPerGame: 4,
    },
    settingsFields: [
      {
        key: "questionsPerGame",
        label: "Number of questions",
        labelKey: "settings_fields.questionsPerGame.label",
        type: "number",
        min: 1,
        max: 10,
        step: 1,
      },
      {
        key: "questionTimeSeconds",
        label: "Time per question (seconds)",
        labelKey: "settings_fields.questionTimeSeconds.label",
        type: "number",
        min: 0,
        max: 300,
        step: 5,
        hint: "0 = no timer",
        hintKey: "settings_fields.questionTimeSeconds.hint",
      },
    ],
  },
  {
    id: "geography",
    label: "Geography Quiz",
    labelKey: "modes.geography.name",
    description: "A country name is shown — click it on the world map before anyone else.",
    descriptionKey: "modes.geography.description",
    defaultSettings: {
      questionTimeSeconds: 20,
      questionsPerGame: 8,
    },
    settingsFields: [
      {
        key: "questionsPerGame",
        label: "Number of countries",
        labelKey: "settings_fields.questionsPerGame.label",
        type: "number",
        min: 1,
        max: 172,
        step: 1,
      },
      {
        key: "questionTimeSeconds",
        label: "Time per country (seconds)",
        labelKey: "settings_fields.questionTimeSeconds.label",
        type: "number",
        min: 0,
        max: 300,
        step: 5,
        hint: "0 = no timer",
        hintKey: "settings_fields.questionTimeSeconds.hint",
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
