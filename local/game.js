(() => {
  const root = document.getElementById("slap15");
  if (!root || root.dataset.init) return;
  root.dataset.init = "1";
  const AVATARS = ["🦊", "🐸", "🐱", "🤖", "👻", "🍌", "👽", "🐻"];
  let names = [];
  let avatars = [];
  let winTarget = 15;
  let questionPool = [];
  let activeLevel = null;
  let choices = [];
  let state = emptyState(0);
  let history = [];
  const savedIndexes = window.__slap15QuestionIndexes || {
    easy: 0,
    medium: 0,
    hard: 0,
    smart: 0,
    mix: 0,
  };
  window.__slap15QuestionIndexes = savedIndexes;
  let persistentQuestionIndex = 0;
  const S = () => window.Slap15Sounds || {};
  const playCorrectSound = () => S().playCorrectSound && S().playCorrectSound();
  const playWrongSound = () => S().playWrongSound && S().playWrongSound();
  const playNopeSound = () => S().playNopeSound && S().playNopeSound();
  const playMultipleChoiceSound = () => S().playMultipleChoiceSound && S().playMultipleChoiceSound();
  const ringAlarm = () => S().ringAlarm && S().ringAlarm();
  const playShowQuestionSound = () => S().playShowQuestionSound && S().playShowQuestionSound();
  const playShowAnswerSound = () => S().playShowAnswerSound && S().playShowAnswerSound();
  const playStartSound = () => S().playStartSound && S().playStartSound();
  const playWinSound = () => S().playWinSound && S().playWinSound();
  const playUndoSound = () => S().playUndoSound && S().playUndoSound();
  const playNextReaderSound = () => S().playNextReaderSound && S().playNextReaderSound();
  const playResetSound = () => S().playResetSound && S().playResetSound();
  const playRulesSound = () => S().playRulesSound && S().playRulesSound();
  const playErrorSound = () => S().playErrorSound && S().playErrorSound();
  const playConfirmSound = () => S().playConfirmSound && S().playConfirmSound();
  const playContinueSound = () => S().playContinueSound && S().playContinueSound();
  const playAvatarSound = () => S().playAvatarSound && S().playAvatarSound();
  const playUiTap = () => S().playUiTap && S().playUiTap();

  const players = root.querySelector("#players");
  const readerLabel = root.querySelector("#readerLabel");
  const status = root.querySelector("#status");
  const winnerBox = root.querySelector("#winner");
  const qmeta = root.querySelector("#qmeta");
  const qtext = root.querySelector("#qtext");
  const answer = root.querySelector("#answer");
  const choicesBox = root.querySelector("#choices");
  const showQuestion = root.querySelector("#showQuestion");
  const showAnswer = root.querySelector("#showAnswer");
  const nobodyKnows = root.querySelector("#nobodyKnows");
  const confirmOverlay = root.querySelector("#confirmOverlay");
  const rulesPanel = root.querySelector("#rulesPanel");
  const showRules = root.querySelector("#showRules");
  const setupPanel = root.querySelector("#setupPanel");
  const gamePanel = root.querySelector("#gamePanel");
  const levelSelect = root.querySelector("#levelSelect");
  const playerCount = root.querySelector("#playerCount");
  const winScore = root.querySelector("#winScore");
  const nameFields = root.querySelector("#nameFields");
  const startGame = root.querySelector("#startGame");
  const gameSubtitle = root.querySelector("#gameSubtitle");
  const roundResultBox = root.querySelector("#roundResult");
  const turnBanner = root.querySelector("#turnBanner");
  const turnKicker = root.querySelector("#turnKicker");
  const turnHint = root.querySelector("#turnHint");
  const turnAvatar = root.querySelector("#turnAvatar");
  const nextReaderBtn = root.querySelector("#nextReader");
  let roundResult = null;

  function emptyState(count) {
    return {
      scores: Array(count).fill(0),
      misses: Array(count).fill(0),
      reader: 0,
      winner: null,
      questionVisible: false,
      answerVisible: false,
      multipleChoice: false,
      missedThisQuestion: Array(count).fill(false),
      eliminatedChoices: [],
    };
  }

  function currentQuestion() {
    return questionPool[persistentQuestionIndex] || null;
  }

  function resetQuestionFlags() {
    state.questionVisible = false;
    state.answerVisible = false;
    state.multipleChoice = false;
    state.missedThisQuestion = Array(state.scores.length).fill(false);
    state.eliminatedChoices = [];
    choices = [];
    confirmOverlay.hidden = true;
  }

  function advanceQuestion() {
    if (activeLevel && persistentQuestionIndex < questionPool.length - 1) {
      persistentQuestionIndex += 1;
      savedIndexes[activeLevel] = persistentQuestionIndex;
    }
    resetQuestionFlags();
  }

  function snapshot() {
    history.push(JSON.stringify(state));
    if (history.length > 100) history.shift();
  }

  function hashSeed(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seededShuffle(items, seed) {
    const arr = items.slice();
    let s = seed >>> 0;
    const rnd = () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildChoices(question) {
    const correct = question.answer.trim();
    const seen = new Set([correct.toLowerCase()]);
    const distractors = [];
    const shuffled = seededShuffle(questionPool, hashSeed(question.question + question.order));
    for (const item of shuffled) {
      const text = (item.answer || "").trim();
      if (!text || seen.has(text.toLowerCase())) continue;
      seen.add(text.toLowerCase());
      distractors.push(text);
      if (distractors.length === 3) break;
    }
    while (distractors.length < 3) distractors.push("A wild guess");
    return seededShuffle(
      [{ text: correct, correct: true }].concat(distractors.map((text) => ({ text, correct: false }))),
      hashSeed(question.answer + "mc")
    );
  }

  function buildNameFields() {
    const count = Math.max(3, Math.min(8, Number(playerCount.value) || 3));
    nameFields.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const field = document.createElement("div");
      field.className = "setup-field setup-player";
      const pick = document.createElement("button");
      pick.type = "button";
      pick.className = "avatar-pick";
      pick.dataset.index = String(i);
      pick.innerHTML =
        '<span class="avatar-emoji">' +
        AVATARS[i % AVATARS.length] +
        "</span><span>Tap to change</span>";
      pick.addEventListener("click", () => {
        playAvatarSound();
        const current = AVATARS.indexOf(pick.querySelector(".avatar-emoji").textContent);
        const next = (current + 1) % AVATARS.length;
        pick.querySelector(".avatar-emoji").textContent = AVATARS[next];
      });
      const wrap = document.createElement("div");
      const label = document.createElement("label");
      label.htmlFor = "playerName" + i;
      label.textContent = "Player " + (i + 1) + " name";
      const input = document.createElement("input");
      input.id = "playerName" + i;
      input.type = "text";
      input.maxLength = 24;
      input.value = ["Bez", "Sean", "Marc"][i] || "";
      input.placeholder = "Player " + (i + 1);
      wrap.append(label, input);
      field.append(pick, wrap);
      nameFields.append(field);
    }
  }

  function renderChoices() {
    choicesBox.innerHTML = "";
    if (!state.multipleChoice || state.answerVisible || !currentQuestion()) {
      choicesBox.hidden = true;
      return;
    }
    choicesBox.hidden = false;
    choices.forEach((choice, index) => {
      const out = state.eliminatedChoices.includes(index);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice" + (out ? " out" : "");
      btn.disabled = out || !!state.winner;
      btn.innerHTML =
        '<span class="choice-letter">' +
        String.fromCharCode(65 + index) +
        "</span>" +
        choice.text;
      btn.addEventListener("click", () => pickChoice(index));
      choicesBox.append(btn);
    });
  }

  function renderQuestion() {
    qmeta.textContent =
      activeLevel && names.length
        ? names[state.reader] +
          " is reading • " +
          (activeLevel === "smart" ? "Smart AF" : activeLevel.charAt(0).toUpperCase() + activeLevel.slice(1))
        : "Ready";
    const q = currentQuestion();
    if (!activeLevel) {
      qtext.textContent = "Complete game setup to begin.";
      answer.hidden = true;
      showQuestion.disabled = true;
      showAnswer.disabled = true;
      nobodyKnows.disabled = true;
      renderChoices();
      return;
    }
    if (!q) {
      qtext.textContent = "Loading questions...";
      answer.hidden = true;
      showQuestion.disabled = true;
      showAnswer.disabled = true;
      nobodyKnows.disabled = true;
      renderChoices();
      return;
    }
    showQuestion.disabled = !!state.winner;
    showAnswer.disabled = !state.questionVisible || !!state.winner;
    nobodyKnows.disabled =
      !state.questionVisible || state.multipleChoice || state.answerVisible || !!state.winner;
    qtext.textContent = state.questionVisible
      ? q.question
      : "Press Show Question when the reader is ready.";
    answer.textContent = q.answer;
    answer.hidden = !state.answerVisible;
    renderChoices();
  }

  function hideRoundResult() {
    roundResult = null;
    if (roundResultBox) {
      roundResultBox.hidden = true;
      roundResultBox.innerHTML = "";
    }
  }

  function paintRoundResult() {
    if (!roundResultBox) return;
    if (!roundResult) {
      roundResultBox.hidden = true;
      roundResultBox.innerHTML = "";
      return;
    }
    const tone = roundResult.won
      ? "win"
      : roundResult.kind === "correct" || roundResult.kind === "mc-correct"
        ? "correct"
        : "wrong";
    const headline = roundResult.won
      ? "WINS!"
      : roundResult.kind === "correct" || roundResult.kind === "mc-correct"
        ? "CORRECT"
        : "WRONG";
    const delta =
      roundResult.delta > 0
        ? "+" + roundResult.delta
        : roundResult.delta < 0
          ? String(roundResult.delta)
          : "";
    roundResultBox.hidden = false;
    roundResultBox.className =
      "round-result " + tone + (roundResult.kind === "mc-correct" ? " picking" : "");
    let html =
      '<div class="result-header"><div><div class="brand">SLAP 15</div><div class="result-reader">' +
      (roundResult.kind === "mc-correct"
        ? "Tap who scored"
        : roundResult.won
          ? "First to the winning score"
          : roundResult.kind === "correct" && names.length
            ? names[(state.reader + 1) % names.length] + " reads next"
            : names[state.reader]
              ? names[state.reader] + " is still reading"
              : "Trivia showdown") +
      '</div></div><span class="result-tap">' +
      (roundResult.kind === "mc-correct" ? "Reader sits out" : "Tap to continue") +
      "</span></div>";
    if (roundResult.playerIndex !== null) {
      html += '<span class="avatar-emoji">' + (roundResult.avatar || "🦊") + "</span>";
    }
    html += '<div class="round-name">' + roundResult.name + "</div>";
    html += '<div class="round-verdict">' + headline + "</div>";
    if (delta) html += '<div class="round-delta">' + delta + "</div>";
    if (roundResult.playerIndex !== null) {
      html += '<div class="round-score">Score ' + roundResult.score + "</div>";
    }
    if (roundResult.answer) {
      html += '<div class="round-answer"><span>Answer</span>' + roundResult.answer + "</div>";
    } else if (roundResult.kind === "wrong") {
      html += '<div class="round-hint">Answer stays hidden. Someone else can steal.</div>';
    } else if (roundResult.kind === "mc-wrong") {
      html += '<div class="round-hint">That choice is out. Pick another.</div>';
    }
    if (roundResult.won) {
      html += '<div class="round-hint">First to the winning score. New night?</div>';
    }
    if (roundResult.kind === "mc-correct") {
      html += '<div class="who-got-it"><div class="who-got-it-label">Who got it?</div><div class="who-got-it-list">';
      names.forEach((name, i) => {
        if (i === state.reader) return;
        html +=
          '<button type="button" class="who-got-it-player" data-award="' +
          i +
          '"><span class="avatar-emoji">' +
          (avatars[i] || "🦊") +
          '</span><span class="who-got-it-name">' +
          name +
          '</span><span class="who-got-it-score">' +
          state.scores[i] +
          "</span></button>";
      });
      html += "</div></div>";
    } else {
      html += '<span class="round-continue">' + roundResult.continueLabel;
      if (roundResult.kind === "correct" && !roundResult.won && names.length) {
        html +=
          '<span class="btn-sub">' +
          names[(state.reader + 1) % names.length] +
          "'s turn</span>";
      }
      html += "</span>";
    }
    roundResultBox.innerHTML = html;
  }

  function dismissRoundResult(event) {
    if (!roundResult) return;
    if (roundResult.kind === "mc-correct") {
      const btn = event && event.target && event.target.closest("[data-award]");
      if (btn) correct(Number(btn.getAttribute("data-award")));
      return;
    }
    if (roundResult.won) {
      root.querySelector("#reset").click();
      return;
    }
    const result = roundResult;
    hideRoundResult();
    if (result.kind === "correct") {
      playNextReaderSound();
      advanceQuestion();
      state.reader = (state.reader + 1) % names.length;
      status.textContent = names[state.reader] + " reads. Press Show Question.";
      render();
      return;
    }
    if (!(result.kind === "wrong" && result.allStumped)) playContinueSound();
    if (result.kind === "wrong" && result.allStumped) {
      state.multipleChoice = true;
      choices = buildChoices(currentQuestion());
      playMultipleChoiceSound();
      status.textContent = "Table's stumped — four choices. Slap in, then pick one.";
    }
    render();
  }

  function render() {
    paintRoundResult();
    if (turnBanner) turnBanner.hidden = !names.length;
    if (names.length) {
      readerLabel.textContent = names[state.reader];
      if (turnAvatar) turnAvatar.textContent = avatars[state.reader] || AVATARS[state.reader % AVATARS.length];
      if (turnKicker) turnKicker.textContent = state.winner ? "Winner" : "Now reading";
      if (turnHint) {
        turnHint.textContent = state.winner
          ? names[state.winner.index] + " just took the game."
          : !state.questionVisible
            ? "Tap Show Question when you're ready."
            : state.multipleChoice && !state.answerVisible
              ? "Table's stumped. Pick a letter."
              : state.answerVisible
                ? "Mark who scored, then keep going."
                : "Everyone else slaps in after the question is read.";
      }
    } else {
      readerLabel.textContent = "Set up the game";
    }
    if (nextReaderBtn && names.length) {
      const nxt = names[(state.reader + 1) % names.length];
      nextReaderBtn.innerHTML = 'Next reader<span class="btn-sub">' + nxt + "'s turn</span>";
    }
    showQuestion.classList.toggle("primary", !state.questionVisible);
    showAnswer.classList.toggle("primary", !!(state.questionVisible && !state.answerVisible));
    renderQuestion();
    players.innerHTML = "";
    names.forEach((name, i) => {
      const isReader = i === state.reader;
      const eligible = !isReader && !state.winner;
      const nextPenalty = state.misses[i] + 1;
      const card = document.createElement("section");
      card.className = "card" + (isReader ? " reading" : "");
      if (isReader) {
        const pill = document.createElement("div");
        pill.className = "reading-pill";
        pill.textContent = "Reading";
        card.append(pill);
      }
      const avatarBtn = document.createElement("button");
      avatarBtn.type = "button";
      avatarBtn.className = "avatar-btn";
      avatarBtn.innerHTML = '<span class="avatar-emoji">' + (avatars[i] || AVATARS[i % AVATARS.length]) + "</span>";
      avatarBtn.addEventListener("click", () => {
        playAvatarSound();
        const current = AVATARS.indexOf(avatars[i]);
        avatars[i] = AVATARS[(current + 1) % AVATARS.length];
        render();
      });
      const nm = document.createElement("div");
      nm.className = "name";
      nm.textContent = name;
      const sc = document.createElement("div");
      sc.className = "score";
      sc.textContent = state.scores[i];
      const mi = document.createElement("div");
      mi.className = "miss";
      mi.textContent = state.misses[i] + " wrong" + (isReader ? "" : " · next miss −" + nextPenalty);
      card.append(avatarBtn, nm, sc, mi);
      if (isReader) {
        const note = document.createElement("div");
        note.className = "seat-note";
        note.textContent = "Sit this one out. You're reading.";
        card.append(note);
      } else {
        const buttons = document.createElement("div");
        buttons.className = "buttons";
        const good = document.createElement("button");
        good.type = "button";
        good.className = "correct" + (eligible ? "" : " disabled");
        good.innerHTML = 'Correct<span class="btn-sub">+1 point</span>';
        good.disabled = !eligible;
        good.addEventListener("click", () => correct(i));
        const bad = document.createElement("button");
        bad.type = "button";
        bad.className = "wrong" + (eligible ? "" : " disabled");
        bad.innerHTML = 'Wrong<span class="btn-sub">−' + nextPenalty + " this miss</span>";
        bad.disabled = !eligible;
        bad.addEventListener("click", () => wrong(i));
        buttons.append(good, bad);
        card.append(buttons);
      }
      players.append(card);
    });
    if (state.winner) {
      winnerBox.innerHTML =
        '<div class="winner">' +
        names[state.winner.index] +
        " wins with " +
        state.scores[state.winner.index] +
        " points!</div>";
    } else winnerBox.innerHTML = "";
    root.querySelector("#undo").disabled = history.length === 0;
  }

  function correct(i) {
    if (i === state.reader || state.winner) return;
    if (roundResult && roundResult.kind !== "mc-correct") return;
    snapshot();
    state.scores[i] += 1;
    state.answerVisible = true;
    const won = state.scores[i] >= winTarget;
    if (won) {
      state.winner = { index: i };
      playWinSound();
    } else playCorrectSound();
    status.textContent = names[i] + " answered correctly: +1 point.";
    const q = currentQuestion();
    roundResult = {
      kind: "correct",
      playerIndex: i,
      name: names[i],
      avatar: avatars[i] || AVATARS[i % AVATARS.length],
      delta: 1,
      score: state.scores[i],
      answer: q ? q.answer : null,
      won: won,
      allStumped: false,
      continueLabel: won ? "New game" : "Next reader",
    };
    render();
  }

  function wrong(i) {
    if (i === state.reader || state.winner || roundResult) return;
    snapshot();
    playWrongSound();
    state.misses[i] += 1;
    state.missedThisQuestion[i] = true;
    const penalty = state.misses[i];
    state.scores[i] -= penalty;
    const competitors = names.map((_, idx) => idx).filter((idx) => idx !== state.reader);
    const allStumped =
      competitors.length > 0 &&
      competitors.every((idx) => state.missedThisQuestion[idx]) &&
      !state.multipleChoice;
    status.textContent = allStumped
      ? names[i] + " was wrong: -" + penalty + ". Table's stumped."
      : names[i] + " was wrong: -" + penalty + ". Any other non-reader may answer next.";
    roundResult = {
      kind: "wrong",
      playerIndex: i,
      name: names[i],
      avatar: avatars[i] || AVATARS[i % AVATARS.length],
      delta: -penalty,
      score: state.scores[i],
      answer: null,
      won: false,
      allStumped: allStumped,
      continueLabel: allStumped ? "Multiple choice" : "Next slap",
    };
    render();
  }

  function pickChoice(index) {
    if (!state.multipleChoice || state.winner || state.answerVisible || roundResult) return;
    const choice = choices[index];
    if (!choice || state.eliminatedChoices.includes(index)) return;
    if (choice.correct) {
      playCorrectSound();
      state.answerVisible = true;
      status.textContent = "That's the one. Tap who got it.";
      const q = currentQuestion();
      roundResult = {
        kind: "mc-correct",
        playerIndex: null,
        name: "Somebody knew it",
        avatar: null,
        delta: 0,
        score: 0,
        answer: q ? q.answer : choice.text,
        won: false,
        allStumped: false,
        continueLabel: "Who got it?",
      };
      render();
      return;
    }
    playNopeSound();
    state.eliminatedChoices.push(index);
    status.textContent = "Nope. Cross that one out and try another.";
    roundResult = {
      kind: "mc-wrong",
      playerIndex: null,
      name: choice.text,
      avatar: null,
      delta: 0,
      score: 0,
      answer: null,
      won: false,
      allStumped: false,
      continueLabel: "Try another",
    };
    render();
  }

  function enableMultipleChoice() {
    if (!currentQuestion() || !state.questionVisible || state.winner || state.multipleChoice || roundResult) return;
    playMultipleChoiceSound();
    state.multipleChoice = true;
    choices = buildChoices(currentQuestion());
    status.textContent = "Nobody knows? Four choices. Slap in, then pick one.";
    render();
  }

  showQuestion.addEventListener("click", () => {
    if (!currentQuestion() || roundResult) return;
    if (state.answerVisible) {
      ringAlarm();
      confirmOverlay.hidden = false;
      return;
    }
    playShowQuestionSound();
    state.questionVisible = true;
    state.answerVisible = false;
    state.multipleChoice = false;
    state.eliminatedChoices = [];
    choices = [];
    renderQuestion();
  });
  showAnswer.addEventListener("click", () => {
    if (!currentQuestion() || !state.questionVisible || roundResult) return;
    playShowAnswerSound();
    state.answerVisible = true;
    renderQuestion();
  });
  nobodyKnows.addEventListener("click", enableMultipleChoice);
  root.querySelector("#confirmYes").addEventListener("click", () => {
    playConfirmSound();
    confirmOverlay.hidden = true;
    state.questionVisible = true;
    state.answerVisible = false;
    state.multipleChoice = false;
    state.eliminatedChoices = [];
    choices = [];
    renderQuestion();
  });
  root.querySelector("#confirmNo").addEventListener("click", () => {
    playUiTap();
    confirmOverlay.hidden = true;
  });
  showRules.addEventListener("click", () => {
    playRulesSound();
    rulesPanel.hidden = false;
    showRules.textContent = "Rules Open";
  });
  root.querySelector("#closeRules").addEventListener("click", () => {
    playRulesSound();
    rulesPanel.hidden = true;
    showRules.textContent = "Show Rules";
  });
  levelSelect.addEventListener("change", playUiTap);
  playerCount.addEventListener("change", () => {
    playUiTap();
    buildNameFields();
  });
  startGame.addEventListener("click", async () => {
    const level = levelSelect.value;
    if (!level) {
      playErrorSound();
      status.textContent = "Choose a question level first.";
      levelSelect.focus();
      return;
    }
    const count = Math.max(3, Math.min(8, Number(playerCount.value) || 3));
    const inputs = [...nameFields.querySelectorAll("input")].slice(0, count);
    names = inputs.map((input, i) => input.value.trim() || "Player " + (i + 1));
    avatars = [...nameFields.querySelectorAll(".avatar-emoji")].slice(0, count).map((el, i) => el.textContent || AVATARS[i]);
    winTarget = Math.max(1, Math.min(99, Number(winScore.value) || 15));
    startGame.disabled = true;
    status.textContent =
      "Loading " + (level === "smart" ? "Smart AF" : level.charAt(0).toUpperCase() + level.slice(1)) + " questions...";
    try {
      const banks = root.__loadQuestionBanks
        ? await root.__loadQuestionBanks(level)
        : root.__questionBanks;
      if (!banks) throw new Error("Question bank is not ready.");
      root.__questionBanks = banks;
      activeLevel = level;
      questionPool = banks[activeLevel] || [];
      persistentQuestionIndex = Math.min(
        savedIndexes[activeLevel] || 0,
        Math.max(questionPool.length - 1, 0)
      );
      state = emptyState(count);
      history = [];
      setupPanel.hidden = true;
      gamePanel.hidden = false;
      gameSubtitle.textContent = "First to " + winTarget + " net points wins";
      playStartSound();
      status.textContent = names[0] + " reads first.";
      render();
    } catch (err) {
      playErrorSound();
      status.textContent = err.message || "Could not load questions.";
    } finally {
      startGame.disabled = false;
    }
  });
  if (roundResultBox) {
    roundResultBox.addEventListener("click", dismissRoundResult);
  }
  root.querySelector("#nextReader").addEventListener("click", () => {
    if (state.winner || !activeLevel || !names.length || roundResult) return;
    playNextReaderSound();
    snapshot();
    advanceQuestion();
    state.reader = (state.reader + 1) % names.length;
    status.textContent = names[state.reader] + " reads. Everyone else may compete.";
    render();
  });
  root.querySelector("#undo").addEventListener("click", () => {
    if (!history.length) return;
    playUndoSound();
    state = Object.assign(emptyState(names.length), JSON.parse(history.pop()));
    confirmOverlay.hidden = true;
    hideRoundResult();
    if (state.multipleChoice && currentQuestion()) choices = buildChoices(currentQuestion());
    status.textContent = "Last scoring action undone. Question position is unchanged.";
    render();
  });
  root.querySelector("#reset").addEventListener("click", () => {
    playResetSound();
    history = [];
    state = emptyState(0);
    confirmOverlay.hidden = true;
    hideRoundResult();
    activeLevel = null;
    questionPool = [];
    names = [];
    avatars = [];
    setupPanel.hidden = false;
    gamePanel.hidden = true;
    gameSubtitle.textContent = "Trivia showdown";
    status.textContent = "New game. Question progress is preserved by level.";
    buildNameFields();
    render();
  });
  root.__setQuestionBanks = (banks) => {
    root.__questionBanks = banks;
    render();
  };
  buildNameFields();
  render();
})();
