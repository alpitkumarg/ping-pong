const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Game settings
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const BALL_RADIUS = 10;
const PLAYER_X = 20;
const AI_X = canvas.width - 20 - PADDLE_WIDTH;
const WINNING_SCORE = 11;
const SERVE_DELAY = 2000; // 2 seconds delay before serving

// Game state
let gameState = 'playing'; // 'playing', 'gameOver', 'serving'
let playerScore = 0;
let aiScore = 0;
let lastScorer = null; // 'player' or 'ai'
let serveTimer = 0;

// Game objects
let playerY = (canvas.height - PADDLE_HEIGHT) / 2;
let aiY = (canvas.height - PADDLE_HEIGHT) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 5;
let ballSpeedY = 3;

// UI elements
const playerScoreElement = document.getElementById('player-score');
const aiScoreElement = document.getElementById('ai-score');
const gameStatusElement = document.getElementById('game-status');

// Background music setup
const bgMusic = document.getElementById('bg-music');
const audioIndicator = document.getElementById('audio-indicator');

// Enhanced background music auto-start on first user interaction
const interactionEvents = ['pointerdown', 'click', 'touchstart', 'keydown'];
interactionEvents.forEach(evtName => {
  window.addEventListener(evtName, tryPlayMusic, { once: true, passive: true });
});

// optional: resume music if it ever stops (e.g., lost focus)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && bgMusic && bgMusic.paused) {
    bgMusic.play().catch(() => {});
  }
});

function tryPlayMusic() {
  if (!bgMusic) return;
  if (bgMusic.paused) {
    bgMusic.volume = 0.5;
    bgMusic.play().catch(err => {
      // most likely gesture restriction — will retry on next interaction
      console.warn('Unable to start background music:', err);
      // retry on next gesture
      interactionEvents.forEach(evtName => {
        window.addEventListener(evtName, tryPlayMusic, { once: true, passive: true });
      });
    });
  }
}

function setAudioIndicator(color) {
  if (audioIndicator) audioIndicator.style.background = color;
}

// initial state
setAudioIndicator('#f44336');

if (bgMusic) {
  console.log('Background music element found:', bgMusic);
  console.log('Initial readyState:', bgMusic.readyState, 'src:', bgMusic.currentSrc || bgMusic.src);
  // log ready state changes
  bgMusic.addEventListener('loadeddata', () => {
    console.log('Audio loaded. readyState =', bgMusic.readyState);
    // yellow = loaded but not yet playing
    setAudioIndicator('#FFC107');
  });
  bgMusic.addEventListener('play', () => {
    console.log('Background music started playing.');
    setAudioIndicator('#4CAF50'); // green = playing
  });
  bgMusic.addEventListener('pause', () => {
    console.log('Background music paused.');
    setAudioIndicator('#f44336');
  });
  bgMusic.addEventListener('error', (e) => {
    console.error('Background music error:', e);
    setAudioIndicator('#f44336');
  });
}

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

