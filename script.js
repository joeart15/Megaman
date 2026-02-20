const megaman = document.getElementById('megaman');
const gameContainer = document.getElementById('game-container');
const startButton = document.getElementById('start-button');
const scoreDisplay = document.getElementById('score');
const credits = document.getElementById('credits');
const jumpButton = document.getElementById('jump-button');
const shootButton = document.getElementById('shoot-button');

let isJumping = false;
let score = 0;
let scoreInterval;
let gameRunning = false;
let isShooting = false;
let spawnTimeout;

// Array of obstacle characters
const characters = [
    'resized_character_1.png',
    'resized_character_3.png',
    'resized_character_5.png',
    'resized_character_7.png',
    'resized_character_9.png',
    'resized_character_15.png',
    'resized_character_17.png',
    'resized_character_19.png'
];

jumpButton.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevents default touch behavior
    jump();
});

shootButton.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevents default touch behavior
    shoot();
});


startButton.addEventListener('click', () => {
    startButton.style.display = 'none';
    credits.style.display = 'none';
    megaman.style.display = 'block';
    megaman.style.animation = 'run 1s steps(10) infinite';
    document.getElementById('instructions').style.display = 'none';
    startObstacleMovement();
    startScoreCounter();
});

function jump() {
    if (isJumping) return; // Prevent double jumps
    isJumping = true;

    let jumpHeight = 225; // Increased jump height (default was 200)
    let jumpSpeed = 5; // Increased jump speed for faster movement

    let upInterval = setInterval(() => {
        let megamanBottom = parseInt(window.getComputedStyle(megaman).bottom);
        if (megamanBottom >= jumpHeight) { // Stop going up at max height
            clearInterval(upInterval);
            let downInterval = setInterval(() => {
                if (megamanBottom <= 20) { // Return to ground level
                    clearInterval(downInterval);
                    isJumping = false;
                } else {
                    megamanBottom -= jumpSpeed; // Faster falling
                    megaman.style.bottom = `${megamanBottom}px`;
                }
            }, 20);
        } else {
            megamanBottom += jumpSpeed; // Faster rising
            megaman.style.bottom = `${megamanBottom}px`;
        }
    }, 20);
}


// Shooting functionality
function shoot() {
    if (isShooting) return;
    isShooting = true;
    setTimeout(() => { isShooting = false; }, 300);

    // Temporarily set the shooting sprite
    megaman.style.background = "url('megaman-shooting-transparent-resized.png') no-repeat";
    megaman.style.animation = "none"; // Stop the running animation

    const projectile = document.createElement('div');
    projectile.classList.add('projectile');
    projectile.style.left = `${megaman.offsetLeft + 105}px`; // Adjusted to the top-right corner
    projectile.style.bottom = `${parseInt(window.getComputedStyle(megaman).bottom) + 50}px`; // Aligned with the blaster

    gameContainer.appendChild(projectile);

    // Move the projectile
    let projectileInterval = setInterval(() => {
        let projectileLeft = parseInt(projectile.style.left);
        projectile.style.left = `${projectileLeft + 10}px`;

        // Check collision with ALL obstacles
        const obstacles = document.querySelectorAll('.obstacle');
        for (const obstacle of obstacles) {
            let obstacleRect = obstacle.getBoundingClientRect();
            let projectileRect = projectile.getBoundingClientRect();

            if (
                projectileRect.right >= obstacleRect.left &&
                projectileRect.left <= obstacleRect.right &&
                projectileRect.bottom >= obstacleRect.top &&
                projectileRect.top <= obstacleRect.bottom
            ) {
                // Reduce obstacle health
                let currentHealth = parseInt(obstacle.dataset.health);
                currentHealth -= 1;
                obstacle.dataset.health = currentHealth;

                // Update health bar
                const healthFill = obstacle.querySelector('.health-fill');
                if (healthFill) {
                    healthFill.style.width = (currentHealth / 3 * 100) + '%';
                    if (currentHealth <= 1) healthFill.style.backgroundColor = 'red';
                    else if (currentHealth <= 2) healthFill.style.backgroundColor = 'orange';
                }

                // Hit flash
                obstacle.classList.add('hit');
                setTimeout(() => obstacle.classList.remove('hit'), 150);

                // Remove projectile
                if (gameContainer.contains(projectile)) gameContainer.removeChild(projectile);
                clearInterval(projectileInterval);

                // Check if the obstacle "dies"
                if (currentHealth <= 0) {
                    score += 50;
                    updateScoreDisplay();
                    if (gameContainer.contains(obstacle)) gameContainer.removeChild(obstacle);
                }
                return;
            }
        }

        // Remove projectile if it goes off-screen
        if (projectileLeft > window.innerWidth) {
            if (gameContainer.contains(projectile)) gameContainer.removeChild(projectile);
            clearInterval(projectileInterval);
        }
    }, 20);

    // Revert back to the running animation after shooting
    setTimeout(() => {
        megaman.style.background = "url('megaman-sprite-single-row-resized.png') no-repeat";
        megaman.style.animation = "run 1s steps(10) infinite"; // Restart running animation
    }, 500); // Match the duration of the shooting animation
}

