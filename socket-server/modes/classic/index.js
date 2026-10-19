const logic = require("./logic");
const { buildPayload } = require("./payload");

const { CLASSIC_CATEGORIES } = require("../../lib/classicCategories");
const {
  FREE_CLASSIC_MAX_QUESTIONS,
  PREMIUM_CLASSIC_MAX_QUESTIONS,
} = require("../../lib/hostLimits");

const DEFAULT_SETTINGS = {
  variant: "solo",
  questionTimeSeconds: 30,
  questionsPerGame: 4,
  category: [],
  difficulty: "all",
  scoringMode: "speed",
  buzzerRace: false,
  hostPacing: false,
  pulpitKit: "gold",
  audioPack: false,
};

const SETTINGS_FIELDS = [
  {
    key: "variant",
    label: "Teams mode",
    type: "select",
    options: [
      { value: "solo", label: "Solo (no teams)" },
      { value: "teams", label: "Teams (Blue vs Red)" },
    ],
    hint: "Turn on Teams so players pick Blue or Red in the lobby.",
  },
  {
    key: "questionsPerGame",
    label: "Number of questions",
    type: "number",
    min: 1,
    max: PREMIUM_CLASSIC_MAX_QUESTIONS,
    freeMax: FREE_CLASSIC_MAX_QUESTIONS,
    step: 1,
    premiumHint: `Free hosts: up to ${FREE_CLASSIC_MAX_QUESTIONS}. Premium: up to ${PREMIUM_CLASSIC_MAX_QUESTIONS}.`,
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
  {
    key: "difficulty",
    label: "Difficulty mix",
    type: "select",
    premium: true,
    options: [
      { value: "all", label: "All difficulties" },
      { value: "easy", label: "Easy" },
      { value: "medium", label: "Medium" },
      { value: "hard", label: "Hard" },
    ],
    hint: "Filter the question bank by difficulty band.",
  },
  {
    key: "scoringMode",
    label: "Scoring",
    type: "select",
    premium: true,
    options: [
      { value: "speed", label: "Speed (faster correct = more points)" },
      { value: "flat", label: "Flat (10 pts per correct)" },
      { value: "sudden_death", label: "Sudden death (wrong = out)" },
    ],
  },
  {
    key: "buzzerRace",
    label: "Buzzer race",
    type: "checkbox",
    premium: true,
    info: "First correct answer locks everyone else out and ends the round.",
  },
  {
    key: "hostPacing",
    label: "Host advances",
    type: "checkbox",
    premium: true,
    info: "Host clicks Next instead of auto-advancing after the reveal.",
  },
  {
    key: "pulpitKit",
    label: "Pulpit style",
    type: "select",
    premium: true,
    options: [
      { value: "gold", label: "Gold" },
      { value: "neon", label: "Neon" },
      { value: "wood", label: "Wood" },
      { value: "chrome", label: "Chrome" },
    ],
  },
  {
    key: "audioPack",
    label: "Sound effects",
    type: "checkbox",
    premium: true,
    info: "Play lock-in / correct / wrong stings (off by default).",
  },
  {
    key: "category",
    label: "Categories",
    type: "multiselect",
    premium: true,
    options: CLASSIC_CATEGORIES.map((id) => ({
      value: id,
      label: id
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    })),
    hint: "Limit the trivia bank to selected categories. Empty = all.",
  },
];

const classicMode = {
  id: "classic",
  label: "Classic Quiz",
  description:
    "Everyone answers the same questions. Fastest correct answers earn the most points.",
  defaultSettings: DEFAULT_SETTINGS,
  settingsFields: SETTINGS_FIELDS,
  createInitialState: logic.createInitialState,
  sanitizeSettings: (input, options) =>
    logic.sanitizeSettings(input, DEFAULT_SETTINGS, options),
  validateStart: logic.validateStart,
  start: logic.start,
  handleAction: logic.handleAction,
  reset: logic.reset,
  buildPayload,
};

module.exports = classicMode;
