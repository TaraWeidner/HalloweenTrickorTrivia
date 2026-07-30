const params = new URLSearchParams(window.location.search);
const roomCode = String(params.get("room") || localStorage.getItem("trickOrTriviaRoom") || "CARL26")
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, "")
  .slice(0, 8) || "CARL26";
const isHostPortal = params.get("hostPortal") === "1" && sessionStorage.getItem("trickOrTriviaHostPortal") === roomCode;

function selectView(view) {
  document.querySelectorAll(".screen").forEach(section => {
    section.classList.toggle("active", section.id === view);
  });
  document.querySelectorAll(".view-button").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });
}

function applyPublicShell() {
  const hostButton = document.querySelector('[data-view="host"]');
  const displayButton = document.querySelector('[data-view="display"]');
  const joinButton = document.querySelector('[data-view="join"]');
  const hostView = document.getElementById("host");

  if (isHostPortal) {
    displayButton?.remove();
    joinButton?.remove();
    if (hostButton) hostButton.textContent = "Private Host Controls";
    selectView("host");
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}#host`);
    return;
  }

  hostButton?.remove();
  if (hostView) {
    hostView.setAttribute("aria-hidden", "true");
    hostView.style.setProperty("display", "none", "important");
  }

  const preventHostView = () => {
    if (window.location.hash.toLowerCase() !== "#host") return;
    const fallback = document.getElementById("join") ? "join" : "display";
    selectView(fallback);
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${fallback === "join" ? "play" : fallback}`);
  };

  preventHostView();
  window.addEventListener("hashchange", preventHostView);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyPublicShell, { once: true });
} else {
  applyPublicShell();
}
