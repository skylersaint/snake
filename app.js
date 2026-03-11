const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const speedEl = document.getElementById('speed');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const speedRange = document.getElementById('speed-range');
const touchButtons = document.querySelectorAll('.touch button');
const versionEl = document.getElementById('version');

const GRID = 20;
const CELL = canvas.width / GRID;
const STORAGE_KEY = 'snake.best';
const FALLBACK_VERSION = '0.1.0';

let snake;
let direction;
let nextDirection;
let food;
let score;
let best;
let speed;
let running = false;
let lastTick = 0;
let tickInterval = 140;
let paused = false;

function loadBest() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? Number(stored) : 0;
}

function saveBest(value) {
  localStorage.setItem(STORAGE_KEY, String(value));
}

function reset() {
  snake = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  speed = Number(speedRange.value);
  tickInterval = 140 / speed;
  placeFood();
  paused = false;
  running = false;
  updateHud();
  draw();
}

function placeFood() {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  let x, y;
  do {
    x = Math.floor(Math.random() * GRID);
    y = Math.floor(Math.random() * GRID);
  } while (occupied.has(`${x},${y}`));
  food = { x, y };
}

function updateHud() {
  scoreEl.textContent = score;
  bestEl.textContent = best;
  speedEl.textContent = `${speed.toFixed(1)}x`;
  if (versionEl && !versionEl.textContent) {
    versionEl.textContent = `v${FALLBACK_VERSION}`;
  }
}

async function syncVersionFromChangelog() {
  if (!versionEl) return;
  try {
    const res = await fetch('./CHANGELOG.md', { cache: 'no-store' });
    if (!res.ok) throw new Error('fetch failed');
    const text = await res.text();
    const match = text.match(/^## \\[(\\d+\\.\\d+\\.\\d+)\\]/m);
    const version = match ? match[1] : FALLBACK_VERSION;
    versionEl.textContent = `v${version}`;
  } catch (_) {
    versionEl.textContent = `v${FALLBACK_VERSION}`;
  }
}

function start() {
  if (running) return;
  running = true;
  overlay.classList.add('hidden');
  overlayTitle.textContent = 'Go!';
  overlayText.textContent = 'Keep moving. Use Space to pause.';
  requestAnimationFrame(loop);
}

function pause() {
  if (!running) return;
  paused = !paused;
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  overlayTitle.textContent = paused ? 'Paused' : 'Go!';
  overlayText.textContent = paused
    ? 'Press Space or Resume to continue.'
    : 'Keep moving. Use Space to pause.';
  overlay.classList.toggle('hidden', !paused);
}

function gameOver() {
  running = false;
  overlayTitle.textContent = 'Game Over';
  overlayText.textContent = 'Press Restart or Space to try again.';
  overlay.classList.remove('hidden');
  pauseBtn.textContent = 'Pause';
}

function loop(timestamp) {
  if (!running) return;
  if (paused) {
    requestAnimationFrame(loop);
    return;
  }

  if (timestamp - lastTick > tickInterval) {
    step();
    lastTick = timestamp;
  }
  draw();
  requestAnimationFrame(loop);
}

function step() {
  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
    gameOver();
    return;
  }

  for (const segment of snake) {
    if (segment.x === head.x && segment.y === head.y) {
      gameOver();
      return;
    }
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 1;
    if (score > best) {
      best = score;
      saveBest(best);
    }
    placeFood();
  } else {
    snake.pop();
  }

  updateHud();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#fefcf7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ff5f2e';
  ctx.shadowColor = 'rgba(255, 95, 46, 0.4)';
  ctx.shadowBlur = 10;
  ctx.fillRect(food.x * CELL + 4, food.y * CELL + 4, CELL - 8, CELL - 8);
  ctx.shadowBlur = 0;

  snake.forEach((segment, index) => {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1b1b1b');
    gradient.addColorStop(1, '#2ab7ff');
    ctx.fillStyle = gradient;
    const inset = index === 0 ? 3 : 5;
    ctx.fillRect(
      segment.x * CELL + inset,
      segment.y * CELL + inset,
      CELL - inset * 2,
      CELL - inset * 2
    );
  });
}

function setDirection(x, y) {
  if (direction.x === -x && direction.y === -y) return;
  nextDirection = { x, y };
}

function handleKey(event) {
  switch (event.key.toLowerCase()) {
    case 'arrowup':
    case 'w':
      setDirection(0, -1);
      break;
    case 'arrowdown':
    case 's':
      setDirection(0, 1);
      break;
    case 'arrowleft':
    case 'a':
      setDirection(-1, 0);
      break;
    case 'arrowright':
    case 'd':
      setDirection(1, 0);
      break;
    case ' ':
      if (!running) {
        start();
      } else {
        pause();
      }
      break;
    default:
      return;
  }
}

speedRange.addEventListener('input', () => {
  speed = Number(speedRange.value);
  tickInterval = 140 / speed;
  updateHud();
});

startBtn.addEventListener('click', start);
restartBtn.addEventListener('click', () => {
  reset();
  start();
});

pauseBtn.addEventListener('click', pause);

touchButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const dir = btn.getAttribute('data-dir');
    if (dir === 'up') setDirection(0, -1);
    if (dir === 'down') setDirection(0, 1);
    if (dir === 'left') setDirection(-1, 0);
    if (dir === 'right') setDirection(1, 0);
  });
});

window.addEventListener('keydown', handleKey);

best = loadBest();
reset();
syncVersionFromChangelog();
