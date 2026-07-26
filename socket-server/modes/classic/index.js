const logic = require("./logic");
const { buildPayload } = require("./payload");

const DEFAULT_SETTINGS = {
  questionTimeSeconds: 30,
  questionsPerGame: 4,
};

const SETTINGS_FIELDS = [
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
];

const classicMode = {
  id: "classic",
  label: "Classic Quiz",
  description:
    "Everyone answers the same questions. Fastest correct answers earn the most points.",
  defaultSettings: DEFAULT_SETTINGS,
  settingsFields: SETTINGS_FIELDS,
  createInitialState: logic.createInitialState,
  sanitizeSettings: (input) => logic.sanitizeSettings(input, DEFAULT_SETTINGS),
  start: logic.start,
  handleAction: logic.handleAction,
  reset: logic.reset,
  buildPayload,
};

module.exports = classicMode;
