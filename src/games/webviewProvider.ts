import * as vscode from 'vscode';
import { closeCountdownClientJs, closeCountdownMarkup, closeCountdownStyles } from '../feed/closeCountdownUi';
import { GameEngine, getRandomBreakText } from './engine';

export class GameWebviewProvider {
    private panel: vscode.WebviewPanel | null = null;
    private gameEngine: GameEngine;
    private extensionUri: vscode.Uri;
    private requestFeedCallback: (() => void) | undefined;
    private muteChatCallback: (() => void) | undefined;

    constructor(extensionUri: vscode.Uri) {
        this.extensionUri = extensionUri;
        this.gameEngine = new GameEngine();
    }

    onRequestFeed(callback: () => void) {
        this.requestFeedCallback = callback;
    }

    onMuteChat(callback: () => void) {
        this.muteChatCallback = callback;
    }

    isOpen(): boolean {
        return this.panel !== null;
    }

    beginCloseCountdown() {
        if (!this.panel) {
            return;
        }
        this.panel.webview.postMessage({ command: 'startCloseCountdown' });
    }

    cancelCloseCountdown() {
        if (!this.panel) {
            return;
        }
        this.panel.webview.postMessage({ command: 'cancelCloseCountdown' });
    }

    showGame(breakText?: string) {
        if (this.panel) {
            this.cancelCloseCountdown();
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'contextSnack',
            '🍿 Context Snack — Game',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this.extensionUri]
            }
        );

        this.panel.webview.html = this.getWebviewContent();
        this.setupMessageHandling();

        this.panel.onDidDispose(() => {
            this.panel = null;
        });

        // Focus the panel when it opens
        this.panel.reveal(vscode.ViewColumn.One, false);

        const randomGame = this.gameEngine.getRandomGame();
        this.panel.webview.postMessage({
            command: 'startGame',
            game: { ...randomGame, breakText: breakText ?? getRandomBreakText() }
        });
    }

    hideGame() {
        if (this.panel) {
            this.panel.dispose();
            this.panel = null;
        }
    }

    getGameEngine(): GameEngine {
        return this.gameEngine;
    }

    private setupMessageHandling() {
        if (!this.panel) return;

        this.panel.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case 'gameOver':
                    this.gameEngine.saveScore(message.game, message.score);
                    // Auto-start next game after 2 seconds
                    setTimeout(() => {
                        const newGame = this.gameEngine.getRandomGame();
                        this.panel?.webview.postMessage({
                            command: 'startGame',
                            game: { ...newGame, breakText: getRandomBreakText() }
                        });
                    }, 2000);
                    break;
                case 'requestNewGame': {
                    const newGame = this.gameEngine.getRandomGame();
                    this.panel?.webview.postMessage({
                        command: 'startGame',
                        game: { ...newGame, breakText: getRandomBreakText() }
                    });
                    break;
                }
                case 'closeGame':
                    this.hideGame();
                    break;
                case 'requestFeed':
                    this.requestFeedCallback?.();
                    break;
                case 'muteChat':
                    this.muteChatCallback?.();
                    break;
                case 'keepOpen':
                    break;
                case 'confirmClose':
                    this.hideGame();
                    break;
            }
        });
    }

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Context Snack</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: #1e1e1e;
            color: #d4d4d4;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 100vh;
            box-sizing: border-box;
        }
        
        h1 {
            text-align: center;
            margin-bottom: 10px;
            color: #569cd6;
        }

        #breakText {
            text-align: center;
            color: #9cdcfe;
            font-style: italic;
            font-size: 13px;
            max-width: 400px;
            margin-bottom: 14px;
            min-height: 18px;
        }
        
        #gameContainer {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        }
        
        #gameCanvas {
            border: 2px solid #569cd6;
            background: #000;
            image-rendering: pixelated;
        }
        
        #gameInfo {
            display: flex;
            gap: 20px;
            font-size: 16px;
        }
        
        #controls {
            text-align: center;
            margin-top: 10px;
            color: #9cdcfe;
        }
        
        button {
            background: #0e639c;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        
        button:hover {
            background: #1177bb;
        }

        #closeBtn {
            background: #5a1d1d;
        }

        #closeBtn:hover {
            background: #7a2626;
        }

        #feedBtn {
            background: #2d5a3d;
        }

        #feedBtn:hover {
            background: #397a4f;
        }

        .game-over {
            text-align: center;
            color: #f14c4c;
            font-size: 18px;
        }
        ${closeCountdownStyles()}
    </style>
