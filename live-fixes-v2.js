import { getApps } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getDatabase,
  get,
  onValue,
  ref,
  runTransaction,
  serverTimestamp,
  set,
  update
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";
import { DEFAULT_ROOM_CODE } from "./firebase-config.js";
import { bonusQuestions } from "./questions-live.js";

const $ = id => document.getElementById(id);
const answerLetters = ["A", "B", "C", "D", "E", "F"];

const roomCode = normalizeRoomCode(
  new URLSearchParams(window.location.search).get("room") ||
  localStorage.getItem("trickOrTriviaRoom") ||
  DEFAULT_ROOM_CODE
);

let auth;
let db;
let uid = null;
let hostUid = null;
let ownPlayerExists = false;
let activeBonus = null;
let activeInstanceId = null;
let ownChoice = null;
let ownAnswerUnsubscribe = null;
let hostAnswersUnsubscribe = null;
let expiryTimer = null;

function normalizeRoomCode(value = "") {
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || DEFAULT_ROOM_CODE;
}

function roomPath(suffix = "") {
  return `rooms/${roomCode}${suffix ? `/${suffix}` : ""}`;
}

function setHostMessage(message) {
  const element = $("hostConnectionHelp");
  if (element) element.textContent = message;
}

function showError(error) {
  console.error(error);
  setHostMessage(`The dungeon objected: ${error?.message || "Unknown Firebase error"}`);
}

function wait(milliseconds) {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds));
}

async function waitForFirebaseApp() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const app = getApps()[0];
    if (app) return app;
    await wait(100);
  }
  throw new Error("The Firebase app did not initialize.");
}

function waitForUser() {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (!user) return;
      unsubscribe();
      resolve(user);
    });
  });
}

function isHost() {
  return Boolean(uid && hostUid === uid);
}

function captureControl(id, handler) {
  const element = $(id);
  if (!element) return;
  element.addEventListener("click", event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    handler().catch(showError);
  }, true);
}

function captureBonusScoring() {
  const element = $("awardPoints");
  if (!element) return;
  element.addEventListener("click", event => {
    if (!activeBonus) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    scoreBonusAnswers().catch(showError);
  }, true);
}

async function startFreshRound() {
  if (!isHost()) {
    setHostMessage("Only the claimed host device can start a fresh round.");
    return;
  }

  const [roundSnapshot, playersSnapshot] = await Promise.all([
    get(ref(db, roomPath("public/round"))),
    get(ref(db, roomPath("players")))
  ]);

  const nextRound = Number(roundSnapshot.val() || 1) + 1;
  const players = playersSnapshot.val() || {};
  const updates = {
    [roomPath("public/round")]: nextRound,
    [roomPath("used")]: null,
    [roomPath("game")]: { phase: "board" }
  };

  Object.keys(players).forEach(playerId => {
    updates[roomPath(`players/${playerId}/round`)] = 0;
  });

  await update(ref(db), updates);
  setHostMessage(`Round ${nextRound} is live. Round scores and the board have been reset.`);
}

async function getNextBonusIndex() {
  const [roundSnapshot, usedSnapshot] = await Promise.all([
    get(ref(db, roomPath("public/round"))),
    get(ref(db, roomPath("used")))
  ]);

  const count = bonusQuestions.length;
  const roundOffset = Math.max(0, Number(roundSnapshot.val() || 1) - 1) % count;
  const used = usedSnapshot.val() || {};

  for (let offset = 0; offset < count; offset += 1) {
    const candidate = (roundOffset + offset) % count;
    if (!used[`bonus-${candidate}`]) return candidate;
  }

  return roundOffset;
}

async function launchBonusFloor() {
  if (!isHost()) {
    setHostMessage("Claim Host Controls before opening a bonus floor.");
    return;
  }

  const bonusIndex = await getNextBonusIndex();
  const question = bonusQuestions[bonusIndex];
  const instanceId = crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  await update(ref(db), {
    [roomPath("game")]: {
      phase: "question",
      instanceId,
      categoryIndex: null,
      questionIndex: bonusIndex,
      isBonus: true,
      value: Number(question.value || 1000),
      startedAt: serverTimestamp(),
      duration: 30
    },
    [roomPath(`used/bonus-${bonusIndex}`)]: true
  });
}

function clearBonusSubscriptions() {
  if (ownAnswerUnsubscribe) ownAnswerUnsubscribe();
  if (hostAnswersUnsubscribe) hostAnswersUnsubscribe();
  ownAnswerUnsubscribe = null;
  hostAnswersUnsubscribe = null;
  window.clearTimeout(expiryTimer);
  expiryTimer = null;
}

function scheduleExpiryRender(game) {
  window.clearTimeout(expiryTimer);
  const startedAt = Number(game.startedAt || Date.now());
  const duration = Number(game.duration || 30) * 1000;
  const delay = Math.max(0, startedAt + duration - Date.now()) + 100;
  expiryTimer = window.setTimeout(renderBonusSoon, delay);
}

function subscribeToBonusAnswers(game) {
  clearBonusSubscriptions();
  if (!game?.instanceId || !uid) return;

  ownAnswerUnsubscribe = onValue(
    ref(db, roomPath(`answers/${game.instanceId}/${uid}`)),
    snapshot => {
      ownChoice = snapshot.val()?.choice || null;
      renderBonusSoon();
    }
  );

  if (isHost()) {
    hostAnswersUnsubscribe = onValue(
      ref(db, roomPath(`answers/${game.instanceId}`)),
      renderBonusSoon
    );
  }
}

function renderBonusSoon() {
  window.setTimeout(renderBonusQuestion, 0);
}

