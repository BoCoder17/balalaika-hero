import Phaser from 'phaser';
import { GameStore } from '../core/GameStore';
import { NoteGenerator, NoteData } from '../mechanics/NoteGenerator';

export class GameScene extends Phaser.Scene {
    private isRoaring: boolean = false;
    private missStreak: number = 0;
    private notesGroup!: Phaser.Physics.Arcade.Group;
    private notesData: NoteData[] = [];
    private currentMusic!: Phaser.Sound.BaseSound;
    private scoreText!: Phaser.GameObjects.Text;
    private comboText!: Phaser.GameObjects.Text;
    private bear!: Phaser.GameObjects.Sprite;
    private isEnding: boolean = false;

    private danceEvent?: Phaser.Time.TimerEvent;

    private patriotBar!: Phaser.GameObjects.Graphics;
    private patriotText!: Phaser.GameObjects.Text;
    private patriotProgress: number = 100;
    
    private totalNotesInLevel: number = 0;
    private successfulHits: number = 0;
    private processedNotes: number = 0;

    private strings: Phaser.GameObjects.Line[] = [];

    private readonly UI_STYLE = {
        fontFamily: 'Ruslan',
        gold: '#ffcc00',
        red: '#b22222',
        redHex: 0xb22222,
        goldHex: 0xffcc00
    };

    constructor() {
        super('GameScene');
    }

    create() {
        this.isEnding = false;
        this.missStreak = 0;
        this.successfulHits = 0;
        this.processedNotes = 0;
        this.strings = [];
        this.stopDancing(); 

        const { width, height } = this.cameras.main;
        const store = GameStore.getInstance();
        store.reset(store.state.difficulty, store.state.currentTrack); 

        // --- 1. ФОН И ТРАЕКТОРИИ ---
        // Градиентная подложка
        const graphicsBg = this.make.graphics({ x: 0, y: 0, add: false });
        graphicsBg.fillGradientStyle(0x1a0505, 0x1a0505, 0x000000, 0x000000, 1);
        graphicsBg.fillRect(0, 0, width, height);
        graphicsBg.generateTexture('main_bg', width, height);
        this.add.image(0, 0, 'main_bg').setOrigin(0, 0).setDepth(-10);

        // Дорожки под струнами
        const trackGraphics = this.add.graphics().setDepth(-5);
        const stringYPositions = [350, 450, 550];

        stringYPositions.forEach((y) => {
            trackGraphics.fillStyle(0xffffff, 0.03); 
            trackGraphics.fillRect(0, y - 20, width, 40);
            
            trackGraphics.lineStyle(1, 0xffffff, 0.05);
            trackGraphics.lineBetween(0, y - 20, width, y - 20);
            trackGraphics.lineBetween(0, y + 20, width, y + 20);
        });

        // Виньетка и затемнение верха
        const overlay = this.add.graphics().setDepth(15);
        overlay.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.8, 0.8, 0, 0);
        overlay.fillRect(0, 0, width, 150);

        // --- 2. ГЕЙМПЛЕЙНЫЕ ОБЪЕКТЫ ---
        // Струны
        stringYPositions.forEach((y) => {
            const line = this.add.line(0, 0, 0, y, width, y, 0xffffff, 0.2);
            line.setOrigin(0, 0);
            line.setLineWidth(2);
            this.strings.push(line);
        });

        // Медведь
        this.bear = this.add.sprite(width / 2, height / 2 + 50, 'bear_sleep');
        this.bear.setScale(0.8).setAlpha(0.8).setDepth(0);

        // Мишени
        const keys = ['A', 'S', 'D'];
        const colors = [0xff4444, 0x4488ff, 0x44ff44];
        
        keys.forEach((keyName, index) => {
            const y = 350 + (index * 100);
            const circle = this.add.circle(150, y, 42);
            circle.setStrokeStyle(4, colors[index], 1);
            circle.setFillStyle(colors[index], 0.2).setDepth(10);

            this.input.keyboard?.on(`keydown-${keyName}`, () => {
                circle.setFillStyle(colors[index], 0.8);
                this.time.delayedCall(100, () => circle.setFillStyle(colors[index], 0.2));
                
                this.tweens.add({
                    targets: this.strings[index],
                    y: "-=4",
                    duration: 50,
                    yoyo: true,
                    repeat: 2,
                    ease: 'Sine.easeInOut'
                });

                this.checkHit(index); 
            });
        });

