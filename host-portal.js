import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getDatabase, onDisconnect, ref, set } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";
import { firebaseConfig, DEFAULT_ROOM_CODE } from "./firebase-config.js";

const HOST_BUILD = "15";
const $ = id => document.getElementById(id);
const normalizeRoomCode = value => String(value || "")
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, "")
  .slice(0, 8) || DEFAULT_ROOM_CODE;

let auth;
let db;
let opened = false;

function setStatus(message, error = false) {
  const status = $("portalStatus");
  status.textContent = message;
  status.classList.toggle("error", error);
}

async function openHostPortal(user) {
  if (opened || !user) return;
  opened = true;

  const params = new URLSearchParams(window.location.search);
  const roomCode = normalizeRoomCode(params.get("room") || localStorage.getItem("trickOrTriviaRoom") || DEFAULT_ROOM_CODE);
  localStorage.setItem("trickOrTriviaRoom", roomCode);
  sessionStorage.setItem("trickOrTriviaHostPortal", roomCode);
  sessionStorage.removeItem("trickOrTriviaHostKeyHash");

  setStatus(`Claiming host controls for room ${roomCode}…`);

  const hostRef = ref(db, `rooms/${roomCode}/hostUid`);

  try {
    // Keyless host mode: the private host page becomes the credential.
    // Opening it explicitly transfers the room's host role to this browser.
    await set(hostRef, user.uid);

    // Prevent a closed/crashed browser from leaving a stale host lock behind.
    try {
      await onDisconnect(hostRef).remove();
    } catch (disconnectError) {
      console.warn("Could not register automatic host release:", disconnectError);
    }

    const frame = $("hostFrame");
    frame.src = `./?room=${encodeURIComponent(roomCode)}&hostPortal=1&build=${HOST_BUILD}#host`;
    frame.hidden = false;
    $("loadingGate").hidden = true;
  } catch (error) {
    opened = false;
    console.error(error);
    setStatus(
      "The host page is ready, but Firebase is still using the old host-key rules. Publish the updated database rules once, then reload this page.",
      true
    );
  }
}

async function initializePortal() {
  const app = getApps()[0] || initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getDatabase(app);

  onAuthStateChanged(auth, user => {
    if (user) openHostPortal(user);
  });

  if (!auth.currentUser) await signInAnonymously(auth);
}

initializePortal().catch(error => {
  console.error(error);
  setStatus(`The host portal could not connect: ${error?.message || "Unknown error"}`, true);
});
