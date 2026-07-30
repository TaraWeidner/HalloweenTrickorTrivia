const params = new URLSearchParams(window.location.search);

function normalizeRoomCode(value = "") {
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "CARL26";
}

const roomCode = normalizeRoomCode(
  params.get("room") || localStorage.getItem("trickOrTriviaRoom") || "CARL26"
);
const requestedHostPortal = params.get("hostPortal") === "1";
const storedPortalRoom = sessionStorage.getItem("trickOrTriviaHostPortal");
const storedKeyHash = sessionStorage.getItem("trickOrTriviaHostKeyHash") || "";
const hasHostPortalSession = storedPortalRoom === roomCode && /^[a-f0-9]{64}$/i.test(storedKeyHash);
const isHostPortal = requestedHostPortal && hasHostPortalSession;

function addExperienceStyles() {
  if (document.getElementById("guestExperienceStyles")) return;

  const style = document.createElement("style");
  style.id = "guestExperienceStyles";
  style.textContent = `
    body.guest-experience .view-switcher,
    body.guest-experience #host,
    body.guest-experience #displayBonus,
    body.guest-experience #display .showcase {
      display: none !important;
    }

    body.guest-experience #display {
      padding-top: 6px;
    }

    body.guest-experience #board .tile {
      cursor: default;
    }

    body.guest-experience .board-panel {
      border-color: rgba(154, 92, 255, .48);
    }

    body.guest-experience .topbar {
      justify-content: space-between;
    }

    body.host-portal-experience .view-button[data-view="join"] {
      display: none !important;
    }

    body.host-portal-experience .prototype-mark .eyebrow {
      color: #f6c453;
    }

    @media (max-width: 760px) {
      body.guest-experience .app {
        padding: 10px;
      }

      body.guest-experience .topbar {
        padding: 10px 12px;
      }

      body.guest-experience .prototype-title {
        font-size: .95rem;
      }
    }
  `;
  document.head.appendChild(style);
}

function setActiveScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.toggle("active", screen.id === screenId);
  });
}

function playerHasJoined() {
  const joinedName = document.getElementById("joinedName")?.textContent?.trim();
  return Boolean(joinedName && joinedName !== "Not summoned yet");
}

let transitionTimer = null;

function syncGuestStage({ immediate = false } = {}) {
  if (isHostPortal) return;

  window.clearTimeout(transitionTimer);
  const joined = playerHasJoined();
  document.body.classList.toggle("guest-joined", joined);
  document.body.classList.toggle("guest-welcome", !joined);

  const showStage = () => setActiveScreen(joined ? "display" : "join");
  if (joined && !immediate) {
    transitionTimer = window.setTimeout(showStage, 350);
  } else {
    showStage();
  }
}

function configureGuestExperience() {
  document.body.classList.add("guest-experience");
  document.body.classList.remove("host-portal-experience");

  const markEyebrow = document.querySelector(".prototype-mark .eyebrow");
  const markTitle = document.querySelector(".prototype-title");
  if (markEyebrow) markEyebrow.textContent = "Live Haunted Game";
  if (markTitle) markTitle.textContent = "Trick or Trivia 2026";

  const boardEyebrow = document.querySelector("#display .board-header .eyebrow");
  const boardHeading = document.querySelector("#display .board-header h2");
  if (boardEyebrow) boardEyebrow.textContent = "Live from The Desperado Club";
  if (boardHeading) boardHeading.textContent = "Watch the Porch Choose Your Fate";

  const board = document.getElementById("board");
  board?.addEventListener("click", event => {
    if (!event.target.closest(".tile")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  const joinedName = document.getElementById("joinedName");
  if (joinedName) {
    const observer = new MutationObserver(() => syncGuestStage());
    observer.observe(joinedName, { childList: true, characterData: true, subtree: true });
  }

  window.addEventListener("hashchange", () => {
    window.setTimeout(() => syncGuestStage({ immediate: true }), 0);
  });

  syncGuestStage({ immediate: true });
}

function configureHostExperience() {
  document.body.classList.add("host-portal-experience");
  document.body.classList.remove("guest-experience");

  const markEyebrow = document.querySelector(".prototype-mark .eyebrow");
  const markTitle = document.querySelector(".prototype-title");
  if (markEyebrow) markEyebrow.textContent = "Private Backstage Access";
  if (markTitle) markTitle.textContent = "Trick or Trivia Host Portal";

  const playerButton = document.querySelector('.view-button[data-view="join"]');
  if (playerButton) playerButton.hidden = true;
}

function initializeExperience() {
  addExperienceStyles();

  if (requestedHostPortal && !hasHostPortalSession) {
    window.location.replace(`./host.html?room=${encodeURIComponent(roomCode)}`);
    return;
  }

  if (isHostPortal) configureHostExperience();
  else configureGuestExperience();

  window.setTimeout(() => {
    import("./player-notice.js").catch(error => console.error("Player notice failed to load:", error));
  }, 0);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeExperience, { once: true });
} else {
  initializeExperience();
}
