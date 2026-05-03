import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

  
    preload() {
        this.load.image('bear_sleep', '/assets/images/bear_sleep.png');
        this.load.image('bear_wake', '/assets/images/bear_wake.png');
        this.load.image('bear_ready', '/assets/images/bear_ready.png');
        this.load.image('bear_dance', '/assets/images/bear_dance.png');
        this.load.image('bear_dance1', '/assets/images/bear_dance1.png');
        this.load.image('bear_roar', '/assets/images/bear_roar.png');

        this.load.image('particle', '/assets/images/particle.png');

        this.load.image('balalaika', '/assets/images/bala.png');

        this.load.image('bg1', '/assets/images/bg1.png');
        this.load.image('bg2', '/assets/images/bg2.png');
        this.load.image('bg3', '/assets/images/bg3.png');

        this.load.font('EpilepsySans', '/assets/fonts/EpilepsySans.ttf');

        this.load.image('note_normal', '/assets/images/matryoshka.png');
        this.load.image('note_golden', '/assets/images/matryoshka_gold.png');   
        this.load.image('note_bomb', '/assets/images/bomb.png');    

        this.load.image('menu_bg', '/assets/images/menu-background.png');

        this.load.audio('kalinka', 'assets/audio/fixed_kalinka.mp3');
        this.load.audio('katyusha', 'assets/audio/fixed_katyusha.mp3');
        this.load.audio('ogorod', 'assets/audio/fixed_ogorod.mp3');
        this.load.audio('bear_growl', 'assets/audio/fixed_bear_growl.mp3');
        this.load.audio('miss_sound', 'assets/audio/miss_sound.mp3');
    }

    create() {
        console.log("Ресурсы готовы, переход в меню...");
        this.scene.start('MenuScene'); 
    }
}