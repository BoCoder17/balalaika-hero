export interface NoteData {
    time: number;
    stringId: number;
    type: 'normal' | 'bomb' | 'golden';
}

export class NoteGenerator {
    private static trackConfigs: Record<string, { bpm: number, pattern: number[] }> = {
        'kalinka': { bpm: 145, pattern: [0, 1, 2, 1, 0, 1, 2, 1] },
        'katyusha': { bpm: 120, pattern: [2, 1, 0, 1, 2, 0, 1, 2] },
        'ogorod': { bpm: 165, pattern: [0, 0, 1, 1, 2, 2, 1, 1] }
    };

    /**
     * @param trackName - ключ трека
     * @param difficulty - сложность
     * @param durationMs - длительность трека в миллисекундах (music.duration * 1000)
     */
    public static generate(trackName: string, difficulty: string, durationMs: number): NoteData[] {
        const track = trackName.toLowerCase();
        const config = this.trackConfigs[track] || this.trackConfigs['kalinka'];
        
        const notes: NoteData[] = [];
        const baseInterval = 60000 / config.bpm;
        const startOffset = 2000; // Начинаем через 2 секунды, чтобы игрок успел подготовиться
        const endBuffer = 3000;   // Заканчиваем за 3 секунды до конца аудио

        const diffSettings: Record<string, any> = {
            'easy': { 
                intervalMult: 1.0, 
                bombChance: 0,
                randomness: 0.1,
                skipChance: 0.2 // Пропускаем 20% ударов, чтобы было легче
            },
            'medium': { 
                intervalMult: 0.5, 
                bombChance: 0.05,
                randomness: 0.3,
                skipChance: 0.1
            },
            'hard': { 
                intervalMult: 0.25, 
                bombChance: 0.12,
                randomness: 0.6,
                skipChance: 0.0
            }
        };

        const current = diffSettings[difficulty] || diffSettings['medium'];

        // Генерируем ноты на основе времени, а не количества
        let currentTime = startOffset;
        let iteration = 0;

        while (currentTime < durationMs - endBuffer) {
            // Решаем, спавнить ли ноту в этот "такт"
            if (Math.random() > current.skipChance) {
                let type: 'normal' | 'bomb' | 'golden' = 'normal';
                
                // Струна по паттерну или случайная
                let stringId = config.pattern[iteration % config.pattern.length];
                if (Math.random() < current.randomness) {
                    stringId = Math.floor(Math.random() * 3);
                }

                // Тип ноты
                const rand = Math.random();
                if (rand < current.bombChance) {
                    type = 'bomb';
                } else if (rand > 0.93) {
                    type = 'golden';
                }

                notes.push({
                    time: currentTime,
                    stringId: stringId,
                    type: type
                });
            }

            // Рассчитываем время для следующего удара
            currentTime += (baseInterval * current.intervalMult);
            iteration++;
        }

        return notes;
    }
}