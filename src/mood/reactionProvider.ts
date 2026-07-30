import * as vscode from 'vscode';
import * as path from 'path';

interface MoodReaction {
    id: string;
    name: string;
    emoji: string;
    description: string;
    hasAnimation: boolean;
    hasSound: boolean;
}

export class MoodReactionProvider {
    private panel: vscode.WebviewPanel | null = null;
    private readonly reactions: MoodReaction[] = [
        {
            id: 'magic',
            name: 'Magic!',
            emoji: '✨',
            description: 'When something works perfectly!',
            hasAnimation: true,
            hasSound: true
        },
        {
            id: 'angry',
            name: 'Angry',
            emoji: '😠',
            description: 'When AI pisses you off!',
            hasAnimation: true,
            hasSound: true
        }
    ];

    constructor(private readonly extensionUri: vscode.Uri) {}

    async showMoodPicker() {
        const items = this.reactions.map(reaction => ({
            label: `${reaction.emoji} ${reaction.name}`,
            description: reaction.description,
            detail: `${reaction.hasAnimation ? 'Animation' : ''} ${reaction.hasSound ? '+ Sound' : ''}`.trim(),
            reaction
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'How are you feeling?',
            title: '🎭 Choose Your Mood Reaction'
        });

        if (selected) {
            this.showReaction(selected.reaction);
        }
    }

    private showReaction(reaction: MoodReaction) {
        if (this.panel) {
            this.panel.dispose();
        }

        this.panel = vscode.window.createWebviewPanel(
            'moodReaction',
            `🎭 ${reaction.name}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: false,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.extensionUri, 'assets'),
                    this.extensionUri
                ]
            }
        );

        this.panel.webview.html = this.getReactionHtml(reaction);
        this.setupMessageHandling(reaction);

        this.panel.onDidDispose(() => {
            this.panel = null;
        });

        setTimeout(() => {
            if (this.panel) {
                this.panel.dispose();
            }
        }, 5000);
    }

    private setupMessageHandling(reaction: MoodReaction) {
        if (!this.panel) {
            return;
        }

        this.panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'playSound':
                    this.playReactionSound(reaction.id);
                    break;
                case 'reactionComplete':
                    break;
            }
        });
    }

    private playReactionSound(reactionId: string) {
        try {
            const terminal = vscode.window.createTerminal({
                name: 'Mood Sound',
                hideFromUser: true
            });

            const soundPath = path.join(this.extensionUri.fsPath, 'assets', 'reactions', reactionId, 'sound.mp3');

            if (process.platform === 'darwin') {
                terminal.sendText(`if [ -f "${soundPath}" ]; then afplay "${soundPath}" && sleep 0.5; else afplay /System/Library/Sounds/Sosumi.aiff && sleep 0.5; fi`);
            } else if (process.platform === 'win32') {
                terminal.sendText(`if exist "${soundPath}" (start /wait "" "${soundPath}") else (rundll32 user32.dll,MessageBeep && timeout /t 1)`);
            } else {
                terminal.sendText(`if [ -f "${soundPath}" ]; then paplay "${soundPath}" && sleep 0.5; else echo -e "\\a" && sleep 0.5; fi`);
            }

            setTimeout(() => {
                terminal.dispose();
            }, 5000);
        } catch (error) {
            console.log('Could not play reaction sound:', error);
            vscode.window.showInformationMessage(`${reactionId === 'magic' ? '✨ MAGIC!' : '😠 AAARRRGHHH!'}`);
        }
    }

    private getReactionHtml(reaction: MoodReaction): string {
        const assetPath = this.panel!.webview.asWebviewUri(
            vscode.Uri.file(path.join(this.extensionUri.fsPath, 'assets', 'reactions', reaction.id))
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reaction.name}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #1e1e1e;
            color: #d4d4d4;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
        }
        .reaction-container {
            text-align: center;
            max-width: 600px;
            animation: slideIn 0.5s ease-out;
        }
        .reaction-title {
            font-size: 48px;
            margin-bottom: 20px;
            color: #569cd6;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        .reaction-media {
            margin: 20px 0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            max-width: 500px;
            max-height: 400px;
        }
        .reaction-gif, .reaction-png {
            width: 100%;
            height: auto;
            display: block;
        }
        .reaction-fallback {
            font-size: 120px;
            margin: 40px 0;
            animation: bounce 2s infinite;
        }
        .close-timer {
            margin-top: 20px;
            font-size: 14px;
            color: #9cdcfe;
            opacity: 0.7;
        }
        @keyframes slideIn {
            from { transform: scale(0.8) translateY(-50px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-20px); }
            60% { transform: translateY(-10px); }
        }
        .pulse { animation: pulse 1.5s infinite; }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    </style>
</head>
<body>
    <div class="reaction-container">
        <div class="reaction-title">${reaction.emoji} ${reaction.name}</div>
        <div class="reaction-media" id="mediaContainer">
            <img id="reactionImage" class="reaction-gif" style="display: none;" />
            <div class="reaction-fallback" id="fallback">${reaction.emoji}</div>
        </div>
        <div class="close-timer">This will close automatically in <span id="countdown">5</span> seconds</div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        const assetPath = '${assetPath}';
        function tryLoadAssets() {
            const img = document.getElementById('reactionImage');
            const fallback = document.getElementById('fallback');
            const gifSrc = assetPath + '/animation.gif';
            const pngSrc = assetPath + '/image.png';
            const testGif = new Image();
            testGif.onload = function() {
                img.src = gifSrc;
                img.style.display = 'block';
                fallback.style.display = 'none';
                img.classList.add('pulse');
            };
            testGif.onerror = function() {
                const testPng = new Image();
                testPng.onload = function() {
                    img.src = pngSrc;
                    img.style.display = 'block';
                    fallback.style.display = 'none';
                    img.classList.add('pulse');
                };
                testPng.onerror = function() {
                    fallback.style.display = 'block';
                };
                testPng.src = pngSrc;
            };
            testGif.src = gifSrc;
        }
        tryLoadAssets();
        setTimeout(() => {
            vscode.postMessage({ command: 'playSound' });
        }, 800);
        let countdown = 5;
        const countdownElement = document.getElementById('countdown');
        const timer = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            if (countdown <= 0) {
                clearInterval(timer);
                vscode.postMessage({ command: 'reactionComplete' });
            }
        }, 1000);
    </script>
</body>
</html>`;
    }
}
