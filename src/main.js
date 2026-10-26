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
const practiceModeSelect = document.querySelector("#practice-mode-select");
const pageTitle = document.querySelector("#page-title");

const restartButton = document.querySelector("#restart-button");
const restartOverlay = document.querySelector("#restart-overlay");
const restartCountdownNumber = document.querySelector(
  "#restart-countdown-number",
);
const cancelRestartButton = document.querySelector("#cancel-restart-button");

const settingsButton = document.querySelector("#settings-button");
const settingsDialog = document.querySelector("#settings-dialog");
const settingsCloseButton = document.querySelector("#settings-close");
const settingsResetButton = document.querySelector("#settings-reset");
const themeSelect = document.querySelector("#theme-select");
const interfaceSizeSelect = document.querySelector("#interface-size");
const targetVariationSelect = document.querySelector("#target-variation");
const blurToggle = document.querySelector("#blur-toggle");
const soundToggle = document.querySelector("#sound-toggle");

const topbarStatus = document.querySelector("#topbar-status");

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
  !practiceModeSelect ||
  !pageTitle ||
  !restartButton ||
  !restartOverlay ||
  !restartCountdownNumber ||
  !cancelRestartButton ||
  !settingsButton ||
  !settingsDialog ||
  !settingsCloseButton ||
  !settingsResetButton ||
  !themeSelect ||
  !interfaceSizeSelect ||
  !targetVariationSelect ||
  !blurToggle ||
  !soundToggle ||
  !topbarStatus
) {
  throw new Error("AimTrain could not find one or more game elements.");
}

const DIFFICULTIES = {
  easy: {
    targetSize: 60,
    respawnDelay: 850,
    precisionLifetime: 1100,
    precisionMinDistance: 100,
  },
  medium: {
    targetSize: 46,
    respawnDelay: 400,
    precisionLifetime: 800,
    precisionMinDistance: 140,
  },
  hard: {
    targetSize: 32,
    respawnDelay: 150,
    precisionLifetime: 550,
    precisionMinDistance: 180,
  },
};

const session = createSession({ durationSeconds: 60 });

const BEST_SCORE_KEY = "aimtrain.bestscore.v1";
let bestScore = 0;

try {
  const savedBestScore = Number(localStorage.getItem(BEST_SCORE_KEY));

  if (Number.isFinite(savedBestScore) && savedBestScore > 0) {
    bestScore = savedBestScore;
  }
} catch {
  // The game can still run if browser storage is unavailable.
}

let respawnTimeoutID = null;
let targetExpiryTimeoutID = null;
let restartCountdownIntervalID = null;
let feedbackTimeoutID = null;
let restartCountdownActive = false;
let previousTargetPosition = null;

const SETTINGS_KEY = "aimtrain.settings.v1";

const DEFAULT_SETTINGS = {
  theme: "tactical",
  size: "standard",
  variation: "varied",
  blur: true,
  sound: false,
};

