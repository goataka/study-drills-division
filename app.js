(() => {
  "use strict";

  const QUESTION_COUNT = 10;
  const STORAGE_KEY = "division-quest-stats-v1";
  const LEVELS = [
    {
      title: "レベル 1 · はじめの3問",
      encouragement: "ゆっくり かんがえよう！",
      divisor: [2, 5],
      quotient: [2, 6],
    },
    {
      title: "レベル 2 · ぐんぐん",
      encouragement: "だんだんレベルアップ！",
      divisor: [3, 7],
      quotient: [4, 12],
    },
    {
      title: "レベル 3 · チャレンジ",
      encouragement: "あと少し、いけるよ！",
      divisor: [6, 9],
      quotient: [9, 15],
    },
    {
      title: "レベル 4 · ボス問題",
      encouragement: "さいごの力を見せよう！",
      divisor: [7, 9],
      quotient: [12, 20],
    },
  ];

  const elements = {
    gameScreen: document.querySelector("#game-screen"),
    resultScreen: document.querySelector("#result-screen"),
    questionNumber: document.querySelector("#question-number"),
    score: document.querySelector("#score"),
    bestScore: document.querySelector("#best-score"),
    progressTrack: document.querySelector(".progress-track"),
    progressFill: document.querySelector("#progress-fill"),
    levelLabel: document.querySelector("#level-label"),
    encouragement: document.querySelector("#encouragement"),
    formula: document.querySelector("#formula"),
    answerForm: document.querySelector("#answer-form"),
    answer: document.querySelector("#answer"),
    checkButton: document.querySelector("#check-button"),
    feedback: document.querySelector("#feedback"),
    finalScore: document.querySelector("#final-score"),
    resultMessage: document.querySelector("#result-message"),
    resultBest: document.querySelector("#result-best"),
    playAgainButton: document.querySelector("#play-again-button"),
  };

  let state;
  let advanceTimer;

  function randomInteger(minimum, maximum) {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
  }

  function levelFor(questionIndex) {
    if (questionIndex < 3) {
      return LEVELS[0];
    }
    if (questionIndex < 6) {
      return LEVELS[1];
    }
    if (questionIndex < 8) {
      return LEVELS[2];
    }
    return LEVELS[3];
  }

  function createQuestions() {
    const questions = [];
    const usedQuestions = new Set();

    for (let index = 0; index < QUESTION_COUNT; index += 1) {
      const level = levelFor(index);
      let divisor;
      let quotient;
      let identifier;

      do {
        divisor = randomInteger(level.divisor[0], level.divisor[1]);
        quotient = randomInteger(level.quotient[0], level.quotient[1]);
        identifier = `${divisor}-${quotient}`;
      } while (usedQuestions.has(identifier));

      usedQuestions.add(identifier);
      questions.push({
        dividend: divisor * quotient,
        divisor,
        quotient,
        level,
      });
    }

    return questions;
  }

  function defaultStats() {
    return { bestScore: 0, completedSessions: 0 };
  }

  function readStats() {
    try {
      const savedStats = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (
        savedStats &&
        Number.isFinite(savedStats.bestScore) &&
        Number.isFinite(savedStats.completedSessions)
      ) {
        return savedStats;
      }
    } catch {
    }

    return defaultStats();
  }

  function writeStats(stats) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
    }
  }

  function displayBestScore(score) {
    elements.bestScore.textContent = String(score);
  }

  function normalizeDigits(value) {
    return value.replace(/[０-９]/g, (character) =>
      String.fromCharCode(character.charCodeAt(0) - 0xfee0),
    );
  }

  function setFeedback(message, type = "") {
    elements.feedback.textContent = message;
    elements.feedback.className = `feedback${type ? ` ${type}` : ""}`;
  }

  function currentQuestion() {
    return state.questions[state.currentIndex];
  }

  function renderQuestion() {
    const question = currentQuestion();
    const completedCount = state.currentIndex;

    elements.questionNumber.textContent = String(state.currentIndex + 1);
    elements.score.textContent = String(state.score);
    elements.levelLabel.textContent = question.level.title;
    elements.encouragement.textContent = question.level.encouragement;
    elements.formula.textContent = `${question.dividend} ÷ ${question.divisor} = ?`;
    elements.progressFill.style.width = `${(completedCount / QUESTION_COUNT) * 100}%`;
    elements.progressTrack.setAttribute("aria-valuenow", String(completedCount));
    elements.answer.value = "";
    elements.answer.disabled = false;
    elements.checkButton.disabled = false;
    setFeedback("");
    elements.answer.focus();
  }

  function resultText(score) {
    if (score >= 180) {
      return "すごい！ パーフェクトに近い大ぼうけんだったね！";
    }
    if (score >= 140) {
      return "ばっちり！ むずかしい問題までクリアできたね。";
    }
    return "10問クリア！ 何度でも遊んで、もっと強くなろう。";
  }

  function finishGame() {
    if (state.finished) {
      return;
    }

    state.finished = true;
    const previousStats = readStats();
    const isNewBest = state.score > previousStats.bestScore;
    const stats = {
      bestScore: Math.max(previousStats.bestScore, state.score),
      completedSessions: previousStats.completedSessions + 1,
    };

    writeStats(stats);
    displayBestScore(stats.bestScore);
    elements.progressFill.style.width = "100%";
    elements.progressTrack.setAttribute("aria-valuenow", String(QUESTION_COUNT));
    elements.finalScore.textContent = String(state.score);
    elements.resultMessage.textContent = resultText(state.score);
    elements.resultBest.textContent = isNewBest
      ? "新記録！ ほしをたくさん集めたね！"
      : `これまでのベストは ${stats.bestScore} 点だよ。`;
    elements.gameScreen.hidden = true;
    elements.resultScreen.hidden = false;
    elements.playAgainButton.focus();
  }

  function moveToNextQuestion() {
    state.currentIndex += 1;
    if (state.currentIndex === QUESTION_COUNT) {
      finishGame();
      return;
    }
    renderQuestion();
  }

  function handleCorrectAnswer() {
    const points = 10 + state.streak * 2;
    state.score += points;
    state.streak += 1;
    elements.score.textContent = String(state.score);
    elements.answer.disabled = true;
    elements.checkButton.disabled = true;
    setFeedback(`せいかい！ +${points}点！`, "success");
    advanceTimer = window.setTimeout(moveToNextQuestion, 850);
  }

  function handleAnswer(event) {
    event.preventDefault();

    if (state.finished || elements.checkButton.disabled) {
      return;
    }

    const input = normalizeDigits(elements.answer.value.trim());
    if (!/^\d+$/.test(input)) {
      setFeedback("数字を入れてからチェックしよう。", "error");
      elements.answer.focus();
      return;
    }

    if (Number(input) === currentQuestion().quotient) {
      handleCorrectAnswer();
      return;
    }

    state.streak = 0;
    setFeedback("おしい！ もう一度、式をよく見て考えよう。", "error");
    elements.answer.focus();
    elements.answer.select();
  }

  function startNewGame() {
    window.clearTimeout(advanceTimer);
    state = {
      currentIndex: 0,
      questions: createQuestions(),
      score: 0,
      streak: 0,
      finished: false,
    };
    elements.resultScreen.hidden = true;
    elements.gameScreen.hidden = false;
    renderQuestion();
  }

  elements.answerForm.addEventListener("submit", handleAnswer);
  elements.playAgainButton.addEventListener("click", startNewGame);
  displayBestScore(readStats().bestScore);
  startNewGame();
})();
