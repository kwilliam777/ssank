import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { vocabulary } from '../data/vocabulary';
import { BackButton } from '../components/BackButton';
import { playSound } from '../utils/sound';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { ExitConfirmModal } from '../components/ExitConfirmModal';

interface Card {
    id: string; // unique ID for React key
    wordId: string; // to check matches
    content: string; // Text to display (English or Korean)
    type: 'word' | 'meaning';
    isFlipped: boolean;
    isMatched: boolean;
}

export function PairMatching() {
    const { currentLevel, currentGrade, currentChapter, addPoints, incrementStreak, resetStreak, setGameActive } = useGameStore();
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [isProcessing, setIsProcessing] = useState(false); // Validating match
    const [score, setScore] = useState(0);
    const [gameWon, setGameWon] = useState(false);

    // Timer State
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [timerActive, setTimerActive] = useState(false);

    // Exit Confirm
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const navigate = useNavigate();

    // Sync global game active state
    useEffect(() => {
        const isGameRunning = cards.length > 0 && !gameWon;
        setGameActive(isGameRunning);
        return () => setGameActive(false);
    }, [cards.length, gameWon, setGameActive]);

    const handleBackClick = () => {
        if (!gameWon && cards.length > 0) { // If game in progress
            setShowExitConfirm(true);
        } else {
            navigate(-1);
        }
    };

    // Filter available words
    const availableWords = React.useMemo(() =>
        vocabulary.filter(w => w.category === currentLevel &&
            w.chapter === currentChapter &&
            (!currentGrade || w.grade === currentGrade)),
        [currentLevel, currentGrade, currentChapter]);

    const startNewGame = () => {
        if (availableWords.length < 6) return; // Need at least 6 words for a 3x4 grid

        // Select 6 random words
        const shuffledWords = [...availableWords].sort(() => Math.random() - 0.5).slice(0, 6);

        // Create pairs
        const newCards: Card[] = [];
        shuffledWords.forEach(w => {
            newCards.push({
                id: `word-${w.id}`,
                wordId: w.id,
                content: w.word,
                type: 'word',
                isFlipped: false,
                isMatched: false
            });
            newCards.push({
                id: `meaning-${w.id}`,
                wordId: w.id,
                content: w.meaningKR,
                type: 'meaning',
                isFlipped: false,
                isMatched: false
            });
        });

        // Shuffle cards
        setCards(newCards.sort(() => Math.random() - 0.5));
        setFlippedIndices([]);
        setIsProcessing(false);
        setGameWon(false);
        setScore(0);
        resetStreak(); // Reset streak on new game? Or keep it. Let's reset for fresh start.

        // Start Timer
        setStartTime(Date.now());
        setElapsedTime(0);
        setTimerActive(true);
    };

    useEffect(() => {
        startNewGame();
    }, [availableWords]);

    // Timer Effect
    useEffect(() => {
        let interval: any;
        if (timerActive && startTime) {
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive, startTime]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleCardClick = (index: number) => {
        if (isProcessing || cards[index].isFlipped || cards[index].isMatched) return;

        // Restriction: Enforce cross-type matching
        const activeCardIndex = flippedIndices.length === 1 ? flippedIndices[0] : null;
        if (activeCardIndex !== null) {
            const activeType = cards[activeCardIndex].type;
            const clickedType = cards[index].type;
            // Prevent clicking the same type (e.g. word -> word)
            if (activeType === clickedType) return;
        }

        // Flip the card
        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);
        playSound('click');

        // Check for match if 2 cards flipped
        if (newFlipped.length === 2) {
            setIsProcessing(true);
            checkForMatch(newFlipped[0], newFlipped[1]);
        }
    };

    const checkForMatch = (index1: number, index2: number) => {
        const card1 = cards[index1];
        const card2 = cards[index2];

        if (card1.wordId === card2.wordId) {
            // Match!
            playSound('correct');
            addPoints(20);
            incrementStreak();
            setScore(prev => prev + 20);

            setTimeout(() => {
                setCards(prev => prev.map((c, i) =>
                    i === index1 || i === index2 ? { ...c, isMatched: true } : c
                ));
                setFlippedIndices([]);
                setIsProcessing(false);
            }, 500);
        } else {
            // No Match
            playSound('wrong');
            // resetStreak(); // Maybe be lenient in memory game? Or strict? Strict for now.

            setTimeout(() => {
                setCards(prev => prev.map((c, i) =>
                    i === index1 || i === index2 ? { ...c, isFlipped: false } : c
                ));
                setFlippedIndices([]);
                setIsProcessing(false);
            }, 1000);
        }
    };

    // Check Win Condition
    useEffect(() => {
        if (cards.length > 0 && cards.every(c => c.isMatched)) {
            setGameWon(true);
            setTimerActive(false); // Stop Timer
            playSound('correct'); // Reusing correct sound for big win
        }
    }, [cards]);

    // Derived state for highlighting and restrictions
    const activeCardIndex = flippedIndices.length === 1 ? flippedIndices[0] : null;
    const activeCardType = activeCardIndex !== null ? cards[activeCardIndex].type : null;

    if (availableWords.length < 6) {
        return <div className="p-8 text-center">Not enough words in this chapter to play (Need at least 6).</div>;
    }

    const meaningCards = cards.filter(c => c.type === 'meaning');
    const wordCards = cards.filter(c => c.type === 'word');

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <ExitConfirmModal
                isOpen={showExitConfirm}
                onCancel={() => setShowExitConfirm(false)}
                onConfirm={() => navigate(-1)}
            />
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white shadow-sm z-10">
                <BackButton onClick={handleBackClick} />
                <div className="flex flex-col items-center">
                    <span className="font-bold text-slate-800">Pair Matching</span>
                    <span className="text-xs text-slate-500">{currentLevel} - Ch.{currentChapter}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-5 h-5" />
                        <span className="font-mono font-bold">{formatTime(elapsedTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <span className="font-bold text-slate-700">{score}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-y-auto">

                {/* Korean Meanings (Top) */}
                <div className={clsx(
                    "flex-1 bg-white/50 rounded-2xl p-4 transition-all duration-300 border-2",
                    activeCardType === 'word'
                        ? "border-yellow-400 bg-yellow-50/50 shadow-[0_0_15px_rgba(250,204,21,0.3)] scale-[1.02] z-10"
                        : activeCardType === 'meaning'
                            ? "border-slate-200 opacity-50 grayscale pointer-events-none" // Disabled state
                            : "border-transparent"
                )}>
                    <h3 className={clsx(
                        "text-sm font-bold mb-3 text-center uppercase tracking-wider",
                        activeCardType === 'word' ? "text-yellow-600 animate-pulse" : "text-slate-400"
                    )}>
                        Select Meaning 🇰🇷
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {meaningCards.map((card) => {
                            const originalIndex = cards.findIndex(c => c.id === card.id);
                            return (
                                <div key={card.id} className="relative w-full aspect-[4/3] perspective-1000" onClick={() => handleCardClick(originalIndex)}>
                                    <motion.div
                                        className="w-full h-full relative preserve-3d transition-all duration-300"
                                        animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        <div className="absolute inset-0 backface-hidden bg-indigo-100 rounded-xl border-2 border-indigo-200 flex items-center justify-center shadow-sm cursor-pointer hover:bg-indigo-200 transition-colors">
                                            <span className="text-2xl text-indigo-300 font-bold opacity-50">🇰🇷</span>
                                        </div>
                                        <div
                                            className={clsx(
                                                "absolute inset-0 backface-hidden bg-white rounded-xl border-2 flex items-center justify-center shadow-md p-2 text-center cursor-default",
                                                card.isMatched ? "border-green-400 bg-green-50" : "border-indigo-500",
                                                "overflow-hidden text-xs sm:text-sm font-bold break-keep"
                                            )}
                                            style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                                        >
                                            <span className={clsx(
                                                "select-none text-indigo-700",
                                                card.isMatched && "text-green-700"
                                            )}>
                                                {card.content}
                                            </span>
                                        </div>
                                    </motion.div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* English Words (Bottom) */}
                <div className={clsx(
                    "flex-1 bg-white/50 rounded-2xl p-4 transition-all duration-300 border-2",
                    activeCardType === 'meaning'
                        ? "border-yellow-400 bg-yellow-50/50 shadow-[0_0_15px_rgba(250,204,21,0.3)] scale-[1.02] z-10"
                        : activeCardType === 'word'
                            ? "border-slate-200 opacity-50 grayscale pointer-events-none" // Disabled state
                            : "border-transparent"
                )}>
                    <h3 className={clsx(
                        "text-sm font-bold mb-3 text-center uppercase tracking-wider",
                        activeCardType === 'meaning' ? "text-yellow-600 animate-pulse" : "text-slate-400"
                    )}>
                        Select Word 🇺🇸
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {wordCards.map((card) => {
                            const originalIndex = cards.findIndex(c => c.id === card.id);
                            return (
                                <div key={card.id} className="relative w-full aspect-[4/3] perspective-1000" onClick={() => handleCardClick(originalIndex)}>
                                    <motion.div
                                        className="w-full h-full relative preserve-3d transition-all duration-300"
                                        animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        <div className="absolute inset-0 backface-hidden bg-indigo-50 rounded-xl border-2 border-indigo-200 flex items-center justify-center shadow-sm cursor-pointer hover:bg-indigo-100 transition-colors">
                                            <span className="text-2xl text-indigo-300 font-bold opacity-50">🇺🇸</span>
                                        </div>
                                        <div
                                            className={clsx(
                                                "absolute inset-0 backface-hidden bg-white rounded-xl border-2 flex items-center justify-center shadow-md p-2 text-center cursor-default",
                                                card.isMatched ? "border-green-400 bg-green-50" : "border-indigo-500",
                                                "overflow-hidden text-sm sm:text-base font-bold break-words"
                                            )}
                                            style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                                        >
                                            <span className={clsx(
                                                "select-none text-slate-800",
                                                card.isMatched && "text-green-700"
                                            )}>
                                                {card.content}
                                            </span>
                                        </div>
                                    </motion.div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Win Overlay */}
                <AnimatePresence>
                    {gameWon && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-20 flex items-center justify-center p-6"
                        >
                            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full">
                                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                                <h2 className="text-3xl font-bold text-slate-800 mb-2">Well Done!</h2>
                                <p className="text-slate-500 mb-2">You matched all pairs!</p>
                                <div className="text-xl font-mono font-bold text-indigo-600 bg-indigo-50 py-2 px-4 rounded-lg inline-block mb-6">
                                    Time: {formatTime(elapsedTime)}
                                </div>
                                <button
                                    onClick={startNewGame}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all"
                                >
                                    Play Again
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
