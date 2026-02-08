import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Badge } from '../components/Badge';
import { achievements } from '../data/achievements';
import { User } from 'lucide-react';

export function Profile() {
    const { points, level, streak, badges } = useGameStore();

    return (
        <div className="bg-slate-50 min-h-full pb-8">
            <header className="bg-white p-6 pb-12 rounded-b-3xl shadow-sm border-b border-indigo-50/50">
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md">
                        <User className="w-10 h-10 text-indigo-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Scholar</h1>
                    <p className="text-indigo-500 font-medium">Level {level} Explorer</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="bg-gray-50 p-3 rounded-2xl text-center">
                        <span className="block text-xl font-bold text-gray-900">{points}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Points</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl text-center">
                        <span className="block text-xl font-bold text-gray-900">{streak}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Streak</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl text-center">
                        <span className="block text-xl font-bold text-gray-900">{badges.length}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Badges</span>
                    </div>
                </div>
            </header>

            <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Achievements</h2>
                <div className="space-y-3">
                    {achievements.map((achievement) => (
                        <Badge
                            key={achievement.id}
                            title={achievement.title}
                            description={achievement.description}
                            icon={achievement.icon}
                            isUnlocked={badges.includes(achievement.id) || achievement.condition({ points, level, streak })}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
