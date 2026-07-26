const logic = require("./logic");
const { buildPayload } = require("./payload");
const COUNTRY_BANK = require("../../data/geography-questions.json");

const DEFAULT_SETTINGS = {
  questionTimeSeconds: 20,
  questionsPerGame: Math.min(8, COUNTRY_BANK.length),
};

const SETTINGS_FIELDS = [
  {
    key: "questionsPerGame",
    label: "Number of countries",
    type: "number",
    min: 1,
    max: COUNTRY_BANK.length,
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
];

const geographyMode = {
  id: "geography",
  label: "Geography Quiz",
  description:
    "A country name is shown — click it on the world map before anyone else.",
  defaultSettings: DEFAULT_SETTINGS,
  settingsFields: SETTINGS_FIELDS,
  createInitialState: logic.createInitialState,
  sanitizeSettings: (input) => logic.sanitizeSettings(input, DEFAULT_SETTINGS),
  start: logic.start,
  handleAction: logic.handleAction,
  reset: logic.reset,
  buildPayload,
};

module.exports = geographyMode;
