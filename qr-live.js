const PLAYER_URL = "https://taraweidner.github.io/HalloweenTrickorTrivia/play/";
const QR_ROWS = ["000000000000000000000000000000000000000000000","000000000000000000000000000000000000000000000","000000000000000000000000000000000000000000000","000000000000000000000000000000000000000000000","000011111110101001010001001010111111100000000","000010000010111010010111100100100000100000000","000010111010101111110101001110101110100000000","000010111010011010110010101110101110100000000","000010111010111100111010001010101110100000000","000010000010000110101100011010100000100000000","000011111110101010101010101010111111100000000","000000000000101110100111000000000000000000000","000011011110101101101101010011100101100000000","000010110001000000010111111000101100100000000","000011101110101111010010110011111001100000000","000010010101100011101101110101011110000000000","000001011110011100011110101111111010100000000","000010100001100111001111011000110010000000000","000001001110111010111000101010111000100000000","000011110001101101010111010011011111100000000","000001110110100001101110111101001101100000000","000010011001001011100010000011101110000000000","000001111110101110101111101010111111100000000","000000001001011010001001011010001010000000000","000011110111111100111100101111101000100000000","000011100000011011101111010100101001100000000","000011001111101011111101111111111110000000000","000010101000010001000011010010101110100000000","000010111111111100111010011111101011100000000","000000000000101101000011010010001010000000000","000011111110101110111110111010101010100000000","000010000010000100001000110010001110000000000","000010111010111111111111111111111111100000000","000010111010101111110011111110101110100000000","000010111010101010110010010010101110000000000","000010000010001101101111111010001001100000000","000011111110101100110010101111101110000000000","000000000000000000000000000000000000000000000","000000000000000000000000000000000000000000000","000000000000000000000000000000000000000000000","000000000000000000000000000000000000000000000","000000000000000000000000000000000000000000000","000000000000000000000000000000000000000000000","000000000000000000000000000000000000000000000","000000000000000000000000000000000000000000000"];

function buildVerifiedQrSvg() {
  const size = QR_ROWS.length;
  const valid = size > 0 && QR_ROWS.every(row => row.length === size && /^[01]+$/.test(row));
  if (!valid) throw new Error("The embedded QR matrix is not square.");

  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "QR code to join Trick or Trivia");
  svg.setAttribute("shape-rendering", "crispEdges");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  const background = document.createElementNS(namespace, "rect");
  background.setAttribute("x", "0");
  background.setAttribute("y", "0");
  background.setAttribute("width", String(size));
  background.setAttribute("height", String(size));
  background.setAttribute("fill", "#ffffff");
  svg.appendChild(background);

  QR_ROWS.forEach((row, y) => {
    for (let x = 0; x < size; x += 1) {
      if (row[x] !== "1") continue;
      const module = document.createElementNS(namespace, "rect");
      module.setAttribute("x", String(x));
      module.setAttribute("y", String(y));
      module.setAttribute("width", "1");
      module.setAttribute("height", "1");
      module.setAttribute("fill", "#000000");
      svg.appendChild(module);
    }
  });

  Object.assign(svg.style, { display: "block", width: "100%", height: "100%", background: "#ffffff" });
  return svg;
}

function installLiveQr() {
  const placeholder = document.querySelector(".qr-placeholder");
  if (!placeholder || placeholder.dataset.liveQr === "verified-v3") return;

  const link = document.createElement("a");
  link.href = PLAYER_URL;
  link.target = "_blank";
  link.rel = "noopener";
  link.setAttribute("aria-label", "Open the Trick or Trivia player welcome screen");
  Object.assign(link.style, { display: "block", width: "100%", height: "100%" });

  link.appendChild(buildVerifiedQrSvg());
  placeholder.replaceChildren(link);
  placeholder.dataset.liveQr = "verified-v3";
  placeholder.setAttribute("aria-label", "QR code to join Trick or Trivia");
  Object.assign(placeholder.style, {
    width: "180px",
    aspectRatio: "1",
    padding: "0",
    border: "0",
    borderRadius: "6px",
    background: "#ffffff",
    overflow: "hidden"
  });

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
