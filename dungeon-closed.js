const params = new URLSearchParams(window.location.search);
const requestedHostPortal = params.get("hostPortal") === "1";
const roomCode = String(
  params.get("room") || localStorage.getItem("trickOrTriviaRoom") || "CARL26"
).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "CARL26";
const storedPortalRoom = sessionStorage.getItem("trickOrTriviaHostPortal");
const storedKeyHash = sessionStorage.getItem("trickOrTriviaHostKeyHash") || "";
const isHostPortal = requestedHostPortal
  && storedPortalRoom === roomCode
  && /^[a-f0-9]{64}$/i.test(storedKeyHash);

function installClosedStyles() {
  if (document.getElementById("dungeonClosedStyles")) return;

  const style = document.createElement("style");
  style.id = "dungeonClosedStyles";
  style.textContent = `
    #dungeonClosedLock {
      display: none;
      isolation: isolate;
      place-items: center;
      overflow: hidden;
      padding: clamp(22px, 5vw, 72px);
      color: #fff7e8;
      text-align: center;
      background:
        radial-gradient(circle at 50% 34%, rgba(160, 26, 46, .32), transparent 34%),
        repeating-linear-gradient(135deg, rgba(255, 111, 69, .035) 0 18px, transparent 18px 36px),
        rgba(7, 4, 11, .965);
      backdrop-filter: blur(9px) brightness(.24);
      -webkit-backdrop-filter: blur(9px) brightness(.24);
    }

    #dungeonClosedLock.visible {
      display: grid;
      animation: dungeonLockArrival .34s ease-out both;
    }

    body.guest-experience #dungeonClosedLock {
      position: fixed;
      inset: 0;
      z-index: 2147483000;
    }

    body.host-portal-experience #display {
      position: relative;
    }

    body.host-portal-experience #display > #dungeonClosedLock {
      position: absolute;
      inset: 0;
      z-index: 10000;
      min-height: 100%;
      border-radius: 20px;
    }

    body.guest-experience.dungeon-locked {
      overflow: hidden;
    }

    .dungeon-closed-frame {
      position: relative;
      width: min(1120px, 94vw);
      border: 2px solid rgba(255, 101, 101, .88);
      border-radius: clamp(22px, 4vw, 44px);
      padding: clamp(30px, 6vw, 82px) clamp(20px, 5vw, 74px);
      background:
        linear-gradient(180deg, rgba(53, 12, 25, .86), rgba(14, 7, 19, .94)),
        rgba(14, 7, 19, .94);
      box-shadow:
        0 0 0 8px rgba(255, 77, 77, .07),
        0 0 68px rgba(255, 56, 56, .28),
        inset 0 0 70px rgba(0, 0, 0, .62);
    }

    .dungeon-closed-frame::before,
    .dungeon-closed-frame::after {
      content: "";
      position: absolute;
      right: 22px;
      left: 22px;
      height: 8px;
      background: repeating-linear-gradient(90deg, #f6c453 0 8px, transparent 8px 26px);
      filter: drop-shadow(0 0 6px rgba(246, 196, 83, .75));
      opacity: .9;
    }

    .dungeon-closed-frame::before { top: 18px; }
    .dungeon-closed-frame::after { bottom: 18px; }

    .dungeon-closed-sigil {
      display: inline-grid;
      width: clamp(52px, 8vw, 86px);
      aspect-ratio: 1;
      place-items: center;
      margin-bottom: clamp(12px, 2vw, 22px);
      border: 2px solid #f6c453;
      border-radius: 50%;
      color: #f6c453;
      font-size: clamp(1.7rem, 4vw, 3.2rem);
      box-shadow: 0 0 28px rgba(246, 196, 83, .22);
    }

    .dungeon-closed-kicker {
      margin: 0 0 clamp(8px, 2vw, 16px);
      color: #ff9a78;
      font-family: "Barlow Condensed", Impact, sans-serif;
      font-size: clamp(.95rem, 2.2vw, 1.55rem);
      font-weight: 900;
      letter-spacing: .22em;
      text-transform: uppercase;
    }

    .dungeon-closed-title {
      margin: 0;
      color: #ff5959;
      font-family: "Barlow Condensed", Impact, sans-serif;
      font-size: clamp(4.2rem, 14vw, 12.5rem);
      font-weight: 1000;
      letter-spacing: .045em;
      line-height: .78;
      text-transform: uppercase;
      text-shadow:
        0 4px 0 #761b27,
        0 0 22px rgba(255, 65, 65, .64),
        0 16px 44px rgba(0, 0, 0, .78);
      animation: dungeonClosedGlow 2.2s ease-in-out infinite alternate;
    }

    .dungeon-closed-divider {
      width: min(560px, 78%);
      height: 2px;
      margin: clamp(25px, 5vw, 48px) auto clamp(20px, 4vw, 34px);
      background: linear-gradient(90deg, transparent, #f6c453 18%, #f6c453 82%, transparent);
      box-shadow: 0 0 14px rgba(246, 196, 83, .48);
    }

    .dungeon-closed-message {
      margin: 0 auto;
      max-width: 850px;
      font-family: "Barlow Condensed", Impact, sans-serif;
      font-size: clamp(1.45rem, 3.7vw, 3.15rem);
      font-weight: 900;
      line-height: 1.08;
      text-transform: uppercase;
    }

    .dungeon-closed-submessage {
      margin: clamp(10px, 2vw, 18px) auto 0;
      max-width: 760px;
      color: #d7cedd;
      font-size: clamp(1rem, 2.2vw, 1.45rem);
      line-height: 1.45;
    }

    .dungeon-closed-thanks {
      margin: clamp(18px, 4vw, 32px) 0 0;
      color: #f6c453;
      font-family: "Barlow Condensed", Impact, sans-serif;
      font-size: clamp(1.15rem, 2.8vw, 1.9rem);
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    @keyframes dungeonLockArrival {
      from { opacity: 0; transform: scale(1.025); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes dungeonClosedGlow {
      from { filter: brightness(.92); }
      to { filter: brightness(1.12); }
    }

    @media (max-width: 620px) {
      .dungeon-closed-title {
        font-size: clamp(3.7rem, 20vw, 7rem);
        line-height: .84;
      }

      .dungeon-closed-frame::before,
      .dungeon-closed-frame::after {
        right: 12px;
        left: 12px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #dungeonClosedLock.visible,
      .dungeon-closed-title {
        animation: none;
      }
    }
  `;
  document.head.appendChild(style);
}

