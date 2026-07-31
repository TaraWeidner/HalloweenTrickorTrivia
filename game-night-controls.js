import { getApps } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getDatabase,
  onValue,
  ref,
  runTransaction,
  set,
  update
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";
import { DEFAULT_ROOM_CODE } from "./firebase-config.js";

const QUESTION_DURATION_SECONDS = 15;
const BREAK_MARKER = "__quizmasterBreak";
const roomCode = String(
  new URLSearchParams(window.location.search).get("room") ||
  localStorage.getItem("trickOrTriviaRoom") ||
  DEFAULT_ROOM_CODE
).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || DEFAULT_ROOM_CODE;

let db = null;
let uid = null;
let hostUid = null;
let breakActive = false;
let currentGame = { phase: "board" };
let revealTimer = null;
let durationWriteInstance = null;
let breakWritePending = false;

const $ = id => document.getElementById(id);

function roomPath(suffix = "") {
  return `rooms/${roomCode}${suffix ? `/${suffix}` : ""}`;
}

function isHost() {
  return Boolean(uid && hostUid === uid);
}

function installStyles() {
  if ($("gameNightControlStyles")) return;

  const style = document.createElement("style");
  style.id = "gameNightControlStyles";
  style.textContent = `
    #display, #join { position: relative; }

    .quizmaster-break-overlay {
      display: none;
      position: absolute;
      inset: 0;
      z-index: 9000;
      min-height: 100%;
      place-items: center;
      overflow: hidden;
      padding: clamp(22px, 5vw, 72px);
      color: #fff7e8;
      text-align: center;
      background:
        radial-gradient(circle at 22% 22%, rgba(244, 123, 32, .24), transparent 28%),
        radial-gradient(circle at 78% 28%, rgba(154, 92, 255, .26), transparent 30%),
        rgba(8, 5, 13, .97);
      backdrop-filter: blur(8px) brightness(.3);
      -webkit-backdrop-filter: blur(8px) brightness(.3);
      border-radius: 20px;
    }

    .quizmaster-break-overlay.visible { display: grid; }

    .quizmaster-break-card {
      width: min(1020px, 94vw);
      border: 2px solid rgba(246, 196, 83, .9);
      border-radius: clamp(24px, 4vw, 46px);
      padding: clamp(36px, 6vw, 82px) clamp(24px, 5vw, 72px);
      background: linear-gradient(180deg, rgba(54, 27, 70, .95), rgba(19, 11, 28, .98));
      box-shadow: 0 0 0 8px rgba(246, 196, 83, .06), 0 0 64px rgba(154, 92, 255, .28), inset 0 0 70px rgba(0, 0, 0, .55);
    }

    .quizmaster-break-candy {
      margin-bottom: 18px;
      font-size: clamp(3rem, 8vw, 6rem);
      line-height: 1;
    }

    .quizmaster-break-kicker {
      margin: 0 0 10px;
      color: #f6c453;
      font-family: "Barlow Condensed", Impact, sans-serif;
      font-size: clamp(1rem, 2.4vw, 1.55rem);
      font-weight: 900;
      letter-spacing: .2em;
      text-transform: uppercase;
    }

    .quizmaster-break-title {
      margin: 0;
      color: #ffad4d;
      font-family: "Barlow Condensed", Impact, sans-serif;
      font-size: clamp(4.2rem, 13vw, 10rem);
      font-weight: 1000;
      letter-spacing: .035em;
      line-height: .84;
      text-transform: uppercase;
      text-shadow: 0 4px 0 #8b3d1e, 0 0 24px rgba(255, 173, 77, .45), 0 16px 42px rgba(0, 0, 0, .72);
    }

    .quizmaster-break-message {
      margin: clamp(28px, 5vw, 46px) auto 0;
      font-family: "Barlow Condensed", Impact, sans-serif;
      font-size: clamp(1.55rem, 4vw, 3.2rem);
      font-weight: 900;
      line-height: 1.08;
      text-transform: uppercase;
    }

    .quizmaster-break-treat {
      margin: 16px auto 0;
      color: #f6c453;
      font-family: "Barlow Condensed", Impact, sans-serif;
      font-size: clamp(1.25rem, 3vw, 2.2rem);
      font-weight: 900;
      letter-spacing: .06em;
      text-transform: uppercase;
    }

    .quizmaster-break-note {
      margin: 13px auto 0;
      color: #d8d0df;
      font-size: clamp(.95rem, 2vw, 1.25rem);
    }

    #quizmasterBreakRow strong { color: #f6c453; }
  `;
  document.head.appendChild(style);
}

function ensureBreakOverlays() {
  ["display", "join"].forEach(screenId => {
    const screen = $(screenId);
    if (!screen || screen.querySelector(".quizmaster-break-overlay")) return;

    const overlay = document.createElement("section");
    overlay.className = "quizmaster-break-overlay";
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "assertive");
    overlay.setAttribute("aria-label", "Quizmaster break");
    overlay.innerHTML = `
      <div class="quizmaster-break-card">
        <div class="quizmaster-break-candy" aria-hidden="true">🍬 🎃 🍭</div>
        <p class="quizmaster-break-kicker">A Brief Intermission</p>
        <h2 class="quizmaster-break-title">Be Right<br>Back</h2>
        <p class="quizmaster-break-message">Your Quizmaster is on break.</p>
        <p class="quizmaster-break-treat">Have some candy while you wait.</p>
        <p class="quizmaster-break-note">The dungeon is still open. Questions will resume shortly.</p>
      </div>
    `;
    screen.appendChild(overlay);
  });
}

