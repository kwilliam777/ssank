
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Card } from '../components/Card';
import { vocabulary } from '../data/vocabulary';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { BackButton } from '../components/BackButton';

export function Learn() {
    const { addPoints, updateMissionProgress, currentLevel, currentChapter, currentGrade, saveSessionProgress, getSessionProgress, clearSessionProgress } = useGameStore();

    const filteredVocabulary = React.useMemo(() => {
        return vocabulary
            .filter(w => w.category === currentLevel && w.chapter === currentChapter && (!currentGrade || w.grade === currentGrade))
        // .sort(() => 0.5 - Math.random()) // Remove random sort to keep order consistent for resume?
        // Actually, if we shuffle, we can't easily resume unless we save the shuffled order.
        // For now, let's keep it simple: Resume works best with consistent order.
        // Or we save the seed/order.
        // Let's remove shuffle for learn mode to make it consistent 'book' style?
        // User didn't specify, but shuffle is usually good for flashcards.
        // If shuffled, we need to save the shuffled indices or the deck.
        // But storing the whole deck in local storage is heavy.
        // Let's stick to non-shuffled for now OR just save the index and hope the shuffle seed is roughly same? No, random is random.
        // Strategy: For "Resume", we really need deterministic order.
        // Let's remove sort for now to enable reliable resume.
        //.sort(() => 0.5 - Math.random());
    }, [currentLevel, currentChapter, currentGrade]);

    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showCompletionPopup, setShowCompletionPopup] = useState(false);
    const currentWord = filteredVocabulary[currentIndex];

    // Session ID
    const sessionId = `learn-${currentLevel}-${currentGrade || 'all'}-${currentChapter}`;

    // Motion values for swipe effect
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-30, 30]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

    // Load progress
    React.useEffect(() => {
        const progress = getSessionProgress(sessionId);
        if (progress && typeof progress.index === 'number') {
            setCurrentIndex(progress.index);
        }
    }, [sessionId]);

    // Save progress on change
    React.useEffect(() => {
        if (currentIndex > 0) {
            saveSessionProgress(sessionId, { index: currentIndex });
        }
    }, [currentIndex, sessionId]);

    // Reset index if level changes or data changes
    React.useEffect(() => {
        // Only reset if we don't have a saved session?
        // The load effect handles setting specific index.
        // This effect might conflicts.
        // Let's rely on sessionId change which triggers load.
        setShowCompletionPopup(false);
    }, [currentLevel, currentChapter]);

    if (!currentWord) {
        return <div className="p-8 text-center text-slate-500">No words found for this level.</div>;
    }

    const handleNext = () => {
        // Basic gamification: Award 1 point for reviewing a card
        addPoints(1);
        updateMissionProgress('review_20_cards', 1);

        if (currentIndex < filteredVocabulary.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // End of chapter
            setShowCompletionPopup(true);
            clearSessionProgress(sessionId);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleDragEnd = (_: any, info: any) => {
        const swipe = info.offset.x;
        if (swipe < -100) {
            handleNext();
        } else if (swipe > 100) {
            handlePrev();
        }
    };

    const handleRepeat = () => {
        setShowCompletionPopup(false);
        setCurrentIndex(0);
        clearSessionProgress(sessionId);
    };

    const handleRestart = () => {
        if (window.confirm("Restart this chapter from the beginning?")) {
            setCurrentIndex(0);
            clearSessionProgress(sessionId);
            setShowCompletionPopup(false);
        }
    };

    const handleExit = () => {
        navigate('/');
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            {/* Completion Popup */}
            {showCompletionPopup && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-3xl">
                            🎉
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Chapter Complete!</h3>
                            <p className="text-slate-600">You've reached the end of this chapter.</p>
                            <p className="text-slate-500 text-sm mt-1">Do you want to repeat?</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleExit}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                            >
                                No, Exit
                            </button>
                            <button
                                onClick={handleRepeat}
                                className="flex-1 py-3 px-4 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="p-4 flex items-center justify-between">
                <BackButton />

                <div className="flex flex-col items-center">
                    <span className="font-bold text-slate-800">Flashcards</span>
                    <span className="text-xs text-slate-500">{currentLevel} - Ch.{currentChapter}</span>
                </div>

                <button
                    onClick={handleRestart}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Restart"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                    </svg>
                </button>
            </header>

            {/* Flashcard Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 w-full relative overflow-hidden">
                {/* Swipe Indicators - Visual Hint */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 opacity-20 pointer-events-none">
                    <ArrowLeft className="w-12 h-12" />
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 opacity-20 pointer-events-none">
                    <ArrowLeft className="w-12 h-12 rotate-180" />
                </div>

                {/* Adaptive Container */}
                <div className="relative w-full max-w-lg h-[50vh] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentWord.id} // Key is important for AnimatePresence to detect changes
                            className="absolute h-full w-auto aspect-[3/4] max-w-full cursor-grab active:cursor-grabbing"
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={handleDragEnd}
                            style={{ x, rotate, opacity }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ x: 50, opacity: 0, scale: 0.95 }}
                            animate={{ x: 0, opacity: 1, scale: 1 }}
                            exit={{ x: -50, opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card word={currentWord} className="w-full h-full" />
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="mt-8 flex items-center gap-4">
                    <span className="text-slate-400 font-medium">{currentIndex + 1} / {filteredVocabulary.length}</span>
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
