import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/Card';
import { vocabulary } from '../data/vocabulary';
import { ChevronRight, ArrowLeft, ArrowRightLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import clsx from 'clsx';

export function Learn() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentWord = vocabulary[currentIndex];

    const { addPoints, updateMissionProgress, flashcardMode, setFlashcardMode } = useGameStore();

    const handleNext = () => {
        // Basic gamification: Award 1 point for reviewing a card
        addPoints(1);
        updateMissionProgress('review_cards', 1);

        if (currentIndex < vocabulary.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Loop back
            setCurrentIndex(0);
        }
    };

    const toggleMode = () => {
        setFlashcardMode(flashcardMode === 'EN_KR' ? 'KR_EN' : 'EN_KR');
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <header className="p-4 flex items-center justify-between">
                <Link to="/" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-600" />
                </Link>

                <div
                    className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={toggleMode}
                >
                    <span className={clsx("text-xs font-bold transition-colors", flashcardMode === 'EN_KR' ? "text-indigo-600" : "text-slate-400")}>EN</span>
                    <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                    <span className={clsx("text-xs font-bold transition-colors", flashcardMode === 'KR_EN' ? "text-indigo-600" : "text-slate-400")}>KR</span>
                </div>

                <div className="w-10" /> {/* Spacer */}
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-6 pb-24">
                <div className="w-full max-w-sm relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentWord.id + flashcardMode} // Key change triggers animation on mode switch too
                            initial={{ x: 50, opacity: 0, scale: 0.95 }}
                            animate={{ x: 0, opacity: 1, scale: 1 }}
                            exit={{ x: -50, opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card word={currentWord} mode={flashcardMode} />
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="mt-8 flex items-center gap-4">
                    <span className="text-slate-400 font-medium">{currentIndex + 1} / {vocabulary.length}</span>
                </div>

                <button
                    onClick={handleNext}
                    className="mt-8 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-slate-800 active:scale-95 transition-all w-full max-w-xs justify-center"
                >
                    <span>Next Word</span>
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
