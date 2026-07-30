import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getDatabase,
  get,
  onValue,
  ref,
  remove,
  runTransaction,
  serverTimestamp,
  set,
  update
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";
import { firebaseConfig, firebaseConfigured, DEFAULT_ROOM_CODE } from "./firebase-config.js";
import { categories, bonus } from "./questions-live.js";

const difficultyLabels = ["Treat", "Trick", "Terror", "Nightmare", "Final Girl"];
const answerLetters = ["A", "B", "C", "D", "E", "F"];
const $ = id => document.getElementById(id);

const state = {
  live: false,
  connecting: false,
  uid: null,
  hostUid: null,
  isHost: false,
  roomCode: getInitialRoomCode(),
  public: {
    eventOpen: true,
    showAddress: false,
    address: "",
    hours: "Open 5:00–9:00 PM",
    roomCode: DEFAULT_ROOM_CODE,
    round: 1
  },
  privateAddress: "",
  players: [],
  activePlayerId: null,
  used: new Set(),
  game: { phase: "board" },
  current: null,
  selectedAnswer: null,
  timerId: null,
  answerCount: 0,
  localPlayers: [],
  localUsed: new Set(),
  localRound: 1,
  localGame: { phase: "board" }
};

let app;
let auth;
let db;
let roomUnsubscribers = [];
let privateAddressUnsubscribe = null;
let currentAnswerUnsubscribe = null;
let answerCountUnsubscribe = null;
let inputWriteTimer = null;

function getInitialRoomCode() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("room");
  const fromStorage = localStorage.getItem("trickOrTriviaRoom");
  return normalizeRoomCode(fromUrl || fromStorage || DEFAULT_ROOM_CODE);
}

