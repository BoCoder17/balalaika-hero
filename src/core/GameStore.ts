import Phaser from 'phaser';

export interface GameState {
    score: number;
    combo: number;
    maxCombo: number;
    health: number; // Наш "Патриотический рейтинг" 0-100
    difficulty: 'easy' | 'medium' | 'hard';
    currentTrack: string;
}

export class GameStore extends Phaser.Events.EventEmitter {
    private static instance: GameStore;
    
    public state: GameState = {
        score: 0,
        combo: 0,
        maxCombo: 0,
        health: 100,
        difficulty: 'medium',
        currentTrack: 'Kalinka'
    };

    private constructor() {
        super();
    }

    public static getInstance(): GameStore {
        if (!GameStore.instance) {
            GameStore.instance = new GameStore();
        }
        return GameStore.instance;
    }

    // Сброс перед новой игрой
    public reset(difficulty: 'easy' | 'medium' | 'hard', track: string) {
        this.state.score = 0;
        this.state.combo = 0;
        this.state.maxCombo = 0;
        this.state.health = 100;
        this.state.difficulty = difficulty;
        this.state.currentTrack = track;
        this.emit('update');
    }

    public addScore(points: number, isPerfect: boolean) {
        this.state.score += points;
        this.state.combo++;
        if (this.state.combo > this.state.maxCombo) {
            this.state.maxCombo = this.state.combo;
        }
        
        // Здоровье: PERFECT +3, GOOD +1
        this.state.health = Math.min(100, this.state.health + (isPerfect ? 3 : 1));
        
        this.emit('update'); // Уведомляем UI
    }

    public miss() {
        this.state.combo = 0;
        this.state.health = Math.max(0, this.state.health - 10);
        this.emit('update');
        
        if (this.state.health <= 0) {
            this.emit('gameover');
        }
    }
}