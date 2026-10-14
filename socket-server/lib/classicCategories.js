const CLASSIC_CATEGORIES = [
  "animals",
  "brain-teasers",
  "celebrities",
  "entertainment",
  "for-kids",
  "general",
  "geography",
  "history",
  "hobbies",
  "humanities",
  "literature",
  "movies",
  "music",
  "people",
  "rated",
  "religion-faith",
  "science-technology",
  "sports",
  "television",
  "video-games",
  "world",
];

function isKnownCategory(value) {
  return CLASSIC_CATEGORIES.includes(String(value || "").trim());
}

module.exports = {
  CLASSIC_CATEGORIES,
  isKnownCategory,
};
