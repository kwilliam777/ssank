import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, Home as HomeIcon, Trophy, User, BrainCircuit, Flame, Star } from 'lucide-react';
import clsx from 'clsx';
import { useGameStore } from '../store/useGameStore';
import { ProgressBar } from './ProgressBar';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={clsx(
                "flex flex-col items-center justify-center w-full py-2 text-xs font-medium transition-colors duration-200",
                isActive ? "text-indigo-600" : "text-gray-500 hover:text-indigo-400"
            )}
        >
            <Icon className={clsx("w-6 h-6 mb-1", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
            <span>{label}</span>
        </Link>
    );
};

export function Layout() {
    const { points, level, streak, xp, xpToNextLevel } = useGameStore();

    return (
        <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Top Bar with Gamification Stats */}
            <div className="bg-white px-4 py-3 shadow-sm border-b border-gray-100 flex items-center justify-between sticky top-0 z-40 max-w-md mx-auto w-full">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-indigo-200 relative">
                        <span className="font-bold text-indigo-700">{level}</span>
                        <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-bold shadow-sm">
                            Lvl
                        </div>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Level {level}</span>
                        <div className="w-24">
                            <ProgressBar value={xp} max={xpToNextLevel} className="h-2" colorClass="bg-gradient-to-r from-indigo-500 to-purple-500" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                        <Flame className={clsx("w-4 h-4", streak > 0 ? "text-orange-500 fill-orange-500 animate-pulse" : "text-gray-300")} />
                        <span className={clsx("text-sm font-bold", streak > 0 ? "text-orange-600" : "text-gray-400")}>{streak}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-yellow-700">{points}</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto pb-20">
                <div className="max-w-md mx-auto min-h-full bg-white shadow-xl overflow-hidden relative">
                    <Outlet />
                </div>
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
                <div className="max-w-md mx-auto flex justify-around">
                    <NavItem to="/" icon={HomeIcon} label="Home" />
                    <NavItem to="/learn" icon={BookOpen} label="Learn" />
                    <NavItem to="/quiz" icon={BrainCircuit} label="Quiz" />
                    <NavItem to="/leaderboard" icon={Trophy} label="Rank" />
                    <NavItem to="/profile" icon={User} label="Profile" />
                </div>
            </nav>
        </div>
    );
}
