export interface NoteData {
    time: number;
    stringId: number;
    type: 'normal' | 'bomb' | 'golden';
}

export class NoteGenerator {
    private static patterns: Record<string, number[]> = {
        'Kalinka': [0, 1, 2, 1, 0, 2, 1, 0, 0, 1, 2, 2, 1, 0, 2, 1, 0, 1, 2, 1, 0, 2, 1, 0, 0, 1, 2, 2],
        'Korobeiniki': [0, 0, 1, 1, 2, 2, 1, 0, 1, 1, 2, 2, 0, 0, 1, 0, 2, 0, 1, 1, 0, 2, 1, 0, 0, 1, 2, 2],
        'Katyusha': [2, 1, 0, 1, 2, 1, 0, 0, 2, 2, 1, 1, 0, 0, 1, 2, 2, 1, 0, 1, 2, 0, 1, 0, 2, 1, 0, 1]
    };

    public static generate(trackName: string, difficulty: string): NoteData[] {
        const pattern = this.patterns[trackName] || this.patterns['Kalinka'];
        const notes: NoteData[] = [];
        
        // Коэффициенты скорости из архитектуры
        const speeds: Record<string, number> = { 'easy': 1.2, 'medium': 0.9, 'hard': 0.7 };
        const speed = speeds[difficulty] || 0.9;
        const noteCount = difficulty === 'hard' ? 70 : (difficulty === 'medium' ? 50 : 30);

        for (let i = 0; i < noteCount; i++) {
            notes.push({
                time: i * 600 * speed, // Интервал в мс
                stringId: pattern[i % pattern.length],
                type: (difficulty === 'hard' && Math.random() < 0.1) ? 'bomb' : 'normal'
            });
        }
        return notes;
    }
}