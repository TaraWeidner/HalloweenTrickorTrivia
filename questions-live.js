export { categories, bonusQuestions, bonus } from "./question-bank-v2.js";

// Load targeted multiplayer, QR, guest-flow, and shutdown-state fixes after the base engine initializes.
window.setTimeout(() => {
  import("./live-fixes.js?v=12").catch(error => console.error("Live fixes failed to load:", error));
  import("./qr-live.js?v=4").catch(error => console.error("Live QR failed to load:", error));
}, 0);
