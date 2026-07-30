import { generalCategoriesA } from "./bank-general-a.js";
import { generalCategoriesB } from "./bank-general-b.js";
import { bookTitles, dccTiers } from "./bank-dcc.js";

const generalCategoryGroups = [generalCategoriesA, generalCategoriesB];

function displayedRound() {
  const value = Number(document.getElementById("roundNumber")?.textContent || 1);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function hashSeed(...parts) {
  let hash = 2166136261;
  for (const character of parts.join("|")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function questionTuple(question) {
  const spoilerBook = Number(question.spoilerBook || 0);
  if (!spoilerBook) return [question.text, question.choices, question.answer, question.fact];
  const title = bookTitles[spoilerBook] || `Book ${spoilerBook}`;
  return [
    `⚠ SPOILER WARNING — BOOK ${spoilerBook}: ${title}. ${question.text}`,
    question.choices,
    question.answer,
    `${question.fact} Spoiler scope: Book ${spoilerBook}, ${title}.`
  ];
}

function buildCategory(category, round) {
  return {
    name: category.name,
    questions: category.tiers.map((tier, tierIndex) => {
      const index = hashSeed(round, category.name, tierIndex) % tier.length;
      return questionTuple(tier[index]);
    })
  };
}

function buildDccCategory(round) {
  return {
    name: "Dungeon Crawler Carl",
    questions: dccTiers.slice(0, 5).map((tier, tierIndex) => {
      const index = hashSeed("dcc", round, tierIndex) % tier.length;
      return questionTuple(tier[index]);
    })
  };
}

function categoriesForRound(round) {
  const groupIndex = (Math.max(1, round) - 1) % generalCategoryGroups.length;
  return [...generalCategoryGroups[groupIndex].map(category => buildCategory(category, round)), buildDccCategory(round)];
}

export const categories = new Proxy([], {
  get(_target, property) {
    const active = categoriesForRound(displayedRound());
    if (property === Symbol.iterator) return active[Symbol.iterator].bind(active);
    if (property === "length") return active.length;
    if (typeof property === "string" && /^\d+$/.test(property)) return active[Number(property)];
    const value = active[property];
    return typeof value === "function" ? value.bind(active) : value;
  }
});

export const bonusQuestions = dccTiers.flat().map((question, index) => {
  const tuple = questionTuple(question);
  return { category: "Dungeon Crawler Carl", value: 1000, text: tuple[0], choices: tuple[1], answer: tuple[2], fact: tuple[3], bankIndex: index };
});

export const bonus = bonusQuestions[0];
