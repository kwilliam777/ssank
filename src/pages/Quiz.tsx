import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { vocabulary } from '../data/vocabulary';
import { QuizOption } from '../components/QuizOption';
import { Link } from 'react-router-dom';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

export function Quiz() {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    const { addPoints, incrementStreak, resetStreak, updateMissionProgress } = useGameStore();

    // Simple randomization for now - in real app, use more robust logic
    const currentWord = useMemo(() => {
        return vocabulary[currentQuestionIndex % vocabulary.length];
    }, [currentQuestionIndex]);

    const options = useMemo(() => {
        const distractors = vocabulary
            .filter(w => w.id !== currentWord.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        return [...distractors, currentWord].sort(() => 0.5 - Math.random());
    }, [currentWord]);

    const handleOptionClick = (wordId: string) => {
        if (isAnswered) return;

        setSelectedOption(wordId);
        setIsAnswered(true);

        const isCorrect = wordId === currentWord.id;

        if (isCorrect) {
            addPoints(10); // Base points
            incrementStreak();
            updateMissionProgress('complete_quiz', 1);
            // Play sound?
        } else {
            resetStreak();
        }

        // Auto advance
        setTimeout(() => {
            handleNext();
        }, 1500);
    };

    const handleNext = () => {
        setSelectedOption(null);
        setIsAnswered(false);
        setCurrentQuestionIndex(prev => prev + 1);
    };

    const getOptionState = (optionId: string) => {
        if (!isAnswered) return selectedOption === optionId ? 'selected' : 'idle';

        if (optionId === currentWord.id) return 'correct';
        if (optionId === selectedOption && selectedOption !== currentWord.id) return 'wrong';

        return 'idle';
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <header className="p-4 flex items-center justify-between">
                <Link to="/" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-600" />
                </Link>
                <div className="flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-slate-800">Quiz</span>
                </div>
                <div className="w-10" />
            </header>

            <div className="flex-1 p-6 flex flex-col max-w-md mx-auto w-full">
                <div className="mb-8">
                    <span className="text-sm font-semibold text-indigo-500 uppercase tracking-wider mb-2 block">Definition</span>
                    <motion.h2
                        key={currentWord.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-bold text-slate-800 leading-tight"
                    >
                        {currentWord.meaning}
                    </motion.h2>
                </div>

                <div className="space-y-3">
                    {options.map((option) => (
                        <QuizOption
                            key={option.id}
                            text={option.word}
                            state={getOptionState(option.id)}
                            disabled={isAnswered}
                            onClick={() => handleOptionClick(option.id)}
                        />
                    ))}
                </div>

                {isAnswered && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-sm"
                    >
                        <span className="font-bold block mb-1">Example usage:</span>
                        "{currentWord.example}"
                    </motion.div>
                )}
            </div>
        </div>
    );
}
