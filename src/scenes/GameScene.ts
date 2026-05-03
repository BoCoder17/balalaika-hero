import Phaser from 'phaser';
import { GameStore } from '../core/GameStore';
import { NoteGenerator, NoteData } from '../mechanics/NoteGenerator';

export class GameScene extends Phaser.Scene {
    private stringYPositions = [450, 550, 650];
    private bg!: Phaser.GameObjects.TileSprite;
    private bgDirection: number = 1;
    private bgOffset: number = 0;
    private isRoaring: boolean = false;
    private missStreak: number = 0;
    private notesGroup!: Phaser.Physics.Arcade.Group;
    private notesData: NoteData[] = [];
    private currentMusic!: Phaser.Sound.BaseSound;
    private scoreText!: Phaser.GameObjects.Text;
    private comboText!: Phaser.GameObjects.Text;
    private bear!: Phaser.GameObjects.Sprite;
    private isEnding: boolean = false;

    private comboGlow!: Phaser.GameObjects.Rectangle;
    private lastHitTime: number = 0;
    private danceEvent?: Phaser.Time.TimerEvent;

    private patriotBar!: Phaser.GameObjects.Graphics;
    private patriotText!: Phaser.GameObjects.Text;
    private patriotProgress: number = 100;
    
    private totalNotesInLevel: number = 0;
    private successfulHits: number = 0;
    private processedNotes: number = 0;

    private strings: any[] = [];

    private readonly UI_STYLE = {
        fontFamily: 'EpilepsySans',
        gold: '#ffcc00',
        red: '#b22222',
        redHex: 0xb22222,
        goldHex: 0xffcc00
    };

    constructor() {
        super('GameScene');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        const backgrounds = ['bg1', 'bg2', 'bg3'];
        const randomBg = Phaser.Utils.Array.GetRandom(backgrounds);
        this.isEnding = false;
        this.missStreak = 0;
        this.successfulHits = 0;
        this.processedNotes = 0;
        this.strings = [];
        this.stopDancing();
        this.bg = this.add.tileSprite(
            0,
            0,
            this.scale.width,
            this.scale.height,
            randomBg
        ).setOrigin(0).setDepth(-20);
        this.tweens.add({
            targets: this.bg,
            alpha: 1,
            duration: 1000
        });
        this.comboGlow = this.add.rectangle(
            0,
            0,
            this.scale.width,
            this.scale.height,
            0xffff00,
            0
        ).setOrigin(0).setDepth(5);
        const darkOverlay = this.add.rectangle(
            0,
            0,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.5 
        ).setOrigin(0).setDepth(-15);

        const store = GameStore.getInstance();
        store.reset(store.state.difficulty, store.state.currentTrack); 

        const graphicsBg = this.make.graphics({ x: 0, y: 0, });
        graphicsBg.fillGradientStyle(0x1a0505, 0x1a0505, 0x000000, 0x000000, 1);
        graphicsBg.fillRect(0, 0, width, height);
        graphicsBg.generateTexture('main_bg', width, height);
        this.add.image(0, 0, 'main_bg').setOrigin(0, 0).setDepth(-10);


            
        const balalaika = this.add.image(
                550,
                this.scale.height - 2050,
                'balalaika'
            );

            balalaika.setScale(2);
            balalaika.setDepth(8);

            balalaika.setAngle(90);

        const overlay = this.add.graphics().setDepth(15);
        overlay.fillGradientStyle(
            0x000000, 0x000000,
            0x000000, 0x000000,
            0.4, 0.4, 0, 0
        );

        this.strings = [];

        this.stringYPositions.forEach((y) => {

            const points = [];
            const segments = 30;
            const width = this.scale.width;

            for (let i = 0; i <= segments; i++) {
                const x = (i / segments) * width;

                points.push({
                    x,
                    y,
                    baseY: y,
                    velocity: 0
                });
            }

            const g = this.add.graphics().setDepth(2);

            this.strings.push({
                points,
                graphics: g
            });
        });

        this.bear = this.add.sprite(width / 2, height / 2 + 30, 'bear_sleep');
        this.bear.setScale(0.9).setAlpha(1).setDepth(-1);

        const keys = ['A', 'S', 'D'];
        const colors = [0xff4444, 0x4488ff, 0x44ff44];
        
        keys.forEach((keyName, index) => {
            const y = this.stringYPositions[index];

    const hitLine = this.add.rectangle(
        150,
        y,
        20,
        80,
        colors[index],
        0.6
    ).setDepth(10);
        const perfectZone = this.add.rectangle(
            150,
            y,
            6,
            80,
            0xffffff,
            0.2
        ).setDepth(12);

    const keyText = this.add.text(150, y, keyName, {
        fontFamily: this.UI_STYLE.fontFamily,
        fontSize: '28px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    })
    .setOrigin(0.5)
    .setAlpha(0.5)
    .setDepth(11);

    this.input.keyboard?.on(`keydown-${keyName}`, () => {

        hitLine.setAlpha(1);
        this.time.delayedCall(100, () => {
            hitLine.setAlpha(0.6);
        });

        keyText.setScale(1.2);
        this.tweens.add({
            targets: keyText,
            scale: 1,
            duration: 100
        });

        this.checkHit(index);
    });
});

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

        this.setupEventListeners(store);
        const trackKey = store.state.currentTrack;
                this.currentMusic = this.sound.add(trackKey, { volume: 0.5 });

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
            const combo = store.state.combo;

            if (combo >= 5) {
                this.tweens.add({
                targets: this.comboText,
                scale: 1.2,
                duration: 100,
                yoyo: true
            });
        }

        if (combo >= 15) {
            this.cameras.main.zoomTo(1.03, 100);
        }

        if (combo >= 25) {
            this.cameras.main.shake(50, 0.002);
        }
    });
}