        // --- 3. ИНТЕРФЕЙС ---
        const textStyle = {
            fontFamily: this.UI_STYLE.fontFamily,
            fontSize: '36px',
            color: this.UI_STYLE.gold,
            stroke: this.UI_STYLE.red,
            strokeThickness: 6,
            shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 4, fill: true }
        };

        this.scoreText = this.add.text(30, 30, 'ОЧКИ: 0', textStyle).setDepth(20);
        this.comboText = this.add.text(30, 80, 'КОМБО: 0', { ...textStyle, fontSize: '26px' }).setDepth(20);
        this.patriotBar = this.add.graphics().setDepth(26);
        this.patriotText = this.add.text(width / 2, 85, 'УРОВЕНЬ ПАТРИОТИЗМА: 100%', {
            fontFamily: this.UI_STYLE.fontFamily,
            fontSize: '20px', color: this.UI_STYLE.gold, stroke: this.UI_STYLE.red, strokeThickness: 4
        }).setOrigin(0.5).setDepth(25);

        // Слушатели и музыка
        this.setupEventListeners(store);
        const trackKey = store.state.currentTrack;
        this.currentMusic = this.sound.add(trackKey, { volume: 0.5 });

        // Ноты
        this.notesGroup = this.physics.add.group();
        const durationMs = (this.currentMusic.duration > 0 ? this.currentMusic.duration : 180) * 1000; 
        this.notesData = NoteGenerator.generate(store.state.currentTrack, store.state.difficulty, durationMs);
        this.totalNotesInLevel = this.notesData.length;
        
        this.currentMusic.play();
        this.updatePatriotismUI();
    }

    private setupEventListeners(store: any) {
        this.input.keyboard?.on('keydown-ESC', () => {
            if (!this.isEnding && !this.scene.isPaused('GameScene')) {
                this.scene.pause(); 
                this.currentMusic.pause(); 
                this.scene.launch('PauseScene');
            }
        });

        this.events.on('resume', () => {
            this.currentMusic.resume();
            if (this.input.keyboard) this.input.keyboard.enabled = true;
        });

        store.on('update', () => {
            if (this.scene.isActive()) {
                this.scoreText.setText(`ОЧКИ: ${store.state.score}`);
                this.comboText.setText(`КОМБО: ${store.state.combo}`);
                this.updateBearState(store.state.combo);
                if (store.state.combo > 0) this.missStreak = 0;
            }
        });
    }

    update() {
        const music = this.currentMusic as any;
        if (!music || !music.isPlaying) return;

        const songTime = music.seek * 1000;

        while (this.notesData.length > 0 && songTime >= this.notesData[0].time) {
            const nextNote = this.notesData.shift();
            if (nextNote) this.spawnNote(nextNote);
        }

        this.notesGroup.getChildren().forEach((note: any) => {
            if (note.x < 50) {
                if (note.getData('type') !== 'bomb') {
                    this.processedNotes++;
                    this.showFeedback(50, note.y, 'ПРОПУЩЕНО', '#777777');
                    this.handleMiss();
                    this.updatePatriotismUI();
                }
                note.destroy();
            }
        });

        if (songTime >= (music.duration * 1000) - 500 || (this.notesData.length === 0 && this.notesGroup.countActive() === 0 && songTime > 5000)) {
            this.endLevel();
        }
    }

    private spawnNote(data: NoteData) {
        const store = GameStore.getInstance();
        const y = 350 + (data.stringId * 100);
        const speedMap: Record<string, number> = { 'easy': -400, 'medium': -600, 'hard': -900 };
        const velocityX = speedMap[store.state.difficulty] || -500;
        let texture = data.type === 'bomb' ? 'note_bomb' : (data.type === 'golden' ? 'note_golden' : 'note_normal'); 
    
        const note = this.physics.add.sprite(1300, y, texture);
        note.setDisplaySize(90, 90).setData('type', data.type).setDepth(5);
    
        this.tweens.add({
            targets: note,
            y: y - 6,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        if (data.type === 'golden') note.setTint(0xffd700);
        this.notesGroup.add(note);
        note.setVelocityX(velocityX); 
    }

    private updatePatriotismUI() {
        const { width } = this.cameras.main;
        const store = GameStore.getInstance();
        this.patriotProgress = store.state.health;
        const barWidth = 400; const barHeight = 22;
        const x = width / 2 - barWidth / 2; const y = 40;
        this.patriotBar.clear();
        this.patriotBar.lineStyle(2, this.UI_STYLE.redHex, 0.8);
        this.patriotBar.strokeRect(x - 6, y - 6, barWidth + 12, barHeight + 12);
        this.patriotBar.lineStyle(4, this.UI_STYLE.goldHex, 1);
        this.patriotBar.strokeRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
        this.patriotBar.fillStyle(0x000000, 0.6);
        this.patriotBar.fillRect(x, y, barWidth, barHeight);
        let barColor = this.UI_STYLE.redHex;
        if (this.patriotProgress > 70) barColor = this.UI_STYLE.goldHex;
        this.patriotBar.fillStyle(barColor, 1);
        const currentWidth = Math.max(0, barWidth * (this.patriotProgress / 100));
        this.patriotBar.fillRect(x, y, currentWidth, barHeight);
        this.patriotText.setText(`УРОВЕНЬ ПАТРИОТИЗМА: ${Math.round(this.patriotProgress)}%`);
    }

    private checkHit(stringIndex: number) {
        const store = GameStore.getInstance();
        const targetY = 350 + (stringIndex * 100);
        let hitDetected = false;
        this.notesGroup.getChildren().forEach((note: any) => {
            const distance = Math.abs(note.x - 150);
            if (note.active && Math.abs(note.y - targetY) < 50 && distance < 100) {
                const type = note.getData('type');
                hitDetected = true;
                this.processedNotes++;
                if (type === 'bomb') {
                    this.showFeedback(150, targetY, 'ВЗРЫВ!', '#ff0000');
                    this.handleMiss();
                    this.cameras.main.shake(200, 0.01);
                } else {
                    const isPerfect = distance < 40;
                    this.successfulHits++; 
                    store.addScore((isPerfect ? 100 : 50) * (type === 'golden' ? 2 : 1), isPerfect);
                    this.showFeedback(150, targetY, isPerfect ? 'ИДЕАЛЬНО!' : 'ХОРОШО!', type === 'golden' ? this.UI_STYLE.gold : '#ffffff');
                }
                this.updatePatriotismUI();
                note.destroy();
            }
        });
        if (!hitDetected) {
            this.showFeedback(150, targetY, 'МИМО!', '#ff4444');
            this.handleMiss();
            this.updatePatriotismUI();
        }
    }

    private startDancing() {
        if (this.danceEvent || this.isRoaring) return;
        this.danceEvent = this.time.addEvent({
            delay: 450,
            callback: () => {
                const nextKey = this.bear.texture.key === 'bear_dance' ? 'bear_dance1' : 'bear_dance';
                this.bear.setTexture(nextKey);
                this.tweens.add({ targets: this.bear, y: this.bear.y - 15, duration: 100, yoyo: true });
            },
            loop: true
        });
    }

    private stopDancing() {
        if (this.danceEvent) { this.danceEvent.destroy(); this.danceEvent = undefined; }
    }

    private handleMiss() {
        this.missStreak++;
        const music = this.currentMusic as any;
        if (music && music.isPlaying) {
            this.tweens.killTweensOf(music);
            this.tweens.add({
                targets: music, volume: 0.1, duration: 80,
                onComplete: () => this.tweens.add({ targets: music, volume: 0.5, delay: 150, duration: 350 })
            });
        }
        if (this.cache.audio.exists('miss_sound')) this.sound.play('miss_sound', { volume: 0.4 });
        if (this.missStreak >= 8) { this.triggerBearRoar(); this.missStreak = 0; }
        GameStore.getInstance().miss();
    }

    private updateBearState(combo: number) {
        if (this.isRoaring) return;
        if (combo >= 50) { this.startDancing(); return; } else { this.stopDancing(); }
        let targetKey = 'bear_sleep';
        if (combo >= 25) targetKey = 'bear_ready';
        else if (combo >= 15) targetKey = 'bear_wake';
        if (this.bear.texture.key !== targetKey) {
            this.bear.setTexture(targetKey);
            this.tweens.add({ targets: this.bear, scale: 0.85, duration: 100, yoyo: true });
        }
    }

    private triggerBearRoar() {
        if (this.isRoaring) return;
        this.stopDancing(); this.isRoaring = true;
        if (this.cache.audio.exists('bear_growl')) this.sound.play('bear_growl', { volume: 0.7 });
        this.bear.setTexture('bear_roar'); this.bear.setTint(0xffaaaa);
        const roarText = this.add.text(this.cameras.main.width / 2, 200, 'Р-Р-РА-А-АР-Р!', {
            fontFamily: 'Ruslan', fontSize: '80px', color: '#ff0000', stroke: '#ffffff', strokeThickness: 10
        }).setOrigin(0.5).setScale(0).setDepth(30);
        this.tweens.add({ targets: roarText, scale: 1.5, alpha: 0, duration: 1200, onComplete: () => roarText.destroy() });
        this.tweens.add({
            targets: this.bear, y: this.bear.y + 50, duration: 100, yoyo: true, repeat: 5,
            onComplete: () => { this.bear.clearTint(); this.isRoaring = false; this.updateBearState(GameStore.getInstance().state.combo); }
        });
        this.cameras.main.shake(300, 0.02);
    }

    private showFeedback(x: number, y: number, text: string, color: string) {
        const feedback = this.add.text(x, y - 40, text, {
            fontFamily: 'Ruslan', fontSize: '24px', color: color, stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);
        this.tweens.add({ targets: feedback, y: y - 100, alpha: 0, duration: 800, onComplete: () => feedback.destroy() });
    }

    private endLevel() {
        if (this.isEnding) return;
        this.isEnding = true;
        this.stopDancing();

        // Расчет точности
        const accuracy = this.totalNotesInLevel > 0 
            ? (this.successfulHits / this.totalNotesInLevel) * 100 
            : 0;

        // Определение ранга
        let rank = 'F';
        if (accuracy >= 95) rank = 'S';
        else if (accuracy >= 85) rank = 'A';
        else if (accuracy >= 70) rank = 'B';
        else if (accuracy >= 50) rank = 'C';

        this.time.delayedCall(1500, () => {
            this.sound.stopAll();
            this.scene.start('ResultScene', {
                hits: this.successfulHits,
                total: this.totalNotesInLevel,
                score: GameStore.getInstance().state.score,
                patriotism: Math.round(this.patriotProgress),
                rank: rank,
                accuracy: Math.round(accuracy)
            });
        });
    }}