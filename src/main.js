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

const startKicker = startPanel?.querySelector(".start-kicker")
const startHeading = startPanel?.querySelector("h2")
const startCopy = startPanel?.querySelector(".start-copy")

if(!playArea || !target || !startPanel || !startButton || !timeValue || !scoreValue || !missesValue || !accuracyValue || !hitRateValue || !bestScoreValue || !startKicker || !startHeading || !startCopy) {
    throw new Error("AimTrain could not find its game elements.");

}

const session = createSession({durationSeconds : 60});
let bestScore = 0;
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds/60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
function moveTarget(){
    const radius = target.offsetWidth / 2;
    const availableX = Math.max(0, playArea.clientWidth - radius * 2);
    const availableY = Math.max(0, playArea.clientHeight - radius * 2);

    const x = radius + Math.random () *availableX;
    const y = radius + Math.random() * availableY;

    target.style.left = `${x}px`;
    target.style.top = `${y}px`;

}



function handleTargetHit(event) {
    event.stopPropagation();

    if(session.getState().phase !== "running") {
        return;
    }

    session.recordHit();

    const nextTarget = target.cloneNode(true);
    target.replaceWith(nextTarget);
    target = nextTarget;

    moveTarget();
    target.addEventListener("click", handleTargetHit, {once : true});
}

function startRound(event) {
    event.stopPropagation();

    if(session.getState().phase === "running") {
        return;
    }

    if(session.getState().phase === "complete") {
        session.reset();
    }


    startKicker.textContent = "CLASSIC · 60 SECONDS"
    startHeading.textContent = "Ready when you are";
    startCopy.textContent = "Click the target whenever it appears. You'll have 60 seconds.";
    startButton.textContent = "Start 60-second session";

    startPanel.hidden = true;
    target.hidden = false;

    moveTarget();
    target.addEventListener("click", handleTargetHit, {once:true});
    session.start();
}

startButton.addEventListener("click", startRound);


playArea.addEventListener("click", () => {
    session.recordMiss();
});

session.subscribe((state) => {
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

  target.hidden = true;
  startPanel.hidden = false;
  startKicker.textContent = "FINAL SCORE";
  startHeading.textContent = `You scored ${state.hits}`;
  startCopy.textContent =
    `Accuracy: ${accuracy} · Hit rate: ${hitRate} / sec · Misses: ${state.misses} · Best score: ${bestScore}`;
  startButton.textContent = "Play again";
});