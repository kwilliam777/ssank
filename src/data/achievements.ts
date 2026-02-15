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
        id: 'streak_3',
        title: 'Consistency is Key',
        description: 'Reach a 3-day study streak',
        icon: Zap,
        condition: (state: any) => state.streak >= 3,
    },
    {
        id: 'streak_7',
        title: 'On Fire!',
        description: 'Reach a 7-day study streak (simulated by 7 streak points for now)',
        icon: Zap,
        condition: (state: any) => state.streak >= 7,
    },
    {
        id: 'streak_14',
        title: 'Unstoppable',
        description: 'Reach a 14-day study streak',
        icon: Zap,
        condition: (state: any) => state.streak >= 14,
    },
    {
        id: 'streak_30',
        title: 'Legendary Streak',
        description: 'Reach a 30-day study streak',
        icon: Zap,
        condition: (state: any) => state.streak >= 30,
    },
    {
        id: 'level_5',
        title: 'Rising Star',
        description: 'Reach Level 5',
        icon: Crown,
        condition: (state: any) => state.level >= 5,
    },
    {
        id: 'level_10',
        title: 'Scholar',
        description: 'Reach Level 10',
        icon: Crown,
        condition: (state: any) => state.level >= 10,
    },
    {
        id: 'level_20',
        title: 'Master',
        description: 'Reach Level 20',
        icon: Crown,
        condition: (state: any) => state.level >= 20,
    },
];
