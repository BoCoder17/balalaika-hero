export interface NoteData {
    time: number;
    stringId: number;
    type: 'normal' | 'bomb' | 'golden';
}

export class NoteGenerator {
    // Добавили offset для каждой песни (время первого удара в мс)
    private static trackConfigs: Record<string, { bpm: number, pattern: number[], offset: number }> = {
        'kalinka': { bpm: 145, pattern: [0, 1, 2, 1], offset: 150 }, 
        'katyusha': { bpm: 120, pattern: [2, 1, 0, 1], offset: 200 }, 
        'ogorod': { bpm: 165, pattern: [0, 0, 1, 1], offset: 50 }
    };

    public static generate(trackName: string, difficulty: string, durationMs: number): NoteData[] {
        const track = trackName.toLowerCase();
        const config = this.trackConfigs[track] || this.trackConfigs['kalinka'];
        
        const notes: NoteData[] = [];
        // Интервал между четвертными нотами в мс
        const baseInterval = 60000 / config.bpm;
        
        const diffSettings: Record<string, any> = {
            'easy': { 
                intervalMult: 1.0, // Каждая четверть (1, 2, 3, 4)
                bombChance: 0.01,
                patternRandomness: 0.1 
            },
            'medium': { 
                intervalMult: 0.5, // Каждая восьмая (1 и 2 и 3 и 4 и)
                bombChance: 0.05,
                patternRandomness: 0.25
            },
            'hard': { 
                intervalMult: 0.375, // Каждая шестнадцатая (очень быстро)
                bombChance: 0.1,
                patternRandomness: 0.5
            }
        };

        const current = diffSettings[difficulty] || diffSettings['medium'];

        // currentTime стартует строго с offset песни
        let currentTime = config.offset; 
        let iteration = 0;

        // Генерируем, пока не дойдем до конца трека (минус 1 секунда запаса)
        while (currentTime < durationMs - 1000) {
            
            let type: 'normal' | 'bomb' | 'golden' = 'normal';
            
            // Выбираем струну: либо по паттерну, либо с небольшим шансом случайную
            let stringId = config.pattern[iteration % config.pattern.length];
            if (Math.random() < current.patternRandomness) {
                stringId = Math.floor(Math.random() * 3);
            }

            // Определяем тип ноты
            const rand = Math.random();
            if (rand < current.bombChance) {
                type = 'bomb';
            } else if (rand > 0.96) { // Золотые ноты теперь реже
                type = 'golden';
            }

            notes.push({
                time: Math.round(currentTime), // Округляем до целых мс для точности
                stringId: stringId,
                type: type
            });

            // Двигаемся строго по сетке BPM
            currentTime += (baseInterval * current.intervalMult);
            iteration++;
        }

        return notes;
    }
}