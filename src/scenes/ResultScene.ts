import Phaser from 'phaser';

export class ResultScene extends Phaser.Scene {
    constructor() {
        super('ResultScene');
    }

    create(data: any) {
        const { width, height } = this.cameras.main;

        // Фон (можно использовать тот же градиент)
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a0505, 0x1a0505, 0x000000, 0x000000, 1);
        bg.fillRect(0, 0, width, height);

        // Заголовок
        this.add.text(width / 2, 100, 'ВЫСТУПЛЕНИЕ ОКОНЧЕНО', {
            fontFamily: 'Ruslan', fontSize: '60px', color: '#ffcc00', stroke: '#b22222', strokeThickness: 8
        }).setOrigin(0.5);

        // Ранг (большая буква по центру)
        const rankText = this.add.text(width / 2, height / 2 - 20, data.rank, {
            fontFamily: 'Ruslan', fontSize: '200px', color: this.getRankColor(data.rank),
            stroke: '#ffffff', strokeThickness: 12
        }).setOrigin(0.5).setScale(0);

        // Анимация появления ранга
        this.tweens.add({
            targets: rankText,
            scale: 1,
            duration: 800,
            ease: 'Back.easeOut'
        });

        // Статистика
        const statsStyle = { fontFamily: 'Ruslan', fontSize: '32px', color: '#ffffff' };
        this.add.text(width / 2, height / 2 + 100, `СЧЕТ: ${data.score}`, statsStyle).setOrigin(0.5);
        this.add.text(width / 2, height / 2 + 150, `ТОЧНОСТЬ: ${data.accuracy}% (${data.hits}/${data.total})`, statsStyle).setOrigin(0.5);
        this.add.text(width / 2, height / 2 + 200, `ПАТРИОТИЗМ: ${data.patriotism}%`, statsStyle).setOrigin(0.5);

        // Кнопки
        const btnStyle = { fontFamily: 'Ruslan', fontSize: '40px', color: '#ffcc00' };
        
        const retryBtn = this.add.text(width / 2 - 150, height - 100, '[ ЗАНОВО ]', btnStyle)
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        const menuBtn = this.add.text(width / 2 + 150, height - 100, '[ В МЕНЮ ]', btnStyle)
            .setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Интерактив
        retryBtn.on('pointerdown', () => this.scene.start('GameScene'));
        menuBtn.on('pointerdown', () => this.scene.start('MenuScene')); // Замени на имя своей сцены меню

        [retryBtn, menuBtn].forEach(btn => {
            btn.on('pointerover', () => btn.setScale(1.1).setColor('#ffffff'));
            btn.on('pointerout', () => btn.setScale(1).setColor('#ffcc00'));
        });
    }

    private getRankColor(rank: string): string {
        switch(rank) {
            case 'S': return '#ffcc00'; // Золото
            case 'A': return '#44ff44'; // Зеленый
            case 'B': return '#4488ff'; // Синий
            case 'C': return '#ff8844'; // Оранжевый
            default: return '#ff4444';  // Красный
        }
    }
}