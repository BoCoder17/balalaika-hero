import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

  
    preload() {
    // Картинки
        this.load.image('bear_sleep', '/assets/images/bear_sleep.png');
        this.load.image('bear_wake', '/assets/images/bear_wake.png');
        this.load.image('bear_ready', '/assets/images/bear_ready.png');
        this.load.image('bear_dance', '/assets/images/bear_dance.png');
        this.load.image('bear_roar', '/assets/images/bear_roar.png');
        this.load.image('note_red_temp', '/assets/images/note_red.png');

    // Аудио
        this.load.audio('kalinka', 'assets/audio/fixed_kalinka.mp3');
        this.load.audio('katyusha', 'assets/audio/fixed_katyusha.mp3');
        this.load.audio('ogorod', 'assets/audio/fixed_ogorod.mp3');
        this.load.audio('bear_growl', 'assets/audio/fixed_bear_growl.mp3');
    }

    create() {
        // Когда ВСЁ загрузилось, идем в МЕНЮ, а не в игру
        console.log("Ресурсы готовы, переход в меню...");
        this.scene.start('MenuScene'); 
    }
}