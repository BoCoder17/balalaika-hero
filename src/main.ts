import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';
import { PauseScene } from './scenes/PauseScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game',
    backgroundColor: '#1a2a3a',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    audio: {
        disableWebAudio: false,
        noAudio: false
    },
    scene: [BootScene, MenuScene, GameScene, ResultScene, PauseScene]
};

// Инициализация игры
new Phaser.Game(config);