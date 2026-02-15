import React from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BookOpen, BrainCircuit, Timer, Keyboard, CloudRain } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { BackButton } from '../components/BackButton';

export function ModeSelection() {
    const navigate = useNavigate();
    const { currentLevel, currentChapter } = useGameStore();

    if (!currentLevel) {
        return <Navigate to="/" replace />;
    }

    if (!currentChapter) {
        return <Navigate to="/chapters" replace />;
    }

    const getLevelDisplay = (level: string) => {
        switch (level) {
            case 'Elementary1': return 'Elementary 1';
            case 'Elementary2': return 'Elementary 2';
            case 'Middle': return 'Middle School';
            case 'High': return 'High School';
            default: return level;
        }
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
                <Link to="/learn" className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Flashcards</h2>
                    <p className="text-slate-500 text-sm">Review vocabulary with flip cards. Perfect for memorization.</p>
                </Link>

                <Link to="/quiz" className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                        <BrainCircuit className="w-6 h-6 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Quiz Mode</h2>
                    <p className="text-slate-500 text-sm">Test your knowledge with multiple choice questions.</p>
                </Link>

                <Link to="/dictation" className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
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

                <Link to="/falling-words" className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                    <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                        <CloudRain className="w-6 h-6 text-sky-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Falling Words</h2>
                    <p className="text-slate-500 text-sm">Type fast! Don't let the words hit the ground.</p>
                </Link>
            </div>
        </div>
    );
}
