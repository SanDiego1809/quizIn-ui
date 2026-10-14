/** OpenTriviaQA categories present in the classic question bank. */
export const CLASSIC_CATEGORIES = [
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

export function formatCategoryLabel(categoryId) {
  return String(categoryId || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
