import { Zap, Book, Crown, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    condition: (state: any) => boolean;
}

export const achievements = [
    {
        id: 'first_10_words',
        title: 'Novice Scholar',
        description: 'Learn your first 10 words',
        icon: Book,
        condition: (state: any) => state.points >= 10, // Simplified trigger
    },
    {
        id: 'streak_7',
        title: 'On Fire!',
        description: 'Reach a 7-day study streak (simulated by 7 streak points for now)',
        icon: Zap,
        condition: (state: any) => state.streak >= 7,
    },
    {
        id: 'level_5',
        title: 'Rising Star',
        description: 'Reach Level 5',
        icon: Crown,
        condition: (state: any) => state.level >= 5,
    },
];
