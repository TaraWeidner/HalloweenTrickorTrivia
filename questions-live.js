export { categories, bonusQuestions, bonus } from "./question-bank-v2.js";

// Load targeted multiplayer and guest-flow fixes after the base engine initializes.
window.setTimeout(() => {
  import("./live-fixes.js").catch(error => console.error("Live fixes failed to load:", error));
}, 0);
