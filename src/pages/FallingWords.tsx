import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/useGameStore';
import { vocabulary } from '../data/vocabulary';
import { BackButton } from '../components/BackButton';
import { playSound } from '../utils/sound';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, RefreshCw, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ExitConfirmModal } from '../components/ExitConfirmModal';

interface FallingWord {
    id: number;
    word: string; // English word to type
    meaning: string; // Korean meaning displayed
    x: number; // Horizontal position (%)
    y: number; // Vertical position (%)
    speed: number;
}

export function FallingWords() {
    const { currentLevel, currentGrade, currentChapter, addPoints, incrementStreak, resetStreak, setGameActive } = useGameStore();
    const [words, setWords] = useState<FallingWord[]>([]);
    const [input, setInput] = useState('');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(5);
    const [gameOver, setGameOver] = useState(false);
    const [gameWon, setGameWon] = useState(false); // Track if won
    const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('easy');

    const [isPlaying, setIsPlaying] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);

    // Remaining words to spawn
    const [remainingWords, setRemainingWords] = useState<typeof vocabulary>([]);

    const gameLoopRef = useRef<number>();
    const lastSpawnTime = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const navigate = useNavigate();

    // Sync global game active state
    useEffect(() => {
        setGameActive(isPlaying);
        return () => setGameActive(false);
    }, [isPlaying, setGameActive]);

    const handleBackClick = () => {
        if (isPlaying && !gameOver && !gameWon) {
            setIsPlaying(false);
            setShowExitConfirm(true);
        } else {
            navigate(-1);
        }
    };

    const handleConfirmExit = () => {
        navigate(-1);
    };

    const handleCancelExit = () => {
        setShowExitConfirm(false);
        setIsPlaying(true);
    };

    // Filter words for current level/chapter
    const availableWords = React.useMemo(() =>
        vocabulary.filter(w => w.category === currentLevel &&
            w.chapter === currentChapter &&
            (!currentGrade || w.grade === currentGrade)),
        [currentLevel, currentGrade, currentChapter]);

    const spawnWord = useCallback(() => {
        if (remainingWords.length === 0) return;

        // Pick random from REMAINING words
        const randomIndex = Math.floor(Math.random() * remainingWords.length);
        const randomWord = remainingWords[randomIndex];

        // Remove from remaining
        setRemainingWords(prev => prev.filter((_, i) => i !== randomIndex));

        const id = Date.now();
        const x = 20 + Math.random() * 60;

        // Base speed based on difficulty
        const baseSpeed = difficulty === 'hard' ? 0.09 : difficulty === 'normal' ? 0.07 : 0.05;

        const textLength = randomWord.word.length;
        const clampedLength = Math.max(3, Math.min(10, textLength));
        const ratio = (10 - clampedLength) / (10 - 3);
        const maxBonus = 0.4;
        const modifier = 1 + (ratio * maxBonus);

        const speed = baseSpeed * modifier;

        setWords(prev => [...prev, {
            id,
            word: randomWord.word,
            meaning: randomWord.meaningKR,
            x,
            y: -10,
            speed
        }]);
    }, [remainingWords, score]);

    const updateGame = useCallback(() => {
        if (gameOver || gameWon || !isPlaying) return;

        // Helper to calculate spawn interval based on score
        // Start: 2500ms (Slow) -> End: 800ms (Fast density, but slow fall)
        const getSpawnInterval = () => {
            return Math.max(800, 2500 - (score * 10)); // Reduces by 10ms per point
        };

        const now = Date.now();
        // Check if we should spawn
        if (remainingWords.length > 0 && now - lastSpawnTime.current > getSpawnInterval()) {
            spawnWord();
            lastSpawnTime.current = now;
        }

        // Check for Win Condition: No remaining words to spawn AND no words currently falling
        if (remainingWords.length === 0 && words.length === 0) {
            setGameWon(true);
            setEndTime(Date.now());
            setIsPlaying(false);
            playSound('correct'); // Victory sound
            return;
        }

        setWords(prevWords => {
            const nextWords = prevWords.map(w => ({
                ...w,
                y: w.y + w.speed
            }));

            // Check for missed words
            const missedWords = nextWords.filter(w => w.y > 100);
            if (missedWords.length > 0) {
                playSound('wrong');
                setLives(prev => {
                    const newLives = prev - missedWords.length;
                    if (newLives <= 0) {
                        setGameOver(true);
                        setEndTime(Date.now());
                        setIsPlaying(false);
                        playSound('wrong');
                    }
                    return Math.max(0, newLives);
                });
                resetStreak();
            }

            return nextWords.filter(w => w.y <= 100);
        });

        gameLoopRef.current = requestAnimationFrame(updateGame);
    }, [gameOver, gameWon, isPlaying, remainingWords.length, words.length, spawnWord, resetStreak]);

    useEffect(() => {
        if (isPlaying && !gameOver && !gameWon) {
            if (!startTime) setStartTime(Date.now());
            lastSpawnTime.current = Date.now();
            gameLoopRef.current = requestAnimationFrame(updateGame);
        }
        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [isPlaying, gameOver, gameWon, updateGame, startTime]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInput(value);

        const matchedWordIndex = words.findIndex(w => w.word.toLowerCase() === value.toLowerCase().trim());

        if (matchedWordIndex !== -1) {
            playSound('correct');
            addPoints(10);
            incrementStreak();
            setScore(prev => prev + 10);

            setWords(prev => prev.filter((_, index) => index !== matchedWordIndex));
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setInput('');
        }
    };

    const startGame = () => {
        setWords([]);
        setScore(0);
        setLives(5);
        setGameOver(false);
        setGameWon(false);
        setIsPlaying(true);
        setInput('');
        resetStreak();
        setRemainingWords(availableWords); // Reset deck
        setStartTime(Date.now());
        setEndTime(null);
    };

    // Calculate duration
    const getDuration = () => {
        if (!startTime || !endTime) return "0s";
        const seconds = Math.floor((endTime - startTime) / 1000);
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden relative">
            <ExitConfirmModal
                isOpen={showExitConfirm}
                onCancel={handleCancelExit}
                onConfirm={handleConfirmExit}
                title="End Game?"
                message="Your progress will be lost."
            />
            {/* Header */}
            <div className="flex items-center justify-between p-4 z-20 bg-slate-800/50 backdrop-blur-sm">
                <BackButton className="text-white hover:bg-slate-700" onClick={handleBackClick} />
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                        <span className="font-bold text-xl">{lives}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                        <span className="font-bold text-xl">{score}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                        {remainingWords.length} left
                    </div>
                </div>
                <div className="w-10"></div>
            </div>

            {/* Game Area */}
            <div ref={containerRef} className="flex-1 relative overflow-hidden">
                <AnimatePresence>
                    {words.map(word => (
                        <motion.div
                            key={word.id}
                            initial={{ y: -50, x: `${word.x}%`, opacity: 0 }}
                            animate={{ y: `${word.y}%`, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0 }}
                            style={{
                                position: 'absolute',
                                left: `${word.x}%`,
                                top: `${word.y}%`,
                                transform: 'translateX(-50%)'
                            }}
                            className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-center"
                        >
                            <span className="text-lg font-bold text-white shadow-sm block whitespace-nowrap">
                                {word.meaning}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Game Over / Win Overlay */}
                {(!isPlaying || gameOver || gameWon) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-30 backdrop-blur-sm">
                        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl text-center max-w-sm mx-4">
                            <h2 className="text-3xl font-bold mb-2">
                                {gameWon ? 'Level Complete!' : gameOver ? 'Game Over!' : 'Falling Words'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {gameWon ? `You matched all words in ${getDuration()}!` :
                                    gameOver ? `Final Score: ${score}` :
                                        'Type the English word for the falling Korean meanings!'}
                            </p>

                            {/* Difficulty Selector */}
                            {!isPlaying && !gameWon && !gameOver && (
                                <div className="flex gap-2 justify-center mb-6">
                                    {(['easy', 'normal', 'hard'] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setDifficulty(mode)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${difficulty === mode
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                }`}
                                        >
                                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={startGame}
                                className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {gameOver || gameWon ? <RefreshCw className="w-5 h-5" /> : null}
                                {gameOver || gameWon ? 'Play Again' : 'Start Game'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 pb-8 z-20 bg-slate-800/80 backdrop-blur-md bottom-0 w-full">
                <div className="max-w-md mx-auto relative">
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={isPlaying ? "Type English word..." : ""}
                        disabled={!isPlaying || gameOver || gameWon}
                        className="w-full bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-xl px-4 py-3 text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        autoFocus
                    />
                </div>
            </div>
        </div>
    );
}