function startObstacleMovement() {
    gameRunning = true;
    const spawnObstacle = () => {
        if (!gameRunning) return;

        const obstacle = document.createElement('div');
        obstacle.classList.add('obstacle');
        obstacle.dataset.health = 3; // Initialize obstacle health to 3

        // Randomly select a character for the obstacle
        const randomCharacter = selectRandomCharacter();
        obstacle.style.backgroundImage = `url(${randomCharacter})`;
        obstacle.style.backgroundSize = 'contain';
        obstacle.style.backgroundRepeat = 'no-repeat';
        obstacle.style.width = '90px';
        obstacle.style.height = '105px';
        obstacle.style.position = 'absolute';

        // Randomize starting position (horizontal position off-screen)
        obstacle.style.bottom = `${Math.floor(Math.random() * 150) + 20}px`; // Randomize vertical position

        // Add health bar
        const healthBar = document.createElement('div');
        healthBar.className = 'health-bar';
        const healthFill = document.createElement('div');
        healthFill.className = 'health-fill';
        healthBar.appendChild(healthFill);
        obstacle.appendChild(healthBar);

        gameContainer.appendChild(obstacle);

        // Track position as JS variable (avoid getComputedStyle in hot loop)
        let obstacleRight = -100;
        obstacle.style.right = `${obstacleRight}px`;

        // Move the obstacle
        let moveInterval = setInterval(() => {
            if (!gameRunning) {
                clearInterval(moveInterval);
                return;
            }

            const speed = Math.min(10, 5 + Math.floor(score / 200));
            obstacleRight += speed;
            obstacle.style.right = `${obstacleRight}px`;

            const megamanRect = megaman.getBoundingClientRect();
            const obstacleRect = obstacle.getBoundingClientRect();

            if (
                megamanRect.right >= obstacleRect.left &&
                megamanRect.left <= obstacleRect.right &&
                megamanRect.bottom >= obstacleRect.top &&
                megamanRect.top <= obstacleRect.bottom
            ) {
                clearInterval(moveInterval);
                gameOver();
            }

            // Remove obstacle if it moves off-screen
            if (obstacleRight >= window.innerWidth) {
                clearInterval(moveInterval);
                if (gameContainer.contains(obstacle)) gameContainer.removeChild(obstacle);
            }
        }, 20);

        // Spawn the next obstacle after a delay based on score
        const spawnDelay = Math.floor(Math.random() * 2000) + Math.max(500, 1000 - Math.floor(score / 100) * 50);
        spawnTimeout = setTimeout(spawnObstacle, spawnDelay);
    };

    // Start the first obstacle
    spawnObstacle();
}

