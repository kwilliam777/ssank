import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, Home as HomeIcon, Trophy, User, BrainCircuit, Flame, Star, Timer, Keyboard } from 'lucide-react';
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
                "flex md:flex-row flex-col items-center md:justify-start justify-center w-full md:px-4 py-2 text-xs md:text-sm font-medium transition-colors duration-200 md:rounded-lg",
                isActive ? "text-indigo-600 md:bg-indigo-50" : "text-gray-500 hover:text-indigo-400 md:hover:bg-gray-50"
            )}
        >
            <Icon className={clsx("w-6 h-6 md:w-5 md:h-5 md:mr-3 mb-1 md:mb-0", isActive && "fill-current md:fill-none")} strokeWidth={isActive ? 2.5 : 2} />
            <span>{label}</span>
        </Link>
    );
};

export function Layout() {
    const { points, level, streak, xp, xpToNextLevel, checkDailyReset } = useGameStore();

    useEffect(() => {
        checkDailyReset();
    }, [checkDailyReset]);

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
            {/* Desktop Side Navigation */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-full p-6">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">S</span>
                    </div>
                    <span className="font-bold text-xl text-slate-800">생각이 크는 학원</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItem to="/" icon={HomeIcon} label="Home" />
                    <NavItem to="/learn" icon={BookOpen} label="Learn" />
                    <NavItem to="/quiz" icon={BrainCircuit} label="Quiz" />
                    <NavItem to="/dictation" icon={Keyboard} label="Dictation" />
                    <NavItem to="/time-challenge" icon={Timer} label="Time Challenge" />
                    <NavItem to="/leaderboard" icon={Trophy} label="Rank" />
                    <NavItem to="/profile" icon={User} label="Profile" />
                </nav>

                <div className="p-4 bg-indigo-50 rounded-xl mt-auto">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-indigo-600 uppercase">Level {level}</span>
                        <span className="text-xs text-indigo-400">{xp}/{xpToNextLevel} XP</span>
                    </div>
                    <ProgressBar value={xp} max={xpToNextLevel} className="h-1.5" colorClass="bg-indigo-500" />
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Top Bar with Gamification Stats */}
                <header className="bg-white px-6 py-3 shadow-sm border-b border-gray-100 flex items-center justify-between sticky top-0 z-40 w-full">
                    {/* Mobile Logo / Placeholder */}
                    <div className="md:hidden font-bold text-lg text-slate-800">생각이 크는 학원</div>

                    {/* Desktop Heading / Breadcrumb Placeholder */}
                    <div className="hidden md:block text-slate-500 text-sm">Welcome back!</div>

                    <div className="flex items-center gap-4">
                        {/* Mobile Level Indicator */}
                        <div className="md:hidden flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-indigo-200 relative">
                                <span className="font-bold text-indigo-700 text-xs">{level}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                            <Flame className={clsx("w-4 h-4", streak > 0 ? "text-orange-500 fill-orange-500 animate-pulse" : "text-gray-300")} />
                            <span className={clsx("text-sm font-bold", streak > 0 ? "text-orange-600" : "text-gray-400")}>{streak}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-bold text-yellow-700">{points}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto pb-32 md:pb-6 md:px-6 md:py-8 flex flex-col">
                    <div className="max-w-7xl mx-auto h-full w-full flex-1">
                        <Outlet />
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
                    <div className="flex justify-around">
                        <NavItem to="/" icon={HomeIcon} label="Home" />
                        <NavItem to="/leaderboard" icon={Trophy} label="Rank" />
                        <NavItem to="/profile" icon={User} label="Profile" />
                    </div>
                </nav>
            </div>
        </div>
    );
}
