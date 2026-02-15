
import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/useGameStore';
import { vocabulary } from '../data/vocabulary';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Volume2 } from 'lucide-react';
import { ProgressBar } from '../components/ProgressBar';
import { QuizOption } from '../components/QuizOption';
import clsx from 'clsx';
import { playSound } from '../utils/sound';
import { BackButton } from '../components/BackButton';

export function Quiz() {
    const navigate = useNavigate();
    const {
        currentLevel,
        currentChapter,
        addPoints,
        incrementStreak,
        resetStreak,
        updateMissionProgress
    } = useGameStore();

    // Quiz Mode Selection: 
    // 'ko-en' (Meaning)
    // 'en-en-context' (Context/Example) - renamed from 'en-en' for clarity but keeping 'en-en' logic if needed or refactoring
    // 'en-en-meaning' (Definition)
    const [quizMode, setQuizMode] = useState<'ko-en' | 'en-en-context' | 'en-en-meaning' | null>(null);

    // Deck Management
    const [deck, setDeck] = useState<typeof vocabulary>([]);
    const [currentWord, setCurrentWord] = useState<typeof vocabulary[0] | null>(null);
    const [options, setOptions] = useState<string[]>([]);

    // Quiz State
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [streakCount, setStreakCount] = useState(0);

    // Initialize/Reset Deck
    useEffect(() => {
        if (quizMode) {
            initializeDeck();
        }
    }, [currentLevel, currentChapter, quizMode]);

    const initializeDeck = () => {
        const chapterWords = vocabulary.filter(
            w => w.category === currentLevel && w.chapter === currentChapter
        );
        // Shuffle full chapter to create a deck
        const shuffled = [...chapterWords].sort(() => Math.random() - 0.5);
        setDeck(shuffled);
        if (shuffled.length > 0) {
            setupQuestion(shuffled[0], shuffled); // Start with first word
        }
    };

    const setupQuestion = (word: typeof vocabulary[0], currentDeck: typeof vocabulary) => {
        setCurrentWord(word);
        setSelectedOption(null);
        setIsCorrect(null);

        // Generate options (1 correct + 3 random from SAME category/level if possible)
        const otherWords = vocabulary.filter(w => w.id !== word.id && w.category === currentLevel);
        const randomDistractors = otherWords
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(w => w.word);

        const allOptions = [word.word, ...randomDistractors].sort(() => Math.random() - 0.5);
        setOptions(allOptions);
    };

    const nextQuestion = () => {
        // Remove current word from deck
        const nextDeck = deck.slice(1); // Remove the first item (current word)

        if (nextDeck.length === 0) {
            // Deck empty, mark chapter finished and reshuffle
            updateMissionProgress('finish_chapter', 1);
            initializeDeck();
        } else {
            setDeck(nextDeck);
            setupQuestion(nextDeck[0], nextDeck);
        }
    };

    const handleOptionClick = (option: string) => {
        if (selectedOption || !currentWord) return;

        setSelectedOption(option);
        const correct = option === currentWord.word;
        setIsCorrect(correct);

        if (correct) {
            playSound('correct');
            addPoints(10);
            incrementStreak();
            const newStreak = streakCount + 1;
            setStreakCount(newStreak);

            if (newStreak >= 5) {
                updateMissionProgress('perfect_quiz', 1);
            }
            updateMissionProgress('complete_quiz', 1);
        } else {
            playSound('wrong');
            resetStreak();
            setStreakCount(0);
        }
    };

    // Display Logic
    const getQuestionText = () => {
        if (!currentWord) return '';

        if (quizMode === 'ko-en') {
            return currentWord.meaningKR;
        } else if (quizMode === 'en-en-meaning') {
            return currentWord.meaning;
        } else {
            // en-en-context
            // Mask the target word in the example sentence (case insensitive)
            const regex = new RegExp(currentWord.word, 'gi');
            return currentWord.example.replace(regex, '______');
        }
    };

    const getOptionState = (text: string) => {
        if (!selectedOption) return 'idle';
        if (text === currentWord.word) return 'correct';
        if (text === selectedOption) return 'wrong';
        return 'idle';
    };

    // 1. Mode Selection Screen
    if (!quizMode) {
        return (
            <div className="flex flex-col h-full bg-slate-50 relative pb-4">
                <div className="flex items-center justify-between p-4 bg-white shadow-sm z-10">
                    <BackButton onClick={() => navigate(-1)} />
                    <div className="flex flex-col items-center">
                        <span className="font-bold text-slate-800">Quiz Mode</span>
                        <span className="text-xs text-slate-500">{currentLevel} - Ch.{currentChapter}</span>
                    </div>
                    <div className="w-10" />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Choose Question Type</h2>

                    <button
                        onClick={() => setQuizMode('ko-en')}
                        className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-md border-2 border-transparent hover:border-indigo-500 hover:shadow-lg transition-all flex items-center gap-4 group"
                    >
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <span className="text-2xl">🇰🇷</span>
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-bold text-slate-900">한-영 (Meaning)</h3>
                            <p className="text-slate-500 text-xs">Korean Meaning → English Word</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setQuizMode('en-en-context')}
                        className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-md border-2 border-transparent hover:border-indigo-500 hover:shadow-lg transition-all flex items-center gap-4 group"
                    >
                        <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <span className="text-2xl">🇺🇸</span>
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-bold text-slate-900">영-영 (Context)</h3>
                            <p className="text-slate-500 text-xs">English Sentence → Fill in Blank</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setQuizMode('en-en-meaning')}
                        className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-md border-2 border-transparent hover:border-indigo-500 hover:shadow-lg transition-all flex items-center gap-4 group"
                    >
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <span className="text-2xl">📖</span>
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-bold text-slate-900">영-영 (Meaning)</h3>
                            <p className="text-slate-500 text-xs">English Definition → English Word</p>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    // 2. Quiz Screen
    if (!currentWord) return <div>Loading...</div>;

    const getModeLabel = () => {
        switch (quizMode) {
            case 'ko-en': return 'Meaning (KR)';
            case 'en-en-context': return 'Context';
            case 'en-en-meaning': return 'Meaning (EN)';
            default: return '';
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative pb-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white shadow-sm z-10 w-full mb-2">
                <BackButton onClick={() => setQuizMode(null)} />
                <div className="flex flex-col items-center">
                    <span className="font-bold text-slate-800">Quiz</span>
                    <span className="text-xs text-slate-500">
                        {currentLevel} - Ch.{currentChapter} ({getModeLabel()})
                    </span>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Progress */}
            <div className="px-6 py-4">
                <ProgressBar
                    value={30 - deck.length + 1}
                    max={30}
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
                    <span>Remaining: {deck.length}</span>
                </div>
            </div>

            {/* Question Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
                <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-lg text-center transform transition-all hover:scale-[1.02]">
                    <span className="text-sm font-medium text-indigo-500 uppercase tracking-wider mb-2 block">
                        {quizMode === 'en-en-context' ? 'Fill in the blank' : 'What is this in English?'}
                    </span>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 break-keep leading-snug">
                        {getQuestionText()}
                    </h2>
                    <div className="w-16 h-1 bg-indigo-100 mx-auto rounded-full" />
                </div>

                <div className="w-full max-w-md grid grid-cols-1 gap-3">
                    {options.map((option) => (
                        <QuizOption
                            key={option}
                            text={option}
                            state={getOptionState(option)}
                            disabled={!!selectedOption}
                            onClick={() => handleOptionClick(option)}
                        />
                    ))}
                </div>
            </div>

            {/* Full Screen Tap-to-Continue Overlay */}
            {selectedOption && (
                <div
                    onClick={nextQuestion}
                    className="fixed inset-0 z-50 flex items-end justify-center pb-12 bg-black/5 backdrop-blur-[1px] cursor-pointer"
                >
                    <div className={clsx(
                        "w-full max-w-md mx-4 p-6 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none", // pointer-events-none so click passes through to parent
                        isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    )}>
                        <h3 className="text-xl font-bold mb-1">
                            {isCorrect ? 'Correct!' : 'Incorrect'}
                        </h3>
                        <p className="opacity-90 mb-4">
                            {isCorrect ? 'Great job!' : `The answer was: ${currentWord.word} `}
                        </p>

                        {/* Example Sentence (Show full sentence now) */}
                        <div className="bg-white/10 p-3 rounded-xl mb-3">
                            <p className="text-sm italic">"{currentWord.example}"</p>
                            <p className="text-xs opacity-75 mt-1">{currentWord.meaningKR}</p>
                        </div>

                        <div className="text-center text-sm font-bold uppercase tracking-widest opacity-75 animate-pulse">
                            Tap anywhere to continue
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
