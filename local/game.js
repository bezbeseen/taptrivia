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
  let audioCtx = null;
  let wrongN = 0;
  let correctN = 0;

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

  function audio() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function envGain(ctx, start, peak, dur) {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    return gain;
  }

  function tone(ctx, opts) {
    const now = ctx.currentTime + (opts.at || 0);
    const osc = ctx.createOscillator();
    const amp = envGain(ctx, now, opts.gain || 0.12, opts.dur || 0.18);
    osc.type = opts.type || "square";
    osc.frequency.setValueAtTime(opts.freq, now);
    if (opts.endFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(opts.endFreq, 20), now + (opts.dur || 0.18));
    }
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (opts.dur || 0.18) + 0.02);
  }

  function noiseBurst(ctx, at, dur, gain, lpf) {
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = lpf || 1200;
    const amp = envGain(ctx, ctx.currentTime + at, gain, dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(ctx.destination);
    src.start(ctx.currentTime + at);
  }

  function honk(ctx) {
    tone(ctx, { type: "sawtooth", freq: 180, endFreq: 140, dur: 0.22, gain: 0.16 });
    noiseBurst(ctx, 0, 0.12, 0.08, 700);
  }
  function duck(ctx) {
    tone(ctx, { type: "square", freq: 420, endFreq: 180, dur: 0.14, gain: 0.14 });
    tone(ctx, { type: "square", freq: 380, endFreq: 140, at: 0.12, dur: 0.16, gain: 0.12 });
  }
  function sadTrombone(ctx) {
    [349, 330, 294, 220].forEach((freq, i) => {
      tone(ctx, { type: "sawtooth", freq, endFreq: freq - 30, at: i * 0.22, dur: 0.28, gain: 0.12 });
    });
  }
  function kazooFanfare(ctx) {
    [523, 659, 784, 1046].forEach((freq, i) => {
      tone(ctx, { type: "square", freq, at: i * 0.09, dur: 0.16, gain: 0.11 });
    });
  }
  function springBoing(ctx) {
    tone(ctx, { type: "sine", freq: 140, endFreq: 720, dur: 0.22, gain: 0.16 });
    tone(ctx, { type: "triangle", freq: 720, endFreq: 420, at: 0.18, dur: 0.22, gain: 0.1 });
  }
  function clownHorn(ctx) {
    honk(ctx);
    tone(ctx, { type: "square", freq: 240, at: 0.12, dur: 0.18, gain: 0.12 });
  }
  function wahWah(ctx) {
    tone(ctx, { type: "sawtooth", freq: 400, endFreq: 180, dur: 0.35, gain: 0.13 });
    tone(ctx, { type: "sawtooth", freq: 300, endFreq: 140, at: 0.28, dur: 0.4, gain: 0.11 });
  }

  function playCorrectSound() {
    try {
      const ctx = audio();
      if (!ctx) return;
      [kazooFanfare, springBoing][correctN++ % 2](ctx);
    } catch {
      /* optional */
    }
  }
  function playWrongSound() {
    try {
      const ctx = audio();
      if (!ctx) return;
      [honk, duck, sadTrombone][wrongN++ % 3](ctx);
    } catch {
      /* optional */
    }
  }
  function ringAlarm() {
    try {
      const ctx = audio();
      if (ctx) clownHorn(ctx);
    } catch {
      /* optional */
    }
  }
  function playMultipleChoiceSound() {
    try {
      const ctx = audio();
      if (ctx) wahWah(ctx);
    } catch {
      /* optional */
    }
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
    roundResultBox.className = "round-result " + tone;
    let html = "";
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
    html += '<span class="round-continue">' + roundResult.continueLabel + "</span>";
    roundResultBox.innerHTML = html;
  }

  function dismissRoundResult() {
    if (!roundResult) return;
    if (roundResult.won) {
      root.querySelector("#reset").click();
      return;
    }
    const result = roundResult;
    hideRoundResult();
    if (result.kind === "correct") {
      advanceQuestion();
      status.textContent = names[state.reader] + " reads. Press Show Question.";
      render();
      return;
    }
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
    readerLabel.textContent = names.length ? names[state.reader] + " is reading" : "Set up the game";
    renderQuestion();
    players.innerHTML = "";
    names.forEach((name, i) => {
      const eligible = i !== state.reader && !state.winner;
      const nextPenalty = state.misses[i] + 1;
      const card = document.createElement("section");
      card.className = "card" + (i === state.reader ? " reading" : "");
      const avatarBtn = document.createElement("button");
      avatarBtn.type = "button";
      avatarBtn.className = "avatar-btn";
      avatarBtn.innerHTML = '<span class="avatar-emoji">' + (avatars[i] || AVATARS[i % AVATARS.length]) + "</span>";
      avatarBtn.addEventListener("click", () => {
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
      mi.textContent = state.misses[i] + " wrong • next miss -" + nextPenalty;
      const buttons = document.createElement("div");
      buttons.className = "buttons";
      const good = document.createElement("button");
      good.type = "button";
      good.className = "correct" + (eligible ? "" : " disabled");
      good.textContent = "+1 Correct";
      good.disabled = !eligible;
      good.addEventListener("click", () => correct(i));
      const bad = document.createElement("button");
      bad.type = "button";
      bad.className = "wrong" + (eligible ? "" : " disabled");
      bad.textContent = "Wrong  -" + nextPenalty;
      bad.disabled = !eligible;
      bad.addEventListener("click", () => wrong(i));
      buttons.append(good, bad);
      card.append(avatarBtn, nm, sc, mi, buttons);
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
    if (i === state.reader || state.winner || roundResult) return;
    snapshot();
    playCorrectSound();
    state.scores[i] += 1;
    state.answerVisible = true;
    const won = state.scores[i] >= winTarget;
    if (won) state.winner = { index: i };
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
      continueLabel: won ? "New game" : "Next question",
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
      status.textContent = "That's the one. Mark who got it.";
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
    playWrongSound();
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
    state.questionVisible = true;
    state.answerVisible = false;
    state.multipleChoice = false;
    state.eliminatedChoices = [];
    choices = [];
    renderQuestion();
  });
  showAnswer.addEventListener("click", () => {
    if (!currentQuestion() || !state.questionVisible) return;
    state.answerVisible = true;
    renderQuestion();
  });
  nobodyKnows.addEventListener("click", enableMultipleChoice);
  root.querySelector("#confirmYes").addEventListener("click", () => {
    confirmOverlay.hidden = true;
    state.questionVisible = true;
    state.answerVisible = false;
    state.multipleChoice = false;
    state.eliminatedChoices = [];
    choices = [];
    renderQuestion();
  });
  root.querySelector("#confirmNo").addEventListener("click", () => {
    confirmOverlay.hidden = true;
  });
  showRules.addEventListener("click", () => {
    rulesPanel.hidden = false;
    showRules.textContent = "Rules Open";
  });
  root.querySelector("#closeRules").addEventListener("click", () => {
    rulesPanel.hidden = true;
    showRules.textContent = "Show Rules";
  });
  playerCount.addEventListener("change", buildNameFields);
  startGame.addEventListener("click", async () => {
    const level = levelSelect.value;
    if (!level) {
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
      status.textContent = names[0] + " reads first.";
      render();
    } catch (err) {
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
    snapshot();
    advanceQuestion();
    state.reader = (state.reader + 1) % names.length;
    status.textContent = names[state.reader] + " reads. Everyone else may compete.";
    render();
  });
  root.querySelector("#undo").addEventListener("click", () => {
    if (!history.length) return;
    state = Object.assign(emptyState(names.length), JSON.parse(history.pop()));
    confirmOverlay.hidden = true;
    hideRoundResult();
    if (state.multipleChoice && currentQuestion()) choices = buildChoices(currentQuestion());
    status.textContent = "Last scoring action undone. Question position is unchanged.";
    render();
  });
  root.querySelector("#reset").addEventListener("click", () => {
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
