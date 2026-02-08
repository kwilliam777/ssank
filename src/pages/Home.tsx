import React, { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ProgressBar } from '../components/ProgressBar';

export function Home() {
    const { dailyMissions, checkDailyReset } = useGameStore();

    useEffect(() => {
        checkDailyReset();
    }, [checkDailyReset]);

    const completedCount = dailyMissions.filter(m => m.completed).length;
    const progressPercentage = (completedCount / dailyMissions.length) * 100;

    return (
        <div className="p-6 pb-24">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
                <p className="text-gray-500">Ready to conquer today's goals?</p>
            </header>

            <div className="space-y-6">
                <section className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-lg font-semibold mb-2">Daily Goals</h2>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-indigo-100">{completedCount} / {dailyMissions.length} Completed</span>
                            <span className="font-bold">{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className="h-2 bg-indigo-900/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-500 rounded-full"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl" />
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Missions</h2>
                    <div className="space-y-3">
                        {dailyMissions.map(mission => (
                            <div key={mission.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                                <div className={clsx("shrink-0 transition-colors", mission.completed ? "text-green-500" : "text-gray-300")}>
                                    {mission.completed ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                </div>
                                <div className="flex-1">
                                    <h3 className={clsx("font-medium text-sm", mission.completed && "text-gray-500 line-through")}>{mission.title}</h3>
                                    <div className="mt-2 text-xs text-gray-400 flex justify-between">
                                        <span>{mission.progress} / {mission.target}</span>
                                        <span className="font-semibold text-indigo-500">+{mission.rewardPoints} pts</span>
                                    </div>
                                    <ProgressBar value={mission.progress} max={mission.target} className="h-1.5 mt-1" colorClass={mission.completed ? "bg-green-500" : "bg-indigo-500"} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Study Modes</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/learn" className="bg-orange-50 p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-2 aspect-square hover:bg-orange-100 transition-colors border border-orange-100/50">
                            <span className="text-4xl filter drop-shadow-sm">📖</span>
                            <span className="font-bold text-orange-900">Flashcards</span>
                        </Link>
                        <Link to="/quiz" className="bg-blue-50 p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-2 aspect-square hover:bg-blue-100 transition-colors border border-blue-100/50">
                            <span className="text-4xl filter drop-shadow-sm">⚡</span>
                            <span className="font-bold text-blue-900">Quiz</span>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
