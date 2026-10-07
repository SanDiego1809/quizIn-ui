/**
 * Convert local OpenTriviaQA category files into the classic quiz question bank.
 *
 * Put the category files in:
 *   socket-server/data/trivia/categories/
 *
 * Then run:
 *   npm run import:trivia
 *
 * Optional path override:
 *   npm run import:trivia -- path/to/categories
 *
 * Source format: https://github.com/uberspot/OpenTriviaQA (CC BY-SA 4.0)
 */

const fs = require("fs");
const path = require("path");

const OUT_PATH = path.join(__dirname, "..", "data", "questions.json");
const META_PATH = path.join(__dirname, "..", "data", "questions.meta.json");
const DEFAULT_LOCAL_DIR = path.join(__dirname, "..", "data", "trivia", "categories");

/** Categories that often overlap other packs or are noisier. */
const SKIP_CATEGORIES = new Set(["newest"]);

const CHOICE_RE = /^[A-Z]\s+(.*)$/;

function decodeLatin1(buffer) {
  return Buffer.from(buffer).toString("latin1");
}

function readLocalText(filePath) {
  return decodeLatin1(fs.readFileSync(filePath));
}

function resolveCategoriesDir(argPath) {
  const resolved = path.resolve(argPath || DEFAULT_LOCAL_DIR);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Local path not found: ${resolved}`);
  }

  const asCategories = path.join(resolved, "categories");
  if (fs.existsSync(asCategories) && fs.statSync(asCategories).isDirectory()) {
    return asCategories;
  }
  if (fs.statSync(resolved).isDirectory()) {
    return resolved;
  }
  throw new Error(`Expected a directory: ${resolved}`);
}

function listLocalCategories(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith(".") && !SKIP_CATEGORIES.has(name))
    .sort();
}

function parseCategory(text, category) {
  const questions = [];
  let current = null;
  let skipped = 0;

  const flush = () => {
    if (!current) return;

    const options = current.options.filter(Boolean);
    const answer = current.answer?.trim();
    const textValue = current.text?.trim();

    if (!textValue || !answer || options.length < 2) {
      skipped += 1;
      current = null;
      return;
    }

    let correctIndex = options.findIndex(
      (option) => option.trim().toLowerCase() === answer.toLowerCase()
    );
    if (correctIndex < 0) {
      // Some rows put the answer only on the ^ line; append it.
      options.push(answer);
      correctIndex = options.length - 1;
    }

    questions.push({
      id: `${category}-${questions.length + 1}`,
      category,
      text: textValue.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " "),
      options: options.map((option) => option.trim()),
      correctIndex,
    });
    current = null;
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/g, "");

    if (line.startsWith("#Q")) {
      flush();
      current = {
        text: line.replace(/^#Q\d*\s*/, ""),
        answer: null,
        options: [],
      };
      continue;
    }

    if (!current) continue;

    if (line.startsWith("^")) {
      current.answer = line.slice(1).trim();
      continue;
    }

    const choice = line.match(CHOICE_RE);
    if (choice) {
      current.options.push(choice[1]);
      continue;
    }

    if (!line.trim()) {
      flush();
      continue;
    }

    // Continuation of a multi-line question prompt.
    if (current.answer == null && current.options.length === 0) {
      current.text = `${current.text}\n${line.trim()}`;
    }
  }

  flush();
  return { questions, skipped };
}

function main() {
  const argPath = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  const categoriesDir = resolveCategoriesDir(argPath);
  const categories = listLocalCategories(categoriesDir);

  if (!categories.length) {
    throw new Error(`No category files found in ${categoriesDir}`);
  }

  console.log(`Importing ${categories.length} local categories from ${categoriesDir}…`);

  const all = [];
  const stats = {};

  for (const category of categories) {
    const text = readLocalText(path.join(categoriesDir, category));
    const { questions, skipped } = parseCategory(text, category);
    stats[category] = { count: questions.length, skipped };
    all.push(...questions);
    console.log(
      `  ${category}: ${questions.length} questions` +
        (skipped ? ` (${skipped} skipped)` : "")
    );
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(all)}\n`, "utf8");
  fs.writeFileSync(
    META_PATH,
    `${JSON.stringify(
      {
        source: "https://github.com/uberspot/OpenTriviaQA",
        license: "CC BY-SA 4.0",
        importSource: categoriesDir,
        importedAt: new Date().toISOString(),
        totalQuestions: all.length,
        categories: stats,
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(`\nWrote ${all.length} questions to ${OUT_PATH}`);
  console.log(`Wrote import metadata to ${META_PATH}`);
}

try {
  main();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