function loadSettings() {
  try {
    return {
      theme:
        localStorage.getItem(`${SETTINGS_KEY}.theme`) ||
        DEFAULT_SETTINGS.theme,
      size:
        localStorage.getItem(`${SETTINGS_KEY}.size`) ||
        DEFAULT_SETTINGS.size,
      variation:
        localStorage.getItem(`${SETTINGS_KEY}.variation`) ||
        DEFAULT_SETTINGS.variation,
      blur: localStorage.getItem(`${SETTINGS_KEY}.blur`) !== "false",
      sound: localStorage.getItem(`${SETTINGS_KEY}.sound`) === "true",
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

const settings = loadSettings();

function saveSetting(name, value) {
  settings[name] = value;

  try {
    localStorage.setItem(`${SETTINGS_KEY}.${name}`, String(value));
  } catch {
    // Settings still work for this visit if storage is unavailable.
  }
}

function applySettings() {
  document.documentElement.dataset.theme = settings.theme;
  document.body.dataset.interfaceSize = settings.size;
  settingsDialog.dataset.blur = String(settings.blur);

  themeSelect.value = settings.theme;
  interfaceSizeSelect.value = settings.size;
  targetVariationSelect.value = settings.variation;
  blurToggle.checked = settings.blur;
  soundToggle.checked = settings.sound;
}

function resetSettings() {
  Object.assign(settings, DEFAULT_SETTINGS);

  try {
    for (const name of Object.keys(DEFAULT_SETTINGS)) {
      localStorage.removeItem(`${SETTINGS_KEY}.${name}`);
    }
  } catch {
    // Defaults still apply for this visit if storage is unavailable.
  }

  applySettings();
}

let audioContext;

function playHitSound() {
  if (!settings.sound) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  audioContext ??= new AudioContextClass();

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.frequency.value = 660;
  gain.gain.setValueAtTime(0.08, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + 0.09,
  );

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.09);
}

function updateModeDisplay() {
  const isPrecisionMode = practiceModeSelect.value === "precision";
  const modeName = isPrecisionMode ? "Precision" : "Classic";

  pageTitle.textContent = modeName;

  if (session.getState().phase !== "complete") {
    startKicker.textContent = `${modeName.toUpperCase()} · 60 SECONDS`;
    startCopy.textContent = isPrecisionMode
      ? "Targets are smaller, expire quickly, and move farther apart as difficulty increases."
      : "Click the target whenever it appears. You'll have 60 seconds.";
  }
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function showShotFeedback(type) {
  const feedbackClass = type === "hit" ? "feedback-hit" : "feedback-miss";

  playArea.classList.remove("feedback-hit", "feedback-miss");
  void playArea.offsetWidth;
  playArea.classList.add(feedbackClass);

  window.clearTimeout(feedbackTimeoutID);
  feedbackTimeoutID = window.setTimeout(() => {
    playArea.classList.remove("feedback-hit", "feedback-miss");
    feedbackTimeoutID = null;
  }, 180);
}

function moveTarget() {
  const difficulty = DIFFICULTIES[difficultySelect.value];
  const isPrecisionMode = practiceModeSelect.value === "precision";

  const baseSize = isPrecisionMode
    ? difficulty.targetSize * 0.75
    : difficulty.targetSize;

  const sizeScale =
    !isPrecisionMode && settings.variation === "varied"
      ? 0.75 + Math.random() * 0.25
      : 1;

  const targetSize = baseSize * sizeScale;
  const radius = targetSize / 2;

  target.style.width = `${targetSize}px`;
  target.style.height = `${targetSize}px`;

  const availableX = Math.max(0, playArea.clientWidth - targetSize);
  const availableY = Math.max(0, playArea.clientHeight - targetSize);

  let x = radius + Math.random() * availableX;
  let y = radius + Math.random() * availableY;

  if (isPrecisionMode && previousTargetPosition) {
    for (let attempt = 0; attempt < 24; attempt += 1) {
      x = radius + Math.random() * availableX;
      y = radius + Math.random() * availableY;

      const distance = Math.hypot(
        x - previousTargetPosition.x,
        y - previousTargetPosition.y,
      );

      if (distance >= difficulty.precisionMinDistance) {
        break;
      }
    }
  }

  target.style.left = `${x}px`;
  target.style.top = `${y}px`;
  previousTargetPosition = { x, y };
}

function applyDifficulty() {
  const difficulty = DIFFICULTIES[difficultySelect.value];

  target.style.width = `${difficulty.targetSize}px`;
  target.style.height = `${difficulty.targetSize}px`;
}

function clearRespawnTimer() {
  if (respawnTimeoutID !== null) {
    window.clearTimeout(respawnTimeoutID);
    respawnTimeoutID = null;
  }
}

function clearTargetExpiryTimer() {
  if (targetExpiryTimeoutID !== null) {
    window.clearTimeout(targetExpiryTimeoutID);
    targetExpiryTimeoutID = null;
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

function scheduleNextTarget() {
  clearRespawnTimer();

  const delay = DIFFICULTIES[difficultySelect.value].respawnDelay;

  respawnTimeoutID = window.setTimeout(() => {
    respawnTimeoutID = null;

    if (session.getState().phase !== "running") return;

    target.hidden = false;
    moveTarget();
    target.addEventListener("click", handleTargetHit, { once: true });
    scheduleTargetExpiry();
  }, delay);
}

function scheduleTargetExpiry() {
  clearTargetExpiryTimer();

  if (practiceModeSelect.value !== "precision") return;

  const lifetime = DIFFICULTIES[difficultySelect.value].precisionLifetime;

  targetExpiryTimeoutID = window.setTimeout(() => {
    targetExpiryTimeoutID = null;

    if (session.getState().phase !== "running") return;

    target.removeEventListener("click", handleTargetHit);
    target.hidden = true;

    showShotFeedback("miss");
    session.recordMiss();
    scheduleNextTarget();
  }, lifetime);
}

function handleTargetHit(event) {
  event.stopPropagation();

  if (session.getState().phase !== "running") return;

  clearTargetExpiryTimer();
  showShotFeedback("hit");
  session.recordHit();
  playHitSound();

  const nextTarget = target.cloneNode(true);
  target.replaceWith(nextTarget);
  target = nextTarget;
  target.hidden = true;

  applyDifficulty();
  scheduleNextTarget();
}

function beginRound() {
  clearRespawnTimer();
  clearTargetExpiryTimer();
  clearRestartCountdown();

  previousTargetPosition = null;
  target.removeEventListener("click", handleTargetHit);

  startHeading.textContent = "Ready when you are";
  startButton.textContent = "Start 60-second session";
  updateModeDisplay();

  startPanel.hidden = true;
  applyDifficulty();
  target.hidden = false;
  moveTarget();
  target.addEventListener("click", handleTargetHit, { once: true });

  session.start();
  scheduleTargetExpiry();
}

function startRound(event) {
  event.stopPropagation();

  const phase = session.getState().phase;

  if (phase === "running") return;

  if (phase === "complete") {
    session.reset();
  }

  beginRound();
}

function restartRound(event) {
  event.stopPropagation();

  if (session.getState().phase !== "running") return;

  clearRespawnTimer();
  clearTargetExpiryTimer();

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
  clearTargetExpiryTimer();
  session.reset();

  previousTargetPosition = null;
  target.removeEventListener("click", handleTargetHit);
  target.hidden = true;

  startPanel.hidden = false;
  startHeading.textContent = "Ready when you are";
  startButton.textContent = "Start 60-second session";
  updateModeDisplay();
}

applySettings();

settingsButton.addEventListener("click", () => settingsDialog.showModal());
settingsCloseButton.addEventListener("click", () => settingsDialog.close());
settingsResetButton.addEventListener("click", resetSettings);

settingsDialog.addEventListener("click", (event) => {
  if (event.target === settingsDialog) {
    settingsDialog.close();
  }
});

themeSelect.addEventListener("change", () => {
  saveSetting("theme", themeSelect.value);
  applySettings();
});

interfaceSizeSelect.addEventListener("change", () => {
  saveSetting("size", interfaceSizeSelect.value);
  applySettings();
});

targetVariationSelect.addEventListener("change", () => {
  saveSetting("variation", targetVariationSelect.value);
  applySettings();
});

blurToggle.addEventListener("change", () => {
  saveSetting("blur", blurToggle.checked);
  applySettings();
});

soundToggle.addEventListener("change", () => {
  saveSetting("sound", soundToggle.checked);
  applySettings();
});

practiceModeSelect.addEventListener("change", updateModeDisplay);
difficultySelect.addEventListener("change", applyDifficulty);
updateModeDisplay();

startButton.addEventListener("click", startRound);
restartButton.addEventListener("click", restartRound);
cancelRestartButton.addEventListener("click", exitToPregame);

playArea.addEventListener("click", () => {
  if (
    restartCountdownActive ||
    session.getState().phase !== "running"
  ) {
    return;
  }

  showShotFeedback("miss");
  session.recordMiss();
});

session.subscribe((state) => {
  topbarStatus.textContent =
    state.phase === "running"
      ? "Running"
      : state.phase === "complete"
        ? "Session complete"
        : "Ready to practice";

  difficultySelect.disabled = state.phase === "running";
  practiceModeSelect.disabled = state.phase === "running";
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

    try {
      localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
    } catch {
      // The current round still works if saving is unavailable.
    }
  }

  accuracyValue.textContent = accuracy;
  hitRateValue.textContent = hitRate;
  bestScoreValue.textContent = String(bestScore);

  if (state.phase !== "complete") return;

  clearRespawnTimer();
  clearTargetExpiryTimer();
  clearRestartCountdown();

  target.hidden = true;
  startPanel.hidden = false;
  startKicker.textContent = "FINAL SCORE";
  startHeading.textContent = `You scored ${state.hits}`;
  startCopy.textContent =
    `Accuracy: ${accuracy} · Hit rate: ${hitRate} / sec · Misses: ${state.misses} · Best score: ${bestScore}`;
  startButton.textContent = "Play again";
});