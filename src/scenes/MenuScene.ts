import Phaser from 'phaser';
import { GameStore } from '../core/GameStore';

export class MenuScene extends Phaser.Scene {
    private selectedTrack: string = 'kalinka';
    private helpOverlay?: Phaser.GameObjects.Container;
    private trackUIs: { bg: Phaser.GameObjects.Rectangle, text: Phaser.GameObjects.Text, key: string }[] = [];

    // Уточненная палитра под твои пожелания
    private readonly COLORS = {
        RED_MAIN: 0xb22222,    // Насыщенный красный (для обводок)
        RED_DARK: 0x4a0000,    // Глубокий бордовый для фона кнопок
        GOLD: 0xffcc00,        // Твой желтый/золотой
        WHITE: 0xffffff,
        BLACK: 0x000000
    };

    constructor() {
        super('MenuScene');
    }

    create() {
        this.trackUIs = [];
        const { width, height } = this.cameras.main;
        const store = GameStore.getInstance();

        // 1. Фон
        const bg = this.add.image(width / 2, height / 2, 'menu_bg');
        bg.setDisplaySize(width, height).setAlpha(1);

        // 2. Декоративные рамки по краям (Желтые с красной обводкой)
        // Основная толстая рамка
        this.add.rectangle(width / 2, height / 2, width - 40, height - 40)
            .setStrokeStyle(6, this.COLORS.GOLD, 0.9);
        // Добавляем красную обводку по краям желтой рамки
        this.add.rectangle(width / 2, height / 2, width - 34, height - 34)
            .setStrokeStyle(2, this.COLORS.RED_MAIN, 0.8);
        this.add.rectangle(width / 2, height / 2, width - 46, height - 46)
            .setStrokeStyle(2, this.COLORS.RED_MAIN, 0.8);

        // 3. Заголовок (Желтый с красной обводкой)
        const title = this.add.text(width / 2, 100, 'BALALAIKA HERO', {
            fontFamily: 'EpilepsySans',
            fontSize: '85px',
            color: '#ffcc00', // Желтый
            stroke: '#b22222', // Красная обводка
            strokeThickness: 10,
            shadow: { offsetX: 4, offsetY: 4, color: '#000', blur: 10, fill: true }
        }).setOrigin(0.5);

        this.tweens.add({ targets: title, scale: 1.03, duration: 1500, yoyo: true, repeat: -1 });

        // 4. Орнамент
        this.add.text(width / 2, 170, '❖ ─── ✦ ─── ❖ ─── ✦ ─── ❖', {
            fontSize: '28px', color: '#ffcc00'
        }).setOrigin(0.5);

        // --- ВЫБОР ПЕСНИ ---
        const tracks = ['kalinka', 'katyusha', 'ogorod'];
        
        tracks.forEach((track, index) => {
            const yPos = 250 + (index * 75);
            
            const bgRect = this.add.rectangle(width / 2, yPos, 340, 55, this.COLORS.RED_DARK, 0.9)
                .setStrokeStyle(3, this.COLORS.RED_MAIN)
                .setInteractive({ useHandCursor: true });

            const btnText = this.add.text(width / 2, yPos, `~ ${track.toUpperCase()} ~`, {
                fontFamily: 'EpilepsySans',
                fontSize: '34px',
                color: '#ffffff',
                stroke: '#000',
                strokeThickness: 4
            }).setOrigin(0.5);

            this.trackUIs.push({ bg: bgRect, text: btnText, key: track });

            bgRect.on('pointerdown', () => {
                this.selectedTrack = track;
                this.updateTrackSelection();
            });

            bgRect.on('pointerover', () => {
                bgRect.setStrokeStyle(4, this.COLORS.GOLD);
                bgRect.setScale(1.05);
            });
            bgRect.on('pointerout', () => {
                this.updateTrackSelection();
                bgRect.setScale(1.0);
            });
        });

        this.time.delayedCall(50, () => {
            this.updateTrackSelection();
        });

        // --- ВЫБОР СЛОЖНОСТИ (Желтый с красной обводкой) ---
        this.add.text(width / 2, 480, 'ВЫБЕРИ СЛОЖНОСТЬ:', { 
            fontFamily: 'EpilepsySans',
            fontSize: '26px', 
            color: '#ffcc00', // Желтый
            stroke: '#b22222', // Красная обводка
            strokeThickness: 6
        }).setOrigin(0.5);

        const difficulties: Array<{ id: 'easy'|'medium'|'hard', name: string, color: number }> = [
            { id: 'easy', name: 'ЛЕГКО', color: 0x228b22 },
            { id: 'medium', name: 'НОРМА', color: 0xd2691e },
            { id: 'hard', name: 'ХАРД', color: 0x8b0000 }
        ];

        difficulties.forEach((diff, index) => {
            const xPos = (width / 2 - 200) + (index * 200);
            
            const diffBg = this.add.rectangle(xPos, 540, 170, 60, diff.color, 1)
                .setStrokeStyle(4, this.COLORS.GOLD)
                .setInteractive({ useHandCursor: true });

            const diffText = this.add.text(xPos, 540, diff.name, {
                fontFamily: 'EpilepsySans',
                fontSize: '28px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 5
            }).setOrigin(0.5);

            diffBg.on('pointerdown', () => {
                store.reset(diff.id, this.selectedTrack);
                this.scene.start('GameScene');
            });

            diffBg.on('pointerover', () => {
                diffBg.setY(535);
                diffText.setY(535);
            });
            diffBg.on('pointerout', () => {
                diffBg.setY(540);
                diffText.setY(540);
            });
        });

        // Кнопка помощи
        const helpBtn = this.add.rectangle(width - 70, 70, 60, 60, this.COLORS.GOLD)
            .setStrokeStyle(4, this.COLORS.RED_MAIN)
            .setInteractive({ useHandCursor: true });
            
        this.add.text(width - 70, 70, '?', {
            fontFamily: 'EpilepsySans', fontSize: '40px', color: '#b22222'
        }).setOrigin(0.5);

        helpBtn.on('pointerdown', () => this.showInstructions());
    }