function buildClosedLock() {
  const overlay = document.createElement("section");
  overlay.id = "dungeonClosedLock";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "assertive");
  overlay.setAttribute("aria-label", "Dungeon closed");
  overlay.innerHTML = `
    <div class="dungeon-closed-frame">
      <div class="dungeon-closed-sigil" aria-hidden="true">☠</div>
      <p class="dungeon-closed-kicker">The Haunting Has Ended</p>
      <h1 class="dungeon-closed-title">Dungeon<br>Closed</h1>
      <div class="dungeon-closed-divider" aria-hidden="true"></div>
      <p class="dungeon-closed-message">Trick or Trivia has ended for the evening.</p>
      <p class="dungeon-closed-submessage">The spirits have retired for the night. No new players or questions may enter the dungeon.</p>
      <p class="dungeon-closed-thanks">Thank you for playing, brave souls.</p>
    </div>
  `;
  return overlay;
}

function placeClosedLock(overlay) {
  if (isHostPortal) {
    const display = document.getElementById("display");
    if (display) {
      display.appendChild(overlay);
      return;
    }
  }
  document.body.appendChild(overlay);
}

function applyClosedState(closed, overlay) {
  overlay.classList.toggle("visible", closed);
  overlay.setAttribute("aria-hidden", String(!closed));
  document.body.classList.toggle("dungeon-locked", closed);

  if (closed) {
    document.querySelectorAll("dialog[open]").forEach(dialog => {
      if (typeof dialog.close === "function") dialog.close();
    });
  }
}

function statusIsClosed(statusBadge) {
  return statusBadge.classList.contains("closed")
    || /currently closed|dungeon is closed/i.test(statusBadge.textContent || "");
}

function initializeDungeonClosedLock() {
  installClosedStyles();

  const overlay = buildClosedLock();
  placeClosedLock(overlay);

  const statusBadge = document.getElementById("statusBadge");
  if (!statusBadge) {
    console.error("Dungeon closed lock could not find the event status badge.");
    return;
  }

  const sync = () => applyClosedState(statusIsClosed(statusBadge), overlay);
  const observer = new MutationObserver(sync);
  observer.observe(statusBadge, {
    attributes: true,
    attributeFilter: ["class"],
    childList: true,
    characterData: true,
    subtree: true
  });

  sync();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDungeonClosedLock, { once: true });
} else {
  initializeDungeonClosedLock();
}
