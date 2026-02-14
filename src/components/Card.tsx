import React, { useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Word } from '../data/vocabulary';

interface CardProps {
    word: Word;
    mode: 'EN_KR' | 'KR_EN';
    className?: string;
}

export const Card: React.FC<CardProps> = ({ word, mode, className }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    // Debugging
    console.log('Card rendering:', { word, mode, isFlipped });

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    // Determine what to show on front and back based on mode
    const isEnFront = mode === 'EN_KR';

    return (
        <div className={clsx("relative w-full aspect-[3/4] perspective-1000", className)} onClick={handleFlip}>
            <motion.div
                className="w-full h-full relative preserve-3d cursor-pointer"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
            >
                {/* Front */}
                <div className="absolute w-full h-full backface-hidden bg-white border-2 border-indigo-100 rounded-3xl shadow-xl overflow-hidden">
                    <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                        <span className="text-sm font-semibold text-indigo-500 mb-4 tracking-wider uppercase">{word.category}</span>
                        {isEnFront ? (
                            <h2 className="text-4xl font-bold text-slate-800 break-words">{word.word}</h2>
                        ) : (
                            <h2 className="text-3xl font-bold text-slate-800 break-words leading-snug">{word.meaningKR}</h2>
                        )}
                        <p className="mt-8 text-slate-400 text-sm">Tap to flip</p>
                    </div>
                </div>

                {/* Back */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-indigo-600 rounded-3xl shadow-xl overflow-hidden">
                    <div className="flex flex-col items-center justify-center p-8 text-center h-full text-white">
                        {isEnFront ? (
                            <>
                                <h3 className="text-xl font-bold mb-2 opacity-90">{word.meaningKR}</h3>
                                <p className="text-base mb-6 opacity-80 leading-relaxed font-medium">{word.meaning}</p>

                                <div className="w-full h-px bg-indigo-400/30 mb-4" />

                                <h3 className="text-sm font-semibold mb-1 opacity-75">Example</h3>
                                <p className="text-sm italic opacity-90">"{word.example}"</p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-4xl font-bold mb-6">{word.word}</h2>

                                <div className="w-full h-px bg-indigo-400/30 mb-4" />

                                <h3 className="text-sm font-semibold mb-1 opacity-75">Definition</h3>
                                <p className="text-base opacity-90 leading-relaxed">{word.meaning}</p>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
