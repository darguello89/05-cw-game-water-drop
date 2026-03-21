const DIFFICULTY_MODES = {
  easy: {
    label: "Easy",
    targetScore: 14,
    timeLimit: 35,
    canSpawnMs: 760,
    obstacleSpawnMs: 2100,
    canMinFallSec: 3.2,
    canMaxFallSec: 4.7,
    obstacleMinFallSec: 3.2,
    obstacleMaxFallSec: 4.8,
    goodPoints: 1,
    badPoints: -2,
  },
  normal: {
    label: "Normal",
    targetScore: 20,
    timeLimit: 30,
    canSpawnMs: 700,
    obstacleSpawnMs: 1650,
    canMinFallSec: 2.7,
    canMaxFallSec: 4.3,
    obstacleMinFallSec: 2.4,
    obstacleMaxFallSec: 4.0,
    goodPoints: 1,
    badPoints: -3,
  },
  hard: {
    label: "Hard",
    targetScore: 28,
    timeLimit: 24,
    canSpawnMs: 600,
    obstacleSpawnMs: 1100,
    canMinFallSec: 2.2,
    canMaxFallSec: 3.4,
    obstacleMinFallSec: 1.9,
    obstacleMaxFallSec: 3.0,
    goodPoints: 1,
    badPoints: -4,
  },
};

const winningMessages = [
  "Amazing work - you helped keep clean water flowing!",
  "You did it! Every tap helped a community get closer to clean water.",
  "Great run! Your quick reflexes made a real impact.",
];

const losingMessages = [
  "Nice effort. Try again and keep those clean cans coming!",
  "Keep going - each can you catch matters.",
  "Almost there. Give it another shot!",
];

const SOUND_FILES = {
  button: "audio/button.mp3",
  collect: "audio/collect.mp3",
  miss: "audio/miss.mp3",
  win: "audio/win.mp3",
};

let gameRunning = false;
let score = 0;
let timeLeft = DIFFICULTY_MODES.normal.timeLimit;
let canMaker = null;
let obstacleMaker = null;
let gameTimer = null;
let selectedDifficulty = "normal";
let activeMode = DIFFICULTY_MODES.normal;
let milestonesForRound = [];
let reachedMilestones = new Set();
let audioContext = null;
const soundEffects = initializeSoundEffects();

const gameContainer = document.getElementById("game-container");
const scoreValue = document.getElementById("score");
const timeValue = document.getElementById("time");
const startButton = document.getElementById("start-btn");
const resetButton = document.getElementById("reset-btn");
const statusMessage = document.getElementById("status-message");
const gameResult = document.getElementById("game-result");
const scoreLabel = document.querySelector(".score");
const confettiLayer = document.getElementById("confetti-layer");
const difficultySelect = document.getElementById("difficulty-select");
const modeGoal = document.getElementById("mode-goal");

startButton.addEventListener("click", startGame);
resetButton.addEventListener("click", resetGame);
gameContainer.addEventListener("pointerdown", handleGameInteraction);
gameContainer.addEventListener("click", handleGameInteraction);
difficultySelect.addEventListener("change", handleDifficultyChange);

updateGoalDisplay();

function startGame() {
  playSound("button");
  if (gameRunning) return;

  selectedDifficulty = difficultySelect.value;
  activeMode = DIFFICULTY_MODES[selectedDifficulty] || DIFFICULTY_MODES.normal;

  prepareRound();
  gameRunning = true;
  startButton.disabled = true;
  difficultySelect.disabled = true;

  canMaker = setInterval(() => createCan(activeMode), activeMode.canSpawnMs);
  obstacleMaker = setInterval(() => createObstacle(activeMode), activeMode.obstacleSpawnMs);
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
  timeLeft = activeMode.timeLimit;
  milestonesForRound = buildMilestones(activeMode.targetScore);
  reachedMilestones = new Set();
  gameResult.textContent = "";
  statusMessage.textContent = `Collect clean cans. Avoid obstacles. Goal: ${activeMode.targetScore} points.`;
  statusMessage.className = "status-message";
  scoreLabel.classList.remove("bump", "danger");
  scoreValue.textContent = String(score);
  updateTimerDisplay();
  updateGoalDisplay();
  gameContainer.innerHTML = "";
}

function resetGame() {
  playSound("button");
  gameRunning = false;
  clearInterval(canMaker);
  clearInterval(obstacleMaker);
  clearInterval(gameTimer);
  canMaker = null;
  obstacleMaker = null;
  gameTimer = null;
  startButton.disabled = false;
  difficultySelect.disabled = false;
  activeMode = DIFFICULTY_MODES[difficultySelect.value] || DIFFICULTY_MODES.normal;
  prepareRound();
  statusMessage.textContent = "Game reset. Press Start Game.";
  clearConfetti();
}

function updateTimerDisplay() {
  timeValue.textContent = String(timeLeft);
}

function createCan(mode) {
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

  const duration = randomFloat(mode.canMinFallSec, mode.canMaxFallSec).toFixed(2);
  can.style.animationDuration = `${duration}s`;

  can.addEventListener(
    "animationend",
    () => {
      if (gameRunning && can.dataset.caught !== "true") {
        playSound("miss");
      }
      can.remove();
    },
    { once: true }
  );

  gameContainer.appendChild(can);
}

