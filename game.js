const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Game settings
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const BALL_RADIUS = 10;
const PLAYER_X = 20;
const AI_X = canvas.width - 20 - PADDLE_WIDTH;
let playerY = (canvas.height - PADDLE_HEIGHT) / 2;
let aiY = (canvas.height - PADDLE_HEIGHT) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 5;
let ballSpeedY = 3;

// Draw functions
function drawRect(x, y, w, h, color='#fff') {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color='#fff') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

function drawNet() {
  for (let i = 0; i < canvas.height; i += 30) {
    drawRect(canvas.width/2 - 1, i, 2, 18, '#aaa');
  }
}

// Game loop
function render() {
  // Clear
  drawRect(0, 0, canvas.width, canvas.height, '#222');
  drawNet();
  // Paddles
  drawRect(PLAYER_X, playerY, PADDLE_WIDTH, PADDLE_HEIGHT);
  drawRect(AI_X, aiY, PADDLE_WIDTH, PADDLE_HEIGHT);
  // Ball
  drawCircle(ballX, ballY, BALL_RADIUS);
}

function update() {
  // Move ball
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Top/bottom wall collision
  if (ballY - BALL_RADIUS < 0 || ballY + BALL_RADIUS > canvas.height) {
    ballSpeedY = -ballSpeedY;
  }

  // Paddle collision (player)
  if (ballX - BALL_RADIUS < PLAYER_X + PADDLE_WIDTH &&
      ballY > playerY && ballY < playerY + PADDLE_HEIGHT) {
    ballSpeedX = -ballSpeedX;
    // Add some "spin"
    let collidePoint = (ballY - (playerY + PADDLE_HEIGHT/2));
    ballSpeedY = collidePoint * 0.15;
    ballX = PLAYER_X + PADDLE_WIDTH + BALL_RADIUS; // Prevent sticking
  }

  // Paddle collision (AI)
  if (ballX + BALL_RADIUS > AI_X &&
      ballY > aiY && ballY < aiY + PADDLE_HEIGHT) {
    ballSpeedX = -ballSpeedX;
    let collidePoint = (ballY - (aiY + PADDLE_HEIGHT/2));
    ballSpeedY = collidePoint * 0.15;
    ballX = AI_X - BALL_RADIUS; // Prevent sticking
  }

  // Left/right wall: reset
  if (ballX < 0 || ballX > canvas.width) {
    // Center ball
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    // Reverse direction
    ballSpeedX = -ballSpeedX;
    ballSpeedY = 3 * (Math.random() > 0.5 ? 1 : -1);
  }

  // AI movement (basic)
  let aiCenter = aiY + PADDLE_HEIGHT / 2;
  if (aiCenter < ballY - 20) {
    aiY += 5;
  } else if (aiCenter > ballY + 20) {
    aiY -= 5;
  }
  // Boundaries
  aiY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, aiY));
}

// Player paddle follows mouse
canvas.addEventListener('mousemove', function(evt) {
  let rect = canvas.getBoundingClientRect();
  let mouseY = evt.clientY - rect.top;
  playerY = mouseY - PADDLE_HEIGHT / 2;
  // Boundaries
  playerY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, playerY));
});

function game() {
  update();
  render();
  requestAnimationFrame(game);
}

game();
