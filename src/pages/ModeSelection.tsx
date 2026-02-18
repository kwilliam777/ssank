import { Link, Navigate } from 'react-router-dom';
import { BookOpen, BrainCircuit, Timer, Keyboard, Gamepad2, CheckCircle2, Circle } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { BackButton } from '../components/BackButton';

export function ModeSelection() {
    const { currentLevel, currentChapter, chapterStats, currentGrade } = useGameStore();

    if (!currentLevel) {
        return <Navigate to="/" replace />;
    }

    if (!currentChapter) {
        return <Navigate to="/chapters" replace />;
    }

    const getLevelDisplay = (level: string) => {
        // Since we use the display names as values now, just return the level
        return level;
    };

    return (
        <div className="p-6 pb-24 flex flex-col min-h-full bg-slate-50">
            <header className="mb-8 flex items-center">
                <BackButton className="mr-4" />
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Study Modes</h1>
                    <p className="text-slate-500 text-sm">
                        <span className="font-semibold text-indigo-600">{getLevelDisplay(currentLevel)}</span>
                        <span className="mx-2">•</span>
                        <span className="font-medium text-slate-600">Chapter {currentChapter}</span>
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to="/learn" className="group relative bg-indigo-50 p-6 rounded-2xl border-2 border-indigo-500 shadow-md hover:shadow-lg hover:border-indigo-600 hover:bg-indigo-100 transition-all duration-200 transform hover:-translate-y-1">
                    <div className="absolute top-4 right-4 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                        Recommended
                    </div>
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-sm border border-indigo-100">
                        <BookOpen className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-bold text-indigo-900 mb-2">Flashcards</h2>
                    <p className="text-indigo-700/80 text-sm">Review vocabulary with flip cards. Perfect for memorization.</p>
                </Link>

                <Link to="/quiz" className="group relative bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                    <div className="absolute top-4 right-4 p-1 rounded-full shadow-sm bg-slate-50">
                        {(() => {
                            const stats = chapterStats[`${currentLevel}-${currentGrade || 'all'}-${currentChapter}`];
                            const isComplete = stats?.quiz_ko_en && stats?.quiz_context && stats?.quiz_meaning;
                            return isComplete ? (
                                <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-50" />
                            ) : (
                                <Circle className="w-6 h-6 text-slate-300" />
                            );
                        })()}
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                        <BrainCircuit className="w-6 h-6 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Quiz Mode</h2>
                    <p className="text-slate-500 text-sm">Test your knowledge with multiple choice questions.</p>
                </Link>

                <Link to="/dictation" className="group relative bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                    <div className="absolute top-4 right-4 p-1 rounded-full shadow-sm bg-slate-50">
                        {chapterStats[`${currentLevel}-${currentGrade || 'all'}-${currentChapter}`]?.dictation ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-50" />
                        ) : (
                            <Circle className="w-6 h-6 text-slate-300" />
                        )}
                    </div>
                    <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                        <Keyboard className="w-6 h-6 text-teal-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Dictation</h2>
                    <p className="text-slate-500 text-sm">Type the English word for the Korean meaning.</p>
                </Link>

                <Link to="/time-challenge" className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                        <Timer className="w-6 h-6 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Time Challenge</h2>
                    <p className="text-slate-500 text-sm">Race against the clock! How many can you answer in 60s?</p>
                </Link>

                <Link to="/games" className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                    <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                        <Gamepad2 className="w-6 h-6 text-pink-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Arcade Games</h2>
                    <p className="text-slate-500 text-sm">Fun mini-games to test your speed and spelling.</p>
                </Link>
            </div>
        </div>
    );
}
