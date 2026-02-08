import React, { useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Word } from '../data/vocabulary';

interface CardProps {
    word: Word;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ word, className }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    return (
        <div className={clsx("relative w-full aspect-[3/4] perspective-1000", className)} onClick={handleFlip}>
            <motion.div
                className="w-full h-full relative preserve-3d cursor-pointer"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
            >
                {/* Front */}
                <div className="absolute w-full h-full backface-hidden bg-white border-2 border-indigo-100 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center">
                    <span className="text-sm font-semibold text-indigo-500 mb-4 tracking-wider uppercase">{word.category}</span>
                    <h2 className="text-4xl font-bold text-slate-800 break-words">{word.word}</h2>
                    <p className="mt-8 text-slate-400 text-sm">Tap to flip</p>
                </div>

                {/* Back */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-indigo-600 text-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center">
                    <h3 className="text-xl font-semibold mb-4 opacity-90">Meaning</h3>
                    <p className="text-lg mb-8 leading-relaxed">{word.meaning}</p>

                    <div className="w-full h-px bg-indigo-400/30 mb-6" />

                    <h3 className="text-sm font-semibold mb-2 opacity-75">Example</h3>
                    <p className="text-base italic opacity-90">"{word.example}"</p>
                </div>
            </motion.div>
        </div>
    );
};
