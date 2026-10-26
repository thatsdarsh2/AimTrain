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
const restartCountdownNumber = document.querySelector("#restart-countdown-number");
const cancelRestartButton = document.querySelector("#cancel-restart-button");

const settingsButton = document.querySelector("#settings-button");
const settingsDialog = document.querySelector("#settings-dialog");
const settingsCloseButton = document.querySelector("#settings-close");
const themeSelect = document.querySelector("#theme-select");
const interfaceSizeSelect = document.querySelector("#interface-size");
const targetVariationSelect = document.querySelector("#target-variation");
const blurToggle = document.querySelector("#blur-toggle");
const soundToggle = document.querySelector("#sound-toggle");

const topbarStatus = document.querySelector("#topbar-status");
const settingsResetButton = document.querySelector("#settings-reset");

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
  !cancelRestartButton ||
  !settingsButton ||
  !settingsDialog ||
  !settingsCloseButton ||
  !themeSelect ||
  !interfaceSizeSelect ||
  !targetVariationSelect ||
  !blurToggle ||
  !soundToggle ||
  !topbarStatus ||
  !settingsResetButton) {
  throw new Error("AimTrain could not find one or more game elements.");
}

const DIFFICULTIES = {
  easy: { targetSize: 60, respawnDelay: 850 },
  medium: { targetSize: 46, respawnDelay: 400 },
  hard: { targetSize: 32, respawnDelay: 150 },
};

const session = createSession({ durationSeconds: 60 });


const BEST_SCORE_KEY = "aimtrain.bestscore.v1";
let bestScore = 0;

try{
    const savedBestScore = Number(localStorage.getItem(BEST_SCORE_KEY));

    if(Number.isFinite(savedBestScore) && savedBestScore > 0) {
        bestScore = savedBestScore;
    }
} catch {
    // the game can still run if the browser storage is unavaiaable

}
let respawnTimeoutID = null;
let restartCountdownIntervalID = null;
let restartCountdownActive = false;
let feedbackTimeoutID = null;

const SETTINGS_KEY  = "aimtrain.settings.v1";

function loadSettings(){
    try {
        return {
            theme: localStorage.getItem(SETTINGS_KEY + ".theme") || "tactical",
            size: localStorage.getItem(SETTINGS_KEY +".size") || "standard",
            variation: localStorage.getItem(SETTINGS_KEY + ".variation") || "varied",
            blur: localStorage.getItem(SETTINGS_KEY + ".blur") !== "false",
            sound: localStorage.getItem(SETTINGS_KEY + ".sound") === "true",
        };
    }catch{
        return{
            theme:"tactical",
            size: "standard",
            variation: "varied",
            blur: true,
            sound: false,
        };
    }
}

const settings = loadSettings();

function saveSetting(name, value){
    settings[name] = value;

    try {
        localStorage.setItem(`${SETTINGS_KEY}.${name}`, String(value));
    }catch{
        //settings will still work even if browser storageis unavailable
    }
}

function applySettings(){
    document.documentElement.dataset.theme = settings.theme;
    document.body.dataset.interfaceSize = settings.size;
    settingsDialog.dataset.blur = String(settings.blur);

    themeSelect.value = settings.theme;
    interfaceSizeSelect.value= settings.size;
    targetVariationSelect.value = settings.variation;
    blurToggle.checked = settings.blur;
    soundToggle.checked = settings.sound;

}

function resetSettings() {
    settings.theme = "tactical";
    settings.size = "standard";
    settings.variation = "varied";
    settings.blur = true;
    settings.sound - false;

    for( const name of ["theme", "size", "variation", "blur", "sound"]) {
        try {
            localStorage.removeItem(`${SETTINGS_KEY}.${name}`);
        
        }catch {
            // deafults still apply even if storage is unavailabel
        }
    }

    applySettings();
}

let audioContext;

function playHitSound(){
    if (!settings.sound) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if(!AudioContextClass) return;

    audioContext ??= new AudioContextClass();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.09);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.09);
}

applySettings();

settingsButton.addEventListener("click", () => settingsDialog.showModal());
settingsCloseButton.addEventListener("click", () => settingsDialog.close());
settingsResetButton.addEventListener("click", resetSettings);
settingsDialog.addEventListener("click", (event) => {
    if(event.target === settingsDialog) settingsDialog.close();

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



function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function moveTarget() {
  const baseSize = DIFFICULTIES[difficultySelect.value].targetSize;

  const sizeScale = settings.variation === "varied" ? 0.75 + Math.random() * 0.25 : 1;

  const targetSize = baseSize * sizeScale

  target.style.width = `${targetSize}px`;
  target.style.height = `${targetSize}px`;


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

function showShotFeedback(type) {
    const feedbackClass = type === "hit" ? "feedback-hit" : "feedback-miss"

    playArea.classList.remove("feedback-hit", "feedback-miss");
    void playArea.offsetWidthl // restart the brief feedback animation
    playArea.classList.add(feedbackClass);

    window.clearTimeout(feedbackTimeoutID);
    feedbackTimeoutID = window.setTimeout(() => {
        playArea.classList.remove("feedback-hit", "feedback-miss");
        feedbackTimeoutID = null;
    }, 180);
}




function handleTargetHit(event) {
  event.stopPropagation();

  if (session.getState().phase !== "running") {
    return;
  }

  session.recordHit();
  showShotFeedback("hit");
  playHitSound();

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
  if (restartCountdownActive || session.getState().phase !== "running") {
    return;
  }

  showShotFeedback("miss");
  session.recordMiss();
});

session.subscribe((state) => {

    topbarStatus.textContent = state.phase === "running" ? "Running" : state.phase === "complete" ? "Session complete" : "Ready to practice";
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

    try{
        localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
    } catch {
        // the current rounf still works if saving is unavailable
    }
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