function remainingSeconds(game) {
  const duration = Number(game.duration || 30);
  const startedAt = Number(game.startedAt || Date.now());
  return Math.max(0, Math.ceil(duration - (Date.now() - startedAt) / 1000));
}

function renderBonusQuestion() {
  if (!activeBonus) return;

  const { question, game } = activeBonus;
  const dialog = $("questionDialog");
  const answers = $("answers");
  if (!dialog || !answers) return;

  $("systemBanner")?.classList.remove("hidden");
  dialog.classList.add("bonus-mode");
  $("questionCategory").textContent = question.category;
  $("questionValue").textContent = `${question.value} point bonus`;
  $("questionText").textContent = question.text;
  $("correctAnswer").textContent = question.answer;
  $("answerFact").textContent = question.fact;

  const revealed = game.phase === "reveal";
  const expired = remainingSeconds(game) <= 0;
  const canAnswer = game.phase === "question" && ownPlayerExists && !expired;

  answers.innerHTML = "";
  question.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.className = "answer";
    button.dataset.letter = answerLetters[index] || String(index + 1);
    button.textContent = choice;
    button.classList.toggle("selected", ownChoice === choice);

    if (revealed) {
      button.classList.toggle("correct", choice === question.answer);
      button.classList.toggle("incorrect", ownChoice === choice && choice !== question.answer);
    }

    button.disabled = !canAnswer;
    button.addEventListener("click", () => submitBonusAnswer(choice).catch(showError));
    answers.appendChild(button);
  });

  const feedback = $("questionFeedback");
  if (feedback) {
    if (revealed && !ownChoice) {
      feedback.textContent = "No answer was summoned. The truth appears anyway.";
    } else if (revealed && ownChoice === question.answer) {
      feedback.textContent = "Correct! The Dungeon AI is reluctantly impressed.";
    } else if (revealed) {
      feedback.textContent = "Incorrect. Mongo is appalled.";
    } else if (!ownPlayerExists) {
      feedback.textContent = "Join as a player or team before locking in an answer.";
    } else if (ownChoice) {
      feedback.textContent = `${ownChoice} is locked in.`;
    } else if (expired) {
      feedback.textContent = "Time has expired. The dungeon accepts no appeals.";
    } else {
      feedback.textContent = "Choose carefully. The Dungeon AI is watching.";
    }
  }

  if (!dialog.open) dialog.showModal();
}

async function submitBonusAnswer(choice) {
  if (!activeBonus || !uid || !ownPlayerExists) return;
  const { game } = activeBonus;
  if (game.phase !== "question" || remainingSeconds(game) <= 0) return;

  await set(ref(db, roomPath(`answers/${game.instanceId}/${uid}`)), {
    choice,
    submittedAt: serverTimestamp()
  });
}

async function scoreBonusAnswers() {
  if (!activeBonus || !isHost()) return;

  const gameSnapshot = await get(ref(db, roomPath("game")));
  const game = gameSnapshot.val();
  if (!game?.isBonus || game.phase !== "reveal" || !game.instanceId) return;

  const question = bonusQuestions[Number(game.questionIndex || 0)] || bonusQuestions[0];
  const instanceId = game.instanceId;
  const lock = await runTransaction(
    ref(db, roomPath("game/scoredInstanceId")),
    current => current === instanceId ? undefined : instanceId
  );

  if (!lock.committed) {
    $("questionFeedback").textContent = "This bonus question has already been scored.";
    return;
  }

  const answersSnapshot = await get(ref(db, roomPath(`answers/${instanceId}`)));
  const answers = answersSnapshot.val() || {};
  const winners = Object.entries(answers)
    .filter(([, answer]) => answer?.choice === question.answer)
    .map(([playerId]) => playerId);

  await Promise.all(winners.flatMap(playerId => [
    runTransaction(ref(db, roomPath(`players/${playerId}/round`)), score => Number(score || 0) + Number(question.value)),
    runTransaction(ref(db, roomPath(`players/${playerId}/total`)), score => Number(score || 0) + Number(question.value))
  ]));

  $("questionFeedback").textContent = winners.length
    ? `${winners.length} correct entr${winners.length === 1 ? "y earns" : "ies earn"} ${question.value} bonus points.`
    : "No correct answers. The Dungeon AI cackles softly.";
}

async function initializeFixes() {
  const app = await waitForFirebaseApp();
  auth = getAuth(app);
  db = getDatabase(app);
  const user = await waitForUser();
  uid = user.uid;

  onValue(ref(db, roomPath("hostUid")), snapshot => {
    hostUid = snapshot.val() || null;
    if (activeBonus) {
      subscribeToBonusAnswers(activeBonus.game);
      scheduleExpiryRender(activeBonus.game);
      renderBonusSoon();
    }
  });

  onValue(ref(db, roomPath(`players/${uid}`)), snapshot => {
    ownPlayerExists = snapshot.exists();
    renderBonusSoon();
  });

  onValue(ref(db, roomPath("game")), snapshot => {
    const game = snapshot.val() || { phase: "board" };
    if (!game.isBonus || game.phase === "board") {
      activeBonus = null;
      activeInstanceId = null;
      ownChoice = null;
      clearBonusSubscriptions();
      return;
    }

    const index = Math.max(0, Math.min(bonusQuestions.length - 1, Number(game.questionIndex || 0)));
    activeBonus = { question: bonusQuestions[index], game };

    if (activeInstanceId !== game.instanceId) {
      activeInstanceId = game.instanceId;
      ownChoice = null;
      subscribeToBonusAnswers(game);
    }

    scheduleExpiryRender(game);
    renderBonusSoon();
  });

  captureControl("newRound", startFreshRound);
  captureControl("displayBonus", launchBonusFloor);
  captureControl("hostBonus", launchBonusFloor);
  captureBonusScoring();
}

initializeFixes().catch(showError);