function normalizeRoomCode(value = "") {
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || DEFAULT_ROOM_CODE;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function roomPath(suffix = "") {
  return `rooms/${state.roomCode}${suffix ? `/${suffix}` : ""}`;
}

function switchView(view, updateHash = true) {
  const normalizedView = view === "play" ? "join" : view;
  document.querySelectorAll(".screen").forEach(element => {
    element.classList.toggle("active", element.id === normalizedView);
  });
  document.querySelectorAll(".view-button").forEach(button => {
    button.classList.toggle("active", button.dataset.view === normalizedView);
  });
  if (updateHash) {
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${normalizedView === "join" ? "play" : normalizedView}`);
  }
}

function setConnectionStatus(mode, text) {
  const badge = $("connectionBadge");
  badge.className = `connection-badge ${mode}`;
  badge.innerHTML = `<span aria-hidden="true">●</span>${escapeHtml(text)}`;
}

function setSetupNotice(visible, message = "") {
  const notice = $("firebaseSetupNotice");
  notice.classList.toggle("hidden", !visible);
  if (message) {
    notice.innerHTML = `<strong>Firebase needs attention.</strong><span>${escapeHtml(message)}</span>`;
  }
}

function currentPlayers() {
  return state.live ? state.players : state.localPlayers;
}

function currentUsed() {
  return state.live ? state.used : state.localUsed;
}

function currentRound() {
  return state.live ? Number(state.public.round || 1) : state.localRound;
}

function currentPublic() {
  return state.live ? state.public : {
    eventOpen: state.public.eventOpen,
    showAddress: state.public.showAddress,
    address: state.public.showAddress ? state.privateAddress : "",
    hours: state.public.hours,
    roomCode: state.roomCode,
    round: state.localRound
  };
}

function renderSettings() {
  const publicState = currentPublic();
  const addressVisible = Boolean(publicState.eventOpen && publicState.showAddress && publicState.address);

  $("statusBadge").innerHTML = `<span class="status-dot" aria-hidden="true"></span>${publicState.eventOpen ? "The Dungeon Is Open" : "The Dungeon Is Currently Closed"}`;
  $("statusBadge").classList.toggle("closed", !publicState.eventOpen);
  $("displayRoomCode").textContent = state.roomCode;
  $("displayHours").textContent = publicState.eventOpen ? publicState.hours : "The spirits have retired for the evening.";
  $("inviteHeadline").textContent = publicState.eventOpen ? "Scan. Join. Answer if you dare." : "The haunting will resume during event hours.";

  if (addressVisible) {
    $("displayAddress").textContent = `Want to play? Join us at ${publicState.address}`;
  } else if (publicState.eventOpen) {
    $("displayAddress").textContent = "Share the room code with nearby friends.";
  } else {
    $("displayAddress").textContent = "The dungeon is closed. Please do not send new visitors.";
  }

  $("addressBanner").classList.toggle("address-visible", addressVisible);
  $("privacyStatus").classList.toggle("visible", addressVisible);
  $("privacyStatus").innerHTML = addressVisible
    ? '<span aria-hidden="true">●</span> Address is currently visible on the public display.'
    : '<span aria-hidden="true">●</span> Address hidden from public screens.';

  $("eventOpen").checked = Boolean(publicState.eventOpen);
  $("showAddress").checked = Boolean(publicState.showAddress);
  $("hoursInput").value = publicState.hours || "Open 5:00–9:00 PM";
  $("roomCodeInput").value = state.roomCode;
  if (document.activeElement !== $("addressInput")) {
    $("addressInput").value = state.privateAddress;
  }
}

function renderBoard() {
  const board = $("board");
  const usedQuestions = currentUsed();
  board.innerHTML = "";

  categories.forEach((category, categoryIndex) => {
    const column = document.createElement("div");
    column.className = "category-column";
    column.innerHTML = `<div class="category-title">${escapeHtml(category.name)}</div>`;

    category.questions.forEach((question, questionIndex) => {
      const key = `${categoryIndex}-${questionIndex}`;
      const used = usedQuestions.has(key);
      const button = document.createElement("button");
      button.className = "tile";
      button.dataset.level = String(questionIndex);
      button.disabled = used;
      button.setAttribute("aria-label", `${category.name}, ${difficultyLabels[questionIndex]}, ${(questionIndex + 1) * 100} points${used ? ", used" : ""}`);
      button.innerHTML = used
        ? "<span>Question</span><strong>Conquered</strong>"
        : `<span>${difficultyLabels[questionIndex]}</span><strong>${(questionIndex + 1) * 100}</strong>`;
      button.addEventListener("click", () => startQuestion({
        key,
        categoryIndex,
        questionIndex,
        category: category.name,
        level: questionIndex,
        value: (questionIndex + 1) * 100,
        text: question[0],
        choices: question[1],
        answer: question[2],
        fact: question[3],
        isBonus: false
      }));
      column.appendChild(button);
    });

    board.appendChild(column);
  });
}

function renderPlayers() {
  const players = currentPlayers();
  const sorted = [...players].sort((a, b) => Number(b.total || 0) - Number(a.total || 0) || Number(b.round || 0) - Number(a.round || 0));

  $("leaderboard").innerHTML = sorted.slice(0, 8).map(player => `
    <li>
      <span>
        <strong>${escapeHtml(player.name)}</strong>
        <span class="entry-meta">${player.type === "team" ? `Adventuring party of ${player.size}` : "Solo survivor"}</span>
      </span>
      <strong>${Number(player.total || 0)}</strong>
    </li>
  `).join("");
  $("emptyLeaderboard").classList.toggle("hidden", sorted.length > 0);
  $("roundNumber").textContent = currentRound();

  $("hostPlayers").innerHTML = players.map(player => `
    <button class="player-card ${player.id === state.activePlayerId ? "active" : ""}" data-player-id="${escapeHtml(player.id)}">
      <strong>${escapeHtml(player.name)}</strong>
      <span class="entry-meta">${player.type === "team" ? `Party of ${player.size}` : "Solo"} · Round ${Number(player.round || 0)} · Night ${Number(player.total || 0)}</span>
    </button>
  `).join("");
  $("hostPlayersEmpty").classList.toggle("hidden", players.length > 0);

  document.querySelectorAll("[data-player-id]").forEach(button => {
    button.addEventListener("click", () => {
      state.activePlayerId = button.dataset.playerId;
      renderPlayers();
    });
  });

  const ownPlayer = state.live
    ? players.find(player => player.id === state.uid)
    : players.find(player => player.id === state.activePlayerId);

  if (ownPlayer) {
    $("joinedName").textContent = ownPlayer.name;
    $("joinedRound").textContent = Number(ownPlayer.round || 0);
    $("joinedTotal").textContent = Number(ownPlayer.total || 0);
    $("playerLiveHeadline").textContent = state.live ? "Your entry is live." : "Local preview entry ready.";
    $("playerLiveStatus").textContent = state.live ? `Connected to room ${state.roomCode}. Questions will appear automatically.` : "Firebase is not connected yet.";
  } else {
    resetJoinedCard();
  }

  if (state.current) renderQuestionControls();
}

function resetJoinedCard() {
  $("joinedName").textContent = "Not summoned yet";
  $("joinedRound").textContent = "0";
  $("joinedTotal").textContent = "0";
  $("playerLiveHeadline").textContent = state.live ? "Join the room to answer." : "The spirits are standing by.";
  $("playerLiveStatus").textContent = state.live ? `Connected to room ${state.roomCode}.` : "New players can join between any questions.";
}

function updateRoleUI() {
  const hostControls = ["eventOpen", "showAddress", "addressInput", "hoursInput", "newRound", "hostBonus", "resetBoard", "clearPlayers"];
  hostControls.forEach(id => {
    $(id).disabled = state.live && !state.isHost;
    $(id).classList.toggle("live-locked", state.live && !state.isHost);
  });

  $("claimHost").classList.toggle("hidden", !state.live || state.isHost || Boolean(state.hostUid));
  $("releaseHost").classList.toggle("hidden", !state.live || !state.isHost);

  if (!state.live) {
    $("hostRoleBadge").textContent = "Local Preview Mode";
    $("hostConnectionHelp").textContent = "Add Firebase configuration to activate shared devices.";
  } else if (state.isHost) {
    $("hostRoleBadge").textContent = "Live Host — Quizmaster Tara";
    $("hostConnectionHelp").textContent = "This browser controls the live room. Keep this tab open during testing.";
  } else if (state.hostUid) {
    $("hostRoleBadge").textContent = "Host Claimed on Another Device";
    $("hostConnectionHelp").textContent = "Players can join here, but only the claimed host device can run the show.";
  } else {
    $("hostRoleBadge").textContent = "Host Access Available";
    $("hostConnectionHelp").textContent = "Claim host access before sharing the room link.";
  }

  renderQuestionControls();
}

function resolveQuestionFromGame(game) {
  if (!game || game.phase === "board") return null;
  if (game.isBonus) return { ...bonus, key: null, isBonus: true };
  const category = categories[Number(game.categoryIndex)];
  const question = category?.questions?.[Number(game.questionIndex)];
  if (!category || !question) return null;
  const level = Number(game.questionIndex);
  return {
    key: `${game.categoryIndex}-${game.questionIndex}`,
    categoryIndex: Number(game.categoryIndex),
    questionIndex: Number(game.questionIndex),
    category: category.name,
    level,
    value: Number(game.value || (level + 1) * 100),
    text: question[0],
    choices: question[1],
    answer: question[2],
    fact: question[3],
    isBonus: false
  };
}

function startQuestion(question) {
  if (state.live) {
    startLiveQuestion(question).catch(handleFirebaseError);
  } else {
    state.localGame = {
      phase: "question",
      instanceId: `local-${Date.now()}`,
      startedAt: Date.now(),
      duration: 30,
      question
    };
    state.selectedAnswer = null;
    state.current = question;
    showQuestionDialog(question, state.localGame);
  }
}

async function startLiveQuestion(question) {
  if (!state.isHost) {
    $("emptyLeaderboard").textContent = "Claim Host Controls before launching a live question.";
    return;
  }

  const instanceId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const game = {
    phase: "question",
    instanceId,
    categoryIndex: question.categoryIndex ?? null,
    questionIndex: question.questionIndex ?? null,
    isBonus: Boolean(question.isBonus),
    value: Number(question.value),
    startedAt: serverTimestamp(),
    duration: 30
  };
  const updates = { [roomPath("game")]: game };
  if (question.key) updates[roomPath(`used/${question.key}`)] = true;
  await update(ref(db), updates);
}

function showQuestionDialog(question, game) {
  clearInterval(state.timerId);
  state.current = question;

  const instanceChanged = $("questionDialog").dataset.instanceId !== String(game.instanceId || "local");
  if (instanceChanged) {
    state.selectedAnswer = null;
    $("questionDialog").dataset.instanceId = String(game.instanceId || "local");
  }

  $("questionDialog").classList.toggle("bonus-mode", Boolean(question.isBonus || question.category === "Dungeon Crawler Carl"));
  $("systemBanner").classList.toggle("hidden", !(question.isBonus || question.category === "Dungeon Crawler Carl"));
  $("questionCategory").textContent = question.category;
  $("questionValue").textContent = question.level === undefined
    ? `${question.value} point bonus`
    : `${difficultyLabels[question.level]} · ${question.value} points`;
  $("questionText").textContent = question.text;
  $("correctAnswer").textContent = question.answer;
  $("answerFact").textContent = question.fact;

  renderQuestionControls();
  startSyncedTimer(game);

  if (!$("questionDialog").open) $("questionDialog").showModal();
  if (state.live && state.uid && game.instanceId) subscribeToOwnAnswer(game.instanceId);
}

function renderQuestionControls() {
  if (!state.current) return;
  const game = state.live ? state.game : state.localGame;
  const isReveal = game.phase === "reveal";
  const isQuestion = game.phase === "question";
  const ownPlayer = currentPlayers().find(player => player.id === (state.live ? state.uid : state.activePlayerId));

  $("answerReveal").classList.toggle("hidden", !isReveal);
  $("revealAnswer").classList.toggle("hidden", state.live ? !(state.isHost && isQuestion) : !isQuestion);
  $("awardPoints").classList.toggle("hidden", state.live
    ? !(state.isHost && isReveal && game.scoredInstanceId !== game.instanceId)
    : !isReveal);
  $("awardPoints").textContent = state.live ? "Score Correct Answers" : "Award Points";
  $("returnBoard").classList.toggle("hidden", state.live && !state.isHost);
  $("answerCount").classList.toggle("hidden", !(state.live && state.isHost));
  if (state.live && state.isHost) {
    $("answerCount").textContent = `${state.answerCount} answer${state.answerCount === 1 ? "" : "s"} received`;
  }

  $("answers").innerHTML = "";
  state.current.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.className = "answer";
    button.dataset.letter = answerLetters[index] || String(index + 1);
    button.textContent = choice;
    button.classList.toggle("selected", state.selectedAnswer === choice);
    if (isReveal) {
      button.classList.toggle("correct", choice === state.current.answer);
      button.classList.toggle("incorrect", choice !== state.current.answer && choice === state.selectedAnswer);
    }

    const expired = getRemainingSeconds(game) <= 0;
    button.disabled = !isQuestion || expired || !ownPlayer;
    button.addEventListener("click", () => selectAnswer(choice));
    $("answers").appendChild(button);
  });

  if (isReveal) {
    if (!state.selectedAnswer) {
      $("questionFeedback").textContent = "No answer was summoned. The truth appears anyway.";
    } else if (state.selectedAnswer === state.current.answer) {
      $("questionFeedback").textContent = "Correct! The spirits approve. Suspiciously enthusiastically.";
    } else {
      $("questionFeedback").textContent = "Alas, the darkness claims that point. Dramatic music, please.";
    }
  } else if (!ownPlayer) {
    $("questionFeedback").textContent = "Join as a player or team before locking in an answer.";
  } else if (state.selectedAnswer) {
    $("questionFeedback").textContent = `${state.selectedAnswer} is locked in. The spirits have been notified.`;
  } else {
    $("questionFeedback").textContent = "Choose carefully. The spirits are taking notes.";
  }
}

function selectAnswer(choice) {
  if (state.live) {
    submitLiveAnswer(choice).catch(handleFirebaseError);
  } else {
    state.selectedAnswer = choice;
    renderQuestionControls();
  }
}

async function submitLiveAnswer(choice) {
  const ownPlayer = state.players.find(player => player.id === state.uid);
  if (!ownPlayer || state.game.phase !== "question" || !state.game.instanceId) return;
  await set(ref(db, roomPath(`answers/${state.game.instanceId}/${state.uid}`)), {
    choice,
    submittedAt: serverTimestamp()
  });
  state.selectedAnswer = choice;
  renderQuestionControls();
}

function subscribeToOwnAnswer(instanceId) {
  if (!state.live || !state.uid) return;
  if (currentAnswerUnsubscribe) currentAnswerUnsubscribe();
  currentAnswerUnsubscribe = onValue(ref(db, roomPath(`answers/${instanceId}/${state.uid}`)), snapshot => {
    state.selectedAnswer = snapshot.val()?.choice || null;
    renderQuestionControls();
  });
}

function getRemainingSeconds(game) {
  const duration = Number(game.duration || 30);
  const startedAt = Number(game.startedAt || Date.now());
  return Math.max(0, Math.ceil(duration - (Date.now() - startedAt) / 1000));
}

function updateTimerAppearance(seconds) {
  const wrap = $("timerWrap");
  wrap.classList.toggle("warning", seconds <= 10 && seconds > 5);
  wrap.classList.toggle("danger", seconds <= 5);
}

function startSyncedTimer(game) {
  clearInterval(state.timerId);
  const tick = () => {
    const seconds = getRemainingSeconds(game);
    $("timer").textContent = seconds;
    updateTimerAppearance(seconds);
    if (seconds <= 0) {
      clearInterval(state.timerId);
      renderQuestionControls();
    }
  };
  tick();
  if (game.phase === "question") state.timerId = setInterval(tick, 250);
}

async function revealAnswer() {
  if (state.live) {
    if (!state.isHost || state.game.phase !== "question") return;
    await update(ref(db, roomPath("game")), { phase: "reveal", revealedAt: serverTimestamp() });
  } else {
    state.localGame.phase = "reveal";
    renderQuestionControls();
  }
}

async function scoreAnswers() {
  if (!state.live) {
    awardLocalPoints();
    return;
  }
  if (!state.isHost || state.game.phase !== "reveal") return;

  const instanceId = state.game.instanceId;
  const lock = await runTransaction(ref(db, roomPath("game/scoredInstanceId")), current => {
    if (current === instanceId) return;
    return instanceId;
  });
  if (!lock.committed) {
    $("questionFeedback").textContent = "This question has already been scored.";
    return;
  }

  const answersSnapshot = await get(ref(db, roomPath(`answers/${instanceId}`)));
  const answers = answersSnapshot.val() || {};
  const winners = Object.entries(answers)
    .filter(([, answer]) => answer?.choice === state.current.answer)
    .map(([uid]) => uid);

  await Promise.all(winners.flatMap(uid => [
    runTransaction(ref(db, roomPath(`players/${uid}/round`)), score => Number(score || 0) + Number(state.current.value)),
    runTransaction(ref(db, roomPath(`players/${uid}/total`)), score => Number(score || 0) + Number(state.current.value))
  ]));

  $("questionFeedback").textContent = winners.length
    ? `${winners.length} correct entr${winners.length === 1 ? "y survives" : "ies survive"} with ${state.current.value} points.`
    : "No correct answers. The scoreboard cackles softly.";
}

function awardLocalPoints() {
  const active = state.localPlayers.find(player => player.id === state.activePlayerId);
  if (!active) {
    $("questionFeedback").textContent = "Choose a contestant in Host Controls before awarding points.";
    return;
  }
  if (state.selectedAnswer === state.current.answer) {
    active.round += state.current.value;
    active.total += state.current.value;
    $("questionFeedback").textContent = `${active.name} survives with ${state.current.value} new points.`;
  } else {
    $("questionFeedback").textContent = `No points for ${active.name}. The scoreboard remains merciless.`;
  }
  renderPlayers();
}

async function returnToBoard() {
  clearInterval(state.timerId);
  if (state.live) {
    if (!state.isHost) return;
    await set(ref(db, roomPath("game")), { phase: "board" });
  } else {
    state.localGame = { phase: "board" };
    if (state.current?.key) state.localUsed.add(state.current.key);
    state.current = null;
    renderBoard();
    if ($("questionDialog").open) $("questionDialog").close();
  }
}

async function joinGame() {
  const name = $("entryName").value.trim();
  const type = document.querySelector('input[name="entryType"]:checked').value;
  const size = type === "team" ? Number($("teamSize").value) : 1;

  if (!name) {
    $("joinFeedback").textContent = "The spirits require a player or team name.";
    return;
  }
  if (currentPlayers().some(player => player.name.toLowerCase() === name.toLowerCase() && player.id !== state.uid)) {
    $("joinFeedback").textContent = "That name is already roaming the haunted leaderboard.";
    return;
  }

  if (state.live) {
    const existing = state.players.find(player => player.id === state.uid);
    const base = roomPath(`players/${state.uid}`);
    const updates = {
      [`${base}/name`]: name,
      [`${base}/type`]: type,
      [`${base}/size`]: size,
      [`${base}/joinedAt`]: serverTimestamp()
    };
    if (!existing) {
      updates[`${base}/round`] = 0;
      updates[`${base}/total`] = 0;
    }
    await update(ref(db), updates);
  } else {
    const player = {
      id: `p-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      type,
      size,
      round: 0,
      total: 0
    };
    state.localPlayers.push(player);
    state.activePlayerId = player.id;
    renderPlayers();
  }

  $("entryName").value = "";
  $("joinFeedback").textContent = `${name} has entered the spotlight.`;
}

