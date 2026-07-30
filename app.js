const state = {
  view: 'display',
  eventOpen: true,
  showAddress: false,
  address: '',
  hours: 'Open 5:00–9:00 PM',
  roomCode: 'CARL26',
  round: 1,
  players: [],
  activePlayerId: null,
  used: new Set(),
  current: null,
  selectedAnswer: null,
  timerId: null
};

const difficultyLabels = ['Treat', 'Trick', 'Terror', 'Nightmare', 'Final Girl'];
const answerLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
const $ = id => document.getElementById(id);

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

function switchView(view) {
  state.view = view;
  document.querySelectorAll('.screen').forEach(element => {
    element.classList.toggle('active', element.id === view);
  });
  document.querySelectorAll('.view-button').forEach(button => {
    button.classList.toggle('active', button.dataset.view === view);
  });
}

function renderSettings() {
  const addressVisible = state.eventOpen && state.showAddress && Boolean(state.address);

  $('statusBadge').innerHTML = `<span class="status-dot" aria-hidden="true"></span>${state.eventOpen ? 'The Dungeon Is Open' : 'The Dungeon Is Currently Closed'}`;
  $('statusBadge').classList.toggle('closed', !state.eventOpen);
  $('displayRoomCode').textContent = state.roomCode || '------';
  $('displayHours').textContent = state.eventOpen ? state.hours : 'The spirits have retired for the evening.';
  $('inviteHeadline').textContent = state.eventOpen ? 'Scan. Join. Answer if you dare.' : 'The haunting will resume during event hours.';

  if (addressVisible) {
    $('displayAddress').textContent = `Want to play? Join us at ${state.address}`;
  } else if (state.eventOpen) {
    $('displayAddress').textContent = 'Share the room code with nearby friends.';
  } else {
    $('displayAddress').textContent = 'The dungeon is closed. Please do not send new visitors.';
  }

  $('addressBanner').classList.toggle('address-visible', addressVisible);
  $('privacyStatus').classList.toggle('visible', addressVisible);

  if (addressVisible) {
    $('privacyStatus').innerHTML = '<span aria-hidden="true">●</span> Address is currently visible on the public display.';
  } else if (state.showAddress && !state.address) {
    $('privacyStatus').innerHTML = '<span aria-hidden="true">●</span> Address sharing is enabled, but no address has been entered.';
  } else {
    $('privacyStatus').innerHTML = '<span aria-hidden="true">●</span> Address hidden from public screens.';
  }
}

function renderBoard() {
  const board = $('board');
  board.innerHTML = '';

  categories.forEach((category, categoryIndex) => {
    const column = document.createElement('div');
    column.className = 'category-column';
    column.innerHTML = `<div class="category-title">${escapeHtml(category.name)}</div>`;

    category.questions.forEach((question, questionIndex) => {
      const key = `${categoryIndex}-${questionIndex}`;
      const used = state.used.has(key);
      const button = document.createElement('button');
      button.className = 'tile';
      button.dataset.level = String(questionIndex);
      button.disabled = used;
      button.setAttribute('aria-label', `${category.name}, ${difficultyLabels[questionIndex]}, ${(questionIndex + 1) * 100} points${used ? ', used' : ''}`);
      button.innerHTML = used
        ? '<span>Question</span><strong>Conquered</strong>'
        : `<span>${difficultyLabels[questionIndex]}</span><strong>${(questionIndex + 1) * 100}</strong>`;
      button.addEventListener('click', () => openQuestion({
        key,
        category: category.name,
        level: questionIndex,
        value: (questionIndex + 1) * 100,
        text: question[0],
        choices: question[1],
        answer: question[2],
        fact: question[3]
      }));
      column.appendChild(button);
    });

    board.appendChild(column);
  });
}

