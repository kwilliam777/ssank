import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DailyMission {
    id: string;
    title: string;
    target: number;
    progress: number;
    completed: boolean;
    rewardPoints: number;
}

interface GameState {
    points: number;
    level: number;
    streak: number;
    xp: number;
    xpToNextLevel: number;
    badges: string[];

    // Daily Missions
    lastLoginDate: string;
    dailyMissions: DailyMission[];

    // Settings
    flashcardMode: 'EN_KR' | 'KR_EN';

    // Actions
    addPoints: (amount: number) => void;
    incrementStreak: () => void;
    resetStreak: () => void;
    unlockBadge: (badgeId: string) => void;
    updateMissionProgress: (missionId: string, amount: number) => void;
    checkDailyReset: () => void;
    setFlashcardMode: (mode: 'EN_KR' | 'KR_EN') => void;
}

const DEFAULT_MISSIONS: DailyMission[] = [
    { id: 'review_cards', title: 'Review 5 Flashcards', target: 5, progress: 0, completed: false, rewardPoints: 20 },
    { id: 'complete_quiz', title: 'Complete 1 Quiz', target: 1, progress: 0, completed: false, rewardPoints: 30 },
];

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            points: 0,
            level: 1,
            streak: 0,
            xp: 0,
            xpToNextLevel: 100,
            badges: [],

            lastLoginDate: new Date().toDateString(),
            dailyMissions: DEFAULT_MISSIONS,
            flashcardMode: 'EN_KR',

            addPoints: (amount) => {
                const { xp, xpToNextLevel, level } = get();
                let newXp = xp + amount;
                let newLevel = level;
                let newXpToNextLevel = xpToNextLevel;

                while (newXp >= newXpToNextLevel) {
                    newXp -= newXpToNextLevel;
                    newLevel++;
                    newXpToNextLevel = Math.floor(newXpToNextLevel * 1.5);
                }

                set({
                    points: get().points + amount,
                    xp: newXp,
                    level: newLevel,
                    xpToNextLevel: newXpToNextLevel
                });
            },

            incrementStreak: () => set((state) => ({ streak: state.streak + 1 })),
            resetStreak: () => set({ streak: 0 }),

            unlockBadge: (badgeId) => {
                const { badges } = get();
                if (!badges.includes(badgeId)) {
                    set({ badges: [...badges, badgeId] });
                    // Could trigger a toast here
                }
            },

            updateMissionProgress: (missionId, amount) => {
                set(state => {
                    const missions = state.dailyMissions.map(mission => {
                        if (mission.id === missionId && !mission.completed) {
                            const newProgress = Math.min(mission.target, mission.progress + amount);
                            const isCompleted = newProgress >= mission.target;

                            if (isCompleted) {
                                // Award points immediately or let user claim?
                                // For now, auto-award
                                state.addPoints(mission.rewardPoints);
                            }

                            return { ...mission, progress: newProgress, completed: isCompleted };
                        }
                        return mission;
                    });
                    return { dailyMissions: missions };
                });
            },

            checkDailyReset: () => {
                const today = new Date().toDateString();
                const { lastLoginDate } = get();

                if (today !== lastLoginDate) {
                    set({
                        lastLoginDate: today,
                        dailyMissions: DEFAULT_MISSIONS.map(m => ({ ...m, progress: 0, completed: false }))
                    });
                }
            },

            setFlashcardMode: (mode) => set({ flashcardMode: mode }),
        }),
        {
            name: 'ssank-game-storage',
        }
    )
);
