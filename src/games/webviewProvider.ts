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
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 8px 8px 10px;
            background: #171514;
            color: #ebe4dc;
            font-family: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
        }
        body.vscode-light {
            background: #f3eee8;
            color: #1c1917;
        }
        button {
            background: #252321;
            color: #ebe4dc;
            border: 1px solid rgba(255,255,255,0.08);
            padding: 4px 8px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 11px;
            font-family: inherit;
        }
        button:hover {
            background: #2e2b28;
            border-color: rgba(46,184,166,0.35);
        }
        body.vscode-light button {
            background: #fff;
            color: #1c1917;
            border-color: rgba(0,0,0,0.1);
        }
        body.vscode-light button:hover {
            background: #f7f2ec;
            border-color: rgba(20,140,120,0.4);
        }
        #closeBtn { color: #c4a8a0; }
        #closeBtn:hover {
            border-color: rgba(196,168,160,0.35);
            background: #2a2321;
        }
        body.vscode-light #closeBtn:hover { background: #f7f2ec; }
        .shell {
            width: 100%;
            max-width: 520px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .card-chrome {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        body.vscode-light .card-chrome {
            border-bottom-color: rgba(0,0,0,0.08);
        }
        .card-chrome-text {
            display: flex;
            flex-direction: column;
            gap: 1px;
            min-width: 0;
        }
        .card-chrome-title {
            font-size: 13px;
            font-weight: 600;
            color: #ebe4dc;
            letter-spacing: 0.01em;
        }
        body.vscode-light .card-chrome-title { color: #1c1917; }
        .card-chrome-subtitle {
            font-size: 10px;
            font-weight: 500;
            color: #7a726a;
            letter-spacing: 0.01em;
            min-height: 14px;
        }
        body.vscode-light .card-chrome-subtitle { color: #6b635c; }
        .card-chrome-actions {
            display: flex;
            gap: 4px;
            flex-shrink: 0;
            align-items: center;
        }
        .chrome-icon-btn {
            width: 30px;
            height: 28px;
            padding: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            line-height: 1;
        }
        .chrome-icon-btn.is-muted,
        #muteBtn.is-muted {
            opacity: 0.75;
            border-color: rgba(46,184,166,0.4);
        }
        .stage {
            display: flex;
            align-items: stretch;
            gap: 10px;
            background: #d9cdb0;
            border-radius: 22px;
            padding: 16px 12px 16px 16px;
            border: 1px solid #b8a88a;
            box-shadow:
                0 16px 40px rgba(0,0,0,0.45),
                inset 0 1px 0 rgba(255,255,255,0.35),
                inset 0 -1px 0 rgba(90,70,40,0.12);
        }
        body.vscode-light .stage {
            background: #e8dcc4;
            border-color: #c4b496;
            box-shadow:
                0 12px 28px rgba(0,0,0,0.12),
                inset 0 1px 0 rgba(255,255,255,0.55);
        }
        .stage-frame {
            position: relative;
            flex: 1;
            min-width: 0;
            border-radius: 14px;
            overflow: hidden;
            background: #111;
            padding: 7px;
            box-shadow:
                inset 0 0 0 1px #2a2a2a,
                0 1px 0 rgba(255,255,255,0.2);
        }
        #gameCanvas {
            display: block;
            width: 100%;
            height: auto;
            background: #000;
            border: none;
            border-radius: 8px;
            image-rendering: pixelated;
        }
        .screen-glass {
            position: absolute;
            inset: 7px;
            pointer-events: none;
            border-radius: 8px;
            background:
                repeating-linear-gradient(
                    to bottom,
                    transparent 0,
                    transparent 2px,
                    rgba(255,255,255,0.03) 2px,
                    rgba(255,255,255,0.03) 3px
                ),
                radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,0.32) 100%);
        }
        .tv-side {
            width: 28px;
            flex-shrink: 0;
            border-radius: 10px;
            background: #634735;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            padding: 10px 6px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .tv-grill {
            width: 12px;
            flex: 1;
            max-height: 72px;
            margin-bottom: 10px;
            background: repeating-linear-gradient(
                to bottom,
                #3d2a1f 0 2px,
                transparent 2px 5px
            );
            border-radius: 2px;
            opacity: 0.85;
        }
        .tv-led {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #2eb8a6;
            box-shadow: 0 0 5px rgba(46,184,166,0.65);
        }
        .hud {
            position: absolute;
            top: 14px;
            left: 16px;
            right: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
            pointer-events: none;
            font-family: ui-monospace, "IBM Plex Mono", "Cascadia Mono", monospace;
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            text-shadow: 0 1px 2px rgba(0,0,0,0.85);
        }
        .hud-game {
            color: #ebe4dc;
            font-size: 10px;
            letter-spacing: 0.04em;
            text-transform: none;
            max-width: 40%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .hud-score,
        .hud-hi {
            color: #9a9188;
        }
        .hud-score span,
        .hud-hi span {
            color: #ebe4dc;
        }
        .controls-hint {
            position: absolute;
            left: 50%;
            bottom: 12px;
            transform: translateX(-50%);
            max-width: 92%;
            text-align: center;
            font-size: 11px;
            line-height: 1.4;
            color: #c4bbb0;
            padding: 6px 10px;
            border-radius: 8px;
            background: rgba(0,0,0,0.55);
            opacity: 1;
            transition: opacity 0.4s ease;
            pointer-events: none;
        }
        .controls-hint.faded {
            opacity: 0;
        }
        #gameOverMessage.game-over {
            position: absolute;
            inset: 7px;
            border-radius: 8px;
            display: none;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 16px;
            background: rgba(23,21,20,0.78);
            color: #f0a0a0;
            font-size: 15px;
            font-weight: 500;
        }
        body.vscode-light #gameOverMessage.game-over {
            background: rgba(243,238,232,0.88);
            color: #b85c5c;
        }
        .footer-actions {
            display: flex;
            justify-content: center;
            padding-top: 2px;
        }
        #newGameBtn {
            padding: 8px 16px;
            font-size: 12px;
            font-weight: 600;
            background: transparent;
            color: #2eb8a6;
            border-color: rgba(46,184,166,0.35);
        }
        #newGameBtn:hover {
            background: rgba(46,184,166,0.08);
            border-color: rgba(46,184,166,0.5);
        }
        body.vscode-light #newGameBtn {
            background: transparent;
            color: #2eb8a6;
        }
        ${closeCountdownStyles()}
    </style>