function renderPlayers() {
  const sorted = [...state.players].sort((a, b) => b.total - a.total || b.round - a.round);

  $('leaderboard').innerHTML = sorted.slice(0, 8).map(player => `
    <li>
      <span>
        <strong>${escapeHtml(player.name)}</strong>
        <span class="entry-meta">${player.type === 'team' ? `Adventuring party of ${player.size}` : 'Solo survivor'}</span>
      </span>
      <strong>${player.total}</strong>
    </li>
  `).join('');
  $('emptyLeaderboard').classList.toggle('hidden', sorted.length > 0);
  $('roundNumber').textContent = state.round;

  $('hostPlayers').innerHTML = state.players.map(player => `
    <button class="player-card ${player.id === state.activePlayerId ? 'active' : ''}" data-player-id="${player.id}">
      <strong>${escapeHtml(player.name)}</strong>
      <span class="entry-meta">${player.type === 'team' ? `Party of ${player.size}` : 'Solo'} · Round ${player.round} · Night ${player.total}</span>
    </button>
  `).join('');
  $('hostPlayersEmpty').classList.toggle('hidden', state.players.length > 0);

  document.querySelectorAll('[data-player-id]').forEach(button => {
    button.addEventListener('click', () => {
      state.activePlayerId = button.dataset.playerId;
      renderPlayers();
    });
  });

  const active = state.players.find(player => player.id === state.activePlayerId);
  if (active) {
    $('joinedName').textContent = active.name;
    $('joinedRound').textContent = active.round;
    $('joinedTotal').textContent = active.total;
  }
}

function updateTimerAppearance(seconds) {
  const wrap = $('timerWrap');
  wrap.classList.toggle('warning', seconds <= 10 && seconds > 5);
  wrap.classList.toggle('danger', seconds <= 5);
}

function openQuestion(question) {
  clearInterval(state.timerId);
  state.current = question;
  state.selectedAnswer = null;

  const isBonus = question.category === 'Dungeon Crawler Carl';
  $('questionDialog').classList.toggle('bonus-mode', isBonus);
  $('systemBanner').classList.toggle('hidden', !isBonus);
  $('questionCategory').textContent = question.category;
  $('questionValue').textContent = question.level === undefined
    ? `${question.value} point bonus`
    : `${difficultyLabels[question.level]} · ${question.value} points`;
  $('questionText').textContent = question.text;
  $('correctAnswer').textContent = question.answer;
  $('answerFact').textContent = question.fact;
  $('answerReveal').classList.add('hidden');
  $('awardPoints').classList.add('hidden');
  $('revealAnswer').classList.remove('hidden');
  $('awardPoints').disabled = false;
  $('questionFeedback').textContent = 'Choose carefully. The spirits are taking notes.';
  $('answers').innerHTML = '';

  question.choices.forEach((choice, index) => {
    const button = document.createElement('button');
    button.className = 'answer';
    button.dataset.letter = answerLetters[index] || String(index + 1);
    button.textContent = choice;
    button.addEventListener('click', () => {
      state.selectedAnswer = choice;
      document.querySelectorAll('.answer').forEach(answer => {
        answer.classList.toggle('selected', answer === button);
      });
      $('questionFeedback').textContent = `${choice} is locked in. The spirits have been notified.`;
    });
    $('answers').appendChild(button);
  });

  let seconds = 30;
  $('timer').textContent = seconds;
  updateTimerAppearance(seconds);
  state.timerId = setInterval(() => {
    seconds -= 1;
    $('timer').textContent = seconds;
    updateTimerAppearance(seconds);
    if (seconds <= 0) {
      clearInterval(state.timerId);
      $('questionFeedback').textContent = 'Time has vanished into the void. Reveal the truth when ready.';
    }
  }, 1000);

  $('questionDialog').showModal();
}

function revealAnswer() {
  clearInterval(state.timerId);
  $('answerReveal').classList.remove('hidden');
  $('revealAnswer').classList.add('hidden');
  $('awardPoints').classList.remove('hidden');

  document.querySelectorAll('.answer').forEach(button => {
    const choice = button.textContent;
    button.classList.toggle('correct', choice === state.current.answer);
    button.classList.toggle('incorrect', choice !== state.current.answer && choice === state.selectedAnswer);
    button.disabled = true;
  });

  const correct = state.selectedAnswer === state.current.answer;
  if (!state.selectedAnswer) {
    $('questionFeedback').textContent = 'No answer was summoned. The truth appears anyway.';
  } else if (correct) {
    $('questionFeedback').textContent = 'Correct! The spirits approve. Suspiciously enthusiastically.';
  } else {
    $('questionFeedback').textContent = 'Alas, the darkness claims that point. Dramatic music, please.';
  }
}

