import Phaser from 'phaser';
import { GameStore } from '../core/GameStore';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.cameras.main;
        const store = GameStore.getInstance();

        this.add.text(width / 2, 100, 'ВЫБЕРИ ТРЕК', { fontSize: '48px', color: '#ffcc00' }).setOrigin(0.5);

        // Связываем текст кнопки с ключом из BootScene
        const trackList = [
            { name: 'Калинка', id: 'kalinka' },
            { name: 'Во саду ли, в огороде', id: 'ogorod' },
            { name: 'Катюша', id: 'katyusha' }
        ];
        
        trackList.forEach((track, index) => {
            const btn = this.add.text(width / 2, 250 + (index * 70), track.name, {
                fontSize: '32px',
                backgroundColor: '#ff3366',
                padding: { x: 20, y: 10 }
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

            btn.on('pointerover', () => btn.setStyle({ fill: '#000' }));
            btn.on('pointerout', () => btn.setStyle({ fill: '#fff' }));
            
            btn.on('pointerdown', () => {
                // Передаем track.id ('kalinka'), а не track.name ('Калинка')
                store.reset('medium', track.id);
                this.scene.start('GameScene');
            });
        });
    }
}