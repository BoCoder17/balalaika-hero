import Phaser from 'phaser';

export interface GameState {
    score: number;
    combo: number;
    maxCombo: number;
    health: number; // Наш "Патриотический рейтинг" 0-100
    isGameOver: boolean; // Добавили, чтобы не было ошибок в reset()
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
        isGameOver: false,
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

    /**
     * Полный сброс состояния перед началом уровня
     */
    public reset(difficulty: 'easy' | 'medium' | 'hard', track: string) {
        this.state.score = 0;
        this.state.combo = 0;
        this.state.maxCombo = 0;
        this.state.health = 100;
        this.state.isGameOver = false;
        this.state.difficulty = difficulty;
        this.state.currentTrack = track;
        
        this.emit('update'); // Обновляем UI (очки, комбо, шкалу)
    }

    /**
     * Логика при успешном попадании
     */
    public addScore(points: number, isPerfect: boolean) {
        if (this.state.isGameOver) return;

        this.state.score += points;
        this.state.combo++;
        
        // Обновляем максимальное комбо для экрана результатов
        if (this.state.combo > this.state.maxCombo) {
            this.state.maxCombo = this.state.combo;
        }
        
        // Патриотизм: Идеально восстанавливает больше, чем просто попадание
        // Не даем подняться выше 100
        this.state.health = Math.min(100, this.state.health + (isPerfect ? 3 : 1));
        
        this.emit('update');
    }

    /**
     * Логика при промахе или попадании в бомбу
     */
    public miss() {
        if (this.state.isGameOver) return;

        this.state.combo = 0;
        // Штраф к патриотизму (здоровью)
        this.state.health = Math.max(0, this.state.health - 10);
        
        this.emit('update');
        
        // Если патриотизм упал до нуля
        if (this.state.health <= 0) {
            this.state.isGameOver = true;
            this.emit('gameover');
        }
    }

    /**
     * Полезный геттер для получения текущего процента (если нужно где-то вне GameScene)
     */
    public get patriotismPercent(): number {
        return this.state.health;
    }
}