import Phaser from 'phaser';
import { GameStore } from '../core/GameStore';

export class MenuScene extends Phaser.Scene {
    private selectedTrack: string = 'kalinka';

    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.cameras.main;
        const store = GameStore.getInstance();

        // Заголовок
        this.add.text(width / 2, 100, 'BALALAIKA HERO', {
            fontSize: '64px',
            fontStyle: 'bold',
            color: '#ffcc00', // Исправлено: color вместо fill
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // --- ВЫБОР ПЕСНИ ---
        const tracks = ['kalinka', 'katyusha', 'ogorod'];
        tracks.forEach((track, index) => {
            const btn = this.add.text(width / 2, 250 + (index * 60), track.toUpperCase(), {
                fontSize: '32px',
                color: '#ffffff' // Исправлено: color
            }).setOrigin(0.5).setInteractive();

            btn.on('pointerdown', () => {
                this.selectedTrack = track;
                // Подсвечиваем выбранную песню
                this.children.list.forEach(c => {
                    if (c instanceof Phaser.GameObjects.Text && tracks.includes(c.text.toLowerCase())) {
                        c.setStyle({ color: '#ffffff' }); // Исправлено: color
                    }
                });
                btn.setStyle({ color: '#ffcc00' }); // Исправлено: color
            });
        });

        // --- ВЫБОР СЛОЖНОСТИ ---
        this.add.text(width / 2, 450, 'ВЫБЕРИ СЛОЖНОСТЬ:', { 
            fontSize: '24px', 
            color: '#aaaaaa' // Исправлено: color
        }).setOrigin(0.5);

        // Явно указываем тип для литералов, чтобы TS не ругался на store.state.difficulty
        const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
        
        difficulties.forEach((diff, index) => {
            const xPos = (width / 2 - 150) + (index * 150);
            const diffBtn = this.add.text(xPos, 500, diff.toUpperCase(), {
                fontSize: '28px',
                color: '#00ff00', // Исправлено: color
                backgroundColor: '#222222',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setInteractive();

            // Стилизация кнопок
            if (diff === 'medium') diffBtn.setStyle({ color: '#ffff00' });
            if (diff === 'hard') diffBtn.setStyle({ color: '#ff4444' });

            diffBtn.on('pointerdown', () => {
                // Сбрасываем старые очки и комбо перед началом новой игры
                store.state.score = 0;
                store.state.combo = 0;
                
                // Записываем данные в Store
                store.state.currentTrack = this.selectedTrack;
                store.state.difficulty = diff;

                // Запускаем игру
                this.scene.start('GameScene');
            });

            // Эффект наведения
            diffBtn.on('pointerover', () => diffBtn.setScale(1.1));
            diffBtn.on('pointerout', () => diffBtn.setScale(1.0));
        });
    }
}