async function claimHost() {
  if (!state.live || !state.uid) return;
  const result = await runTransaction(ref(db, roomPath("hostUid")), current => current || state.uid);
  if (!result.committed || result.snapshot.val() !== state.uid) return;
  await initializeRoomDefaults();
}

async function releaseHost() {
  if (!state.live || !state.isHost) return;
  await remove(ref(db, roomPath("hostUid")));
}

async function initializeRoomDefaults() {
  const publicRef = ref(db, roomPath("public"));
  const snapshot = await get(publicRef);
  const existing = snapshot.val() || {};
  await update(publicRef, {
    eventOpen: existing.eventOpen ?? true,
    showAddress: existing.showAddress ?? false,
    address: existing.address ?? null,
    hours: existing.hours || "Open 5:00–9:00 PM",
    roomCode: state.roomCode,
    round: existing.round || 1
  });
  const gameSnapshot = await get(ref(db, roomPath("game")));
  if (!gameSnapshot.exists()) await set(ref(db, roomPath("game")), { phase: "board" });
}

async function updatePublicSettings(values) {
  if (!state.live) {
    Object.assign(state.public, values);
    if (Object.prototype.hasOwnProperty.call(values, "address") && values.address) state.privateAddress = values.address;
    renderSettings();
    return;
  }
  if (!state.isHost) return;
  await update(ref(db, roomPath("public")), values);
}

