const playArea = document.querySelector("#play-area");
const target = document.querySelector("#target");
const startPanel = document.querySelector("#start-panel");
const startButton = document.querySelector("#start-button");

if(!playArea || !target || !startPanel || !startButton) {
    throw new Error("AimTrain could not find its game elements.");

}

function moveTarget(){
    const radius = target.offsetWidth / 2;
    const availableX = Math.max(0, playArea.clientWidth - radius * 2);
    const availableY = Math.max(0, playArea.clientWidth - radius * 2);

    const x = radius + Math.random () *availableX;
    const y = radius + Math.random() * availableY;

    target.style.left = `${x}px`;
    target.style.top = `${y}px`;

}

startButton.addEventListener("click", () => {
    startPanel.hidden = true;
    target.hidden = false;
    moveTarget();
});

target.addEventListener("click", (event) => {
    event.stopPropagation();
    moveTarget();
});