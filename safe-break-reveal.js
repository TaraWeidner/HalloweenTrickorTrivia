import { getApps } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getDatabase, onValue, ref, set, update } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";
import { DEFAULT_ROOM_CODE } from "./firebase-config.js";

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
let breakToggle = null;
let breakWritePending = false;
let revealPendingInstance = null;

function roomPath(suffix = "") {
  return `rooms/${roomCode}${suffix ? `/${suffix}` : ""}`;
}

function isHost() {
  return Boolean(uid && hostUid === uid);
}

function installStyles() {
  if (document.getElementById("safeBreakRevealStyles")) return;

  const style = document.createElement("style");
  style.id = "safeBreakRevealStyles";
  style.textContent = `
    #display { position: relative; }

    #quizmasterBreakLock {
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
        radial-gradient(circle at 24% 24%, rgba(244, 123, 32, .22), transparent 27%),
        radial-gradient(circle at 76% 28%, rgba(154, 92, 255, .24), transparent 28%),
        rgba(8, 5, 13, .97);
      backdrop-filter: blur(8px) brightness(.28);
      -webkit-backdrop-filter: blur(8px) brightness(.28);
      border-radius: 20px;
    }

    #quizmasterBreakLock.visible { display: grid; }

    body.guest-experience #quizmasterBreakLock {
      position: fixed;
      inset: 0;
      z-index: 2147482000;
      min-height: 100vh;
      border-radius: 0;
    }

    body.quizmaster-on-break.guest-experience { overflow: hidden; }

    .quizmaster-break-frame {
      width: min(1050px, 94vw);
      border: 2px solid rgba(246, 196, 83, .88);
      border-radius: clamp(24px, 4vw, 46px);
      padding: clamp(34px, 6vw, 84px) clamp(22px, 5vw, 76px);
      background: linear-gradient(180deg, rgba(54, 27, 70, .94), rgba(19, 11, 28, .97));
      box-shadow: 0 0 0 8px rgba(246, 196, 83, .06), 0 0 64px rgba(154, 92, 255, .28), inset 0 0 70px rgba(0, 0, 0, .55);
    }

    .quizmaster-break-candy {
      margin: 0 0 clamp(12px, 2vw, 22px);
      font-size: clamp(2.8rem, 8vw, 6rem);
      line-height: 1;
    }

    .quizmaster-break-kicker {
      margin: 0 0 clamp(8px, 2vw, 16px);
      color: #f6c453;
      font-family: "Barlow Condensed", Impact, sans-serif;
      font-size: clamp(1rem, 2.4vw, 1.65rem);
      font-weight: 900;
      letter-spacing: .22em;
      text-transform: uppercase;
    }

    .quizmaster-break-title {
      margin: 0;
      color: #ffad4d;
      font-family: "Barlow Condensed", Impact, sans-serif;
      font-size: clamp(4.2rem, 13vw, 11rem);
      font-weight: 1000;
      letter-spacing: .035em;
      line-height: .82;
      text-transform: uppercase;
      text-shadow: 0 4px 0 #8b3d1e, 0 0 24px rgba(255, 173, 77, .45), 0 16px 42px rgba(0, 0, 0, .72);
    }

    .quizmaster-break-divider {
      width: min(560px, 78%);
      height: 2px;
      margin: clamp(24px, 5vw, 46px) auto clamp(19px, 4vw, 32px);
      background: linear-gradient(90deg, transparent, #9a5cff 18%, #f6c453 50%, #9a5cff 82%, transparent);
    }

    .quizmaster-break-message {
      margin: 0 auto;
      font-family: "Barlow Condensed", Impact, sans-serif;
      font-size: clamp(1.6rem, 4vw, 3.4rem);
      font-weight: 900;
      line-height: 1.08;
      text-transform: uppercase;
    }

    .quizmaster-break-treat {
      margin: clamp(15px, 3vw, 26px) auto 0;
      color: #f6c453;
      font-family: "Barlow Condensed", Impact, sans-serif;
      font-size: clamp(1.3rem, 3.2vw, 2.25rem);
      font-weight: 900;
      letter-spacing: .06em;
      text-transform: uppercase;
    }

    .quizmaster-break-note {
      margin: clamp(10px, 2vw, 17px) auto 0;
      color: #d8d0df;
      font-size: clamp(.95rem, 2vw, 1.3rem);
    }

    #quizmasterBreakRow strong { color: #f6c453; }
  `;
  document.head.appendChild(style);
}

