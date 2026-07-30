import * as vscode from 'vscode';

const BREAK_TEXTS: string[] = [
    "Your agent is deep in thought. Here's 90 seconds of pixels to cope.",
    "Big compute happening elsewhere. You get 8-bit graphics.",
    "The agent is \"thinking\". Suspicious. Anyway, here's a game.",
    "Somewhere, tokens are being generated. Here, you can eat dots instead.",
    "This is not a bug, it's a scheduled dopamine break.",
    "While the machine works, please enjoy this equally pointless activity.",
    "Status: agent busy. Status: you, about to lose at Pong.",
    "Consider this a certified productive-procrastination interlude."
];

export function getRandomBreakText(): string {
    return BREAK_TEXTS[Math.floor(Math.random() * BREAK_TEXTS.length)];
}

export interface GameData {
    name: string;
    type: 'snake' | 'pong' | 'invaders' | 'breakout' | 'dodge';
    description: string;
    highScore?: number;
}

export class GameEngine {
    private games: GameData[] = [
        {
            name: 'Hungry Snake',
            type: 'snake',
            description: 'Eat food and grow, but don\'t hit yourself!'
        },
        {
            name: 'Ping Pong',
            type: 'pong',
            description: 'Keep the ball bouncing, don\'t let it fall!'
        },
        {
            name: 'Space Invaders',
            type: 'invaders',
            description: 'Save Earth from the alien invasion!'
        },
        {
            name: 'Brick Breaker',
            type: 'breakout',
            description: 'Clear the bricks before the ball escapes!'
        },
        {
            name: 'Meteor Dodge',
            type: 'dodge',
            description: 'Dodge falling meteors and survive as long as you can!'
        }
    ];

    private readonly STORAGE_KEY = 'contextSnack.scores';

    constructor() {
        this.loadHighScores();
    }

    getRandomGame(): GameData {
        const randomIndex = Math.floor(Math.random() * this.games.length);
        return { ...this.games[randomIndex] };
    }

    saveScore(gameName: string, score: number) {
        const game = this.games.find(g => g.name === gameName);
        if (!game) return;

        if (!game.highScore || score > game.highScore) {
            game.highScore = score;
            this.saveHighScores();
            
            if (score > 0) {
                this.showMeaninglessAchievement(gameName, score);
            }
        }
    }

    private loadHighScores() {
        try {
            const scores = vscode.workspace.getConfiguration().get<{[key: string]: number}>(this.STORAGE_KEY, {});
            for (const game of this.games) {
                if (scores[game.name]) {
                    game.highScore = scores[game.name];
                }
            }
        } catch (error) {
            console.error('Failed to load high scores:', error);
        }
    }

    private saveHighScores() {
        try {
            const scores: {[key: string]: number} = {};
            for (const game of this.games) {
                if (game.highScore) {
                    scores[game.name] = game.highScore;
                }
            }
            vscode.workspace.getConfiguration().update(this.STORAGE_KEY, scores, vscode.ConfigurationTarget.Global);
        } catch (error) {
            console.error('Failed to save high scores:', error);
        }
    }

    private showMeaninglessAchievement(gameName: string, score: number) {
        const achievements = [
            `🏆 New high score! You got ${score} points in ${gameName}`,
            `🎯 Amazing! You achieved ${score} meaningless points`,
            `🌟 Well done! ${score} points of quality procrastination`,
            `🎮 Personal best! ${score} points while the computer works for you`,
            `💫 New achievement! ${score} points of reality avoidance`
        ];

        const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)];
        vscode.window.showInformationMessage(randomAchievement);
    }

    getTotalMeaninglessPoints(): number {
        return this.games.reduce((total, game) => total + (game.highScore || 0), 0);
    }
    getMeaninglessStats(): string {
        const totalPoints = this.getTotalMeaninglessPoints();
        const gamesPlayed = this.games.filter(g => g.highScore && g.highScore > 0).length;
        
        return `Total: ${totalPoints} meaningless points across ${gamesPlayed}/${this.games.length} games`;
    }
}