function drawText(text, x, y, size = 16, color = '#fff') {
  ctx.fillStyle = color;
  ctx.font = `${size}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

// Game logic functions
function updateScore() {
  playerScoreElement.textContent = playerScore;
  aiScoreElement.textContent = aiScore;
}

function resetBall(serverSide = 'center') {
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  
  // Ball direction depends on who serves
  if (serverSide === 'player') {
    ballSpeedX = Math.abs(ballSpeedX); // Ball goes right (towards AI)
  } else if (serverSide === 'ai') {
    ballSpeedX = -Math.abs(ballSpeedX); // Ball goes left (towards player)
  } else {
    ballSpeedX = Math.random() > 0.5 ? 5 : -5; // Random direction
  }
  
  ballSpeedY = (Math.random() - 0.5) * 6; // Random vertical speed
}

function scorePoint(scorer) {
  if (scorer === 'player') {
    playerScore++;
    lastScorer = 'player';
  } else {
    aiScore++;
    lastScorer = 'ai';
  }
  
  updateScore();
  
  // Check for game winner
  if (playerScore >= WINNING_SCORE || aiScore >= WINNING_SCORE) {
    gameState = 'gameOver';
    const winner = playerScore >= WINNING_SCORE ? 'Player' : 'AI';
    gameStatusElement.textContent = `${winner} Wins! Click to restart`;
    gameStatusElement.style.color = playerScore >= WINNING_SCORE ? '#4CAF50' : '#f44336';
  } else {
    // Prepare for next serve
    gameState = 'serving';
    serveTimer = Date.now() + SERVE_DELAY;
    const server = lastScorer === 'player' ? 'AI' : 'Player';
    gameStatusElement.textContent = `${server} serves in ${Math.ceil(SERVE_DELAY / 1000)}...`;
    gameStatusElement.style.color = '#FFA500';
  }
}

function restartGame() {
  playerScore = 0;
  aiScore = 0;
  gameState = 'serving';
  serveTimer = Date.now() + 1000;
  lastScorer = null;
  resetBall();
  updateScore();
  gameStatusElement.textContent = 'Get ready!';
  gameStatusElement.style.color = '#4CAF50';
}

// Game loop
function render() {
  // Clear
  drawRect(0, 0, canvas.width, canvas.height, '#222');
  drawNet();
  
  // Paddles
  drawRect(PLAYER_X, playerY, PADDLE_WIDTH, PADDLE_HEIGHT);
  drawRect(AI_X, aiY, PADDLE_WIDTH, PADDLE_HEIGHT);
  
  // Ball (only show if game is playing)
  if (gameState === 'playing') {
    drawCircle(ballX, ballY, BALL_RADIUS);
  } else if (gameState === 'serving') {
    // Show semi-transparent ball at center during serve countdown
    drawCircle(ballX, ballY, BALL_RADIUS, 'rgba(255, 255, 255, 0.5)');
  }
  
  // Game status overlay
  if (gameState === 'gameOver') {
    drawRect(0, 0, canvas.width, canvas.height, 'rgba(0, 0, 0, 0.7)');
    const winner = playerScore >= WINNING_SCORE ? 'PLAYER WINS!' : 'AI WINS!';
    drawText(winner, canvas.width/2, canvas.height/2 - 20, 48, '#fff');
    drawText('Click anywhere to restart', canvas.width/2, canvas.height/2 + 30, 24, '#ccc');
  }
}

function update() {
  if (gameState === 'serving') {
    // Handle serve countdown
    const timeLeft = Math.max(0, serveTimer - Date.now());
    if (timeLeft > 0) {
      const secondsLeft = Math.ceil(timeLeft / 1000);
      const server = lastScorer === 'player' ? 'AI' : 'Player';
      gameStatusElement.textContent = `${server} serves in ${secondsLeft}...`;
    } else {
      // Start the game
      gameState = 'playing';
      gameStatusElement.textContent = '';
      // Server gets the ball
      const serverSide = lastScorer === 'player' ? 'ai' : 'player';
      resetBall(serverSide);
    }
    return;
  }
  
  if (gameState !== 'playing') return;

  // Move ball
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Top/bottom wall collision
  if (ballY - BALL_RADIUS < 0 || ballY + BALL_RADIUS > canvas.height) {
    ballSpeedY = -ballSpeedY;
    ballY = ballY - BALL_RADIUS < 0 ? BALL_RADIUS : canvas.height - BALL_RADIUS;
  }

  // Paddle collision (player)
  if (ballSpeedX < 0 && // Ball moving towards player
      ballX - BALL_RADIUS < PLAYER_X + PADDLE_WIDTH &&
      ballX - BALL_RADIUS > PLAYER_X &&
      ballY + BALL_RADIUS > playerY && 
      ballY - BALL_RADIUS < playerY + PADDLE_HEIGHT) {
    
    ballSpeedX = Math.abs(ballSpeedX) + 0.5; // Increase speed slightly and ensure positive
    let collidePoint = (ballY - (playerY + PADDLE_HEIGHT/2)) / (PADDLE_HEIGHT/2);
    ballSpeedY = collidePoint * 5; // More responsive angle control
    ballX = PLAYER_X + PADDLE_WIDTH + BALL_RADIUS; // Prevent sticking
  }

  // Paddle collision (AI)
  if (ballSpeedX > 0 && // Ball moving towards AI
      ballX + BALL_RADIUS > AI_X &&
      ballX + BALL_RADIUS < AI_X + PADDLE_WIDTH &&
      ballY + BALL_RADIUS > aiY && 
      ballY - BALL_RADIUS < aiY + PADDLE_HEIGHT) {
    
    ballSpeedX = -(Math.abs(ballSpeedX) + 0.5); // Increase speed slightly and ensure negative
    let collidePoint = (ballY - (aiY + PADDLE_HEIGHT/2)) / (PADDLE_HEIGHT/2);
    ballSpeedY = collidePoint * 5;
    ballX = AI_X - BALL_RADIUS; // Prevent sticking
  }

  // Scoring: Ball goes off left or right edge
  if (ballX < -BALL_RADIUS) {
    // AI scores (ball went off player's side)
    scorePoint('ai');
  } else if (ballX > canvas.width + BALL_RADIUS) {
    // Player scores (ball went off AI's side)
    scorePoint('player');
  }

  // AI movement (improved)
  let aiCenter = aiY + PADDLE_HEIGHT / 2;
  let targetY = ballY;
  
  // AI skill level - slightly imperfect
  if (ballSpeedX > 0) { // Ball moving towards AI
    let aiSpeed = 4;
    if (aiCenter < targetY - 10) {
      aiY += aiSpeed;
    } else if (aiCenter > targetY + 10) {
      aiY -= aiSpeed;
    }
  } else {
    // When ball is moving away, AI moves to center
    let centerY = canvas.height / 2 - PADDLE_HEIGHT / 2;
    if (aiY < centerY - 5) {
      aiY += 2;
    } else if (aiY > centerY + 5) {
      aiY -= 2;
    }
  }
  
  // Keep AI paddle in bounds
  aiY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, aiY));
}

// Event handlers
canvas.addEventListener('mousemove', function(evt) {
  if (gameState === 'gameOver') return;
  
  let rect = canvas.getBoundingClientRect();
  let mouseY = evt.clientY - rect.top;
  playerY = mouseY - PADDLE_HEIGHT / 2;
  // Boundaries
  playerY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, playerY));
});

canvas.addEventListener('click', function() {
  if (gameState === 'gameOver') {
    restartGame();
  }
});

// Touch support for mobile
canvas.addEventListener('touchmove', function(evt) {
  evt.preventDefault();
  if (gameState === 'gameOver') return;
  
  let rect = canvas.getBoundingClientRect();
  let touch = evt.touches[0];
  let touchY = touch.clientY - rect.top;
  playerY = touchY - PADDLE_HEIGHT / 2;
  playerY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, playerY));
});

canvas.addEventListener('touchstart', function(evt) {
  evt.preventDefault();
  if (gameState === 'gameOver') {
    restartGame();
  }
});

function game() {
  update();
  render();
  requestAnimationFrame(game);
}

// Initialize game
updateScore();
gameStatusElement.textContent = 'Move your mouse to control the paddle!';
gameStatusElement.style.color = '#4CAF50';
resetBall();
game();
