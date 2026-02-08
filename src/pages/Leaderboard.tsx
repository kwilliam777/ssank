import React, { useState } from 'react';
import { Trophy, Medal, User } from 'lucide-react';
import clsx from 'clsx';
import { useGameStore } from '../store/useGameStore';

interface LeaderboardEntry {
    rank: number;
    name: string;
    points: number;
    level: number;
    isCurrentUser?: boolean;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
    { rank: 1, name: "SmartCookie99", points: 1250, level: 12 },
    { rank: 2, name: "VocabMaster", points: 1100, level: 11 },
    { rank: 3, name: "LearningLegend", points: 980, level: 10 },
    { rank: 4, name: "StudyBuddy", points: 850, level: 9 },
    { rank: 5, name: "WordWizard", points: 720, level: 8 },
];

export function Leaderboard() {
    const { points, level } = useGameStore();
    const [filter, setFilter] = useState<'Global' | 'Friends' | 'School'>('Global');

    // Inject current user into leaderboard for display
    const currentUserEntry: LeaderboardEntry = {
        rank: 99,
        name: "You (Scholar)",
        points: points,
        level: level,
        isCurrentUser: true
    };

    // Sort including current user would happen here in real app
    const displayList = [...MOCK_LEADERBOARD, currentUserEntry].sort((a, b) => b.points - a.points);

    // Re-calculate ranks
    const rankedList = displayList.map((entry, index) => ({ ...entry, rank: index + 1 }));

    return (
        <div className="flex flex-col h-full bg-slate-50 pb-20">
            <header className="bg-indigo-600 text-white p-6 pb-12 rounded-b-3xl shadow-lg z-10 relative overflow-hidden">
                <div className="flex flex-col items-center">
                    <Trophy className="w-12 h-12 text-yellow-300 mb-2 filter drop-shadow-md" />
                    <h1 className="text-2xl font-bold">Leaderboard</h1>
                    <p className="text-indigo-200 text-sm">See who's learning the fastest!</p>
                </div>

                {/* Filters */}
                <div className="flex justify-center mt-6 bg-indigo-800/50 p-1 rounded-xl backdrop-blur-sm">
                    {['Global', 'School', 'Friends'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={clsx(
                                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                                filter === f ? "bg-white text-indigo-900 shadow-sm" : "text-indigo-200 hover:text-white"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl pointer-events-none" />
            </header>

            <div className="flex-1 overflow-y-auto px-4 -mt-4 z-20">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {rankedList.map((entry) => (
                        <div
                            key={entry.name}
                            className={clsx(
                                "flex items-center p-4 border-b border-gray-50 last:border-0",
                                entry.isCurrentUser && "bg-yellow-50"
                            )}
                        >
                            <div className="w-8 flex justify-center font-bold text-gray-400">
                                {entry.rank === 1 && <Medal className="w-6 h-6 text-yellow-500" />}
                                {entry.rank === 2 && <Medal className="w-6 h-6 text-gray-400" />}
                                {entry.rank === 3 && <Medal className="w-6 h-6 text-amber-600" />}
                                {entry.rank > 3 && <span>{entry.rank}</span>}
                            </div>

                            <div className="mx-3 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                <User className="w-5 h-5 text-gray-400" />
                            </div>

                            <div className="flex-1">
                                <h3 className={clsx("font-bold text-sm", entry.isCurrentUser ? "text-indigo-900" : "text-gray-800")}>
                                    {entry.name} {entry.isCurrentUser && "(You)"}
                                </h3>
                                <p className="text-xs text-gray-500">Level {entry.level}</p>
                            </div>

                            <div className="font-bold text-indigo-600">
                                {entry.points} pts
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
