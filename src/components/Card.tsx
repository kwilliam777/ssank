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
    const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

    React.useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            // Prioritize high quality voices
            // 1. Google US English (Chrome)
            // 2. Samantha (Mac)
            // 3. Microsoft Zira (Windows)
            // 4. Any en-US voice
            const bestVoice = voices.find(v => v.name === 'Google US English') ||
                voices.find(v => v.name === 'Samantha') ||
                voices.find(v => v.lang === 'en-US' && v.name.includes('Premium')) ||
                voices.find(v => v.lang === 'en-US');

            setVoice(bestVoice || null);
        };

        loadVoices();

        // Browsers like Chrome load voices asynchronously
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleSpeak = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card flip

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(word.word);
        utterance.lang = 'en-US';

        if (voice) {
            utterance.voice = voice;
        }

        // Adjust for smoother sound
        utterance.rate = 0.9; // Slightly slower
        utterance.pitch = 1.0;

        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className={clsx("relative perspective-1000", className)} onClick={handleFlip}>
            <motion.div
                className="w-full h-full relative preserve-3d cursor-pointer"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
            >
                {/* Front (English) */}
                <div className="absolute w-full h-full backface-hidden bg-white border-2 border-indigo-100 rounded-3xl shadow-xl overflow-hidden">
                    <div className="flex flex-col items-center justify-center p-8 text-center h-full relative">
                        {/* Audio Button */}
                        <button
                            onClick={handleSpeak}
                            className="absolute top-4 right-4 p-3 bg-indigo-50 text-indigo-500 rounded-full hover:bg-indigo-100 transition-colors z-10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                            </svg>
                        </button>

                        <span className="text-sm font-semibold text-indigo-500 mb-8 tracking-wider uppercase">English</span>
                        <h2 className="text-4xl font-bold text-slate-800 break-words">{word.word}</h2>
                        <p className="mt-8 text-slate-400 text-sm">Tap to flip</p>
                    </div>
                </div>

                {/* Back (Korean) */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-indigo-600 rounded-3xl shadow-xl overflow-hidden">
                    <div className="flex flex-col items-center justify-center p-8 text-center h-full text-white">
                        <span className="text-sm font-semibold text-indigo-200 mb-8 tracking-wider uppercase">Meaning</span>
                        <h2 className="text-3xl font-bold leading-snug">{word.meaningKR}</h2>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
