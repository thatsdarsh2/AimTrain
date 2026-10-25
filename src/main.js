import { createSession } from "./game.js";

const playArea = document.querySelector("#play-area");
let target = document.querySelector("#target");
const startPanel = document.querySelector("#start-panel");
const startButton = document.querySelector("#start-button");

const timeValue = document.querySelector("#time-value");
const scoreValue = document.querySelector("#score-value");
const missesValue = document.querySelector("#misses-value");
const accuracyValue = document.querySelector("#accuracy-value");
const hitRateValue = document.querySelector("#hit-rate-value");
const bestScoreValue = document.querySelector("#best-score-value");

const startKicker = startPanel?.querySelector(".start-kicker");
const startHeading = startPanel?.querySelector("h2");
const startCopy = startPanel?.querySelector(".start-copy");

const difficultySelect = document.querySelector("#difficulty-select");
const restartButton = document.querySelector("#restart-button");
const restartOverlay = document.querySelector("#restart-overlay");
const restartCountdownNumber = document.querySelector(
  "#restart-countdown-number",
);
const cancelRestartButton = document.querySelector("#cancel-restart-button");

if (
  !playArea ||
  !target ||
  !startPanel ||
  !startButton ||
  !timeValue ||
  !scoreValue ||
  !missesValue ||
  !accuracyValue ||
  !hitRateValue ||
  !bestScoreValue ||
  !startKicker ||
  !startHeading ||
  !startCopy ||
  !difficultySelect ||
  !restartButton ||
  !restartOverlay ||
  !restartCountdownNumber ||
  !cancelRestartButton
) {
  throw new Error("AimTrain could not find one or more game elements.");
}

const DIFFICULTIES = {
  easy: { targetSize: 60, respawnDelay: 850 },
  medium: { targetSize: 46, respawnDelay: 400 },
  hard: { targetSize: 32, respawnDelay: 150 },
};

const session = createSession({ durationSeconds: 60 });

let bestScore = 0;
let respawnTimeoutID = null;
let restartCountdownIntervalID = null;
let restartCountdownActive = false;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function moveTarget() {
  const sizeScale = 0.75 + Math.random() * 25;
  target.style.width = `${DIFFICULTIES[difficultySelect.value].targetSize * sizeScale}px`;
  target.style.height = `${DIFFICULTIES[difficultySelect.value].targetSize * sizeScale}px`;
  const radius = target.offsetWidth / 2;
  const availableX = Math.max(0, playArea.clientWidth - radius * 2);
  const availableY = Math.max(0, playArea.clientHeight - radius * 2);

  const x = radius + Math.random() * availableX;
  const y = radius + Math.random() * availableY;

  target.style.left = `${x}px`;
  target.style.top = `${y}px`;
}

function applyDifficulty() {
  const settings = DIFFICULTIES[difficultySelect.value];

  target.style.width = `${settings.targetSize}px`;
  target.style.height = `${settings.targetSize}px`;
}

function clearRespawnTimer() {
  if (respawnTimeoutID !== null) {
    window.clearTimeout(respawnTimeoutID);
    respawnTimeoutID = null;
  }
}

function clearRestartCountdown() {
  if (restartCountdownIntervalID !== null) {
    window.clearInterval(restartCountdownIntervalID);
    restartCountdownIntervalID = null;
  }

  restartCountdownActive = false;
  restartOverlay.hidden = true;
}

function handleTargetHit(event) {
  event.stopPropagation();

  if (session.getState().phase !== "running") {
    return;
  }

  session.recordHit();

  const nextTarget = target.cloneNode(true);
  target.replaceWith(nextTarget);
  target = nextTarget;
  target.hidden = true;

  applyDifficulty();
  clearRespawnTimer();

  const delay = DIFFICULTIES[difficultySelect.value].respawnDelay;

  respawnTimeoutID = window.setTimeout(() => {
    respawnTimeoutID = null;

    if (session.getState().phase !== "running") {
      return;
    }

    target.hidden = false;
    moveTarget();
    target.addEventListener("click", handleTargetHit, { once: true });
  }, delay);
}

