import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { vocabulary } from '../data/vocabulary';
import { QuizOption } from '../components/QuizOption';
import { Link, useNavigate } from 'react-router-dom';
import { Timer, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProgressBar } from '../components/ProgressBar';
import { playSound } from '../utils/sound';
import { BackButton } from '../components/BackButton';

export function TimeChallenge() {
    const navigate = useNavigate();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30); // 30 seconds initial
    const [isGameOver, setIsGameOver] = useState(false);
    const [sessionPoints, setSessionPoints] = useState(0);

    const { addPoints, currentLevel, currentChapter, updateMissionProgress } = useGameStore();
    const timerRef = useRef<NodeJS.Timeout>();

    const filteredVocabulary = useMemo(() => {
        return vocabulary.filter(w => w.category === currentLevel && w.chapter === currentChapter);
    }, [currentLevel, currentChapter]);

    const currentWord = useMemo(() => {
        if (filteredVocabulary.length === 0) return null;
        return filteredVocabulary[currentQuestionIndex % filteredVocabulary.length];
    }, [currentQuestionIndex, filteredVocabulary]);

    const options = useMemo(() => {
        if (!currentWord) return [];

        const distractors = filteredVocabulary
            .filter(w => w.id !== currentWord.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        return [...distractors, currentWord].sort(() => 0.5 - Math.random());
    }, [currentWord, filteredVocabulary]);

    if (!currentWord) {
        return <div className="p-8 text-center text-slate-500">No words found for this level.</div>;
    }

    useEffect(() => {
        if (isGameOver) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    setIsGameOver(true);
                    updateMissionProgress('finish_time_challenge', 1);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [isGameOver]);

    const handleOptionClick = (wordId: string) => {
        if (isAnswered || isGameOver) return;

        setSelectedOption(wordId);
        setIsAnswered(true);

        const isCorrect = wordId === currentWord.id;

        if (isCorrect) {
            playSound('correct');
            const pointsEarned = 10 + Math.ceil(timeLeft / 5); // Bonus for time
            addPoints(pointsEarned);
            setSessionPoints(prev => {
                const newPoints = prev + pointsEarned;
                if (newPoints >= 100) {
                    updateMissionProgress('high_score_time_challenge', 1);
                }
                return newPoints;
            });
            // Add time bonus
            setTimeLeft(prev => Math.min(60, prev + 3));
        } else {
            playSound('wrong');
            // Penalty: deduct time
            setTimeLeft(prev => Math.max(0, prev - 5));
        }

        // Auto advance quickly
        setTimeout(() => {
            if (!isGameOver) {
                handleNext();
            }
        }, 800);
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

    if (isGameOver) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-slate-50">
                <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Timer className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Time's Up!</h1>
                    <p className="text-slate-500 mb-8">You showed great focus.</p>

                    <div className="bg-indigo-50 p-4 rounded-xl mb-8">
                        <span className="text-sm text-indigo-500 uppercase font-bold tracking-wider">Total Score</span>
                        <div className="text-4xl font-bold text-indigo-600">{sessionPoints}</div>
                    </div>

                    <div className="space-y-3">
                        <button onClick={() => window.location.reload()} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                            <RefreshCw className="w-5 h-5" />
                            <span>Play Again</span>
                        </button>
                        <Link to="/" className="block w-full py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            <header className="p-4 flex items-center justify-between">
                <BackButton />
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
                    <Timer className={isAnswered ? "w-5 h-5 text-slate-400" : "w-5 h-5 text-indigo-600 animate-pulse"} />
                    <span className={`font-bold tabular-nums ${timeLeft < 10 ? 'text-red-500' : 'text-slate-800'}`}>{timeLeft}s</span>
                </div>
                <div className="w-10" />
            </header>

            {/* Time Progress Bar */}
            <div className="px-6">
                <ProgressBar value={timeLeft} max={30} className="h-1.5" colorClass={timeLeft < 10 ? 'bg-red-500' : 'bg-indigo-500'} />
            </div>

            <div className="flex-1 p-6 flex flex-col max-w-2xl mx-auto w-full justify-center">
                <div className="mb-8 mt-4">
                    <span className="text-sm font-semibold text-indigo-500 uppercase tracking-wider mb-2 block">Meaning</span>
                    <motion.h2
                        key={currentWord.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-3xl font-bold text-slate-800 leading-tight"
                    >
                        {currentWord.meaningKR}
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
            </div>
        </div>
    );
}
