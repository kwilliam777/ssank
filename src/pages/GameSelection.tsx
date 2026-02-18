import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CloudRain, Puzzle, Grid } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { BackButton } from '../components/BackButton';

export function GameSelection() {
    const { currentLevel, currentChapter } = useGameStore();

    if (!currentLevel || !currentChapter) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="p-6 pb-24 flex flex-col min-h-full bg-slate-50">
            <header className="mb-8 flex items-center">
                <BackButton className="mr-4" />
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Arcade Games</h1>
                    <p className="text-slate-500 text-sm">
                        Fun ways to practice vocabulary
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/falling-words" className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                    <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                        <CloudRain className="w-6 h-6 text-sky-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Falling Words</h2>
                    <p className="text-slate-500 text-sm">Type fast! Don't let the words hit the ground.</p>
                </Link>

                <Link to="/word-scramble" className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                        <Puzzle className="w-6 h-6 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Word Scramble</h2>
                    <p className="text-slate-500 text-sm">Unscramble the letters to form the correct word.</p>
                </Link>

                <Link to="/pair-matching" className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                        <Grid className="w-6 h-6 text-green-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Pair Matching</h2>
                    <p className="text-slate-500 text-sm">Find the matching pairs of words and meanings.</p>
                </Link>
            </div>
        </div>
    );
}
