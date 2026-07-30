const PLAYER_URL = "https://taraweidner.github.io/HalloweenTrickorTrivia/play/";
const QR_ASSET_URL = "./player-qr.svg?v=4";

function installLiveQr() {
  const placeholder = document.querySelector(".qr-placeholder");
  if (!placeholder || placeholder.dataset.liveQr === "asset-v4") return;

  const link = document.createElement("a");
  link.href = PLAYER_URL;
  link.target = "_blank";
  link.rel = "noopener";
  link.setAttribute("aria-label", "Open the Trick or Trivia player welcome screen");
  Object.assign(link.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    margin: "0 auto"
  });

  const image = document.createElement("img");
  image.src = QR_ASSET_URL;
  image.alt = "Scan to join Trick or Trivia";
  image.width = 180;
  image.height = 180;
  image.decoding = "sync";
  Object.assign(image.style, {
    display: "block",
    width: "100%",
    height: "100%",
    margin: "0 auto",
    objectFit: "contain"
  });

  link.appendChild(image);
  placeholder.replaceChildren(link);
  placeholder.dataset.liveQr = "asset-v4";
  placeholder.setAttribute("aria-label", "QR code to join Trick or Trivia");
  Object.assign(placeholder.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "180px",
    height: "180px",
    margin: "0 auto",
    padding: "0",
    border: "0",
    borderRadius: "6px",
    background: "#ffffff",
    overflow: "hidden"
  });

  const frame = placeholder.closest(".qr-frame");
  if (frame) {
    Object.assign(frame.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    });
  }

  const stage = placeholder.closest(".qr-stage");
  if (stage) stage.style.textAlign = "center";

  const title = document.querySelector(".qr-title");
  const note = document.querySelector(".qr-note");
  if (title) title.textContent = "Scan to Join the Game";
  if (note) note.textContent = "Opens the player welcome screen.";
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", installLiveQr, { once: true });
} else {
  installLiveQr();
}
