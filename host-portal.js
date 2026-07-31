import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getDatabase,
  get,
  ref,
  remove,
  runTransaction,
  set
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";
import { firebaseConfig, DEFAULT_ROOM_CODE } from "./firebase-config.js";

const HOST_BUILD = "14";
const $ = id => document.getElementById(id);
const normalizeRoomCode = value => String(value || "")
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, "")
  .slice(0, 8) || DEFAULT_ROOM_CODE;

let auth;
let db;
let uid = null;
let currentHostUid = null;

function roomPath(roomCode, suffix = "") {
  return `rooms/${roomCode}${suffix ? `/${suffix}` : ""}`;
}

function setStatus(message, mode = "") {
  const status = $("portalStatus");
  status.textContent = message;
  status.dataset.mode = mode;
}

function getRoomCode() {
  return normalizeRoomCode($("portalRoom").value);
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function refreshHostState(roomCode) {
  const snapshot = await get(ref(db, roomPath(roomCode, "hostUid")));
  currentHostUid = snapshot.val() || null;

  if (currentHostUid === uid) {
    setStatus("This browser currently holds the host role. Enter a private key to secure it, then open the controls.", "ready");
    $("unlockHost").textContent = "Save Host Key & Open Controls";
  } else if (!currentHostUid) {
    setStatus("No host currently holds this room. Enter a new private key to complete secure setup.", "ready");
    $("unlockHost").textContent = "Secure Room & Open Controls";
  } else {
    setStatus("This room is secured. Enter the private host key to open the control booth.", "ready");
    $("unlockHost").textContent = "Unlock Host Controls";
  }
}

async function openHostPortal() {
  const roomCode = getRoomCode();
  const key = $("portalKey").value;

  if (!uid) {
    setStatus("The séance is still connecting. Give it one moment and try again.", "error");
    return;
  }
  if (key.length < 12) {
    setStatus("Use a private host key with at least 12 characters. A short PIN is too easy for the dungeon to guess.", "error");
    return;
  }

  $("unlockHost").disabled = true;
  setStatus("The dungeon is verifying your host key…", "working");

  const keyHash = await sha256(key);
  const hostUidRef = ref(db, roomPath(roomCode, "hostUid"));
  const hostSecurityRef = ref(db, roomPath(roomCode, "hostSecurity/keyHash"));
  const claimRef = ref(db, roomPath(roomCode, `hostClaims/${uid}`));
  const sessionRef = ref(db, roomPath(roomCode, `hostSessions/${uid}`));

  try {
    const hostSnapshot = await get(hostUidRef);
    currentHostUid = hostSnapshot.val() || null;

    // The current host may establish or rotate the secret. If the room has no
    // host and no secret yet, this also performs the one-time secure bootstrap.
    if (!currentHostUid || currentHostUid === uid) {
      try {
        await set(hostSecurityRef, keyHash);
      } catch (error) {
        // When a secret already exists and no host currently holds the room,
        // Firebase correctly blocks replacement. Continue and test the key.
        if (currentHostUid === uid) throw error;
      }
    }

    await set(claimRef, keyHash);
    await set(sessionRef, true);
    await remove(claimRef);

    const claim = await runTransaction(hostUidRef, current => current || uid);
    const claimedUid = claim.snapshot.val();

    sessionStorage.setItem("trickOrTriviaHostPortal", roomCode);
    sessionStorage.setItem("trickOrTriviaHostKeyHash", keyHash);

    const frame = $("hostFrame");
    frame.src = `./?room=${encodeURIComponent(roomCode)}&hostPortal=1&build=${HOST_BUILD}#host`;
    frame.hidden = false;
    $("portalGate").hidden = true;
    $("portalShell").classList.add("unlocked");

    if (claimedUid === uid) {
      setStatus("Host controls unlocked. Keep this page private.", "success");
    } else {
      setStatus("Host key accepted. Another device currently holds the room; release it there before claiming this one.", "success");
    }
  } catch (error) {
    console.error(error);
    const permissionDenied = String(error?.code || error?.message || "").toLowerCase().includes("permission");
    setStatus(
      permissionDenied
        ? "That host key was not accepted, or the secure Firebase rules have not been published yet."
        : `The host portal could not open: ${error?.message || "Unknown Firebase error"}`,
      "error"
    );
  } finally {
    $("unlockHost").disabled = false;
  }
}

async function initializePortal() {
  const params = new URLSearchParams(window.location.search);
  $("portalRoom").value = normalizeRoomCode(params.get("room") || localStorage.getItem("trickOrTriviaRoom") || DEFAULT_ROOM_CODE);

  const app = getApps()[0] || initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getDatabase(app);

  onAuthStateChanged(auth, async user => {
    if (!user) return;
    uid = user.uid;
    await refreshHostState(getRoomCode());
  });

  if (!auth.currentUser) await signInAnonymously(auth);

  $("portalRoom").addEventListener("change", async event => {
    event.target.value = normalizeRoomCode(event.target.value);
    localStorage.setItem("trickOrTriviaRoom", event.target.value);
    if (uid) await refreshHostState(event.target.value);
  });
  $("portalKey").addEventListener("keydown", event => {
    if (event.key === "Enter") openHostPortal();
  });
  $("unlockHost").addEventListener("click", openHostPortal);
}

initializePortal().catch(error => {
  console.error(error);
  setStatus(`The host portal could not connect: ${error?.message || "Unknown error"}`, "error");
});
