import { getApps } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getDatabase, onValue, ref, set } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";
import { DEFAULT_ROOM_CODE } from "./firebase-config.js";

const roomCode = String(
  new URLSearchParams(window.location.search).get("room") ||
  localStorage.getItem("trickOrTriviaRoom") ||
  DEFAULT_ROOM_CODE
).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || DEFAULT_ROOM_CODE;

let uid = null;
let hostUid = null;
let currentRound = 1;
let db = null;

function roomPath(suffix = "") {
  return `rooms/${roomCode}${suffix ? `/${suffix}` : ""}`;
}

async function forceRoundBoardRefresh() {
  if (!db || !uid || uid !== hostUid || currentRound < 1) return;
  await set(ref(db, roomPath(`used/__round_${currentRound}`)), true);
}

async function initializeRoundBankSync() {
  for (let attempt = 0; attempt < 50 && !getApps()[0]; attempt += 1) {
    await new Promise(resolve => window.setTimeout(resolve, 100));
  }

  const app = getApps()[0];
  if (!app) throw new Error("Firebase did not initialize for round bank synchronization.");

  const auth = getAuth(app);
  db = getDatabase(app);

  onAuthStateChanged(auth, user => {
    if (!user) return;
    uid = user.uid;
    forceRoundBoardRefresh().catch(console.error);
  });

  onValue(ref(db, roomPath("hostUid")), snapshot => {
    hostUid = snapshot.val() || null;
    forceRoundBoardRefresh().catch(console.error);
  });

  onValue(ref(db, roomPath("public/round")), snapshot => {
    currentRound = Number(snapshot.val() || 1);
    forceRoundBoardRefresh().catch(console.error);
  });
}

initializeRoundBankSync().catch(error => console.error("Round bank sync failed:", error));
