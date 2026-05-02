import Phaser from 'phaser';
import { GameStore } from '../core/GameStore';

// ВАЖНО: Проверь, что здесь написано export
export class ResultScene extends Phaser.Scene {
    constructor() {
        super('ResultScene');
    }

    create() {
        const { width, height } = this.cameras.main;
        const store = GameStore.getInstance();

        // Фон
        this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);

        this.add.text(width / 2, 200, 'КОНЕЦ ИГРЫ', {
            fontSize: '64px',
            color: '#ffcc00'
        }).setOrigin(0.5);

        this.add.text(width / 2, 350, `СЧЕТ: ${store.state.score}`, {
            fontSize: '42px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const retryBtn = this.add.text(width / 2, 500, 'В МЕНЮ', {
            fontSize: '32px',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        retryBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}