import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        const { width, height } = this.cameras.main;

        // 1. Затемнение
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

        // 2. Заголовок (в стиле Ruslan)
        this.add.text(width / 2, height / 2 - 120, 'ПАУЗА', {
            fontFamily: 'Ruslan',
            fontSize: '64px', 
            color: '#ffcc00',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // 3. Кнопки
        this.createButton(width / 2, height / 2, 'ПРОДОЛЖИТЬ', () => {
            this.scene.resume('GameScene');
            this.scene.stop();
        });

        this.createButton(width / 2, height / 2 + 80, 'ЗАНОВО', () => {
            this.resetGameContext(); 
            this.scene.stop('GameScene');
            this.scene.start('GameScene');
            this.scene.stop();
        });

        // КНОПКА "В МЕНЮ" С ЗАДЕРЖКОЙ
        this.createButton(width / 2, height / 2 + 160, 'В МЕНЮ', () => {
            // 1. Сначала полностью очищаем ввод и звуки
            this.resetGameContext();

            // 2. Используем задержку в 10мс (1 кадр), чтобы Phaser корректно закрыл текущий стек событий
            this.time.delayedCall(10, () => {
                // Останавливаем всё принудительно
                this.scene.stop('GameScene');
                
                // Запускаем Меню
                this.scene.start('MenuScene');
                
                // Останавливаем саму паузу
                this.scene.stop();
            });
        });
    }

    private resetGameContext() {
        // Останавливаем все звуки сразу
        this.sound.stopAll();

        const gameScene = this.scene.get('GameScene');
        
        if (gameScene) {
            // Выключаем таймеры
            gameScene.time.removeAllEvents();
            
            // Разблокируем и чистим ввод, чтобы клавиши не "залипали" в меню
            if (gameScene.input && gameScene.input.keyboard) {
                gameScene.input.keyboard.enabled = true;
                gameScene.input.keyboard.resetKeys();
                gameScene.input.keyboard.removeAllListeners();
            }

            // Убиваем все анимации
            gameScene.tweens.killAll();
        }
    }

    private createButton(x: number, y: number, text: string, callback: () => void) {
        const btn = this.add.text(x, y, text, {
            fontFamily: 'Ruslan',
            fontSize: '32px', 
            color: '#ffffff', 
            backgroundColor: '#333333', 
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', callback)
        .on('pointerover', () => btn.setStyle({ color: '#ffcc00', backgroundColor: '#444444' }))
        .on('pointerout', () => btn.setStyle({ color: '#ffffff', backgroundColor: '#333333' }));
        
        return btn;
    }
}