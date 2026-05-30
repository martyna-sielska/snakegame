const board = document.getElementById("board");
const ctx = board.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlaySubtitle = document.getElementById("overlay-subtitle");
const restartBtn = document.getElementById("restart");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const speedInput = document.getElementById("speed");
const sizeInput = document.getElementById("size");

const colors = {
  grid: "rgba(255,255,255,0.25)",
  snake: "#fff1f8",
  snakeGlow: "#ff4fa2",
  food: "#f3178a",
  foodGlow: "#ff9ccc",
  head: "#fff",
  headEye: "#2b0518",
};

let gridSize = Number(sizeInput.value);
let cellSize = board.width / gridSize;
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 5, y: 5 };
let score = 0;
let best = 0;
let running = false;
let paused = false;
let lastTime = 0;
let stepInterval = 1000 / Number(speedInput.value);
let touchStart = null;

function resetGame() {
  gridSize = Number(sizeInput.value);
  cellSize = board.width / gridSize;
  snake = [
    { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) },
    { x: Math.floor(gridSize / 2) - 1, y: Math.floor(gridSize / 2) },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  scoreEl.textContent = score;
  spawnFood();
}

function spawnFood() {
  let placed = false;
  while (!placed) {
    const x = Math.floor(Math.random() * gridSize);
    const y = Math.floor(Math.random() * gridSize);
    const collision = snake.some((segment) => segment.x === x && segment.y === y);
    if (!collision) {
      food = { x, y };
      placed = true;
    }
  }
}

function setOverlay(show, title = "", subtitle = "") {
  if (show) {
    overlay.classList.remove("hidden");
    overlayTitle.textContent = title;
    overlaySubtitle.textContent = subtitle;
  } else {
    overlay.classList.add("hidden");
  }
}

function updateScore() {
  scoreEl.textContent = score;
  if (score > best) {
    best = score;
    bestEl.textContent = best;
    localStorage.setItem("snakeBest", String(best));
  }
}

function drawGrid() {
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  for (let i = 1; i < gridSize; i += 1) {
    const pos = i * cellSize;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, board.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(board.width, pos);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const x = segment.x * cellSize;
    const y = segment.y * cellSize;
    const radius = cellSize * 0.25;

    ctx.fillStyle = index === 0 ? colors.head : colors.snake;
    ctx.shadowColor = colors.snakeGlow;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, radius);
    ctx.fill();

    if (index === 0) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = colors.headEye;
      const eyeOffset = cellSize * 0.25;
      ctx.beginPath();
      ctx.arc(x + eyeOffset, y + eyeOffset, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + cellSize - eyeOffset, y + eyeOffset, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.shadowBlur = 0;
}

function drawFood() {
  const x = food.x * cellSize;
  const y = food.y * cellSize;
  ctx.shadowColor = colors.foodGlow;
  ctx.shadowBlur = 18;
  ctx.fillStyle = colors.food;
  ctx.beginPath();
  ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function draw() {
  ctx.clearRect(0, 0, board.width, board.height);
  drawGrid();
  drawFood();
  drawSnake();
}

function step() {
  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
    gameOver();
    return;
  }

  if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    updateScore();
    spawnFood();
  } else {
    snake.pop();
  }
}

function loop(timestamp) {
  if (!running) {
    return;
  }

  if (!lastTime) {
    lastTime = timestamp;
  }

  const delta = timestamp - lastTime;
  if (delta >= stepInterval) {
    lastTime = timestamp;
    if (!paused) {
      step();
      draw();
    }
  }

  requestAnimationFrame(loop);
}

function startGame() {
  if (!running) {
    running = true;
    paused = false;
    lastTime = 0;
    setOverlay(false);
    requestAnimationFrame(loop);
  }
}

function pauseGame() {
  if (!running) {
    return;
  }
  paused = !paused;
  if (paused) {
    setOverlay(true, "Paused", "Press space to resume");
  } else {
    setOverlay(false);
  }
}

function gameOver() {
  running = false;
  setOverlay(true, "Game over", "Click the button to play again");
}

function handleDirection(x, y) {
  if (direction.x === -x && direction.y === -y) {
    return;
  }
  nextDirection = { x, y };
}

function handleKey(event) {
  const blockedKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];
  if (running && blockedKeys.includes(event.key)) {
    event.preventDefault();
  }
  switch (event.key) {
    case "ArrowUp":
    case "w":
    case "W":
      handleDirection(0, -1);
      break;
    case "ArrowDown":
    case "s":
    case "S":
      handleDirection(0, 1);
      break;
    case "ArrowLeft":
    case "a":
    case "A":
      handleDirection(-1, 0);
      break;
    case "ArrowRight":
    case "d":
    case "D":
      handleDirection(1, 0);
      break;
    case " ":
      pauseGame();
      break;
    default:
      break;
  }
}

function handleTouchStart(event) {
  if (event.touches.length !== 1) {
    return;
  }
  const touch = event.touches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
  event.preventDefault();
  if (!running) {
    resetGame();
    startGame();
  }
}

function handleTouchMove(event) {
  if (running) {
    event.preventDefault();
  }
}

function handleTouchEnd(event) {
  if (!touchStart) {
    return;
  }
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const threshold = 12;
  touchStart = null;
  event.preventDefault();

  if (absX < threshold && absY < threshold) {
    if (running) {
      pauseGame();
    }
    return;
  }

  if (absX > absY) {
    handleDirection(dx > 0 ? 1 : -1, 0);
  } else {
    handleDirection(0, dy > 0 ? 1 : -1);
  }
}

function updateSpeed() {
  stepInterval = 1000 / Number(speedInput.value);
}

function restoreBest() {
  const saved = localStorage.getItem("snakeBest");
  if (saved) {
    best = Number(saved);
    bestEl.textContent = best;
  }
}

restartBtn.addEventListener("click", () => {
  resetGame();
  startGame();
});

startBtn.addEventListener("click", () => {
  resetGame();
  startGame();
});

pauseBtn.addEventListener("click", () => {
  pauseGame();
});

speedInput.addEventListener("input", () => {
  updateSpeed();
});

sizeInput.addEventListener("input", () => {
  resetGame();
  draw();
});

document.addEventListener("keydown", handleKey);
board.addEventListener("touchstart", handleTouchStart, { passive: false });
board.addEventListener("touchmove", handleTouchMove, { passive: false });
board.addEventListener("touchend", handleTouchEnd, { passive: false });

restoreBest();
resetGame();
draw();
setOverlay(true, "Ready?", "Click start to begin");
