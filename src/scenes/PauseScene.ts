import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        const { width, height } = this.cameras.main;

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

        this.add.text(width / 2, height / 2 - 120, 'ПАУЗА', {
            fontFamily: 'Ruslan',
            fontSize: '64px', 
            color: '#ffcc00',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

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

        this.createButton(width / 2, height / 2 + 160, 'В МЕНЮ', () => {
            this.resetGameContext();

            this.time.delayedCall(10, () => {
                this.scene.stop('GameScene');
                
                this.scene.start('MenuScene');
                
                this.scene.stop();
            });
        });
    }

    private resetGameContext() {
        this.sound.stopAll();

        const gameScene = this.scene.get('GameScene');
        
        if (gameScene) {
            gameScene.time.removeAllEvents();
            
            if (gameScene.input && gameScene.input.keyboard) {
                gameScene.input.keyboard.enabled = true;
                gameScene.input.keyboard.resetKeys();
                gameScene.input.keyboard.removeAllListeners();
            }

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