</head>
<body>
    <div class="shell">
        <div class="card-chrome">
            <div class="card-chrome-text">
                <div class="card-chrome-title">🍿 Context Snack</div>
                <div class="card-chrome-subtitle" id="breakText"></div>
            </div>
            <div class="card-chrome-actions">
                <button id="muteBtn" class="chrome-icon-btn" onclick="muteChat()" title="Do not pop Context Snack for the current agent conversation" aria-label="Do not pop Context Snack for the current agent conversation">🔕</button>
                <button id="feedBtn" class="chrome-icon-btn" onclick="requestFeed()" title="News instead" aria-label="News instead">📰</button>
                <button id="closeBtn" class="chrome-icon-btn" onclick="closeGame()" title="Close" aria-label="Close">✕</button>
            </div>
        </div>
        <div class="stage">
            <div class="stage-frame">
                <canvas id="gameCanvas" width="400" height="300"></canvas>
                <div class="screen-glass" aria-hidden="true"></div>
                <div class="hud">
                    <div class="hud-game" id="gameName">-</div>
                    <div class="hud-score">SCORE <span id="score">0</span></div>
                    <div class="hud-hi">HI <span id="highScore">0</span></div>
                </div>
                <div id="gameOverMessage" class="game-over">
                    <div>Game Over! Next game in: <span id="countdown">2</span>s</div>
                </div>
                <div id="controls" class="controls-hint">
                    Use arrow keys or WASD to control<br>
                    Space for action
                </div>
            </div>
            <div class="tv-side" aria-hidden="true">
                <div class="tv-grill"></div>
                <span class="tv-led"></span>
            </div>
        </div>
        <div class="footer-actions">
            <button id="newGameBtn" onclick="requestNewGame()">Next game</button>
        </div>
    </div>
    ${closeCountdownMarkup()}

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const vscode = acquireVsCodeApi();
        
        let currentGame = null;
        let gameState = null;
        let animationId = null;
        let controlsHintDismissed = false;

        function fadeControlsHint() {
            if (controlsHintDismissed) return;
            controlsHintDismissed = true;
            const controlsEl = document.getElementById('controls');
            if (controlsEl) {
                controlsEl.classList.add('faded');
            }
        }
        
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
            const gameOverEl = document.getElementById('gameOverMessage');
            gameOverEl.style.display = 'none';
            document.getElementById('countdown').textContent = '2';
            controlsHintDismissed = false;
            const controlsEl = document.getElementById('controls');
            if (controlsEl) {
                controlsEl.classList.remove('faded');
            }
            
            keysDown.clear();
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
                case 'breakout':
                    return initBreakout();
                case 'dodge':
                    return initDodge();
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

        function initBreakout() {
            const bricks = [];
            const cols = 10;
            const rows = 5;
            const brickW = 36;
            const brickH = 12;
            const offsetX = 20;
            const offsetY = 28;
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    bricks.push({
                        x: col * brickW + offsetX,
                        y: row * (brickH + 4) + offsetY,
                        w: brickW - 2,
                        h: brickH,
                        alive: true
                    });
                }
            }
            return {
                paddle: { x: 170, y: 282, width: 60, height: 8 },
                ball: { x: 200, y: 265, dx: 1.5, dy: -1.2, size: 6 },
                bricks: bricks,
                score: 0,
                gameOver: false
            };
        }

        function initDodge() {
            return {
                player: { x: 190, y: 268, width: 20, height: 12 },
                meteors: [],
                score: 0,
                gameOver: false,
                spawnCooldown: 40,
                tick: 0
            };
        }

        const keysDown = new Set();
        document.addEventListener('keyup', (e) => {
            keysDown.delete(e.key);
        });

        let lastUpdateTime = 0;
        const gameSpeed = {
            snake: 150,     // Update every 150ms (slower)
            pong: 16,       // ~60fps but with slower ball
            invaders: 50,    // Update every 50ms (slower)
            breakout: 16,
            dodge: 16
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
                case 'breakout':
                    updateBreakout();
                    break;
                case 'dodge':
                    updateDodge();
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

        function updateBreakout() {
            const ball = gameState.ball;
            const paddle = gameState.paddle;
            if (keysDown.has('ArrowLeft') || keysDown.has('a') || keysDown.has('A')) {
                paddle.x = Math.max(0, paddle.x - 4);
            }
            if (keysDown.has('ArrowRight') || keysDown.has('d') || keysDown.has('D')) {
                paddle.x = Math.min(400 - paddle.width, paddle.x + 4);
            }
            ball.x += ball.dx;
            ball.y += ball.dy;

            if (ball.x <= 0 || ball.x >= 400 - ball.size) {
                ball.dx = -ball.dx;
                ball.x = Math.max(0, Math.min(400 - ball.size, ball.x));
            }
            if (ball.y <= 0) {
                ball.dy = -ball.dy;
                ball.y = 0;
            }

            const ballBottom = ball.y + ball.size;
            const ballRight = ball.x + ball.size;
            if (ballBottom >= paddle.y &&
                ball.y <= paddle.y + paddle.height &&
                ballRight >= paddle.x &&
                ball.x <= paddle.x + paddle.width &&
                ball.dy > 0) {
                ball.dy = -Math.abs(ball.dy);
                const hitPos = (ball.x + ball.size / 2 - paddle.x) / paddle.width - 0.5;
                ball.dx = hitPos * 3;
                if (Math.abs(ball.dx) < 0.8) {
                    ball.dx = ball.dx >= 0 ? 0.8 : -0.8;
                }
                ball.y = paddle.y - ball.size;
            }

            for (let brick of gameState.bricks) {
                if (!brick.alive) continue;
                if (ballRight >= brick.x &&
                    ball.x <= brick.x + brick.w &&
                    ballBottom >= brick.y &&
                    ball.y <= brick.y + brick.h) {
                    brick.alive = false;
                    gameState.score += 10;
                    ball.dy = -ball.dy;
                    break;
                }
            }

            if (ball.y > 300) {
                gameState.gameOver = true;
            }

            if (gameState.bricks.every(b => !b.alive)) {
                gameState.gameOver = true;
            }
        }

        function updateDodge() {
            const player = gameState.player;
            if (keysDown.has('ArrowLeft') || keysDown.has('a') || keysDown.has('A')) {
                player.x = Math.max(0, player.x - 3.5);
            }
            if (keysDown.has('ArrowRight') || keysDown.has('d') || keysDown.has('D')) {
                player.x = Math.min(400 - player.width, player.x + 3.5);
            }
            gameState.tick += 1;
            if (gameState.tick % 40 === 0) {
                gameState.score += 1;
            }
            gameState.spawnCooldown -= 1;
            if (gameState.spawnCooldown <= 0) {
                gameState.meteors.push({
                    x: Math.random() * (400 - 24),
                    y: -16,
                    w: 14 + Math.floor(Math.random() * 10),
                    h: 14 + Math.floor(Math.random() * 8),
                    vy: 1.5 + Math.random() * 1.2
                });
                gameState.spawnCooldown = 45 + Math.floor(Math.random() * 25);
            }

            gameState.meteors = gameState.meteors.filter(m => {
                m.y += m.vy;
                if (m.y > 300) {
                    gameState.score += 5;
                    return false;
                }
                const px = player.x;
                const py = player.y;
                const pw = player.width;
                const ph = player.height;
                if (m.x + m.w > px && m.x < px + pw &&
                    m.y + m.h > py && m.y < py + ph) {
                    gameState.gameOver = true;
                    return false;
                }
                return true;
            });
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
                case 'breakout':
                    renderBreakout();
                    break;
                case 'dodge':
                    renderDodge();
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

        function renderBreakout() {
            ctx.fillStyle = '#fff';
            ctx.fillRect(gameState.paddle.x, gameState.paddle.y, gameState.paddle.width, gameState.paddle.height);
            ctx.fillRect(gameState.ball.x, gameState.ball.y, gameState.ball.size, gameState.ball.size);
            for (let brick of gameState.bricks) {
                if (brick.alive) {
                    ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
                }
            }
        }

        function renderDodge() {
            ctx.fillStyle = '#fff';
            ctx.fillRect(gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height);
            for (let m of gameState.meteors) {
                ctx.fillRect(m.x, m.y, m.w, m.h);
            }
        }

        function handleGameOver() {
            vscode.postMessage({
                command: 'gameOver',
                game: currentGame.name,
                score: gameState.score
            });
            
            // Show countdown
            document.getElementById('gameOverMessage').style.display = 'flex';
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
            const btn = document.getElementById('muteBtn');
            if (btn) {
                btn.textContent = '🔇';
                btn.title = 'Context Snack muted for the current agent conversation';
                btn.setAttribute('aria-label', 'Context Snack muted for the current agent conversation');
                btn.classList.add('is-muted');
            }
            vscode.postMessage({
                command: 'muteChat'
            });
        }

        document.addEventListener('keydown', (e) => {
            keysDown.add(e.key);
            if (!gameState || gameState.gameOver) return;

            fadeControlsHint();

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