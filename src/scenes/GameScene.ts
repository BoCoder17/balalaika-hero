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
    private isEnding: boolean = false;

    constructor() {
        super('GameScene');
    }

    create() {
        this.isEnding = false;
        const { width, height } = this.cameras.main;
        const store = GameStore.getInstance(); // Сначала получаем store

        // 1. Подготовка музыки (важно сделать это до генерации нот)
        const trackKey = store.state.currentTrack;
        const music = this.sound.add(trackKey, { volume: 0.5 });

        // 2. Визуал струн
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xffffff, 0.3); 
        [350, 450, 550].forEach(y => graphics.lineBetween(0, y, width, y));

        // 3. Медведь
        this.bear = this.add.sprite(width / 2, height / 2 + 50, 'bear_sleep');
        this.bear.setScale(0.8).setAlpha(0.8).setDepth(0);

        // 4. Зоны нажатия
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

        // 5. Интерфейс
        this.scoreText = this.add.text(20, 20, 'ОЧКИ: 0', { 
            fontSize: '32px', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6 
        }).setDepth(20);

        this.comboText = this.add.text(20, 60, 'КОМБО: 0', { 
            fontSize: '24px', color: '#ffcc00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 
        }).setDepth(20);

        // 6. Подписка на обновления
        store.on('update', () => {
            if (this.scene.isActive()) {
                this.scoreText.setText(`ОЧКИ: ${store.state.score}`);
                this.comboText.setText(`КОМБО: ${store.state.combo}`);
                this.updateBearState(store.state.combo);
                
                if (store.state.score > 0 && store.state.score % 1000 === 0) {
                    this.triggerBearRoar();
                }
            }
        });

        // 7. Генерация нот на всю длину песни
        this.notesGroup = this.physics.add.group();
        
        // Передаем длительность в мс
        const durationMs = music.duration * 1000;
        this.notesData = NoteGenerator.generate(store.state.currentTrack, store.state.difficulty, durationMs);
        
        this.gameStartTime = this.time.now;
        music.play();
    }

    update(time: number) {
        const elapsed = time - this.gameStartTime;

        // 1. Спавн нот (используем while для точности при микро-фризах)
        while (this.notesData.length > 0 && elapsed >= this.notesData[0].time) {
            const nextNote = this.notesData.shift();
            if (nextNote) this.spawnNote(nextNote);
        }

        // 2. Очистка пропущенных нот
        this.notesGroup.getChildren().forEach((note: any) => {
            if (note.x < 50) {
                if (note.getData('type') !== 'bomb') {
                    this.showFeedback(50, note.y, 'ПРОПУЩЕНО', '#777777');
                    GameStore.getInstance().miss();
                }
                note.destroy();
            }
        });

        // 3. Проверка завершения (только если песня шла дольше 2 сек)
        if (elapsed > 2000 && this.notesData.length === 0 && this.notesGroup.countActive() === 0) {
            if (!this.isEnding) {
                this.isEnding = true;
                this.time.delayedCall(2000, () => {
                    this.sound.stopAll();
                    this.scene.start('ResultScene');
                });
            }
        }
    }

    private spawnNote(data: NoteData) {
        const store = GameStore.getInstance();
        const y = 350 + (data.stringId * 100);
        
        const speedMap: Record<string, number> = { 'easy': -350, 'medium': -500, 'hard': -700 };
        const velocityX = speedMap[store.state.difficulty] || -500;

        let tint = 0xffffff;
        if (data.type === 'bomb') tint = 0x333333; 
        else if (data.type === 'golden') tint = 0xffd700; 

        // Используем временную текстуру, пока не заменим на финальную
        const note = this.physics.add.sprite(1300, y, 'note_red_temp');
        note.setData('type', data.type);
        note.setTint(tint);
        this.notesGroup.add(note);
        note.setVelocityX(velocityX); 
    }

    private checkHit(stringIndex: number) {
        const store = GameStore.getInstance();
        const targetY = 350 + (stringIndex * 100);
        let hitDetected = false;

        this.notesGroup.getChildren().forEach((note: any) => {
            const distance = Math.abs(note.x - 150);
            if (note.active && note.y === targetY && distance < 100) {
                const type = note.getData('type');
                hitDetected = true;

                if (type === 'bomb') {
                    this.showFeedback(150, targetY, 'ВЗРЫВ!', '#ff0000');
                    store.miss();
                    this.cameras.main.shake(200, 0.01);
                } else {
                    const isPerfect = distance < 40;
                    const multiplier = type === 'golden' ? 2 : 1;
                    store.addScore((isPerfect ? 100 : 50) * multiplier, isPerfect);
                    this.showFeedback(150, targetY, isPerfect ? 'ИДЕАЛЬНО!' : 'ХОРОШО!', type === 'golden' ? '#ffd700' : '#ffffff');
                }
                note.destroy();
            }
        });

        if (!hitDetected) {
            this.showFeedback(150, targetY, 'МИМО!', '#ff4444');
            store.miss();
        }
    }

    private updateBearState(combo: number) {
        let targetKey = 'bear_sleep';
        if (combo >= 50) targetKey = 'bear_dance';
        else if (combo >= 25) targetKey = 'bear_ready';
        else if (combo >= 15) targetKey = 'bear_wake';

        if (this.bear.texture.key !== targetKey) {
            this.bear.setTexture(targetKey);
            this.tweens.add({ targets: this.bear, scale: 0.85, duration: 100, yoyo: true });
        }
    }

    private triggerBearRoar() {
        if (this.cache.audio.exists('bear_growl')) this.sound.play('bear_growl', { volume: 0.7 });

        this.bear.setTexture('bear_roar');
        this.bear.setTint(0xffaaaa);

        const roarText = this.add.text(this.cameras.main.width / 2, 200, 'Р-Р-РА-А-АР-Р!', {
            fontSize: '80px', fontStyle: 'bold', color: '#ff0000', stroke: '#ffffff', strokeThickness: 10
        }).setOrigin(0.5).setScale(0).setDepth(30);

        this.tweens.add({ targets: roarText, scale: 1.5, alpha: 0, duration: 1200, onComplete: () => roarText.destroy() });
        this.tweens.add({
            targets: this.bear, y: 600, duration: 150, yoyo: true, repeat: 2,
            onComplete: () => {
                this.bear.clearTint();
                this.updateBearState(GameStore.getInstance().state.combo); 
            }
        });
        this.cameras.main.shake(300, 0.02);
    }

    private showFeedback(x: number, y: number, text: string, color: string) {
        const feedback = this.add.text(x, y - 40, text, {
            fontSize: '24px', fontStyle: 'bold', color: color, stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({ targets: feedback, y: y - 100, alpha: 0, duration: 800, onComplete: () => feedback.destroy() });
    }
}