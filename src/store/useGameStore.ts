import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { achievements } from '../data/achievements';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
    isMuted: boolean;
    lastResetMonth: number;
    toggleMute: () => void;

    // Daily Missions
    lastLoginDate: string;
    dailyMissions: DailyMission[];

    // Level System
    currentLevel: 'Elementary1' | 'Elementary2' | 'Middle' | 'High';
    currentChapter: number;

    // User Data
    userData: {
        uid: string | null;
        email: string | null;
        displayName: string | null;
        photoURL: string | null;
        schoolName: string | null;
    };

    // Actions
    addPoints: (amount: number) => void;
    incrementStreak: () => void;
    resetStreak: () => void;
    unlockBadge: (badgeId: string) => void;
    checkAchievements: () => void;
    updateMissionProgress: (missionId: string, amount: number) => void;
    checkDailyReset: () => void;
    setCurrentLevel: (level: 'Elementary1' | 'Elementary2' | 'Middle' | 'High') => void;
    setCurrentChapter: (chapter: number) => void;
    setUserData: (user: Partial<GameState['userData']>) => void; // Allow partial updates
    loadFromFirestore: (uid: string) => Promise<void>;
    updateProfile: (data: { displayName?: string; schoolName?: string; photoURL?: string }) => Promise<void>;
    logout: () => void;
}

const DEFAULT_MISSIONS: DailyMission[] = [
    { id: 'review_20_cards', title: 'Review 20 Flashcards', target: 20, progress: 0, completed: false, rewardPoints: 50 },
    { id: 'complete_quiz', title: 'Complete 1 Quiz', target: 1, progress: 0, completed: false, rewardPoints: 30 },
    { id: 'perfect_quiz', title: 'Get 100% on a Quiz', target: 1, progress: 0, completed: false, rewardPoints: 100 },
    { id: 'finish_chapter', title: 'Finish 1 Chapter (Quiz)', target: 1, progress: 0, completed: false, rewardPoints: 50 },
    { id: 'finish_time_challenge', title: 'Play Time Challenge', target: 1, progress: 0, completed: false, rewardPoints: 30 },
    { id: 'high_score_time_challenge', title: 'Score 100+ in Time Challenge', target: 1, progress: 0, completed: false, rewardPoints: 50 },
    { id: 'daily_login', title: 'Login Today', target: 1, progress: 1, completed: true, rewardPoints: 10 },
];

// Helper to debounce writes
let syncTimeout: any;
const debouncedSync = (state: GameState) => {
    if (!state.userData.uid) return;

    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
        try {
            const userRef = doc(db, 'users', state.userData.uid!);
            const dataToSave = {
                points: state.points,
                level: state.level,
                streak: state.streak,
                xp: state.xp,
                xpToNextLevel: state.xpToNextLevel,
                badges: state.badges,
                dailyMissions: state.dailyMissions,
                lastLoginDate: state.lastLoginDate,
                currentLevel: state.currentLevel,
                currentChapter: state.currentChapter,
                displayName: state.userData.displayName,
                photoURL: state.userData.photoURL,
                schoolName: state.userData.schoolName,
                lastResetMonth: state.lastResetMonth,
                lastUpdated: new Date().toISOString()
            };
            await setDoc(userRef, dataToSave, { merge: true });
            console.log('Synced to Firestore');
        } catch (e) {
            console.error('Error syncing to Firestore:', e);
        }
    }, 2000); // 2 second debounce
};