async function savePrivateAddress() {
  state.privateAddress = $("addressInput").value.trim();
  if (!state.live) {
    state.public.address = state.public.showAddress ? state.privateAddress : "";
    renderSettings();
    return;
  }
  if (!state.isHost) return;
  await set(ref(db, roomPath("private/address")), state.privateAddress || null);
  if (state.public.showAddress) {
    await updatePublicSettings({ address: state.privateAddress || null });
  }
}

async function startNewRound() {
  if (!state.live) {
    state.localRound += 1;
    state.localPlayers.forEach(player => { player.round = 0; });
    state.localUsed.clear();
    renderPlayers();
    renderBoard();
    return;
  }
  if (!state.isHost) return;
  const updates = {
    [roomPath("public/round")]: Number(state.public.round || 1) + 1,
    [roomPath("used")]: null,
    [roomPath("answers")]: null,
    [roomPath("game")]: { phase: "board" }
  };
  state.players.forEach(player => { updates[roomPath(`players/${player.id}/round`)] = 0; });
  await update(ref(db), updates);
}

async function resetBoard() {
  if (!state.live) {
    state.localUsed.clear();
    renderBoard();
    return;
  }
  if (!state.isHost) return;
  await update(ref(db), {
    [roomPath("used")]: null,
    [roomPath("game")]: { phase: "board" }
  });
}

