const GAME_LENGTH_SECONDS = 30;
const POINTS_GOOD_CAN = 1;
const POINTS_OBSTACLE = -3;

const winningMessages = [
  "Amazing work - you helped keep clean water flowing!",
  "You did it! Every tap helped a community get closer to clean water.",
  "Great run! Your quick reflexes made a real impact.",
];

const losingMessages = [
  "Nice effort. Try again and collect 20+ points!",
  "Keep going - each can you catch matters.",
  "Almost there. Give it another shot and beat 20!",
];

let gameRunning = false;
let score = 0;
let timeLeft = GAME_LENGTH_SECONDS;
let canMaker = null;
let obstacleMaker = null;
let gameTimer = null;

const gameContainer = document.getElementById("game-container");
const scoreValue = document.getElementById("score");
const timeValue = document.getElementById("time");
const startButton = document.getElementById("start-btn");
const resetButton = document.getElementById("reset-btn");
const statusMessage = document.getElementById("status-message");
const gameResult = document.getElementById("game-result");
const scoreLabel = document.querySelector(".score");
const confettiLayer = document.getElementById("confetti-layer");

startButton.addEventListener("click", startGame);
resetButton.addEventListener("click", resetGame);
gameContainer.addEventListener("pointerdown", handleGameInteraction);
gameContainer.addEventListener("click", handleGameInteraction);

