import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { vocabulary } from '../data/vocabulary';
import { BackButton } from '../components/BackButton';
import { playSound } from '../utils/sound';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Trophy } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { ExitConfirmModal } from '../components/ExitConfirmModal';

// Simple shuffle function
const shuffleString = (str: string) => {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
};

export function WordScramble() {
    const { currentLevel, currentGrade, currentChapter, addPoints, incrementStreak, resetStreak, setGameActive } = useGameStore();
    const navigate = useNavigate();
    const [currentWord, setCurrentWord] = useState<typeof vocabulary[0] | null>(null);
    const [scrambledButtons, setScrambledButtons] = useState<{ id: string; char: string; isUsed: boolean }[]>([]);

    // userAnswer is now an array of fixed size (length of word), containing null or the chosen item
    const [userAnswer, setUserAnswer] = useState<({ id: string; char: string } | null)[]>([]);

    const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const [score, setScore] = useState(0);

    // New state for game flow
    const [remainingWords, setRemainingWords] = useState<typeof vocabulary>([]);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);

    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Update global game active state
    useEffect(() => {
        const isPlaying = gameStarted && !gameCompleted;
        setGameActive(isPlaying);
        return () => setGameActive(false);
    }, [gameStarted, gameCompleted, setGameActive]);

    const handleBackClick = () => {
        if (gameStarted && !gameCompleted) {
            setShowExitConfirm(true);
        } else {
            navigate(-1);
        }
    };

    const confirmExit = () => {
        setGameActive(false);
        setShowExitConfirm(false);
        navigate(-1);
    };

    const cancelExit = () => {
        setShowExitConfirm(false);
    };

    // Filter words
    const availableWords = React.useMemo(() =>
        vocabulary.filter(w => w.category === currentLevel &&
            w.chapter === currentChapter &&
            (!currentGrade || w.grade === currentGrade)),
        [currentLevel, currentGrade, currentChapter]);

    const startGame = () => {
        setGameStarted(true);
        setGameCompleted(false);
        setScore(0);
        resetStreak();
        setStartTime(Date.now());
        setEndTime(null);

        // Initialize deck with shuffled words
        const deck = [...availableWords].sort(() => Math.random() - 0.5);
        setRemainingWords(deck);

        // Load first word immediately
        loadNextWord(deck);
    };

    const loadNextWord = (deck: typeof vocabulary) => {
        if (deck.length === 0) {
            // Game Over
            setGameCompleted(true);
            setEndTime(Date.now());
            setCurrentWord(null);
            return;
        }

        const nextWord = deck[0];
        setRemainingWords(deck.slice(1)); // Remove from deck
        setCurrentWord(nextWord);

        let shuffled = shuffleString(nextWord.word.toUpperCase());
        // Ensure it's not same as original (simple check)
        while (shuffled === nextWord.word.toUpperCase() && nextWord.word.length > 1) {
            shuffled = shuffleString(nextWord.word.toUpperCase());
        }

        const buttons = shuffled.split('').map((char, index) => ({
            id: `${index}-${char}-${Date.now()}`,
            char,
            isUsed: false
        }));
        setScrambledButtons(buttons);

        // Initialize answer slots with nulls
        setUserAnswer(Array(nextWord.word.length).fill(null));
        setFeedback('idle');
    };

    const handleLetterClick = (item: { id: string; char: string }, index: number) => {
        if (feedback !== 'idle' || !currentWord) return;

        // Find first empty slot
        const emptySlotIndex = userAnswer.findIndex(slot => slot === null);

        if (emptySlotIndex !== -1) {
            // Fill the slot
            setUserAnswer(prev => {
                const newArr = [...prev];
                newArr[emptySlotIndex] = { id: item.id, char: item.char };
                return newArr;
            });

            // Mark as used in pool
            setScrambledButtons(prev => {
                const newArr = [...prev];
                newArr[index].isUsed = true;
                return newArr;
            });
            playSound('click');
        }
    };

    const handleAnswerClick = (item: { id: string; char: string }, index: number) => {
        if (feedback !== 'idle') return;

        // Remove from answer slot (set to null)
        setUserAnswer(prev => {
            const newArr = [...prev];
            newArr[index] = null;
            return newArr;
        });

        // Mark as unused in pool
        setScrambledButtons(prev => prev.map(btn => btn.id === item.id ? { ...btn, isUsed: false } : btn));
        playSound('click');
    };

    const checkAnswer = () => {
        if (!currentWord) return;

        // Check if all slots are filled
        if (userAnswer.some(slot => slot === null)) return;

        const formedWord = userAnswer.map(u => u!.char).join('');

        if (formedWord === currentWord.word.toUpperCase()) {
            setFeedback('correct');
            playSound('correct');
            addPoints(15);
            incrementStreak();
            setScore(prev => prev + 15);

            setTimeout(() => {
                // Pass current remainingWords properly
                loadNextWord(remainingWords);
            }, 1000);
        } else {
            setFeedback('wrong');
            playSound('wrong');
            resetStreak();
            setTimeout(() => {
                setFeedback('idle');
                // Reset letters: Clear all slots and return to pool
                // Alternatively, we could just clear wrong letters, but clearing all is standard
                setUserAnswer(Array(currentWord.word.length).fill(null));
                setScrambledButtons(prev => prev.map(btn => ({ ...btn, isUsed: false })));
            }, 1000);
        }
    };

    // Auto-check when all letters are used OR all slots filled
    useEffect(() => {
        if (currentWord && userAnswer.every(slot => slot !== null)) {
            checkAnswer();
        }
    }, [userAnswer]);

    // Calculate duration
    const getDuration = () => {
        if (!startTime || !endTime) return "0s";
        const seconds = Math.floor((endTime - startTime) / 1000);
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    // Initial Start Screen
    if (!gameStarted) {
        return (
            <div className="flex flex-col h-full bg-slate-50 items-center justify-center p-8 text-center relative">
                <BackButton className="absolute top-4 left-4" onClick={handleBackClick} />
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Word Scramble</h1>
                <p className="text-slate-500 mb-8">Unscramble all {availableWords.length} words in this chapter!</p>
                <button
                    onClick={startGame}
                    className="w-full max-w-sm py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                    Start Game
                </button>
            </div>
        );
    }

    if (gameCompleted) {
        return (
            <div className="flex flex-col h-full bg-slate-50 items-center justify-center p-8 text-center relative">
                <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm animate-fade-in-up">
                    <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Chapter Complete!</h1>
                    <p className="text-slate-500 mb-6">You unscrambled all words!</p>

                    <div className="bg-indigo-50 p-4 rounded-xl mb-8">
                        <span className="text-xs text-indigo-500 uppercase font-bold tracking-wider block mb-1">Time Taken</span>
                        <div className="text-3xl font-bold text-indigo-600">{getDuration()}</div>
                    </div>

                    <div className="space-y-3">
                        <button onClick={startGame} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                            Play Again
                        </button>
                        <button onClick={() => window.history.back()} className="block w-full py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">
                            Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentWord) return <div>Loading...</div>;

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <ExitConfirmModal
                isOpen={showExitConfirm}
                onConfirm={confirmExit}
                onCancel={cancelExit}
                title="Exit Game?"
                message="Your progress in this chapter will be lost."
            />
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white shadow-sm z-10">
                <BackButton onClick={handleBackClick} />
                <div className="flex flex-col items-center">
                    <span className="font-bold text-slate-800">Word Scramble</span>
                    <span className="text-xs text-slate-500">{remainingWords.length + 1} remaining</span>
                </div>
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="font-bold text-slate-700">{score}</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-10">

                {/* Meaning Hint */}
                <div className="text-center space-y-2">
                    <span className="text-sm font-medium text-indigo-500 uppercase tracking-wider">Meaning</span>
                    <h2 className="text-3xl font-bold text-slate-800 break-keep animate-fade-in">
                        {currentWord.meaningKR}
                    </h2>
                </div>

                {/* Answer Slots */}
                <div className="flex flex-wrap justify-center gap-2 min-h-[64px]">
                    {userAnswer.map((item, index) => {
                        if (item) {
                            // Filled Slot
                            return (
                                <motion.button
                                    layoutId={item.id}
                                    key={item.id}
                                    onClick={() => handleAnswerClick(item, index)}
                                    className={clsx(
                                        "w-12 h-14 rounded-xl font-bold text-2xl shadow-sm border-b-4 transition-all flex items-center justify-center",
                                        feedback === 'correct' ? "bg-green-100 text-green-700 border-green-300" :
                                            feedback === 'wrong' ? "bg-red-100 text-red-700 border-red-300" :
                                                "bg-indigo-600 text-white border-indigo-800 hover:bg-indigo-500"
                                    )}
                                >
                                    {item.char}
                                </motion.button>
                            );
                        } else {
                            // Empty Slot
                            return (
                                <div
                                    key={`empty-${index}`}
                                    className="w-12 h-14 rounded-xl bg-slate-200 border-2 border-dashed border-slate-300"
                                />
                            );
                        }
                    })}
                </div>

                {/* Scrambled Letters Pool */}
                <div className="flex flex-wrap justify-center gap-3 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 max-w-lg w-full">
                    {scrambledButtons.map((item, index) => (
                        <div key={item.id} className="relative w-12 h-12">
                            {/* Placeholder to keep layout stable */}
                            <div className="absolute inset-0 bg-slate-100 rounded-lg opacity-50" />

                            {!item.isUsed && (
                                <motion.button
                                    layoutId={item.id}
                                    onClick={() => handleLetterClick(item, index)}
                                    className="absolute inset-0 w-full h-full bg-white border-2 border-slate-200 rounded-lg shadow-sm text-slate-700 font-bold text-xl hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center"
                                >
                                    {item.char}
                                </motion.button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Feedback Message */}
                <div className="h-8 flex items-center justify-center">
                    {feedback === 'correct' && (
                        <div className="flex items-center gap-2 text-green-600 font-bold animate-bounce">
                            <CheckCircle className="w-6 h-6" />
                            <span>Correct!</span>
                        </div>
                    )}
                    {feedback === 'wrong' && (
                        <div className="flex items-center gap-2 text-red-500 font-bold animate-shake">
                            <XCircle className="w-6 h-6" />
                            <span>Try Again!</span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
