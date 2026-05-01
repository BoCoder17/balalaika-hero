import Phaser from 'phaser';
import { GameStore } from '../core/GameStore';
import { NoteGenerator, NoteData } from '../mechanics/NoteGenerator';

export class GameScene extends Phaser.Scene {
    private notesGroup!: Phaser.Physics.Arcade.Group;
    private notesData: NoteData[] = [];
    private gameStartTime: number = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private comboText!: Phaser.GameObjects.Text;
    private bear!: Phaser.GameObjects.Sprite;

    constructor() {
        super('GameScene');
    }

    create() {
        // Объявляем переменные ОДИН раз в самом начале
        const { width, height } = this.cameras.main;
        const store = GameStore.getInstance();

        // 1. Визуал струн
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xffffff, 0.3); 
        [350, 450, 550].forEach(y => graphics.lineBetween(0, y, width, y));

        // 2. Медведь (Используем уже объявленные width и height)
        this.bear = this.add.sprite(width / 2, height / 2 + 50, 'bear_sleep');
        this.bear.setScale(0.8);
        this.bear.setAlpha(0.8);
        this.bear.setDepth(0);

        // 3. Зоны нажатия
        const keys = ['A', 'S', 'D'];
        const colors = [0xff4444, 0x4488ff, 0x44ff44];
        
        keys.forEach((keyName, index) => {
            const y = 350 + (index * 100);
            const circle = this.add.circle(150, y, 42);
            circle.setStrokeStyle(4, colors[index], 1);
            circle.setFillStyle(colors[index], 0.2);
            circle.setDepth(10);

            this.input.keyboard?.on(`keydown-${keyName}`, () => {
                circle.setFillStyle(colors[index], 0.8);
                this.time.delayedCall(100, () => circle.setFillStyle(colors[index], 0.2));
                this.checkHit(index); 
            });
        });

        // 4. Интерфейс
        this.scoreText = this.add.text(20, 20, 'ОЧКИ: 0', { 
            fontSize: '32px', 
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6 
        }).setDepth(20);

        this.comboText = this.add.text(20, 60, 'КОМБО: 0', { 
            fontSize: '24px', 
            color: '#ffcc00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4 
        }).setDepth(20);

        // 5. Подписка на обновления стора
        store.on('update', () => {
            this.scoreText.setText(`ОЧКИ: ${store.state.score}`);
            this.comboText.setText(`КОМБО: ${store.state.combo}`);
            this.updateBearState(store.state.combo);
        });

        // 6. Подготовка нот
        this.notesGroup = this.physics.add.group();
        this.notesData = NoteGenerator.generate(store.state.currentTrack, store.state.difficulty);
        this.gameStartTime = this.time.now;
        const trackKey = store.state.currentTrack;
        this.sound.play(trackKey, { volume: 0.5 });
    }

    update(time: number) {
        const elapsed = time - this.gameStartTime;

        if (this.notesData.length > 0 && elapsed >= this.notesData[0].time) {
            const nextNote = this.notesData.shift();
            if (nextNote) this.spawnNote(nextNote);
        }

        this.notesGroup.getChildren().forEach((note: any) => {
            if (note.x < 50) {
                this.showFeedback(50, note.y, 'ПРОПУЩЕНО', '#777777');
                note.destroy();
                GameStore.getInstance().miss();
            }
        });
    }

    private spawnNote(data: NoteData) {
        const y = 350 + (data.stringId * 100);
        const note = this.physics.add.sprite(1300, y, 'note_red_temp');
        this.notesGroup.add(note);
        note.setVelocityX(-400); 
    }

    private checkHit(stringIndex: number) {
        const store = GameStore.getInstance();
        const targetY = 350 + (stringIndex * 100);
        let hitDetected = false;
        const currentScore = store.state.score;

        this.notesGroup.getChildren().forEach((note: any) => {
            const distance = Math.abs(note.x - 150);
            
            if (note.y === targetY && distance < 100) {
                hitDetected = true;
                const isPerfect = distance < 40;
                const feedbackText = isPerfect ? 'ИДЕАЛЬНО!' : 'ХОРОШО!';
                const feedbackColor = isPerfect ? '#ffcc00' : '#ffffff';

                this.showFeedback(150, targetY, feedbackText, feedbackColor);
                store.addScore(isPerfect ? 100 : 50, isPerfect);
                note.destroy();

                if (Math.floor(store.state.score / 1000) > Math.floor(currentScore / 1000)) {
                    this.triggerBearRoar();
                }
            }
        });

        if (!hitDetected) {
            this.showFeedback(150, targetY, 'МИМО!', '#ff4444');
            store.miss();
        }
    }

    // ЛОГИКА ТЕКСТУР МЕДВЕДЯ
    private updateBearState(combo: number) {
        let targetKey = 'bear_sleep';

        if (combo >= 50) {
            targetKey = 'bear_dance';
        } else if (combo >= 25) {
            targetKey = 'bear_ready';
        } else if (combo >= 15) {
            targetKey = 'bear_wake';
        }

        if (this.bear.texture.key !== targetKey) {
            this.bear.setTexture(targetKey);
            this.tweens.add({
                targets: this.bear,
                scale: 0.65,
                duration: 100,
                yoyo: true
            });
        }
    }

    // ЭФФЕКТ РЫКА С ТЕКСТУРОЙ И ЗВУКОМ
    private triggerBearRoar() {
        const { width } = this.cameras.main;
        const store = GameStore.getInstance();

        // 1. ВОСПРОИЗВЕДЕНИЕ ЗВУКА
        // Проверяем, существует ли ключ в кеше звуков перед запуском
        if (this.sound.get('bear_growl') || this.cache.audio.exists('bear_growl')) {
            this.sound.play('bear_growl', { volume: 0.7 });
        }

        // 2. ВИЗУАЛЬНОЕ СОСТОЯНИЕ МЕДВЕДЯ
        this.bear.setTexture('bear_roar');
        this.bear.setTint(0xffaaaa); // Немного краснеет от ярости

        // 3. ТЕКСТОВЫЙ ЭФФЕКТ
        const roarText = this.add.text(width / 2, 200, 'Р-Р-РА-А-АР-Р!', {
            fontSize: '80px',
            fontStyle: 'bold',
            color: '#ff0000',
            stroke: '#ffffff',
            strokeThickness: 10
        }).setOrigin(0.5).setScale(0).setDepth(30);

        this.tweens.add({
            targets: roarText,
            scale: 1.5,
            alpha: { from: 1, to: 0 },
            duration: 1200,
            onComplete: () => roarText.destroy()
        });

        // 4. АНИМАЦИЯ ПРЫЖКА И ТРЯСКИ МЕДВЕДЯ
        this.tweens.add({
            targets: this.bear,
            scale: 0.85,
            y: 600,
            duration: 150,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.bear.clearTint();
                // Возвращаем позу медведя в зависимости от текущего комбо
                this.updateBearState(store.state.combo); 
            }
        });

        // Эффект дрожания камеры
        this.cameras.main.shake(300, 0.02);
    }

    private showFeedback(x: number, y: number, text: string, color: string) {
        const feedback = this.add.text(x, y - 40, text, {
            fontSize: '24px',
            fontStyle: 'bold',
            color: color,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: feedback,
            y: y - 100,
            alpha: 0,
            duration: 800,
            onComplete: () => feedback.destroy()
        });
    }
}