// Function to randomly select a character
function selectRandomCharacter() {
    const randomIndex = Math.floor(Math.random() * characters.length);
    return characters[randomIndex];
}

// Score counter
function startScoreCounter() {
    score = 0;
    updateScoreDisplay();
    scoreInterval = setInterval(() => {
        score++;
        updateScoreDisplay();
    }, 100);
}

function updateScoreDisplay() {
    const highScore = parseInt(localStorage.getItem('megaman_highscore') || '0');
    scoreDisplay.textContent = `Score: ${score}  Best: ${highScore}`;
}

function gameOver() {
    gameRunning = false;
    clearInterval(scoreInterval);
    clearTimeout(spawnTimeout);
    stopAutoPlay();

    const highScore = parseInt(localStorage.getItem('megaman_highscore') || '0');
    if (score > highScore) localStorage.setItem('megaman_highscore', score);

    const newHigh = parseInt(localStorage.getItem('megaman_highscore') || '0');
    document.getElementById('game-over-score').textContent = `Score: ${score}`;
    document.getElementById('game-over-best').textContent = `Best: ${newHigh}`;
    document.getElementById('game-over-overlay').style.display = 'flex';
}

document.getElementById('play-again-button').addEventListener('click', () => {
    document.getElementById('game-over-overlay').style.display = 'none';
    document.querySelectorAll('.obstacle').forEach(el => el.remove());
    document.querySelectorAll('.projectile').forEach(el => el.remove());
    megaman.style.display = 'block';
    megaman.style.animation = 'run 1s steps(10) infinite';
    startObstacleMovement();
    startScoreCounter();
});

// Adaptive instructions
if ('ontouchstart' in window) {
    const inst = document.getElementById('instructions');
    inst.textContent = 'Tap Shoot to fire';
    inst.appendChild(document.createElement('br'));
    inst.appendChild(document.createTextNode('Tap Jump to jump'));
}

// Event listeners for jump and shoot
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') jump();
    if (e.code === 'KeyF') shoot();
    if (e.code === 'KeyP') toggleAutoPlay();
});

// ── AI Auto-Play ──────────────────────────────────────────────
let autoPlay = false;
let autoPlayInterval = null;

function startAutoPlay() {
    if (autoPlayInterval) return;
    autoPlayInterval = setInterval(() => {
        if (!gameRunning) return;

        const obstacles = Array.from(document.querySelectorAll('.obstacle'));
        if (obstacles.length === 0) return;

        const megaRect = megaman.getBoundingClientRect();

        // Find the nearest obstacle in front of Megaman
        let nearest = null;
        let nearestDist = Infinity;
        for (const o of obstacles) {
            const r = o.getBoundingClientRect();
            const dist = r.left - megaRect.right;
            if (dist >= -20 && dist < nearestDist) {
                nearest = { el: o, rect: r, dist };
                nearestDist = dist;
            }
        }
        if (!nearest) return;

        const oRect = nearest.rect;
        const verticalOverlap = !(megaRect.bottom < oRect.top || megaRect.top > oRect.bottom);
        const horiz = nearest.dist;

        // Close + low enemy → jump
        if (horiz <= 140 && !isJumping && (oRect.bottom >= (window.innerHeight - 160) || verticalOverlap)) {
            jump();
            return;
        }

        // Shoot at anything within range
        if (horiz <= 600) {
            shoot();
        }
    }, 100);
}

function stopAutoPlay() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
}

function toggleAutoPlay() {
    autoPlay = !autoPlay;
    const btn = document.getElementById('ai-toggle');
    if (autoPlay) {
        startAutoPlay();
        if (btn) { btn.textContent = '🤖 AI: ON'; btn.style.backgroundColor = '#27ae60'; }
    } else {
        stopAutoPlay();
        if (btn) { btn.textContent = '🤖 AI: OFF'; btn.style.backgroundColor = '#888'; }
    }
}
