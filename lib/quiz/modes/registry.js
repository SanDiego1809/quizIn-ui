import { CLASSIC_CATEGORIES, formatCategoryLabel } from "@/lib/quiz/classicCategories";

export const FALLBACK_MODES = [
  {
    id: "classic",
    label: "Classic Quiz",
    labelKey: "modes.classic.name",
    description: "Everyone answers the same questions. Fastest correct answers earn the most points.",
    descriptionKey: "modes.classic.description",
    defaultSettings: {
      variant: "solo",
      questionTimeSeconds: 30,
      questionsPerGame: 4,
      category: "",
    },
    settingsFields: [
      {
        key: "variant",
        label: "Teams mode",
        labelKey: "settings_fields.variant.labelClassic",
        type: "select",
        options: [
          { value: "solo", label: "Solo (no teams)" },
          { value: "teams", label: "Teams (Blue vs Red)" },
        ],
        hint: "Turn on Teams so players pick Blue or Red in the lobby.",
        hintKey: "settings_fields.variant.hintClassic",
      },
      {
        key: "questionsPerGame",
        label: "Number of questions",
        labelKey: "settings_fields.questionsPerGame.label",
        type: "number",
        min: 1,
        max: 25,
        freeMax: 10,
        step: 1,
        premiumHint: "Free hosts: up to 10. Premium: up to 25.",
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
      {
        key: "category",
        label: "Category",
        labelKey: "settings_fields.category.label",
        type: "select",
        premium: true,
        options: [
          { value: "", label: "All categories" },
          ...CLASSIC_CATEGORIES.map((id) => ({
            value: id,
            label: formatCategoryLabel(id),
          })),
        ],
        hint: "Premium host — filter the trivia bank by category.",
        hintKey: "settings_fields.category.hint",
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
      variant: "countries",
      questionTimeSeconds: 20,
      questionsPerGame: 8,
    },
    settingsFields: [
      {
        key: "variant",
        label: "Variant",
        labelKey: "settings_fields.variant.label",
        type: "select",
        options: [
          { value: "countries", label: "Find the country" },
          { value: "flags", label: "Find by flag" },
          { value: "capitals", label: "Find by capital" },
          { value: "teams", label: "Teams (Blue vs Red)" },
        ],
        hint: "How the prompt is shown each round. Teams: players pick Blue or Red.",
        hintKey: "settings_fields.variant.hint",
      },
      {
        key: "questionsPerGame",
        label: "Number of countries",
        labelKey: "settings_fields.questionsPerGame.label",
        type: "number",
        min: 1,
        max: 172,
        freeMax: 8,
        step: 1,
        premiumHint: "Free hosts: up to 8. Premium: up to the full country set.",
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
