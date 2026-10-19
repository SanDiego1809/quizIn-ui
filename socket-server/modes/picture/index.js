const classicLogic = require("../classic/logic");
const { buildPayload } = require("../classic/payload");
const PICTURE_BANK = require("../../data/picture-questions.json");
const {
  FREE_CLASSIC_MAX_QUESTIONS,
  PREMIUM_CLASSIC_MAX_QUESTIONS,
} = require("../../lib/hostLimits");

const DEFAULT_SETTINGS = {
  variant: "solo",
  questionTimeSeconds: 30,
  questionsPerGame: 6,
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
    label: "Number of pictures",
    type: "number",
    min: 1,
    max: Math.min(PREMIUM_CLASSIC_MAX_QUESTIONS, PICTURE_BANK.length),
    freeMax: FREE_CLASSIC_MAX_QUESTIONS,
    step: 1,
    premiumHint: `Free hosts: up to ${FREE_CLASSIC_MAX_QUESTIONS}. Premium: up to the picture bank.`,
  },
  {
    key: "questionTimeSeconds",
    label: "Time per picture (seconds)",
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
];

const pictureMode = {
  id: "picture",
  label: "Picture Round",
  description:
    "Identify what’s in the picture. Same show stage, buzzers, and pulpits as Classic.",
  defaultSettings: DEFAULT_SETTINGS,
  settingsFields: SETTINGS_FIELDS,
  createInitialState: classicLogic.createInitialState,
  sanitizeSettings: (input, options) =>
    classicLogic.sanitizeSettings(input, DEFAULT_SETTINGS, options),
  validateStart: classicLogic.validateStart,
  start: (room, ctx) =>
    classicLogic.start(room, ctx, { questionBank: PICTURE_BANK }),
  handleAction: classicLogic.handleAction,
  reset: classicLogic.reset,
  buildPayload,
};

module.exports = pictureMode;