function startGame() {
  if (gameRunning) return;

  prepareRound();
  gameRunning = true;
  startButton.disabled = true;

  canMaker = setInterval(createCan, 700);
  obstacleMaker = setInterval(createObstacle, 1650);
  gameTimer = setInterval(() => {
    timeLeft -= 1;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function prepareRound() {
  score = 0;
  timeLeft = GAME_LENGTH_SECONDS;
  gameResult.textContent = "";
  statusMessage.textContent = "Collect clean cans. Avoid obstacles.";
  statusMessage.className = "status-message";
  scoreLabel.classList.remove("bump", "danger");
  scoreValue.textContent = String(score);
  updateTimerDisplay();
  gameContainer.innerHTML = "";
}

function resetGame() {
  gameRunning = false;
  clearInterval(canMaker);
  clearInterval(obstacleMaker);
  clearInterval(gameTimer);
  canMaker = null;
  obstacleMaker = null;
  gameTimer = null;
  startButton.disabled = false;
  prepareRound();
  statusMessage.textContent = "Game reset. Press Start Game.";
  clearConfetti();
}

function updateTimerDisplay() {
  timeValue.textContent = String(timeLeft);
}

function createCan() {
  const can = document.createElement("div");
  can.className = "water-can";

  const minSize = 46;
  const maxSize = 74;
  const size = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
  can.style.width = `${size}px`;
  can.style.height = `${size}px`;

  const gameWidth = gameContainer.clientWidth;
  const xPosition = Math.random() * (gameWidth - size);
  can.style.left = `${Math.max(0, xPosition)}px`;

  const duration = (Math.random() * 1.6 + 2.7).toFixed(2);
  can.style.animationDuration = `${duration}s`;

  can.addEventListener("animationend", () => can.remove(), { once: true });

  gameContainer.appendChild(can);
}

function createObstacle() {
  const obstacle = document.createElement("div");
  obstacle.className = "obstacle";

  const minSize = 42;
  const maxSize = 58;
  const size = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
  obstacle.style.width = `${size}px`;
  obstacle.style.height = `${size}px`;

  const gameWidth = gameContainer.clientWidth;
  const xPosition = Math.random() * (gameWidth - size);
  obstacle.style.left = `${Math.max(0, xPosition)}px`;

  const duration = (Math.random() * 1.6 + 2.4).toFixed(2);
  obstacle.style.animationDuration = `${duration}s`;

  obstacle.addEventListener("animationend", () => obstacle.remove(), { once: true });

  gameContainer.appendChild(obstacle);
}

function handleGameInteraction(event) {
  if (!gameRunning) return;

  const can = event.target.closest(".water-can");
  if (can) {
    event.preventDefault();
    if (can.dataset.caught === "true") return;
    can.dataset.caught = "true";
    handleCanClick(can);
    return;
  }

  const obstacle = event.target.closest(".obstacle");
  if (obstacle) {
    event.preventDefault();
    if (obstacle.dataset.caught === "true") return;
    obstacle.dataset.caught = "true";
    handleObstacleClick(obstacle);
  }
}

function handleCanClick(canElement) {
  if (!gameRunning) return;

  const delta = POINTS_GOOD_CAN;
  score = Math.max(0, score + delta);
  scoreValue.textContent = String(score);

  scoreLabel.classList.remove("bump", "danger");
  scoreLabel.classList.add("bump");
  statusMessage.textContent = "Nice catch! +1 point";
  statusMessage.className = "status-message good";

  showFloatingPoints(delta, canElement.offsetLeft, canElement.offsetTop, true);
  canElement.remove();

  setTimeout(() => scoreLabel.classList.remove("bump", "danger"), 200);
}

function handleObstacleClick(obstacleElement) {
  if (!gameRunning) return;

  const delta = POINTS_OBSTACLE;
  score = Math.max(0, score + delta);
  scoreValue.textContent = String(score);

  scoreLabel.classList.remove("bump", "danger");
  scoreLabel.classList.add("danger");
  statusMessage.textContent = "Obstacle hit! -3 points";
  statusMessage.className = "status-message bad";

  showFloatingPoints(delta, obstacleElement.offsetLeft, obstacleElement.offsetTop, false);
  obstacleElement.remove();

  setTimeout(() => scoreLabel.classList.remove("bump", "danger"), 220);
}

function showFloatingPoints(points, x, y, isGood) {
  const marker = document.createElement("span");
  marker.className = `floating-points ${isGood ? "good" : "bad"}`;
  marker.textContent = points > 0 ? `+${points}` : String(points);
  marker.style.left = `${x + 10}px`;
  marker.style.top = `${Math.max(0, y)}px`;

  gameContainer.appendChild(marker);
  marker.addEventListener("animationend", () => marker.remove(), { once: true });
}

function endGame() {
  gameRunning = false;
  clearInterval(canMaker);
  clearInterval(obstacleMaker);
  clearInterval(gameTimer);
  canMaker = null;
  obstacleMaker = null;
  gameTimer = null;
  startButton.disabled = false;

  const wonGame = score >= 20;
  const messageSet = wonGame ? winningMessages : losingMessages;
  const randomMessage = messageSet[Math.floor(Math.random() * messageSet.length)];
  gameResult.textContent = randomMessage;
  statusMessage.textContent = "Press Start Game to play again.";
  statusMessage.className = "status-message";

  if (wonGame) {
    triggerConfetti();
  }

  // Remove active cans after the game ends so users can restart with a clean board.
  gameContainer.innerHTML = "";
}

function triggerConfetti() {
  clearConfetti();
  const colors = ["#ffc907", "#2e9df7", "#4fcb53", "#ff902a", "#f5402c", "#8bd1cb"];
  const pieces = 120;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < pieces; i += 1) {
    const piece = document.createElement("span");
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const delay = (Math.random() * 0.8).toFixed(2);
    const duration = (Math.random() * 1.7 + 1.8).toFixed(2);

    piece.className = "confetti";
    piece.style.left = `${left}%`;
    piece.style.backgroundColor = color;
    piece.style.animationDelay = `${delay}s`;
    piece.style.animationDuration = `${duration}s`;
    piece.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;
    fragment.appendChild(piece);
  }

  confettiLayer.appendChild(fragment);
  setTimeout(clearConfetti, 4200);
}

function clearConfetti() {
  confettiLayer.innerHTML = "";
}