function syncBreakUi() {
  document.querySelectorAll(".quizmaster-break-overlay").forEach(overlay => {
    overlay.classList.toggle("visible", breakActive);
    overlay.setAttribute("aria-hidden", String(!breakActive));
  });

  const toggle = $("quizmasterBreak");
  if (toggle) {
    toggle.checked = breakActive;
    toggle.disabled = breakWritePending || !isHost();
    toggle.classList.toggle("live-locked", !isHost());
  }

  if (breakActive) {
    document.querySelectorAll("dialog[open]").forEach(dialog => {
      if (typeof dialog.close === "function") dialog.close();
    });
  }
}

async function setBreakMode(enabled) {
  const toggle = $("quizmasterBreak");
  if (!db || !isHost() || breakWritePending) {
    if (toggle) toggle.checked = breakActive;
    return;
  }

  breakWritePending = true;
  syncBreakUi();
  try {
    if (enabled) {
      await update(ref(db), {
        [roomPath(`used/${BREAK_MARKER}`)]: true,
        [roomPath("game")]: { phase: "board" }
      });
    } else {
      await set(ref(db, roomPath(`used/${BREAK_MARKER}`)), null);
    }
  } catch (error) {
    console.error("Quizmaster break toggle failed:", error);
    if (toggle) toggle.checked = breakActive;
  } finally {
    breakWritePending = false;
    syncBreakUi();
  }
}

function bindBreakToggle() {
  const toggle = $("quizmasterBreak");
  if (!toggle || toggle.dataset.bound === "true") return;
  toggle.dataset.bound = "true";
  toggle.addEventListener("change", event => {
    setBreakMode(Boolean(event.target.checked)).catch(console.error);
  });
}

async function enforceQuestionDuration(game) {
  if (!db || !isHost() || game?.phase !== "question" || !game.instanceId) return;
  if (Number(game.duration) === QUESTION_DURATION_SECONDS) return;
  if (durationWriteInstance === game.instanceId) return;

  durationWriteInstance = game.instanceId;
  try {
    await update(ref(db, roomPath("game")), { duration: QUESTION_DURATION_SECONDS });
  } catch (error) {
    console.error("Could not set the 15-second timer:", error);
  } finally {
    durationWriteInstance = null;
  }
}

async function revealExpiredQuestion(instanceId) {
  if (!db || !isHost() || !instanceId || breakActive) return;

  try {
    await runTransaction(ref(db, roomPath("game")), game => {
      if (!game || game.phase !== "question" || game.instanceId !== instanceId) return;

      const startedAt = Number(game.startedAt || 0);
      const durationMs = Number(game.duration || QUESTION_DURATION_SECONDS) * 1000;
      if (!startedAt || Date.now() + 100 < startedAt + durationMs) return;

      return {
        ...game,
        phase: "reveal",
        revealedAt: Date.now()
      };
    });
  } catch (error) {
    console.error("Automatic answer reveal failed:", error);
  }
}

function scheduleAutomaticReveal(game) {
  window.clearTimeout(revealTimer);
  revealTimer = null;

  if (!isHost() || breakActive || game?.phase !== "question" || !game.instanceId) return;

  const startedAt = Number(game.startedAt || 0);
  if (!startedAt) return;
  const durationMs = Number(game.duration || QUESTION_DURATION_SECONDS) * 1000;
  const delay = Math.max(0, startedAt + durationMs - Date.now()) + 150;

  revealTimer = window.setTimeout(() => {
    revealExpiredQuestion(game.instanceId).catch(console.error);
  }, delay);
}

async function waitForFirebaseApp() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const app = getApps()[0];
    if (app) return app;
    await new Promise(resolve => window.setTimeout(resolve, 100));
  }
  throw new Error("Firebase did not initialize for game-night controls.");
}

async function initializeGameNightControls() {
  installStyles();
  ensureBreakOverlays();
  bindBreakToggle();

  const timer = $("timer");
  if (timer) timer.textContent = String(QUESTION_DURATION_SECONDS);

  const app = await waitForFirebaseApp();
  const auth = getAuth(app);
  db = getDatabase(app);

  onAuthStateChanged(auth, user => {
    uid = user?.uid || null;
    syncBreakUi();
    enforceQuestionDuration(currentGame).catch(console.error);
    scheduleAutomaticReveal(currentGame);
  });

  onValue(ref(db, roomPath("hostUid")), snapshot => {
    hostUid = snapshot.val() || null;
    syncBreakUi();
    enforceQuestionDuration(currentGame).catch(console.error);
    scheduleAutomaticReveal(currentGame);
  });

  onValue(ref(db, roomPath(`used/${BREAK_MARKER}`)), snapshot => {
    breakActive = snapshot.val() === true;
    syncBreakUi();
    scheduleAutomaticReveal(currentGame);
  });

  onValue(ref(db, roomPath("game")), snapshot => {
    currentGame = snapshot.val() || { phase: "board" };
    enforceQuestionDuration(currentGame).catch(console.error);
    scheduleAutomaticReveal(currentGame);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeGameNightControls().catch(error => console.error("Game-night controls failed:", error));
  }, { once: true });
} else {
  initializeGameNightControls().catch(error => console.error("Game-night controls failed:", error));
}