async function clearPlayers() {
  if (!state.live) {
    state.localPlayers = [];
    state.activePlayerId = null;
    renderPlayers();
    return;
  }
  if (!state.isHost) return;
  await update(ref(db), {
    [roomPath("players")]: null,
    [roomPath("answers")]: null
  });
}

async function connectRoom(roomCode) {
  state.roomCode = normalizeRoomCode(roomCode);
  localStorage.setItem("trickOrTriviaRoom", state.roomCode);
  const url = new URL(window.location.href);
  url.searchParams.set("room", state.roomCode);
  history.replaceState(null, "", url);

  roomUnsubscribers.forEach(unsubscribe => unsubscribe());
  roomUnsubscribers = [];
  if (privateAddressUnsubscribe) privateAddressUnsubscribe();
  privateAddressUnsubscribe = null;
  if (currentAnswerUnsubscribe) currentAnswerUnsubscribe();
  currentAnswerUnsubscribe = null;
  if (answerCountUnsubscribe) answerCountUnsubscribe();
  answerCountUnsubscribe = null;

  state.hostUid = null;
  state.isHost = false;
  state.players = [];
  state.used = new Set();
  state.game = { phase: "board" };
  state.current = null;
  state.selectedAnswer = null;

  roomUnsubscribers.push(onValue(ref(db, roomPath("hostUid")), snapshot => {
    state.hostUid = snapshot.val() || null;
    state.isHost = state.hostUid === state.uid;
    subscribePrivateAddressIfHost();
    updateRoleUI();
  }));

  roomUnsubscribers.push(onValue(ref(db, roomPath("public")), snapshot => {
    state.public = {
      eventOpen: true,
      showAddress: false,
      address: "",
      hours: "Open 5:00–9:00 PM",
      roomCode: state.roomCode,
      round: 1,
      ...(snapshot.val() || {})
    };
    renderSettings();
    renderPlayers();
  }));

  roomUnsubscribers.push(onValue(ref(db, roomPath("players")), snapshot => {
    const value = snapshot.val() || {};
    state.players = Object.entries(value).map(([id, player]) => ({ id, ...player }));
    renderPlayers();
  }));

  roomUnsubscribers.push(onValue(ref(db, roomPath("used")), snapshot => {
    const value = snapshot.val() || {};
    state.used = new Set(Object.entries(value).filter(([, used]) => Boolean(used)).map(([key]) => key));
    renderBoard();
  }));

  roomUnsubscribers.push(onValue(ref(db, roomPath("game")), snapshot => {
    state.game = snapshot.val() || { phase: "board" };
    const question = resolveQuestionFromGame(state.game);
    if (!question) {
      state.current = null;
      state.selectedAnswer = null;
      clearInterval(state.timerId);
      if (answerCountUnsubscribe) answerCountUnsubscribe();
      answerCountUnsubscribe = null;
      if ($("questionDialog").open) $("questionDialog").close();
      return;
    }
    showQuestionDialog(question, state.game);
    subscribeAnswerCount(state.game.instanceId);
  }));

  renderSettings();
  renderBoard();
  renderPlayers();
  updateRoleUI();
}