function buildOverlay() {
  let overlay = document.getElementById("quizmasterBreakLock");
  if (overlay) return overlay;

  overlay = document.createElement("section");
  overlay.id = "quizmasterBreakLock";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "assertive");
  overlay.setAttribute("aria-label", "Quizmaster break");
  overlay.innerHTML = `
    <div class="quizmaster-break-frame">
      <div class="quizmaster-break-candy" aria-hidden="true">🍬 🎃 🍭</div>
      <p class="quizmaster-break-kicker">A Brief Intermission</p>
      <h1 class="quizmaster-break-title">Be Right<br>Back</h1>
      <div class="quizmaster-break-divider" aria-hidden="true"></div>
      <p class="quizmaster-break-message">Your Quizmaster is on break.</p>
      <p class="quizmaster-break-treat">Have some candy while you wait.</p>
      <p class="quizmaster-break-note">The dungeon is still open. Questions will resume shortly.</p>
    </div>
  `;

  document.getElementById("display")?.appendChild(overlay);
  return overlay;
}

function buildToggle() {
  const existing = document.getElementById("quizmasterBreak");
  if (existing) {
    breakToggle = existing;
    return;
  }

  const eventOpen = document.getElementById("eventOpen");
  const eventRow = eventOpen?.closest(".switch-row");
  if (!eventRow) return;

  const row = document.createElement("div");
  row.id = "quizmasterBreakRow";
  row.className = "switch-row";
  row.innerHTML = `
    <div>
      <strong>Quizmaster break screen</strong>
      <span>Temporarily pauses play without closing the dungeon.</span>
    </div>
    <label class="toggle">
      <input id="quizmasterBreak" type="checkbox" aria-label="Quizmaster break screen" />
      <span></span>
    </label>
  `;
  eventRow.insertAdjacentElement("afterend", row);
  breakToggle = row.querySelector("#quizmasterBreak");

  breakToggle.addEventListener("change", async event => {
    const enabled = Boolean(event.target.checked);
    if (!db || !isHost() || breakWritePending) {
      event.target.checked = breakActive;
      return;
    }

    breakWritePending = true;
    breakToggle.disabled = true;
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
      event.target.checked = breakActive;
    } finally {
      breakWritePending = false;
      syncToggleAccess();
    }
  });
}

function syncToggleAccess() {
  if (!breakToggle) return;
  breakToggle.checked = breakActive;
  breakToggle.disabled = breakWritePending || !isHost();
  breakToggle.classList.toggle("live-locked", !isHost());
}

function applyBreakState(overlay) {
  overlay.classList.toggle("visible", breakActive);
  overlay.setAttribute("aria-hidden", String(!breakActive));
  document.body.classList.toggle("quizmaster-on-break", breakActive);
  syncToggleAccess();

  if (breakActive) {
    document.querySelectorAll("dialog[open]").forEach(dialog => {
      if (typeof dialog.close === "function") dialog.close();
    });
  }
}

function automaticRevealTick() {
  if (!isHost() || breakActive) return;

  const dialog = document.getElementById("questionDialog");
  const timer = document.getElementById("timer");
  const revealButton = document.getElementById("revealAnswer");
  if (!dialog?.open || !timer || !revealButton) return;
  if (Number(timer.textContent || 0) > 0) return;
  if (revealButton.hidden || revealButton.classList.contains("hidden") || revealButton.disabled) return;

  const instanceId = dialog.dataset.instanceId || "active-question";
  if (revealPendingInstance === instanceId) return;

  revealPendingInstance = instanceId;
  revealButton.click();

  window.setTimeout(() => {
    if (revealPendingInstance !== instanceId) return;
    if (dialog.open && !revealButton.hidden && !revealButton.classList.contains("hidden")) {
      revealPendingInstance = null;
    }
  }, 3000);
}

async function waitForFirebaseApp() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const app = getApps()[0];
    if (app) return app;
    await new Promise(resolve => window.setTimeout(resolve, 100));
  }
  throw new Error("Firebase did not initialize for the break screen.");
}

async function initializeSafeBreakReveal() {
  installStyles();
  buildToggle();
  const overlay = buildOverlay();

  const app = await waitForFirebaseApp();
  const auth = getAuth(app);
  db = getDatabase(app);

  onAuthStateChanged(auth, user => {
    uid = user?.uid || null;
    syncToggleAccess();
  });

  onValue(ref(db, roomPath("hostUid")), snapshot => {
    hostUid = snapshot.val() || null;
    syncToggleAccess();
  });

  onValue(ref(db, roomPath(`used/${BREAK_MARKER}`)), snapshot => {
    breakActive = snapshot.val() === true;
    applyBreakState(overlay);
  });

  window.setInterval(automaticRevealTick, 250);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeSafeBreakReveal().catch(error => console.error("Safe break/reveal initialization failed:", error));
  }, { once: true });
} else {
  initializeSafeBreakReveal().catch(error => console.error("Safe break/reveal initialization failed:", error));
}