function awardPoints() {
  const active = state.players.find(player => player.id === state.activePlayerId);
  if (!active) {
    $('questionFeedback').textContent = 'Choose a contestant or team in Host Controls before awarding points.';
    return;
  }

  if (state.selectedAnswer === state.current.answer) {
    active.round += state.current.value;
    active.total += state.current.value;
    $('questionFeedback').textContent = `${active.name} survives with ${state.current.value} new points.`;
    $('awardPoints').disabled = true;
  } else {
    $('questionFeedback').textContent = `No points for ${active.name}. The scoreboard remains merciless.`;
  }

  if (state.current.key) state.used.add(state.current.key);
  renderPlayers();
  renderBoard();
}

function resetJoinedCard() {
  $('joinedName').textContent = 'Not summoned yet';
  $('joinedRound').textContent = '0';
  $('joinedTotal').textContent = '0';
}

document.querySelectorAll('.view-button').forEach(button => {
  button.addEventListener('click', () => switchView(button.dataset.view));
});

$('eventOpen').addEventListener('change', event => {
  state.eventOpen = event.target.checked;
  renderSettings();
});
$('showAddress').addEventListener('change', event => {
  state.showAddress = event.target.checked;
  renderSettings();
});
$('addressInput').addEventListener('input', event => {
  state.address = event.target.value.trim();
  renderSettings();
});
$('hoursInput').addEventListener('input', event => {
  state.hours = event.target.value;
  renderSettings();
});
$('roomCodeInput').addEventListener('input', event => {
  state.roomCode = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  event.target.value = state.roomCode;
  renderSettings();
});

document.querySelectorAll('input[name="entryType"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const team = document.querySelector('input[name="entryType"]:checked').value === 'team';
    $('nameLabel').textContent = team ? 'Team name' : 'Player name';
    $('teamSizeLabel').classList.toggle('hidden', !team);
  });
});

$('joinGame').addEventListener('click', () => {
  const name = $('entryName').value.trim();
  const type = document.querySelector('input[name="entryType"]:checked').value;
  const size = type === 'team' ? Number($('teamSize').value) : 1;

  if (!name) {
    $('joinFeedback').textContent = 'The spirits require a player or team name.';
    return;
  }
  if (state.players.some(player => player.name.toLowerCase() === name.toLowerCase())) {
    $('joinFeedback').textContent = 'That name is already roaming the haunted leaderboard.';
    return;
  }

  const player = {
    id: `p-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    type,
    size,
    round: 0,
    total: 0
  };
  state.players.push(player);
  state.activePlayerId = player.id;
  $('entryName').value = '';
  $('joinFeedback').textContent = `${name} has entered the spotlight.`;
  renderPlayers();
});

$('newRound').addEventListener('click', () => {
  state.round += 1;
  state.players.forEach(player => { player.round = 0; });
  state.used.clear();
  renderPlayers();
  renderBoard();
});
$('resetBoard').addEventListener('click', () => {
  state.used.clear();
  renderBoard();
});
$('clearPlayers').addEventListener('click', () => {
  state.players = [];
  state.activePlayerId = null;
  resetJoinedCard();
  renderPlayers();
});
$('displayBonus').addEventListener('click', () => openQuestion({ ...bonus, key: null }));
$('hostBonus').addEventListener('click', () => openQuestion({ ...bonus, key: null }));
$('revealAnswer').addEventListener('click', revealAnswer);
$('awardPoints').addEventListener('click', awardPoints);
$('returnBoard').addEventListener('click', () => {
  clearInterval(state.timerId);
  if (state.current?.key) state.used.add(state.current.key);
  renderBoard();
  $('questionDialog').close();
});

renderSettings();
renderBoard();
renderPlayers();