function subscribePrivateAddressIfHost() {
  if (privateAddressUnsubscribe) privateAddressUnsubscribe();
  privateAddressUnsubscribe = null;
  if (!state.live || !state.isHost) {
    state.privateAddress = "";
    renderSettings();
    return;
  }
  privateAddressUnsubscribe = onValue(ref(db, roomPath("private/address")), snapshot => {
    state.privateAddress = snapshot.val() || "";
    renderSettings();
  });
}

function subscribeAnswerCount(instanceId) {
  if (answerCountUnsubscribe) answerCountUnsubscribe();
  answerCountUnsubscribe = null;
  if (!state.live || !state.isHost || !instanceId) {
    state.answerCount = 0;
    renderQuestionControls();
    return;
  }
  answerCountUnsubscribe = onValue(ref(db, roomPath(`answers/${instanceId}`)), snapshot => {
    state.answerCount = snapshot.exists() ? snapshot.size : 0;
    renderQuestionControls();
  });
}

function handleFirebaseError(error) {
  console.error(error);
  setConnectionStatus("offline", "Firebase error");
  setSetupNotice(true, error?.message || "The live connection failed. Check Firebase configuration and rules.");
}

async function initializeFirebase() {
  if (!firebaseConfigured) {
    state.live = false;
    setConnectionStatus("setup", "Firebase setup needed");
    setSetupNotice(true);
    updateRoleUI();
    return;
  }

  state.connecting = true;
  setConnectionStatus("connecting", "Connecting to the séance");
  setSetupNotice(false);

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);

    onValue(ref(db, ".info/connected"), snapshot => {
      if (!state.live) return;
      setConnectionStatus(snapshot.val() ? "live" : "offline", snapshot.val() ? `Live room ${state.roomCode}` : "Connection interrupted");
    });

    onAuthStateChanged(auth, async user => {
      if (!user) return;
      state.uid = user.uid;
      state.live = true;
      state.connecting = false;
      setConnectionStatus("live", `Live room ${state.roomCode}`);
      await connectRoom(state.roomCode);
    });

    await signInAnonymously(auth);
  } catch (error) {
    state.live = false;
    state.connecting = false;
    handleFirebaseError(error);
    updateRoleUI();
  }
}

