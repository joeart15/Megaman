const megaman = document.getElementById('megaman');
const gameContainer = document.getElementById('game-container');
const startButton = document.getElementById('start-button');
const scoreDisplay = document.getElementById('score');
const startButton1 = document.getElementById('start-button1'); // Get start-button1

let isJumping = false;
let score = 0;
let scoreInterval;

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

startButton.addEventListener('click', () => {
    startButton.style.display = 'none'; // Hide the main start button
    startButton1.style.display = 'none'; // Hide start-button1
    megaman.style.display = 'block'; // Show Mega Man
    megaman.style.animation = 'run 1s steps(10) infinite'; // Start running animation
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

        // Check collision with obstacles
        const obstacle = document.querySelector('.obstacle');
        if (obstacle) {
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

                // Remove projectile
                gameContainer.removeChild(projectile);
                clearInterval(projectileInterval);

                // Check if the obstacle "dies"
                if (currentHealth <= 0) {
                    gameContainer.removeChild(obstacle);
                    resetObstacle(); // Spawn a new obstacle
                }
            }
        }

        // Remove projectile if it goes off-screen
        if (projectileLeft > window.innerWidth) {
            gameContainer.removeChild(projectile);
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
    const spawnObstacle = () => {
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
        obstacle.style.right = '-100px'; // Start off-screen
        gameContainer.appendChild(obstacle);

        // Move the obstacle
        let moveInterval = setInterval(() => {
            let obstacleRight = parseInt(window.getComputedStyle(obstacle).right);
            obstacle.style.right = `${obstacleRight + 5}px`;

            const megamanRect = megaman.getBoundingClientRect();
            const obstacleRect = obstacle.getBoundingClientRect();

            if (
                megamanRect.right >= obstacleRect.left &&
                megamanRect.left <= obstacleRect.right &&
                megamanRect.bottom >= obstacleRect.top &&
                megamanRect.top <= obstacleRect.bottom
            ) {
                clearInterval(moveInterval);
                alert(`Game Over! Final Score: ${score}`);
                window.location.reload();
            }

            // Remove obstacle if it moves off-screen
            if (obstacleRight >= window.innerWidth) {
                clearInterval(moveInterval);
                gameContainer.removeChild(obstacle);
            }
        }, 20);

        // Spawn the next obstacle after a random delay
        setTimeout(spawnObstacle, Math.floor(Math.random() * 3000) + 1000); // Delay between 1-4 seconds
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
    scoreDisplay.textContent = `Score: ${score}`;
    scoreInterval = setInterval(() => {
        score++;
        scoreDisplay.textContent = `Score: ${score}`;
    }, 100);
}

// Event listeners for jump and shoot
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') jump();
    if (e.code === 'KeyF') shoot();
});
