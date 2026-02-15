import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/useGameStore';
import { vocabulary } from '../data/vocabulary';
import { BackButton } from '../components/BackButton';
import { playSound } from '../utils/sound';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, RefreshCw, Trophy } from 'lucide-react';
import clsx from 'clsx';

interface FallingWord {
    id: number;
    word: string; // English word to type
    meaning: string; // Korean meaning displayed
    x: number; // Horizontal position (%)
    y: number; // Vertical position (%)
    speed: number;
}

export function FallingWords() {
    const { currentLevel, currentChapter, addPoints, incrementStreak, resetStreak } = useGameStore();
    const [words, setWords] = useState<FallingWord[]>([]);
    const [input, setInput] = useState('');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(5);
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const gameLoopRef = useRef<number>();
    const lastSpawnTime = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter words for current level/chapter
    const availableWords = React.useMemo(() =>
        vocabulary.filter(w => w.category === currentLevel && w.chapter === currentChapter),
        [currentLevel, currentChapter]);

    const spawnWord = useCallback(() => {
        if (availableWords.length === 0) return;

        const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
        const id = Date.now();
        // Random x position between 10% and 90%
        const x = 10 + Math.random() * 80;
        // Speed increases slightly with score
        const speed = 0.2 + (score * 0.01);

        setWords(prev => [...prev, {
            id,
            word: randomWord.word,
            meaning: randomWord.meaningKR,
            x,
            y: -10,
            speed
        }]);
    }, [availableWords, score]);

    const updateGame = useCallback(() => {
        if (gameOver || !isPlaying) return;

        const now = Date.now();
        if (now - lastSpawnTime.current > 2000) { // Spawn every 2 seconds
            spawnWord();
            lastSpawnTime.current = now;
        }

        setWords(prevWords => {
            const nextWords = prevWords.map(w => ({
                ...w,
                y: w.y + w.speed
            }));

            // Check for missed words (hit bottom)
            const missedWords = nextWords.filter(w => w.y > 100);
            if (missedWords.length > 0) {
                playSound('wrong');
                setLives(prev => {
                    const newLives = prev - missedWords.length;
                    if (newLives <= 0) {
                        setGameOver(true);
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
    }, [gameOver, isPlaying, spawnWord, resetStreak]);

    useEffect(() => {
        if (isPlaying && !gameOver) {
            lastSpawnTime.current = Date.now();
            gameLoopRef.current = requestAnimationFrame(updateGame);
        }
        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [isPlaying, gameOver, updateGame]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInput(value);

        // Check if typed word matches any falling word
        const matchedWordIndex = words.findIndex(w => w.word.toLowerCase() === value.toLowerCase().trim());

        if (matchedWordIndex !== -1) {
            playSound('correct');
            addPoints(10);
            incrementStreak();
            setScore(prev => prev + 10);

            // Remove matched word
            setWords(prev => prev.filter((_, index) => index !== matchedWordIndex));
            setInput(''); // Clear input
        }
    };

    const startGame = () => {
        setWords([]);
        setScore(0);
        setLives(5);
        setGameOver(false);
        setIsPlaying(true);
        setInput('');
        resetStreak(); // Optional: reset streak on new game start? Or keep it? keeping logic simple.
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4 z-20 bg-slate-800/50 backdrop-blur-sm">
                <BackButton className="text-white hover:bg-slate-700" />
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                        <span className="font-bold text-xl">{lives}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                        <span className="font-bold text-xl">{score}</span>
                    </div>
                </div>
                <div className="w-10"></div> {/* Spacer */}
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
                            transition={{ duration: 0 }} // Managed by requestAnimationFrame
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

                {/* Game Over / Start Overlay */}
                {(!isPlaying || gameOver) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-30 backdrop-blur-sm">
                        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl text-center max-w-sm mx-4">
                            <h2 className="text-3xl font-bold mb-2">
                                {gameOver ? 'Game Over!' : 'Falling Words'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {gameOver
                                    ? `Final Score: ${score}`
                                    : 'Type the English word for the falling Korean meanings before they hit the bottom!'}
                            </p>

                            <button
                                onClick={startGame}
                                className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {gameOver ? <RefreshCw className="w-5 h-5" /> : null}
                                {gameOver ? 'Play Again' : 'Start Game'}
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
                        placeholder={isPlaying ? "Type English word..." : ""}
                        disabled={!isPlaying || gameOver}
                        className="w-full bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-xl px-4 py-3 text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        autoFocus
                    />
                </div>
            </div>
        </div>
    );
}
