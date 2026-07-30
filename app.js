const state = {
  view: 'display', eventOpen: true, showAddress: false, address: '',
  hours: 'Open 5:00–9:00 PM', roomCode: 'CARL26', round: 1,
  players: [], activePlayerId: null, used: new Set(), current: null,
  selectedAnswer: null, timerId: null
};

const $ = id => document.getElementById(id);

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
}

function switchView(view) {
  state.view = view;
  document.querySelectorAll('.screen').forEach(el => el.classList.toggle('active', el.id === view));
  document.querySelectorAll('.view-button').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
}

function renderSettings() {
  $('statusBadge').textContent = state.eventOpen ? 'The Dungeon Is Open' : 'The Dungeon Is Currently Closed';
  $('statusBadge').classList.toggle('closed', !state.eventOpen);
  $('displayRoomCode').textContent = state.roomCode || '------';
  $('displayAddress').textContent = state.showAddress && state.address ? state.address : 'Event address hidden until game night';
  $('displayHours').textContent = state.eventOpen ? state.hours : 'Check back during event hours.';
  $('addressBanner').classList.toggle('hidden', !state.eventOpen);
  $('privacyStatus').textContent = state.showAddress && state.address ? 'Address is currently visible on the public display.' : 'Address hidden from public screens.';
}

function renderBoard() {
  const labels = ['Treat','Trick','Terror','Nightmare','Final Girl'];
  const board = $('board');
  board.innerHTML = '';
  categories.forEach((category, ci) => {
    const col = document.createElement('div');
    col.className = 'category-column';
    col.innerHTML = `<div class="category-title">${category.name}</div>`;
    category.questions.forEach((q, qi) => {
      const key = `${ci}-${qi}`;
      const button = document.createElement('button');
      button.className = 'tile';
      button.disabled = state.used.has(key);
      button.innerHTML = `<span>${labels[qi]}</span><strong>${(qi + 1) * 100}</strong>`;
      button.addEventListener('click', () => openQuestion({ key, category: category.name, value: (qi + 1) * 100, text: q[0], choices: q[1], answer: q[2], fact: q[3] }));
      col.appendChild(button);
    });
    board.appendChild(col);
  });
}

function renderPlayers() {
  const sorted = [...state.players].sort((a,b) => b.total - a.total || b.round - a.round);
  $('leaderboard').innerHTML = sorted.slice(0,8).map((p,i) => `<li><span><strong>${i + 1}. ${escapeHtml(p.name)}</strong><span class="entry-meta">${p.type === 'team' ? `Team of ${p.size}` : 'Solo'}</span></span><strong>${p.total}</strong></li>`).join('');
  $('emptyLeaderboard').classList.toggle('hidden', sorted.length > 0);
  $('roundNumber').textContent = state.round;

  $('hostPlayers').innerHTML = state.players.map(p => `<button class="player-card ${p.id === state.activePlayerId ? 'active' : ''}" data-player-id="${p.id}"><strong>${escapeHtml(p.name)}</strong><span class="entry-meta">${p.type === 'team' ? `Team of ${p.size}` : 'Solo'} · Round ${p.round} · Night ${p.total}</span></button>`).join('');
  $('hostPlayersEmpty').classList.toggle('hidden', state.players.length > 0);
  document.querySelectorAll('[data-player-id]').forEach(button => button.addEventListener('click', () => { state.activePlayerId = button.dataset.playerId; renderPlayers(); }));

  const active = state.players.find(p => p.id === state.activePlayerId);
  if (active) {
    $('joinedName').textContent = active.name;
    $('joinedRound').textContent = active.round;
    $('joinedTotal').textContent = active.total;
  }
}

function openQuestion(question) {
  clearInterval(state.timerId);
  state.current = question;
  state.selectedAnswer = null;
  $('questionCategory').textContent = question.category;
  $('questionValue').textContent = `${question.value} points`;
  $('questionText').textContent = question.text;
  $('correctAnswer').textContent = question.answer;
  $('answerFact').textContent = question.fact;
  $('answerReveal').classList.add('hidden');
  $('awardPoints').classList.add('hidden');
  $('revealAnswer').classList.remove('hidden');
  $('awardPoints').disabled = false;
  $('questionFeedback').textContent = '';
  $('answers').innerHTML = '';

  question.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'answer';
    btn.textContent = choice;
    btn.addEventListener('click', () => {
      state.selectedAnswer = choice;
      document.querySelectorAll('.answer').forEach(a => a.classList.toggle('selected', a === btn));
      $('questionFeedback').textContent = `Answer locked: ${choice}`;
    });
    $('answers').appendChild(btn);
  });

  let seconds = 30;
  $('timer').textContent = seconds;
  state.timerId = setInterval(() => {
    seconds -= 1;
    $('timer').textContent = seconds;
    if (seconds <= 0) {
      clearInterval(state.timerId);
      $('questionFeedback').textContent = 'Time is up. Reveal when ready.';
    }
  }, 1000);

  $('questionDialog').showModal();
}

