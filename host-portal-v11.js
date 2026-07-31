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

const BUILD_ID = "11";
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
    setStatus("This browser currently holds the host role. Enter your private key to reopen the controls.", "ready");
    $("unlockHost").textContent = "Open Recovery Controls";
  } else if (!currentHostUid) {
    setStatus("No device currently holds the host role. Enter the existing room key to claim it.", "ready");
    $("unlockHost").textContent = "Claim Recovery Controls";
  } else {
    setStatus("Another device currently holds this room. Enter the private host key to open the control booth.", "ready");
    $("unlockHost").textContent = "Unlock Recovery Controls";
  }
}

function injectRecoveryModule(frame) {
  const tryInject = () => {
    try {
      const doc = frame.contentDocument;
      if (!doc?.documentElement) return false;
      if (doc.getElementById("quizmasterBreak")) return true;
      if (doc.getElementById("recoveryBuild11Module")) return true;

      const script = doc.createElement("script");
      script.id = "recoveryBuild11Module";
      script.type = "module";
      script.src = `./safe-break-reveal.js?v=${BUILD_ID}`;
      script.addEventListener("load", () => {
        setStatus("Recovery controls loaded. The Be Right Back toggle should now appear beneath Dungeon is open.", "success");
      }, { once: true });
      script.addEventListener("error", () => {
        setStatus("The host controls opened, but the recovery module did not load. Refresh this Recovery Build 11 page once.", "error");
      }, { once: true });
      doc.head.appendChild(script);
      return true;
    } catch (error) {
      console.error("Recovery module injection failed:", error);
      return false;
    }
  };

  window.setTimeout(() => {
    if (tryInject()) return;
    window.setTimeout(tryInject, 1200);
  }, 600);
}

function openFrame(roomCode, keyHash) {
  sessionStorage.setItem("trickOrTriviaHostPortal", roomCode);
  sessionStorage.setItem("trickOrTriviaHostKeyHash", keyHash);

  const frame = $("hostFrame");
  frame.addEventListener("load", () => injectRecoveryModule(frame), { once: true });
  frame.src = `./?room=${encodeURIComponent(roomCode)}&hostPortal=1&recoveryBuild=${BUILD_ID}#host`;
  frame.hidden = false;
  $("portalGate").hidden = true;
  $("portalShell").classList.add("unlocked");
}

async function openHostPortal() {
  const roomCode = getRoomCode();
  const key = $("portalKey").value;

  if (!uid) {
    setStatus("The séance is still connecting. Give it one moment and try again.", "error");
    return;
  }
  if (key.length < 12) {
    setStatus("Enter the private host key with at least 12 characters.", "error");
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

    if (!currentHostUid || currentHostUid === uid) {
      try {
        await set(hostSecurityRef, keyHash);
      } catch (error) {
        if (currentHostUid === uid) throw error;
      }
    }

    await set(claimRef, keyHash);
    await set(sessionRef, true);
    await remove(claimRef);

    const claim = await runTransaction(hostUidRef, current => current || uid);
    const claimedUid = claim.snapshot.val();

    openFrame(roomCode, keyHash);

    if (claimedUid === uid) {
      setStatus("Recovery host controls unlocked.", "success");
    } else {
      setStatus("Host key accepted. Another device still holds the room; release it there before claiming this one.", "success");
    }
  } catch (error) {
    console.error(error);
    const permissionDenied = String(error?.code || error?.message || "").toLowerCase().includes("permission");
    setStatus(
      permissionDenied
        ? "That host key was not accepted, or the secure Firebase rules have not been published yet."
        : `The recovery host portal could not open: ${error?.message || "Unknown Firebase error"}`,
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
  setStatus(`The recovery host portal could not connect: ${error?.message || "Unknown error"}`, "error");
});
