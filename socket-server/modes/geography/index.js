const logic = require("./logic");
const { buildPayload } = require("./payload");
const COUNTRY_BANK = require("../../data/geography-questions.json");
const { FREE_GEOGRAPHY_MAX_QUESTIONS } = require("../../lib/hostLimits");

const DEFAULT_SETTINGS = {
  variant: "countries",
  continents: [],
  harderPool: false,
  neighborMiss: false,
  revealHeat: false,
  lives: false,
  silhouette: false,
  questionTimeSeconds: 20,
  questionsPerGame: Math.min(8, COUNTRY_BANK.length),
};

const CHECKBOX_FIELDS = [
  {
    key: "harderPool",
    label: "Harder pool",
    type: "checkbox",
    premium: true,
    info: "Bias the country pool toward smaller, less familiar countries.",
  },
  {
    key: "neighborMiss",
    label: "Neighbor miss",
    type: "checkbox",
    premium: true,
    info: "Clicking a bordering country scores 2 consolation points and keeps you alive.",
  },
  {
    key: "revealHeat",
    label: "Reveal heat",
    type: "checkbox",
    premium: true,
    info: "During the 2s answer reveal, also show where every other player clicked.",
  },
  {
    key: "lives",
    label: "Lives",
    type: "checkbox",
    premium: true,
    info: "Each player gets 3 lives. A wrong answer or timeout costs a life; at 0 you are out.",
  },
  {
    key: "silhouette",
    label: "Silhouette",
    type: "checkbox",
    premium: true,
    info: "Hide country borders so land is one solid shape — harder to recognize by frontiers.",
  },
];

const SETTINGS_FIELDS = [
  {
    key: "variant",
    label: "Variant",
    type: "select",
    options: [
      { value: "countries", label: "Find the country" },
      { value: "flags", label: "Find by flag" },
      { value: "capitals", label: "Find by capital" },
      { value: "mixed", label: "Mix" },
      { value: "streak", label: "Streak", premium: true },
      { value: "teams", label: "Teams (Blue vs Red)" },
    ],
    hint: "How the prompt is shown each round. Teams: players pick Blue or Red. Streak is Premium.",
  },
  {
    key: "continents",
    label: "Continents",
    type: "multiselect",
    premium: true,
    options: [
      { value: "africa", label: "Africa" },
      { value: "asia", label: "Asia" },
      { value: "europe", label: "Europe" },
      { value: "north_america", label: "North America" },
      { value: "south_america", label: "South America" },
      { value: "oceania", label: "Oceania" },
    ],
    hint: "Limit the country pool to selected continents. Empty = all.",
  },
  ...CHECKBOX_FIELDS,
  {
    key: "questionsPerGame",
    label: "Number of countries",
    type: "number",
    min: 1,
    max: COUNTRY_BANK.length,
    freeMax: FREE_GEOGRAPHY_MAX_QUESTIONS,
    step: 1,
    premiumHint: `Free hosts: up to ${FREE_GEOGRAPHY_MAX_QUESTIONS}. Premium: up to ${COUNTRY_BANK.length}.`,
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
  sanitizeSettings: (input, options) =>
    logic.sanitizeSettings(input, DEFAULT_SETTINGS, options),
  validateStart: logic.validateStart,
  start: logic.start,
  handleAction: logic.handleAction,
  reset: logic.reset,
  buildPayload,
};

module.exports = geographyMode;