</head>
<body>
    <h1>🍿 Context Snack — Game</h1>
    <div id="breakText"></div>
    <div id="gameContainer">
        <canvas id="gameCanvas" width="400" height="300"></canvas>
        <div id="gameInfo">
            <span>Game: <span id="gameName">-</span></span>
            <span>Score: <span id="score">0</span></span>
            <span>High: <span id="highScore">0</span></span>
        </div>
        <div id="gameOverMessage" style="display: none;" class="game-over">
            <div>Game Over! Next game in: <span id="countdown">2</span>s</div>
        </div>
        <div id="controls">
            Use arrow keys or WASD to control<br>
            Space for action
        </div>
        <button id="newGameBtn" onclick="requestNewGame()">New Game</button>
        <button id="feedBtn" onclick="requestFeed()">📰 News instead</button>
        <button id="muteBtn" onclick="muteChat()" title="Mute for this chat only">Mute chat</button>
        <button id="closeBtn" onclick="closeGame()">Close</button>
    </div>
    ${closeCountdownMarkup()}

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const vscode = acquireVsCodeApi();
        
        let currentGame = null;
        let gameState = null;
        let animationId = null;
        
        // Auto-focus when the page loads
        window.addEventListener('load', () => {
            canvas.focus();
            canvas.tabIndex = 1;
        });

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'startGame':
                    cancelCloseCountdown();
                    startGame(message.game);
                    break;
                case 'startCloseCountdown':
                    startCloseCountdown();
                    break;
                case 'cancelCloseCountdown':
                    cancelCloseCountdown();
                    break;
            }
        });

        function startGame(gameData) {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            
            currentGame = gameData;
            document.getElementById('breakText').textContent = gameData.breakText || '';
            document.getElementById('gameName').textContent = gameData.name;
            document.getElementById('score').textContent = '0';
            document.getElementById('highScore').textContent = gameData.highScore || '0';
            document.getElementById('gameOverMessage').style.display = 'none';
            
            gameState = initializeGame(gameData.type);
            lastUpdateTime = performance.now();
            gameLoop(performance.now());
            
            // Auto-focus the canvas for immediate keyboard input
            canvas.focus();
            canvas.tabIndex = 1;
        }

        function initializeGame(gameType) {
            switch (gameType) {
                case 'snake':
                    return initSnake();
                case 'pong':
                    return initPong();
                case 'invaders':
                    return initInvaders();
                default:
                    return initSnake();
            }
        }

        function initSnake() {
            return {
                snake: [{x: 200, y: 140}],
                direction: {x: 20, y: 0}, // Start moving right
                food: {x: Math.floor(Math.random() * 20) * 20, y: Math.floor(Math.random() * 15) * 20},
                score: 0,
                gameOver: false
            };
        }

        function initPong() {
            return {
                paddle: {x: 20, y: 120, width: 10, height: 60},
                ball: {x: 200, y: 150, dx: 1.5, dy: 1, size: 8}, // Much slower ball
                aiPaddle: {x: 370, y: 120, width: 10, height: 60},
                score: 0,
                gameOver: false
            };
        }

        function initInvaders() {
            const invaders = [];
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 10; col++) {
                    invaders.push({
                        x: col * 35 + 25,
                        y: row * 25 + 25,
                        alive: true
                    });
                }
            }
            
            return {
                player: {x: 200, y: 260, width: 24, height: 16},
                invaders: invaders,
                bullets: [],
                invaderBullets: [],
                direction: 1,
                score: 0,
                gameOver: false,
                lastShotTime: 0
            };
        }

        let lastUpdateTime = 0;
        const gameSpeed = {
            snake: 150,     // Update every 150ms (slower)
            pong: 16,       // ~60fps but with slower ball
            invaders: 50    // Update every 50ms (slower)
        };

        function gameLoop(currentTime) {
            if (!gameState || gameState.gameOver) {
                if (gameState && gameState.gameOver) {
                    handleGameOver();
                }
                return;
            }

            const deltaTime = currentTime - lastUpdateTime;
            const targetSpeed = gameSpeed[currentGame.type] || 100;

            if (deltaTime >= targetSpeed) {
                update();
                lastUpdateTime = currentTime;
            }
            
            render();
            animationId = requestAnimationFrame(gameLoop);
        }

        function update() {
            if (!currentGame || !gameState) return;

            switch (currentGame.type) {
                case 'snake':
                    updateSnake();
                    break;
                case 'pong':
                    updatePong();
                    break;
                case 'invaders':
                    updateInvaders();
                    break;
            }
        }

        function updateSnake() {
            if (gameState.direction.x === 0 && gameState.direction.y === 0) return;

            const head = {...gameState.snake[0]};
            head.x += gameState.direction.x;
            head.y += gameState.direction.y;

            // Check boundaries
            if (head.x < 0 || head.x >= 400 || head.y < 0 || head.y >= 300) {
                gameState.gameOver = true;
                return;
            }

            // Check self collision
            if (gameState.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
                gameState.gameOver = true;
                return;
            }

            gameState.snake.unshift(head);

            // Check food collision - make sure food coordinates are on grid
            if (head.x === gameState.food.x && head.y === gameState.food.y) {
                gameState.score += 10;
                // Generate new food on grid
                gameState.food = {
                    x: Math.floor(Math.random() * 20) * 20,
                    y: Math.floor(Math.random() * 15) * 20
                };
            } else {
                gameState.snake.pop();
            }
        }

        function updatePong() {
            gameState.ball.x += gameState.ball.dx;
            gameState.ball.y += gameState.ball.dy;

            if (gameState.ball.y <= 0 || gameState.ball.y >= 300 - gameState.ball.size) {
                gameState.ball.dy = -gameState.ball.dy;
            }

            if (gameState.ball.x <= gameState.paddle.x + gameState.paddle.width &&
                gameState.ball.y >= gameState.paddle.y &&
                gameState.ball.y <= gameState.paddle.y + gameState.paddle.height &&
                gameState.ball.dx < 0) {
                gameState.ball.dx = -gameState.ball.dx;
                gameState.score += 1;
            }

            const aiCenter = gameState.aiPaddle.y + gameState.aiPaddle.height / 2;
            if (gameState.ball.y < aiCenter - 5) {
                gameState.aiPaddle.y = Math.max(0, gameState.aiPaddle.y - 1); // Slower AI
            } else if (gameState.ball.y > aiCenter + 5) {
                gameState.aiPaddle.y = Math.min(300 - gameState.aiPaddle.height, gameState.aiPaddle.y + 1);
            }

            if (gameState.ball.x >= gameState.aiPaddle.x &&
                gameState.ball.y >= gameState.aiPaddle.y &&
                gameState.ball.y <= gameState.aiPaddle.y + gameState.aiPaddle.height &&
                gameState.ball.dx > 0) {
                gameState.ball.dx = -gameState.ball.dx;
            }

            if (gameState.ball.x < 0) {
                gameState.gameOver = true;
            }
        }

        function updateInvaders() {
            let moveDown = false;
            
            for (let invader of gameState.invaders) {
                if (!invader.alive) continue;
                
                invader.x += gameState.direction * 0.3; // Slower invader movement
                
                if (invader.x <= 0 || invader.x >= 380) {
                    moveDown = true;
                }
            }
            
            if (moveDown) {
                gameState.direction *= -1;
                for (let invader of gameState.invaders) {
                    if (invader.alive) {
                        invader.y += 15;
                        if (invader.y > 240) {
                            gameState.gameOver = true;
                        }
                    }
                }
            }

            gameState.bullets = gameState.bullets.filter(bullet => {
                bullet.y -= 6; // Faster bullet speed
                
                for (let invader of gameState.invaders) {
                    if (invader.alive && 
                        bullet.x >= invader.x && bullet.x <= invader.x + 20 &&
                        bullet.y >= invader.y && bullet.y <= invader.y + 15) {
                        invader.alive = false;
                        gameState.score += 10;
                        return false;
                    }
                }
                
                return bullet.y > 0;
            });

            if (Math.random() < 0.005) { // Less frequent enemy shooting
                const aliveInvaders = gameState.invaders.filter(inv => inv.alive);
                if (aliveInvaders.length > 0) {
                    const randomInvader = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
                    gameState.invaderBullets.push({
                        x: randomInvader.x + 10,
                        y: randomInvader.y + 15
                    });
                }
            }

            gameState.invaderBullets = gameState.invaderBullets.filter(bullet => {
                bullet.y += 4; // Faster enemy bullets
                
                if (bullet.x >= gameState.player.x && bullet.x <= gameState.player.x + gameState.player.width &&
                    bullet.y >= gameState.player.y && bullet.y <= gameState.player.y + gameState.player.height) {
                    gameState.gameOver = true;
                    return false;
                }
                
                return bullet.y < 300;
            });

            if (gameState.invaders.every(inv => !inv.alive)) {
                gameState.gameOver = true;
            }
        }

        function render() {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, 400, 300);

            if (!currentGame || !gameState) return;

            ctx.fillStyle = '#fff';

            switch (currentGame.type) {
                case 'snake':
                    renderSnake();
                    break;
                case 'pong':
                    renderPong();
                    break;
                case 'invaders':
                    renderInvaders();
                    break;
            }

            document.getElementById('score').textContent = gameState.score;
        }

        function renderSnake() {
            ctx.fillStyle = '#fff';
            for (let segment of gameState.snake) {
                ctx.fillRect(segment.x, segment.y, 20, 20);
            }
            
            ctx.fillStyle = '#f00';
            ctx.fillRect(gameState.food.x, gameState.food.y, 20, 20);
        }

        function renderPong() {
            ctx.fillRect(gameState.paddle.x, gameState.paddle.y, gameState.paddle.width, gameState.paddle.height);
            ctx.fillRect(gameState.aiPaddle.x, gameState.aiPaddle.y, gameState.aiPaddle.width, gameState.aiPaddle.height);
            ctx.fillRect(gameState.ball.x, gameState.ball.y, gameState.ball.size, gameState.ball.size);
        }

        function renderInvaders() {
            ctx.fillStyle = '#fff';
            
            // Draw player with rounded corners effect
            ctx.fillRect(gameState.player.x + 2, gameState.player.y, gameState.player.width - 4, gameState.player.height);
            ctx.fillRect(gameState.player.x, gameState.player.y + 2, gameState.player.width, gameState.player.height - 4);
            
            // Draw invaders with more interesting shape
            for (let invader of gameState.invaders) {
                if (invader.alive) {
                    // Main body
                    ctx.fillRect(invader.x + 2, invader.y, 16, 12);
                    ctx.fillRect(invader.x, invader.y + 3, 20, 6);
                    // "Legs"
                    ctx.fillRect(invader.x + 1, invader.y + 12, 3, 3);
                    ctx.fillRect(invader.x + 16, invader.y + 12, 3, 3);
                }
            }
            
            // Draw player bullets - wider and more visible
            ctx.fillStyle = '#0f0'; // Green bullets
            for (let bullet of gameState.bullets) {
                ctx.fillRect(bullet.x - 1, bullet.y, 4, 8);
            }
            
            // Draw enemy bullets - red and wider
            ctx.fillStyle = '#f00';
            for (let bullet of gameState.invaderBullets) {
                ctx.fillRect(bullet.x - 1, bullet.y, 4, 6);
            }
        }

        function handleGameOver() {
            vscode.postMessage({
                command: 'gameOver',
                game: currentGame.name,
                score: gameState.score
            });
            
            // Show countdown
            document.getElementById('gameOverMessage').style.display = 'block';
            let countdown = 2;
            const countdownElement = document.getElementById('countdown');
            
            const countdownInterval = setInterval(() => {
                countdown--;
                countdownElement.textContent = countdown;
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    document.getElementById('gameOverMessage').style.display = 'none';
                }
            }, 1000);
        }

        function requestNewGame() {
            vscode.postMessage({
                command: 'requestNewGame'
            });
        }

        function closeGame() {
            vscode.postMessage({
                command: 'closeGame'
            });
        }

        function requestFeed() {
            vscode.postMessage({
                command: 'requestFeed'
            });
        }

        function muteChat() {
            vscode.postMessage({
                command: 'muteChat'
            });
        }

        document.addEventListener('keydown', (e) => {
            if (!gameState || gameState.gameOver) return;

            switch (currentGame.type) {
                case 'snake':
                    handleSnakeInput(e);
                    break;
                case 'pong':
                    handlePongInput(e);
                    break;
                case 'invaders':
                    handleInvadersInput(e);
                    break;
            }
        });

        function handleSnakeInput(e) {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (gameState.direction.y !== 20) {
                        gameState.direction = {x: 0, y: -20};
                    }
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (gameState.direction.y !== -20) {
                        gameState.direction = {x: 0, y: 20};
                    }
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (gameState.direction.x !== 20) {
                        gameState.direction = {x: -20, y: 0};
                    }
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (gameState.direction.x !== -20) {
                        gameState.direction = {x: 20, y: 0};
                    }
                    break;
            }
        }

        function handlePongInput(e) {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    gameState.paddle.y = Math.max(0, gameState.paddle.y - 8); // Slightly slower paddle
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    gameState.paddle.y = Math.min(300 - gameState.paddle.height, gameState.paddle.y + 8);
                    break;
            }
        }

        function handleInvadersInput(e) {
            const currentTime = performance.now();
            
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    gameState.player.x = Math.max(0, gameState.player.x - 5);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    gameState.player.x = Math.min(400 - gameState.player.width, gameState.player.x + 5);
                    break;
                case ' ':
                    e.preventDefault();
                    // Rate limit shooting to prevent spam but allow rapid fire
                    if (currentTime - gameState.lastShotTime > 150) { // Max 6-7 shots per second
                        gameState.bullets.push({
                            x: gameState.player.x + gameState.player.width / 2,
                            y: gameState.player.y
                        });
                        gameState.lastShotTime = currentTime;
                    }
                    break;
            }
        }

        ${closeCountdownClientJs()}
    </script>
</body>
</html>`;
    }
}