function revealAnswer() {
  clearInterval(state.timerId);
  $('answerReveal').classList.remove('hidden');
  $('revealAnswer').classList.add('hidden');
  $('awardPoints').classList.remove('hidden');
  const correct = state.selectedAnswer === state.current.answer;
  $('questionFeedback').textContent = state.selectedAnswer ? (correct ? 'Correct! The dungeon grudgingly approves.' : 'Incorrect. The dungeon feeds on confidence.') : 'No answer was selected.';
}

function awardPoints() {
  const active = state.players.find(p => p.id === state.activePlayerId);
  if (!active) {
    $('questionFeedback').textContent = 'Choose an active player or team in Host Controls first.';
    return;
  }
  if (state.selectedAnswer === state.current.answer) {
    active.round += state.current.value;
    active.total += state.current.value;
    $('questionFeedback').textContent = `${active.name} earned ${state.current.value} points.`;
    $('awardPoints').disabled = true;
  } else {
    $('questionFeedback').textContent = `No points awarded to ${active.name}.`;
  }
  if (state.current.key) state.used.add(state.current.key);
  renderPlayers();
  renderBoard();
}

document.querySelectorAll('.view-button').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
$('eventOpen').addEventListener('change', e => { state.eventOpen = e.target.checked; renderSettings(); });
$('showAddress').addEventListener('change', e => { state.showAddress = e.target.checked; renderSettings(); });
$('addressInput').addEventListener('input', e => { state.address = e.target.value.trim(); renderSettings(); });
$('hoursInput').addEventListener('input', e => { state.hours = e.target.value; renderSettings(); });
$('roomCodeInput').addEventListener('input', e => { state.roomCode = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''); e.target.value = state.roomCode; renderSettings(); });

document.querySelectorAll('input[name="entryType"]').forEach(radio => radio.addEventListener('change', () => {
  const team = document.querySelector('input[name="entryType"]:checked').value === 'team';
  $('nameLabel').textContent = team ? 'Team name' : 'Player name';
  $('teamSizeLabel').classList.toggle('hidden', !team);
}));

$('joinGame').addEventListener('click', () => {
  const name = $('entryName').value.trim();
  const type = document.querySelector('input[name="entryType"]:checked').value;
  const size = type === 'team' ? Number($('teamSize').value) : 1;
  if (!name) { $('joinFeedback').textContent = 'Enter a player or team name first.'; return; }
  if (state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) { $('joinFeedback').textContent = 'That name is already roaming the dungeon.'; return; }
  const player = { id: `p-${Date.now()}-${Math.random().toString(16).slice(2)}`, name, type, size, round: 0, total: 0 };
  state.players.push(player);
  state.activePlayerId = player.id;
  $('entryName').value = '';
  $('joinFeedback').textContent = `${name} joined successfully.`;
  renderPlayers();
});

$('newRound').addEventListener('click', () => { state.round += 1; state.players.forEach(p => p.round = 0); state.used.clear(); renderPlayers(); renderBoard(); });
$('resetBoard').addEventListener('click', () => { state.used.clear(); renderBoard(); });
$('clearPlayers').addEventListener('click', () => { state.players = []; state.activePlayerId = null; $('joinedName').textContent = 'Not joined yet'; $('joinedRound').textContent = '0'; $('joinedTotal').textContent = '0'; renderPlayers(); });
$('displayBonus').addEventListener('click', () => openQuestion({...bonus, key: null}));
$('hostBonus').addEventListener('click', () => openQuestion({...bonus, key: null}));
$('revealAnswer').addEventListener('click', revealAnswer);
$('awardPoints').addEventListener('click', awardPoints);
$('returnBoard').addEventListener('click', () => { clearInterval(state.timerId); if (state.current?.key) state.used.add(state.current.key); renderBoard(); $('questionDialog').close(); });

renderSettings();
renderBoard();
renderPlayers();