    update() {
        this.updateStrings();
        this.bgOffset += 0.3 * this.bgDirection;
        this.bg.setScale(1.1);

        this.tweens.add({
            targets: this.bg,
            x: "+=20",
            duration: 4000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
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
        const stringYPositions = [450, 550, 650];
        const y = stringYPositions[data.stringId];
        const speedMap: Record<string, number> = { 'easy': -300, 'medium': -450, 'hard': -600 };
        const velocityX = speedMap[store.state.difficulty] || -500;
        let texture = data.type === 'bomb' ? 'note_bomb' : (data.type === 'golden' ? 'note_golden' : 'note_normal'); 
    
        const note = this.physics.add.sprite(1300, y, texture);
        note.setDisplaySize(90, 90).setData('type', data.type).setDepth(5);

        if (data.type === 'golden') note.setTint(0xffd700);
        this.notesGroup.add(note);
        note.setVelocityX(velocityX);

        note.setAlpha(0.9);

        this.tweens.add({
            targets: note,
            alpha: 1,
            duration: 300,
            yoyo: true,
            repeat: -1
        }); 
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
        
        const baseY = this.stringYPositions[stringIndex];

        this.tweens.add({
            targets: this.cameras.main,
            zoom: 1.02,
            duration: 80,
            yoyo: true
        });

        this.tweens.add({
            targets: this.comboText,
            scale: 1.3,
            duration: 80,
            yoyo: true
        });
        

        this.tweens.addCounter({
            from: 0,
            to: Math.PI,
            duration: 300,
            ease: 'Sine.easeOut',
            onUpdate: (tween) => {
                const value = tween.getValue();
            },
            onComplete: () => {
                    }
                });
        const store = GameStore.getInstance();
        const stringYPositions = [450, 550, 650];
        const targetY = this.stringYPositions[stringIndex];
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
                    const isPerfect = distance < 15;

                    if (isPerfect) {
                        this.hitString(stringIndex);
                    }
                    if (isPerfect) {
                        this.cameras.main.shake(60, 0.002);

                        this.tweens.add({
                        targets: this.scoreText,
                        scale: 1.2,
                        duration: 100,
                        yoyo: true
                        });
                    }
                    this.successfulHits++;

                    const score = (isPerfect ? 100 : 50) * (type === 'golden' ? 2 : 1);
                    store.addScore(score, isPerfect);


                    if (isPerfect) {
                    store.state.combo += 1;
                    }
                    this.showFeedback(150, targetY, isPerfect ? 'ИДЕАЛЬНО!' : 'ХОРОШО!', type === 'golden' ? this.UI_STYLE.gold : '#ffffff');
                    if (isPerfect) {

                        this.tweens.add({
                            targets: this.comboText,
                            scale: 1.4,
                            duration: 100,
                            yoyo: true
                        });
}
                }
                
                this.cameras.main.shake(80, 0.003);
                this.updatePatriotismUI();
        
        
        
        this.time.delayedCall(100, () => {
            note.destroy();
        });
    }
        });
        if (!hitDetected) {
            this.showFeedback(150, targetY, 'МИМО!', '#ff4444');
            this.handleMiss();
            this.updatePatriotismUI();

            this.cameras.main.shake(100, 0.005);
            this.cameras.main.flash(100, 255, 0, 0);
            for (let i = 0; i < 3; i++) {
            const wave = this.add.circle(150, targetY, 6, 0xffffff, 0.8)
                .setDepth(6);

            this.tweens.add({
                targets: wave,
                x: this.scale.width,
                alpha: 0,
                scale: 0.3,
                duration: 400 + i * 100,
                delay: i * 50,
                ease: 'Sine.easeOut',
                onComplete: () => wave.destroy()
                });
            }
            this.tweens.add({
                targets: this.strings[stringIndex],
                scaleY: 1.4,
                duration: 80,
                yoyo: true
            });
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

    if (combo >= 20) { 
        this.startDancing(); 
        return; 
    } else { 
        this.stopDancing(); 
    }

    let targetKey = 'bear_sleep';

    if (combo >= 12) targetKey = 'bear_ready';
    else if (combo >= 6) targetKey = 'bear_wake';

    if (this.bear.texture.key !== targetKey) {
        this.bear.setTexture(targetKey);

        this.tweens.add({
            targets: this.bear,
            scale: 0.85,
            duration: 100,
            yoyo: true
        });
    }
}

    private triggerBearRoar() {
        if (this.isRoaring) return;
        this.stopDancing(); this.isRoaring = true;
        if (this.cache.audio.exists('bear_growl')) this.sound.play('bear_growl', { volume: 0.7 });
        this.bear.setTexture('bear_roar'); this.bear.setTint(0xffaaaa);
        const roarText = this.add.text(this.cameras.main.width / 2, 200, 'Р-Р-РА-А-АР-Р!', {
            fontFamily: this.UI_STYLE.fontFamily, fontSize: '80px', color: '#ff0000', stroke: '#ffffff', strokeThickness: 10
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
            fontFamily: this.UI_STYLE.fontFamily, fontSize: '24px', color: color, stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);
        this.tweens.add({ targets: feedback, y: y - 100, alpha: 0, duration: 800, onComplete: () => feedback.destroy() });
    }

    private updateStrings() {
    this.strings.forEach((string) => {

        const g = string.graphics;
        const points = string.points;

        for (let i = 1; i < points.length - 1; i++) {
            const p = points[i];
            const left = points[i - 1];
            const right = points[i + 1];

            const restore = (p.baseY - p.y) * 0.15;

            const spread = (left.y + right.y - 2 * p.y) * 0.15;

            p.velocity += restore + spread;

            p.velocity *= 0.8;
            if (Math.abs(p.velocity) < 0.05) {
                p.velocity = 0;
            }

            p.y += p.velocity;

            if (Math.abs(p.y - p.baseY) < 0.5 && p.velocity === 0) {
                p.y = p.baseY;
            }

            const maxOffset = 40;
            if (p.y > p.baseY + maxOffset) p.y = p.baseY + maxOffset;
            if (p.y < p.baseY - maxOffset) p.y = p.baseY - maxOffset;
        }

        g.clear();
        g.lineStyle(3, 0xffffff, 0.85);
        g.beginPath();

        points.forEach((p: any, i: number) => {
            if (i === 0) g.moveTo(p.x, p.y);
            else g.lineTo(p.x, p.y);
        });

        g.strokePath();
    });
}

private hitString(index: number) {
    if (this.lastHitTime && this.time.now - this.lastHitTime < 100) return;
        this.lastHitTime = this.time.now;
    const string = this.strings[index];
    if (!string) return;

    const points = string.points;

    const hitX = 150;

    let closest = 0;
    let minDist = Infinity;

    points.forEach((p: any, i: number) => {
        const dist = Math.abs(p.x - hitX);
        if (dist < minDist) {
            minDist = dist;
            closest = i;
        }
    });

        points[closest].velocity = -18;

        if (points[closest - 1]) points[closest - 1].velocity = -10;
        if (points[closest + 1]) points[closest + 1].velocity = -10;
        
}

    private endLevel() {
        if (this.isEnding) return;
        this.isEnding = true;
        this.stopDancing();

        const accuracy = this.totalNotesInLevel > 0 
            ? (this.successfulHits / this.totalNotesInLevel) * 100 
            : 0;

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