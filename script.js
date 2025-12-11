// --- Configuration ---
const ASSETS = {
    bird: "https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/bluebird-midflap.png",
    bg: "https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/background-day.png",
    ground: "https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/base.png",
    pipe: "https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/pipe-green.png"
};

const CVS = document.getElementById("game-canvas");
const CTX = CVS.getContext("2d");

// UI Elements
const scoreEl = document.getElementById("score");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const finalScoreEl = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");

// Game Constants
const DEGREE = Math.PI / 180;
let frames = 0;

// --- State Management ---
const state = {
    current: 0,
    getReady: 0,
    game: 1,
    over: 2
};

// --- Image Loading System ---
const sprites = {};
let assetsLoaded = 0;
const totalAssets = Object.keys(ASSETS).length;

function loadImages() {
    for (let key in ASSETS) {
        sprites[key] = new Image();
        sprites[key].src = ASSETS[key];
        sprites[key].onload = () => {
            assetsLoaded++;
            if (assetsLoaded === totalAssets) {
                // Once all images are loaded, start the loop
                loop();
            }
        };
    }
}

// --- Game Objects ---

const bg = {
    draw: function() {
        CTX.drawImage(sprites.bg, 0, 0, CVS.width, CVS.height);
    }
};

const fg = {
    h: 112, // Height of the floor sprite
    x: 0,
    dx: 2,  // Speed of scrolling
    
    draw: function() {
        // Draw two copies for seamless scrolling
        CTX.drawImage(sprites.ground, this.x, CVS.height - this.h, CVS.width, this.h);
        CTX.drawImage(sprites.ground, this.x + CVS.width, CVS.height - this.h, CVS.width, this.h);
    },
    
    update: function() {
        if (state.current === state.game) {
            this.x = (this.x - this.dx) % (CVS.width / 2); // Simple modulus scrolling
        }
    }
};

const bird = {
    x: 50,
    y: 150,
    w: 34,
    h: 24,
    radius: 12, // Circular collision boundary
    
    speed: 0,
    gravity: 0.25,
    jump: 4.6,
    rotation: 0,
    
    draw: function() {
        CTX.save();
        CTX.translate(this.x, this.y);
        // Rotate bird based on velocity
        CTX.rotate(this.rotation);
        CTX.drawImage(sprites.bird, -this.w/2, -this.h/2, this.w, this.h);
        CTX.restore();
    },
    
    flap: function() {
        this.speed = -this.jump;
    },
    
    update: function() {
        // Physics logic depending on state
        if (state.current === state.getReady) {
            this.y = 150; // Reset position
            this.rotation = 0 * DEGREE;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;

            // Rotation logic
            if(this.speed < this.jump) {
                this.rotation = -25 * DEGREE;
            } else {
                this.rotation += 5 * DEGREE;
                this.rotation = Math.min(this.rotation, 90 * DEGREE); // Cap rotation at 90
            }

            // Floor Collision
            if (this.y + this.h/2 >= CVS.height - fg.h) {
                this.y = CVS.height - fg.h - this.h/2;
                gameOver();
            }
        }
    }
};

const pipes = {
    position: [],
    w: 52,
    h: 400,
    gap: 100, // Space between pipes
    dx: 2,
    maxYPos: -150,
    
    draw: function() {
        for(let i = 0; i < this.position.length; i++){
            let p = this.position[i];
            let topY = p.y;
            let bottomY = p.y + this.h + this.gap;
            
            // Top Pipe (flipped)
            CTX.save();
            CTX.translate(p.x + this.w/2, topY + this.h/2);
            CTX.rotate(Math.PI); // Rotate 180 degrees
            CTX.drawImage(sprites.pipe, -this.w/2, -this.h/2, this.w, this.h);
            CTX.restore();
            
            // Bottom Pipe
            CTX.drawImage(sprites.pipe, p.x, bottomY, this.w, this.h);
        }
    },
    
    update: function() {
        if(state.current !== state.game) return;
        
        // Add new pipe every 100 frames
        if(frames % 120 == 0){
            this.position.push({
                x: CVS.width,
                y: this.maxYPos * (Math.random() + 1)
            });
        }
        
        for(let i = 0; i < this.position.length; i++){
            let p = this.position[i];
            p.x -= this.dx; // Move pipe left
            
            // Collision Detection
            let bottomPipeY = p.y + this.h + this.gap;
            
            // Logic: Is bird within the horizontal area of the pipe?
            if(bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w){
                // Logic: Is bird hitting top pipe OR hitting bottom pipe?
                if(bird.y - bird.radius < p.y + this.h || bird.y + bird.radius > bottomPipeY){
                    gameOver();
                }
            }
            
            // Remove pipes that have gone off screen
            if(p.x + this.w <= 0){
                this.position.shift();
                score.value += 1;
                scoreEl.innerText = score.value;
                // Important: decrement i because array length changed
                i--; 
            }
        }
    },
    
    reset: function() {
        this.position = [];
    }
};

const score = {
    value: 0,
    draw: function() {
        // Handled by HTML overlay mostly, but internal tracking here
    },
    reset: function() {
        this.value = 0;
        scoreEl.innerText = this.value;
    }
};

// --- Control & Game Logic ---

function gameOver() {
    state.current = state.over;
    gameOverScreen.classList.remove("hidden");
    finalScoreEl.innerText = score.value;
}

function resetGame() {
    bird.speed = 0;
    bird.rotation = 0;
    pipes.reset();
    score.reset();
    frames = 0;
    state.current = state.getReady;
    
    gameOverScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
}

function startGame() {
    state.current = state.game;
    startScreen.classList.add("hidden");
    bird.flap();
}

// Input Handler
function inputAction() {
    switch (state.current) {
        case state.getReady:
            startGame();
            break;
        case state.game:
            bird.flap();
            break;
        case state.over:
            // Handled by button, but clicking screen can also restart if desired
            break;
    }
}

// Event Listeners
document.addEventListener("keydown", function(evt) {
    if (evt.code === "Space" || evt.code === "ArrowUp") {
        inputAction();
    }
});

CVS.addEventListener("click", inputAction);
restartBtn.addEventListener("click", resetGame);

// --- The Main Loop ---

function draw() {
    // Clear canvas
    CTX.fillStyle = "#70c5ce"; // Fallback sky color
    CTX.fillRect(0, 0, CVS.width, CVS.height);
    
    bg.draw();
    pipes.draw();
    fg.draw(); // Draw foreground over pipes
    bird.draw();
}

function update() {
    bird.update();
    fg.update();
    pipes.update();
}

function loop() {
    update();
    draw();
    frames++;
    requestAnimationFrame(loop);
}

// Initialize
// Set canvas internal resolution to match CSS display size for crisp rendering
function resizeCanvas() {
    // We hardcode 320x480 for the internal game logic to keep physics consistent,
    // but CSS handles the visual scaling.
    CVS.width = 320;
    CVS.height = 480;
}

resizeCanvas();
loadImages();