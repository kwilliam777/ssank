
import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Card } from '../components/Card';
import { vocabulary } from '../data/vocabulary';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { BackButton } from '../components/BackButton';

export function Learn() {
    const { addPoints, updateMissionProgress, currentLevel, currentChapter } = useGameStore();

    const filteredVocabulary = React.useMemo(() => {
        return vocabulary
            .filter(w => w.category === currentLevel && w.chapter === currentChapter)
            .sort(() => 0.5 - Math.random());
    }, [currentLevel, currentChapter]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const currentWord = filteredVocabulary[currentIndex];

    // Motion values for swipe effect
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-30, 30]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

    // Reset index if level changes or data changes
    React.useEffect(() => {
        setCurrentIndex(0);
    }, [currentLevel]);

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
            // Loop back
            setCurrentIndex(0);
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

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <header className="p-4 flex items-center justify-between">
                <BackButton />

                <div className="flex flex-col items-center">
                    <span className="font-bold text-slate-800">Flashcards</span>
                    <span className="text-xs text-slate-500">{currentLevel} - Ch.{currentChapter}</span>
                </div>

                <div className="w-10" /> {/* Spacer */}
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
                <div className="relative w-full max-w-md h-[65vh] flex items-center justify-center">
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
