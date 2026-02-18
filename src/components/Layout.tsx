import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Home as HomeIcon, Trophy, User, BrainCircuit, Flame, Star, Timer, Keyboard, Gamepad2, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { useGameStore } from '../store/useGameStore';
import { ProgressBar } from './ProgressBar';
import { ExitConfirmModal } from './ExitConfirmModal';

const NavItem = ({ to, icon: Icon, label, onNavClick }: { to: string; icon: React.ElementType; label: string; onNavClick: (e: React.MouseEvent, path: string) => void }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <a
            href={to}
            onClick={(e) => onNavClick(e, to)}
            className={clsx(
                "flex md:flex-row flex-col items-center md:justify-start justify-center w-full md:px-4 py-2 text-xs md:text-sm font-medium transition-colors duration-200 md:rounded-lg cursor-pointer",
                isActive ? "text-indigo-600 md:bg-indigo-50" : "text-gray-500 hover:text-indigo-400 md:hover:bg-gray-50"
            )}
        >
            <Icon className={clsx("w-6 h-6 md:w-5 md:h-5 md:mr-3 mb-1 md:mb-0", isActive && "fill-current md:fill-none")} strokeWidth={isActive ? 2.5 : 2} />
            <span>{label}</span>
        </a>
    );
};

export function Layout() {
    const { points, level, streak, xp, xpToNextLevel, checkDailyReset, isGameActive, setGameActive } = useGameStore();
    const location = useLocation();
    const navigate = useNavigate();
    const isWritingCenter = location.pathname === '/writing-center';

    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [pendingPath, setPendingPath] = useState<string | null>(null);

    useEffect(() => {
        checkDailyReset();
    }, [checkDailyReset]);

    const handleNavClick = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        if (isGameActive) {
            setPendingPath(path);
            setShowExitConfirm(true);
        } else {
            navigate(path);
        }
    };

    const confirmNavigation = () => {
        setGameActive(false);
        setShowExitConfirm(false);
        if (pendingPath) {
            navigate(pendingPath);
            setPendingPath(null);
        }
    };

    const cancelNavigation = () => {
        setShowExitConfirm(false);
        setPendingPath(null);
    };

    return (
        <div className="flex h-[100dvh] bg-gray-50 text-gray-900 font-sans overflow-hidden">
            <ExitConfirmModal
                isOpen={showExitConfirm}
                onConfirm={confirmNavigation}
                onCancel={cancelNavigation}
                title="Leave Game?"
                message="You are currently playing a game. Progress will be lost if you leave."
            />
            {/* Desktop Side Navigation */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-full p-6">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">S</span>
                    </div>
                    <span className="font-bold text-xl text-slate-800">생각이 크는 학원</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItem to="/" icon={HomeIcon} label="Home" onNavClick={handleNavClick} />
                    <NavItem to="/learn" icon={BookOpen} label="Flashcards" onNavClick={handleNavClick} />
                    <NavItem to="/quiz" icon={BrainCircuit} label="Quiz" onNavClick={handleNavClick} />
                    <NavItem to="/dictation" icon={Keyboard} label="Dictation" onNavClick={handleNavClick} />
                    <NavItem to="/time-challenge" icon={Timer} label="Time Challenge" onNavClick={handleNavClick} />
                    <NavItem to="/games" icon={Gamepad2} label="Arcade Games" onNavClick={handleNavClick} />

                    {/* PC Writing Center */}
                    <a
                        href="/writing-center"
                        onClick={(e) => handleNavClick(e, '/writing-center')}
                        className={clsx(
                            "flex items-center w-full px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg cursor-pointer",
                            location.pathname === '/writing-center'
                                ? "bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200"
                                : "text-gray-500 hover:bg-purple-50 hover:text-purple-600"
                        )}
                    >
                        <Sparkles className={clsx("w-5 h-5 mr-3", location.pathname === '/writing-center' ? "text-purple-600 fill-purple-200" : "text-purple-400")} />
                        <span>Writing Center</span>
                        <span className="ml-auto text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold">AI</span>
                    </a>

                    <NavItem to="/leaderboard" icon={Trophy} label="Rank" onNavClick={handleNavClick} />
                    <NavItem to="/profile" icon={User} label="Profile" onNavClick={handleNavClick} />
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

                <main className={clsx(
                    "flex-1 flex flex-col",
                    isWritingCenter ? "overflow-hidden" : "overflow-y-auto pb-32 md:pb-6 md:px-6 md:py-8"
                )}>
                    <div className={clsx(
                        "w-full flex-1",
                        isWritingCenter ? "h-full" : "max-w-7xl mx-auto"
                    )}>
                        <Outlet />
                    </div>
                </main>

                {/* Mobile Bottom Navigation - Hide on Writing Center? Or Just Fixed? 
                    Usually chat apps hide the bottom nav or keep it. 
                    User said "other component's view".
                    Let's keep it but ensure it doesn't overlap weirdly. 
                    If WritingCenter is 100% height, bottom nav might cover the input.
                    WritingCenter has input at bottom.
                    The Layout creates a fixed bottom nav.
                    We should probably ADD padding to Writing Center to account for it, OR
                    let WritingCenter handle it.
                    However, the request is about "header part hidden... other part moves".
                    Using 100dvh helps.
                    The bottom nav has z-50.
                */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
                    <div className="flex justify-around items-center h-16">
                        <NavItem to="/" icon={HomeIcon} label="Home" onNavClick={handleNavClick} />

                        {/* Mobile Writing Center */}
                        <a
                            href="/writing-center"
                            onClick={(e) => handleNavClick(e, '/writing-center')}
                            className="flex flex-col items-center justify-center w-full h-full text-xs font-medium text-purple-600"
                        >
                            <div className={clsx(
                                "w-10 h-10 rounded-full flex items-center justify-center mb-0.5 transition-all shadow-sm",
                                location.pathname === '/writing-center' ? "bg-purple-600 text-white shadow-purple-200" : "bg-purple-100 text-purple-600"
                            )}>
                                <Sparkles className="w-5 h-5 fill-current" />
                            </div>
                            <span className="text-[10px] font-bold">Writing(AI)</span>
                        </a>

                        <NavItem to="/leaderboard" icon={Trophy} label="Rank" onNavClick={handleNavClick} />
                        <NavItem to="/profile" icon={User} label="Profile" onNavClick={handleNavClick} />
                    </div>
                </nav>
            </div>
        </div>
    );
}