function createObstacle(mode) {
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

  const duration = randomFloat(mode.obstacleMinFallSec, mode.obstacleMaxFallSec).toFixed(2);
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

  const delta = activeMode.goodPoints;
  score = Math.max(0, score + delta);
  scoreValue.textContent = String(score);

  scoreLabel.classList.remove("bump", "danger");
  scoreLabel.classList.add("bump");
  statusMessage.textContent = "Nice catch! +1 point";
  statusMessage.className = "status-message good";
  playSound("collect");

  showFloatingPoints(delta, canElement.offsetLeft, canElement.offsetTop, true);
  showTapSplash(canElement, true);
  canElement.remove();
  checkMilestones();

  setTimeout(() => scoreLabel.classList.remove("bump", "danger"), 200);
}

function handleObstacleClick(obstacleElement) {
  if (!gameRunning) return;

  const delta = activeMode.badPoints;
  score = Math.max(0, score + delta);
  scoreValue.textContent = String(score);

  scoreLabel.classList.remove("bump", "danger");
  scoreLabel.classList.add("danger");
  statusMessage.textContent = `Obstacle hit! ${delta} points`;
  statusMessage.className = "status-message bad";

  showFloatingPoints(delta, obstacleElement.offsetLeft, obstacleElement.offsetTop, false);
  showTapSplash(obstacleElement, false);
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

function showTapSplash(element, isGood) {
  const splash = document.createElement("span");
  splash.className = `tap-splash ${isGood ? "good" : "bad"}`;
  splash.style.left = `${element.offsetLeft + element.offsetWidth / 2}px`;
  splash.style.top = `${element.offsetTop + element.offsetHeight / 2}px`;
  gameContainer.appendChild(splash);
  splash.addEventListener("animationend", () => splash.remove(), { once: true });
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
  difficultySelect.disabled = false;

  const wonGame = score >= activeMode.targetScore;
  const messageSet = wonGame ? winningMessages : losingMessages;
  const randomMessage = messageSet[Math.floor(Math.random() * messageSet.length)];
  gameResult.textContent = wonGame
    ? `${randomMessage} (${activeMode.label} goal: ${activeMode.targetScore})`
    : `${randomMessage} (${activeMode.label} goal: ${activeMode.targetScore})`;
  statusMessage.textContent = "Press Start Game to play again.";
  statusMessage.className = "status-message";

  if (wonGame) {
    playSound("win");
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

function handleDifficultyChange() {
  selectedDifficulty = difficultySelect.value;
  if (gameRunning) return;
  activeMode = DIFFICULTY_MODES[selectedDifficulty] || DIFFICULTY_MODES.normal;
  updateGoalDisplay();
  timeLeft = activeMode.timeLimit;
  updateTimerDisplay();
}

function updateGoalDisplay() {
  const mode = DIFFICULTY_MODES[selectedDifficulty] || DIFFICULTY_MODES.normal;
  modeGoal.textContent = `${mode.label}: Reach ${mode.targetScore} points in ${mode.timeLimit} seconds.`;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function buildMilestones(targetScore) {
  const steps = [
    { ratio: 0.25, text: "Great start! Keep collecting." },
    { ratio: 0.5, text: "Halfway there!" },
    { ratio: 0.75, text: "So close - final push!" },
  ];

  return steps.map((step) => {
    const milestoneScore = Math.max(1, Math.ceil(targetScore * step.ratio));
    return {
      score: milestoneScore,
      message: `${step.text} (${milestoneScore}/${targetScore})`,
    };
  });
}

function checkMilestones() {
  for (const milestone of milestonesForRound) {
    if (score >= milestone.score && !reachedMilestones.has(milestone.score)) {
      reachedMilestones.add(milestone.score);
      statusMessage.textContent = milestone.message;
      statusMessage.className = "status-message good";
    }
  }
}

function initializeSoundEffects() {
  const effects = {};

  Object.entries(SOUND_FILES).forEach(([name, path]) => {
    const audio = new Audio(path);
    audio.preload = "auto";
    effects[name] = audio;
  });

  return effects;
}

function playSound(name) {
  const sound = soundEffects[name];

  if (!sound) {
    playFallbackTone(name);
    return;
  }

  sound.currentTime = 0;
  sound.play().catch(() => {
    playFallbackTone(name);
  });
}

function playFallbackTone(name) {
  const toneMap = {
    button: { frequency: 440, duration: 0.06, type: "square" },
    collect: { frequency: 620, duration: 0.09, type: "sine" },
    miss: { frequency: 240, duration: 0.12, type: "triangle" },
    win: { frequency: 760, duration: 0.18, type: "sine" },
  };

  const tone = toneMap[name];
  if (!tone || typeof window.AudioContext === "undefined") return;

  if (!audioContext) {
    audioContext = new window.AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = tone.type;
  oscillator.frequency.setValueAtTime(tone.frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + tone.duration);
}