export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            points: 0,
            level: 1,
            streak: 0,
            xp: 0,
            xpToNextLevel: 100,
            badges: [],
            isMuted: false,
            lastResetMonth: new Date().getMonth(),

            lastLoginDate: new Date().toDateString(),
            dailyMissions: DEFAULT_MISSIONS,
            currentLevel: 'Elementary1',
            currentChapter: 1,

            userData: { uid: null, email: null, displayName: null, photoURL: null, schoolName: null },

            addPoints: (amount) => {
                const { xp, xpToNextLevel, level, userData } = get();
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
                get().checkAchievements();

                // Increment School Score if user has a school
                if (userData.uid && userData.schoolName) {
                    const schoolRef = doc(db, 'schools', userData.schoolName);
                    // Use setDoc with merge to create if not exists
                    setDoc(schoolRef, {
                        name: userData.schoolName,
                        score: increment(amount),
                        lastUpdated: new Date().toISOString()
                    }, { merge: true }).catch(e => console.error("Error updating school score:", e));
                }
            },

            incrementStreak: () => {
                set((state) => ({ streak: state.streak + 1 }));
                get().checkAchievements();
            },
            resetStreak: () => set({ streak: 0 }),

            unlockBadge: (badgeId) => {
                const { badges } = get();
                if (!badges.includes(badgeId)) {
                    set({ badges: [...badges, badgeId] });
                    // Could trigger a toast here
                }
            },

            checkAchievements: () => {
                const state = get();
                achievements.forEach(achievement => {
                    if (!state.badges.includes(achievement.id) && achievement.condition(state)) {
                        state.unlockBadge(achievement.id);
                    }
                });
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

            // Settings
            toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

            checkDailyReset: () => {
                const today = new Date().toDateString();
                const { lastLoginDate } = get();

                // Check Monthly Reset
                const currentMonth = new Date().getMonth();
                const { lastResetMonth } = get();

                if (currentMonth !== lastResetMonth) {
                    // Reset for new month
                    set({
                        points: 0,
                        streak: 0,
                        // badges: [], // Keep badges? Usually yes.
                        lastResetMonth: currentMonth
                    });
                    // Reset School Score if applicable? 
                    // Schools might want cumulative or monthly. 
                    // The request said "reset all the ranking system to 0". 
                    // Users point reset effectively resets user ranking.
                    // School score is cumulative in DB. We might need to reset school score in DB too 
                    // or just track monthly score. For simplicity, we just reset user points which feeds into rankings.
                    // However, the school score in DB is incremented. 
                    // To fully reset, we'd need a cloud function or similar. 
                    // Client-side reset for school is risky/hard. 
                    // Let's stick to user reset for now as requested "users need to start over".
                }

                if (today !== lastLoginDate) {
                    set({
                        lastLoginDate: today,
                        dailyMissions: DEFAULT_MISSIONS.map(m => {
                            if (m.id === 'daily_login') {
                                // Auto complete daily login
                                return { ...m, progress: 1, completed: true };
                            }
                            return { ...m, progress: 0, completed: false };
                        })
                    });
                } else {
                    // Same day, but check if we have new missions (e.g. from app update)
                    const { dailyMissions } = get();
                    const missingMissions = DEFAULT_MISSIONS.filter(dm => !dailyMissions.find(m => m.id === dm.id));

                    if (missingMissions.length > 0) {
                        set({
                            dailyMissions: [...dailyMissions, ...missingMissions.map(m => {
                                if (m.id === 'daily_login') {
                                    return { ...m, progress: 1, completed: true };
                                }
                                return m;
                            })]
                        });
                    }
                }
            },

            setCurrentLevel: (level) => set({ currentLevel: level, currentChapter: 1 }), // Reset chapter when level changes
            setCurrentChapter: (chapter) => set({ currentChapter: chapter }),

            setUserData: (user) => set(state => ({ userData: { ...state.userData, ...user } })),

            updateProfile: async (data) => {
                set(state => ({ userData: { ...state.userData, ...data } }));
                // Debounced sync will pick this up, but we can also force it if needed
            },

            logout: () => set({
                userData: { uid: null, email: null, displayName: null, photoURL: null, schoolName: null },
                // Optional: Reset game state on logout? Or keep local progress separate?
                // Usually better to reset to defaults to avoid data leakage
                points: 0, level: 1, streak: 0, xp: 0, badges: []
            }),

            loadFromFirestore: async (uid) => {
                try {
                    const docRef = doc(db, 'users', uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        set({
                            points: data.points,
                            level: data.level,
                            streak: data.streak,
                            xp: data.xp,
                            xpToNextLevel: data.xpToNextLevel,
                            badges: data.badges || [],
                            dailyMissions: data.dailyMissions || DEFAULT_MISSIONS,
                            lastLoginDate: data.lastLoginDate,
                            currentLevel: data.currentLevel,
                            currentChapter: data.currentChapter,
                            lastResetMonth: data.lastResetMonth !== undefined ? data.lastResetMonth : new Date().getMonth(),
                            userData: {
                                uid: uid,
                                email: null, // We might not have this in stored data unless we auth again
                                displayName: data.displayName || null,
                                photoURL: data.photoURL || null,
                                schoolName: data.schoolName || null
                            }
                        });
                    } else {
                        // New user, save initial state which is already in store
                        // We trigger a sync by updating userData
                        set(state => ({ userData: { ...state.userData, uid } }));
                        // The subscriber will catch this change and sync?
                        // No, subscriber checks if uid exists.
                        // We should probably force a sync here since we just set the uid?
                        // Wait, if we set userData here, the subscriber will fire.
                    }
                } catch (e) {
                    console.error("Error loading from Firestore:", e);
                }
            },
        }),
        {
            name: 'ssank-game-storage',
        }
    )
);

// Subscribe to store changes and sync to Firestore if user is logged in
useGameStore.subscribe((state) => {
    if (state.userData && state.userData.uid) {
        debouncedSync(state);
    }
});
