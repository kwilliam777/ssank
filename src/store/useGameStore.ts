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
    currentLevel: 'Elementary' | 'Middle School' | 'High School' | 'CSAT';
    currentGrade: string | null; // e.g., "1-2", "3-4", "1", "2", "3"
    currentChapter: number;

    // User Data
    userData: {
        uid: string | null;
        email: string | null;
        displayName: string | null;
        photoURL: string | null;
        schoolName: string | null;
    };

    // Session Persistence
    sessionProgress: Record<string, any>; // Map of session ID to progress data
    saveSessionProgress: (sessionId: string, data: any) => void;
    getSessionProgress: (sessionId: string) => any;
    clearSessionProgress: (sessionId: string) => void;

    // Chat Persistence
    chatHistory: { id: string; text: string; sender: 'user' | 'ai'; timestamp: number }[];
    chatLastDate: string | null;
    clearChatHistory: () => void;
    addChatMessage: (message: { id: string; text: string; sender: 'user' | 'ai'; timestamp: number }) => void;

    // Actions
    addPoints: (amount: number) => void;
    incrementStreak: () => void;
    resetStreak: () => void;
    unlockBadge: (badgeId: string) => void;
    checkAchievements: () => void;
    updateMissionProgress: (missionId: string, amount: number) => void;
    checkDailyReset: () => void;
    setCurrentLevel: (level: 'Elementary' | 'Middle School' | 'High School' | 'CSAT') => void;
    setCurrentGrade: (grade: string | null) => void;
    setCurrentChapter: (chapter: number) => void;
    setUserData: (user: Partial<GameState['userData']>) => void; // Allow partial updates
    loadFromFirestore: (uid: string) => Promise<void>;
    updateProfile: (data: { displayName?: string; schoolName?: string; photoURL?: string }) => Promise<void>;
    logout: () => void;

    // Notification System
    notification: { content: string; date: string; id?: string } | null;
    fetchNotification: () => Promise<void>;
    updateNotification: (content: string) => Promise<void>;
    clearNotification: () => Promise<void>;

    // Chapter Statistics (Perfect Scores)
    chapterStats: Record<string, {
        dictation: boolean;
        quiz_ko_en: boolean;
        quiz_context: boolean;
        quiz_meaning: boolean;
    }>;
    recordChapterSuccess: (mode: 'dictation' | 'quiz_ko_en' | 'quiz_context' | 'quiz_meaning') => void;

    // Global Game State (for navigation blocking)
    isGameActive: boolean;
    setGameActive: (isActive: boolean) => void;

    // Wrong Answer Note
    wrongAnswers: Record<string, number>; // wordId -> count
    incrementWrongAnswer: (wordId: string) => void;
    resetWrongAnswer: (wordId: string) => void;
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
                currentGrade: state.currentGrade,
                currentChapter: state.currentChapter,
                displayName: state.userData.displayName,
                photoURL: state.userData.photoURL,
                schoolName: state.userData.schoolName,
                lastResetMonth: state.lastResetMonth,
                chapterStats: state.chapterStats,
                wrongAnswers: state.wrongAnswers,
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
            currentLevel: 'Elementary',
            currentGrade: '1-2', // Default
            currentChapter: 1,

            sessionProgress: {},

            userData: { uid: null, email: null, displayName: null, photoURL: null, schoolName: null },

            // Chat Persistence Implementation
            chatHistory: [],
            chatLastDate: null,
            clearChatHistory: () => set({ chatHistory: [], chatLastDate: null }),
            addChatMessage: (message) => set((state) => ({
                chatHistory: [...state.chatHistory, message],
                chatLastDate: new Date().toDateString()
            })),

            saveSessionProgress: (sessionId, data) => {
                set(state => ({
                    sessionProgress: {
                        ...state.sessionProgress,
                        [sessionId]: data
                    }
                }));
            },

            getSessionProgress: (sessionId) => {
                const { sessionProgress } = get();
                return sessionProgress[sessionId] || null;
            },

            clearSessionProgress: (sessionId) => {
                set(state => {
                    const newProgress = { ...state.sessionProgress };
                    delete newProgress[sessionId];
                    return { sessionProgress: newProgress };
                });
            },

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
                const todayDate = new Date();
                const today = todayDate.toDateString();
                const { lastLoginDate, streak } = get();

                // Check Monthly Reset
                const currentMonth = new Date().getMonth();
                const { lastResetMonth } = get();

                if (currentMonth !== lastResetMonth) {
                    set({
                        points: 0,
                        streak: 0,
                        badges: [], // Reset achievements
                        lastResetMonth: currentMonth
                    });
                }

                if (today !== lastLoginDate) {
                    // It's a new day! Calculate streak.
                    // Always increment streak on a new day (Monthly Visit Count)
                    const newStreak = streak + 1;

                    set({
                        streak: newStreak,
                        lastLoginDate: today,
                        dailyMissions: DEFAULT_MISSIONS.map(m => {
                            if (m.id === 'daily_login') {
                                // Auto complete daily login
                                return { ...m, progress: 1, completed: true };
                            }
                            return { ...m, progress: 0, completed: false };
                        })
                    });

                    // Check for achievements with new streak
                    get().checkAchievements();

                } else {
                    // Same day, just ensure streak is at least 1 if it's 0 (e.g. fresh install today)
                    if (streak === 0) {
                        set({ streak: 1 });
                    }

                    // Check if we have new missions (e.g. from app update)
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

            setCurrentLevel: (level) => set({ currentLevel: level, currentGrade: null, currentChapter: 1 }), // Reset grade and chapter when level changes
            setCurrentGrade: (grade) => set({ currentGrade: grade, currentChapter: 1 }),
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
                            currentLevel: data.currentLevel || 'Elementary',
                            currentGrade: data.currentGrade || null,
                            currentChapter: data.currentChapter,
                            lastResetMonth: data.lastResetMonth !== undefined ? data.lastResetMonth : new Date().getMonth(),
                            chapterStats: data.chapterStats || {},
                            wrongAnswers: data.wrongAnswers || {},
                            userData: {
                                uid: uid,
                                email: null, // We might not have this in stored data unless we auth again
                                displayName: data.displayName || null,
                                photoURL: data.photoURL || null,
                                schoolName: data.schoolName || null
                            }
                        });
                        // IMPORTANT: Check for daily reset AFTER loading remote data
                        // This ensures if I logged in on another device yesterday, 
                        // my local state now reflects that, and checkDailyReset will increment streak.
                        get().checkDailyReset();
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

            // Notification Implementation
            notification: null,

            fetchNotification: async () => {
                try {
                    const docRef = doc(db, 'system', 'notifications');
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        set({ notification: docSnap.data() as any });
                    }
                } catch (e) {
                    console.error("Error fetching notification:", e);
                }
            },

            updateNotification: async (content: string) => {
                try {
                    const notificationData = {
                        content,
                        date: new Date().toISOString(),
                    };
                    await setDoc(doc(db, 'system', 'notifications'), notificationData);
                    set({ notification: notificationData });
                } catch (e) {
                    console.error("Error updating notification:", e);
                }
            },

            clearNotification: async () => {
                try {
                    await setDoc(doc(db, 'system', 'notifications'), { content: null, date: null }); // Or delete doc
                    set({ notification: null });
                } catch (e) {
                    console.error("Error clearing notification:", e);
                }
            },

            // Chapter Stats
            chapterStats: {},
            recordChapterSuccess: (mode) => {
                const { currentLevel, currentGrade, currentChapter, chapterStats } = get();
                const key = `${currentLevel}-${currentGrade || 'all'}-${currentChapter}`;

                const currentStats = chapterStats[key] || {
                    dictation: false,
                    quiz_ko_en: false,
                    quiz_context: false,
                    quiz_meaning: false
                };

                // Only update if not already completed
                if (!currentStats[mode]) {
                    set({
                        chapterStats: {
                            ...chapterStats,
                            [key]: {
                                ...currentStats,
                                [mode]: true
                            }
                        }
                    });
                }
            },

            // Global Game State
            isGameActive: false,
            setGameActive: (isActive) => set({ isGameActive: isActive }),

            // Wrong Answer Note
            wrongAnswers: {},
            incrementWrongAnswer: (wordId: string) => set((state) => ({
                wrongAnswers: {
                    ...state.wrongAnswers,
                    [wordId]: (state.wrongAnswers[wordId] || 0) + 1
                }
            })),
            resetWrongAnswer: (wordId: string) => set((state) => {
                const newWrongAnswers = { ...state.wrongAnswers };
                delete newWrongAnswers[wordId];
                return { wrongAnswers: newWrongAnswers };
            }),
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