function beginRound() {
  clearRespawnTimer();
  clearRestartCountdown();
  target.removeEventListener("click", handleTargetHit);

  startKicker.textContent = "CLASSIC · 60 SECONDS";
  startHeading.textContent = "Ready when you are";
  startCopy.textContent =
    "Click the target whenever it appears. You'll have 60 seconds.";
  startButton.textContent = "Start 60-second session";

  startPanel.hidden = true;
  applyDifficulty();
  target.hidden = false;
  moveTarget();
  target.addEventListener("click", handleTargetHit, { once: true });

  session.start();
}

function startRound(event) {
  event.stopPropagation();

  const phase = session.getState().phase;

  if (phase === "running") {
    return;
  }

  if (phase === "complete") {
    session.reset();
  }

  beginRound();
}

function restartRound(event) {
  event.stopPropagation();

  if (session.getState().phase !== "running") {
    return;
  }

  clearRespawnTimer();
  target.removeEventListener("click", handleTargetHit);
  target.hidden = true;

  restartCountdownActive = true;
  restartOverlay.hidden = false;
  restartButton.disabled = true;

  let secondsLeft = 3;
  restartCountdownNumber.textContent = String(secondsLeft);

  restartCountdownIntervalID = window.setInterval(() => {
    secondsLeft -= 1;

    if (secondsLeft === 0) {
      clearRestartCountdown();
      session.reset();
      beginRound();
      return;
    }

    restartCountdownNumber.textContent = String(secondsLeft);
  }, 1000);
}

function exitToPregame(event) {
  event.stopPropagation();

  clearRestartCountdown();
  clearRespawnTimer();
  session.reset();

  target.removeEventListener("click", handleTargetHit);
  target.hidden = true;

  startPanel.hidden = false;
  startKicker.textContent = "CLASSIC · 60 SECONDS";
  startHeading.textContent = "Ready when you are";
  startCopy.textContent =
    "Click the target whenever it appears. You'll have 60 seconds.";
  startButton.textContent = "Start 60-second session";
}

startButton.addEventListener("click", startRound);
restartButton.addEventListener("click", restartRound);
cancelRestartButton.addEventListener("click", exitToPregame);
difficultySelect.addEventListener("change", applyDifficulty);

playArea.addEventListener("click", () => {
  if (restartCountdownActive) {
    return;
  }

  session.recordMiss();
});

session.subscribe((state) => {
  difficultySelect.disabled = state.phase === "running";
  restartButton.disabled =
    state.phase !== "running" || restartCountdownActive;

  timeValue.textContent = formatTime(state.remainingSeconds);
  scoreValue.textContent = String(state.hits);
  missesValue.textContent = String(state.misses);

  const totalShots = state.hits + state.misses;

  const accuracy =
    totalShots === 0
      ? "—"
      : `${Math.round((state.hits / totalShots) * 100)}%`;

  const elapsedSeconds = state.durationSeconds - state.remainingSeconds;

  const hitRate =
    elapsedSeconds <= 0
      ? "0.0"
      : (state.hits / elapsedSeconds).toFixed(1);

  if (state.phase === "complete" && state.hits > bestScore) {
    bestScore = state.hits;
  }

  accuracyValue.textContent = accuracy;
  hitRateValue.textContent = hitRate;
  bestScoreValue.textContent = String(bestScore);

  if (state.phase !== "complete") {
    return;
  }

  clearRespawnTimer();
  clearRestartCountdown();

  target.hidden = true;
  startPanel.hidden = false;
  startKicker.textContent = "FINAL SCORE";
  startHeading.textContent = `You scored ${state.hits}`;
  startCopy.textContent =
    `Accuracy: ${accuracy} · Hit rate: ${hitRate} / sec · Misses: ${state.misses} · Best score: ${bestScore}`;
  startButton.textContent = "Play again";
});