    private updateTrackSelection() {
        this.trackUIs.forEach(ui => {
            if (ui.text && ui.text.active && ui.text.frame) {
                if (ui.key === this.selectedTrack) {
                    ui.bg.setStrokeStyle(5, this.COLORS.GOLD);
                    ui.bg.setFillStyle(this.COLORS.RED_MAIN, 0.9);
                    ui.text.setStyle({ color: '#ffcc00' });
                } else {
                    ui.bg.setStrokeStyle(3, this.COLORS.RED_MAIN);
                    ui.bg.setFillStyle(this.COLORS.RED_DARK, 0.9);
                    ui.text.setStyle({ color: '#ffffff' });
                }
            }
        });
    }

    private showInstructions() {
        if (this.helpOverlay) return;
        const { width, height } = this.cameras.main;
        const container = this.add.container(0, 0).setDepth(100);

        const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);
        const frameOuter = this.add.rectangle(width / 2, height / 2, 640, 440, this.COLORS.GOLD);
        const frameInner = this.add.rectangle(width / 2, height / 2, 620, 420, this.COLORS.RED_DARK);

        const title = this.add.text(width / 2, height / 2 - 160, 'СОВЕТЫ МАСТЕРА', {
            fontFamily: 'EpilepsySans', fontSize: '42px', color: '#ffcc00', stroke: '#b22222', strokeThickness: 5
        }).setOrigin(0.5);

        const rules = [
            '• Жми [A], [S], [D] точно в цель',
            '• Не пропускай ноты — Медведь расстроится!',
            '• Золотые хиты дают больше очков',
            '• Бомбы — это проигрыш!',
            '',
            'Кликни, чтобы вернуться'
        ];

        const text = this.add.text(width / 2, height / 2 + 30, rules.join('\n'), {
            fontFamily: 'EpilepsySans', fontSize: '24px', color: '#ffffff', align: 'center', lineSpacing: 12
        }).setOrigin(0.5);

        container.add([bg, frameOuter, frameInner, title, text]);
        bg.setInteractive().on('pointerdown', () => {
            container.destroy();
            this.helpOverlay = undefined;
        });
        this.helpOverlay = container;
    }
}