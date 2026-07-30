function addDesperadoClubNotice() {
  const playerView = document.getElementById("join");
  const intro = playerView?.querySelector(".join-intro");

  if (!playerView || !intro || document.getElementById("desperadoClubNotice")) return;

  const notice = document.createElement("aside");
  notice.id = "desperadoClubNotice";
  notice.setAttribute("aria-label", "How questions are selected");
  notice.innerHTML = `
    <span class="desperado-badge" aria-hidden="true">★</span>
    <div>
      <p class="desperado-kicker">Desperado Club Rules</p>
      <h2>The Porch Controls the Board</h2>
      <p>The player standing at the porch chooses the category and point value for everyone. Want to call the shot? Find your way to <strong>The Desperado Club</strong>.</p>
    </div>
  `;

  Object.assign(notice.style, {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    margin: "0 0 16px",
    border: "1px solid rgba(246, 196, 83, .68)",
    borderLeft: "5px solid #f47b20",
    borderRadius: "16px",
    padding: "16px 18px",
    background: "linear-gradient(100deg, rgba(244, 123, 32, .13), rgba(154, 92, 255, .10)), rgba(13, 9, 18, .86)",
    boxShadow: "inset 0 0 22px rgba(246, 196, 83, .04), 0 10px 28px rgba(0, 0, 0, .22)"
  });

  const badge = notice.querySelector(".desperado-badge");
  Object.assign(badge.style, {
    display: "grid",
    flex: "0 0 auto",
    width: "52px",
    aspectRatio: "1",
    placeItems: "center",
    border: "2px solid #f6c453",
    borderRadius: "50%",
    color: "#f6c453",
    background: "rgba(246, 196, 83, .08)",
    fontSize: "1.35rem",
    boxShadow: "0 0 18px rgba(246, 196, 83, .12)"
  });

  const kicker = notice.querySelector(".desperado-kicker");
  Object.assign(kicker.style, {
    margin: "0 0 3px",
    color: "#ffad4d",
    fontFamily: '"Barlow Condensed", Impact, sans-serif',
    fontSize: ".78rem",
    fontWeight: "900",
    letterSpacing: ".15em",
    textTransform: "uppercase"
  });

  const heading = notice.querySelector("h2");
  Object.assign(heading.style, {
    margin: "0 0 5px",
    color: "#f6c453",
    fontFamily: '"Barlow Condensed", Impact, sans-serif',
    fontSize: "clamp(1.45rem, 4vw, 2rem)",
    lineHeight: "1"
  });

  const copy = notice.querySelector("p:last-child");
  Object.assign(copy.style, {
    margin: "0",
    color: "#cfc7d9",
    lineHeight: "1.45"
  });

  copy.querySelector("strong").style.color = "#ffad4d";
  intro.insertAdjacentElement("afterend", notice);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", addDesperadoClubNotice, { once: true });
} else {
  addDesperadoClubNotice();
}