function bindInterface() {
  document.querySelectorAll(".view-button").forEach(button => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  window.addEventListener("hashchange", () => switchView(window.location.hash.slice(1) || "display", false));

  $("eventOpen").addEventListener("change", event => {
    updatePublicSettings({ eventOpen: event.target.checked }).catch(handleFirebaseError);
  });
  $("showAddress").addEventListener("change", event => {
    updatePublicSettings({
      showAddress: event.target.checked,
      address: event.target.checked && state.privateAddress ? state.privateAddress : null
    }).catch(handleFirebaseError);
  });
  $("addressInput").addEventListener("change", () => savePrivateAddress().catch(handleFirebaseError));
  $("hoursInput").addEventListener("change", event => {
    updatePublicSettings({ hours: event.target.value.trim() || "Open 5:00–9:00 PM" }).catch(handleFirebaseError);
  });
  $("roomCodeInput").addEventListener("input", event => {
    event.target.value = normalizeRoomCode(event.target.value);
    clearTimeout(inputWriteTimer);
    inputWriteTimer = setTimeout(() => {
      const room = normalizeRoomCode(event.target.value);
      if (state.live) connectRoom(room).catch(handleFirebaseError);
      else {
        state.roomCode = room;
        renderSettings();
      }
    }, 600);
  });

  document.querySelectorAll('input[name="entryType"]').forEach(radio => {
    radio.addEventListener("change", () => {
      const team = document.querySelector('input[name="entryType"]:checked').value === "team";
      $("nameLabel").textContent = team ? "Team name" : "Player name";
      $("teamSizeLabel").classList.toggle("hidden", !team);
    });
  });

  $("joinGame").addEventListener("click", () => joinGame().catch(handleFirebaseError));
  $("claimHost").addEventListener("click", () => claimHost().catch(handleFirebaseError));
  $("releaseHost").addEventListener("click", () => releaseHost().catch(handleFirebaseError));
  $("newRound").addEventListener("click", () => startNewRound().catch(handleFirebaseError));
  $("resetBoard").addEventListener("click", () => resetBoard().catch(handleFirebaseError));
  $("clearPlayers").addEventListener("click", () => clearPlayers().catch(handleFirebaseError));
  $("displayBonus").addEventListener("click", () => startQuestion({ ...bonus, key: null, isBonus: true }));
  $("hostBonus").addEventListener("click", () => startQuestion({ ...bonus, key: null, isBonus: true }));
  $("revealAnswer").addEventListener("click", () => revealAnswer().catch(handleFirebaseError));
  $("awardPoints").addEventListener("click", () => scoreAnswers().catch(handleFirebaseError));
  $("returnBoard").addEventListener("click", () => returnToBoard().catch(handleFirebaseError));
}

bindInterface();
switchView(window.location.hash.slice(1) || "display", false);
renderSettings();
renderBoard();
renderPlayers();
updateRoleUI();
initializeFirebase();
