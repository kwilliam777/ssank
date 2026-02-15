import React, { useState, useEffect } from 'react';
import { Trophy, Medal, User, School } from 'lucide-react';
import clsx from 'clsx';
import { useGameStore } from '../store/useGameStore';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface LeaderboardEntry {
    id: string;
    rank: number;
    name: string;
    score: number; // points for users, total score for schools
    detail?: string; // Level for users, member count etc for schools?
    photoURL?: string;
    isCurrentUser?: boolean;
}

export function Leaderboard() {
    const { points, level, userData } = useGameStore();
    const [filter, setFilter] = useState<'School' | 'Learners'>('Learners');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                let fetchedEntries: LeaderboardEntry[] = [];

                if (filter === 'School') {
                    const schoolsRef = collection(db, 'schools');
                    const q = query(schoolsRef, orderBy('score', 'desc'), limit(50));
                    const querySnapshot = await getDocs(q);

                    fetchedEntries = querySnapshot.docs.map((doc, index) => ({
                        id: doc.id,
                        rank: index + 1,
                        name: doc.data().name,
                        score: doc.data().score,
                        detail: 'School'
                    }));

                    // Add current user's school if not in top 50? (Optional)

                } else {
                    // Learner Ranking (Global Users)
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, orderBy('points', 'desc'), limit(50));
                    const querySnapshot = await getDocs(q);

                    fetchedEntries = querySnapshot.docs.map((doc, index) => ({
                        id: doc.id,
                        rank: index + 1,
                        name: doc.data().displayName || 'Anonymous',
                        score: doc.data().points,
                        detail: `Level ${doc.data().level}`,
                        photoURL: doc.data().photoURL,
                        isCurrentUser: doc.id === userData.uid
                    }));

                    // Check if current user is in list, if not add them?
                    // We simplified existing mock logic.
                    // If fetching real data, we usually show Top N.
                }

                setEntries(fetchedEntries);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [filter, userData.uid]);

    return (
        <div className="flex flex-col h-full bg-slate-50 pb-20">
            <header className="bg-indigo-600 text-white p-4 pb-6 rounded-b-2xl shadow-lg z-10 relative overflow-hidden shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-300 filter drop-shadow-md" />
                        <h1 className="text-lg font-bold">Leaderboard</h1>
                    </div>

                    {/* Compact Filters */}
                    <div className="flex bg-indigo-800/50 p-1 rounded-lg backdrop-blur-sm">
                        {(['Learners', 'School'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={clsx(
                                    "px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                                    filter === f ? "bg-white text-indigo-900 shadow-sm" : "text-indigo-200 hover:text-white"
                                )}
                            >
                                {f === 'School' ? <School className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-4 z-0">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-full">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading rankings...</div>
                    ) : entries.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No rankings yet. Start playing!</div>
                    ) : (
                        entries.map((entry) => (
                            <div
                                key={entry.id}
                                className={clsx(
                                    "flex items-center p-3 border-b border-gray-50 last:border-0",
                                    entry.isCurrentUser && "bg-yellow-50"
                                )}
                            >
                                <div className="w-8 flex justify-center font-bold text-gray-400 text-sm">
                                    {entry.rank === 1 && <Medal className="w-5 h-5 text-yellow-500" />}
                                    {entry.rank === 2 && <Medal className="w-5 h-5 text-gray-400" />}
                                    {entry.rank === 3 && <Medal className="w-5 h-5 text-amber-600" />}
                                    {entry.rank > 3 && <span>{entry.rank}</span>}
                                </div>

                                <div className="mx-3 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden shrink-0">
                                    {entry.photoURL ? (
                                        <img src={entry.photoURL} alt={entry.name} className="w-full h-full object-cover" />
                                    ) : (
                                        filter === 'School' ? <School className="w-4 h-4 text-indigo-400" /> : <User className="w-4 h-4 text-gray-400" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 pr-2">
                                    <h3 className={clsx("font-bold text-sm truncate", entry.isCurrentUser ? "text-indigo-900" : "text-gray-800")}>
                                        {entry.name} {entry.isCurrentUser && "(You)"}
                                    </h3>
                                    <p className="text-[10px] text-gray-500 truncate">{entry.detail}</p>
                                </div>

                                <div className="font-bold text-indigo-600 text-sm whitespace-nowrap">
                                    {entry.score} pts
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
