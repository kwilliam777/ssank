
import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/useGameStore';
import { vocabulary } from '../data/vocabulary';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Volume2, CheckCircle2, Circle } from 'lucide-react';
import { ProgressBar } from '../components/ProgressBar';
import { QuizOption } from '../components/QuizOption';
import clsx from 'clsx';
import { playSound } from '../utils/sound';
import { BackButton } from '../components/BackButton';

export function Quiz() {
    const navigate = useNavigate();
    const {
        currentLevel,
        currentGrade,
        currentChapter,
        addPoints,
        incrementStreak,
        resetStreak,
        updateMissionProgress,
        saveSessionProgress,
        getSessionProgress,
        clearSessionProgress,
        recordChapterSuccess,
        chapterStats
    } = useGameStore();

    // Quiz Mode Selection
    const [quizMode, setQuizMode] = useState<'ko-en' | 'en-en-context' | 'en-en-meaning' | null>(null);

    // Deck Management
    const [deck, setDeck] = useState<typeof vocabulary>([]);
    const [currentWord, setCurrentWord] = useState<typeof vocabulary[0] | null>(null);
    const [options, setOptions] = useState<string[]>([]);

    // Initial Full Deck (for tracking progress index)
    // We need to store the full list of IDs to reconstruct the deck for resume
    const [fullDeckIds, setFullDeckIds] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Quiz State
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [streakCount, setStreakCount] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [isQuizComplete, setIsQuizComplete] = useState(false);

    const sessionId = `quiz-${currentLevel}-${currentGrade || 'all'}-${currentChapter}-${quizMode}`;

    // Initialize/Reset Deck
    useEffect(() => {
        if (quizMode) {
            // Check for saved session
            const saved = getSessionProgress(sessionId);
            if (saved && saved.fullDeckIds && saved.currentIndex < saved.fullDeckIds.length) {
                // Resume
                setFullDeckIds(saved.fullDeckIds);
                setCurrentIndex(saved.currentIndex);
                setCorrectCount(saved.correctCount || 0);
                setStreakCount(saved.streakCount || 0);

                // Reconstruct deck
                const remainingIds = saved.fullDeckIds.slice(saved.currentIndex);
                const restoredDeck = remainingIds.map((id: string) => vocabulary.find(w => w.id === id)).filter((w): w is typeof vocabulary[0] => !!w);

                setDeck(restoredDeck);
                if (restoredDeck.length > 0) {
                    setupQuestion(restoredDeck[0]);
                } else {
                    setIsQuizComplete(true);
                }
            } else {
                initializeDeck();
            }
        }
    }, [currentLevel, currentGrade, currentChapter, quizMode]);

    const initializeDeck = () => {
        setIsQuizComplete(false);
        setCorrectCount(0);
        setStreakCount(0);
        setCurrentIndex(0);

        const chapterWords = vocabulary.filter(
            w => w.category === currentLevel &&
                w.chapter === currentChapter &&
                (!currentGrade || w.grade === currentGrade)
        );
        // Shuffle full chapter to create a deck
        const shuffled = [...chapterWords].sort(() => Math.random() - 0.5);
        const shuffledIds = shuffled.map(w => w.id);

        setFullDeckIds(shuffledIds);
        setDeck(shuffled);

        // Save initial state
        saveSessionProgress(sessionId, {
            fullDeckIds: shuffledIds,
            currentIndex: 0,
            correctCount: 0,
            streakCount: 0
        });

        if (shuffled.length > 0) {
            setupQuestion(shuffled[0]); // Start with first word
        }
    };

    const setupQuestion = (word: typeof vocabulary[0]) => {
        setCurrentWord(word);
        setSelectedOption(null);
        setIsCorrect(null);

        // Generate options (1 correct + 3 random from SAME category/level/grade/CHAPTER if possible)
        let otherWords = vocabulary.filter(w =>
            w.id !== word.id &&
            w.category === currentLevel &&
            w.chapter === currentChapter && // Added Chapter constraint
            (!currentGrade || w.grade === currentGrade)
        );

        // Fallback: If chapter has too few words (< 3 distractors needed), widen search to Level
        if (otherWords.length < 3) {
            otherWords = vocabulary.filter(w =>
                w.id !== word.id &&
                w.category === currentLevel &&
                (!currentGrade || w.grade === currentGrade)
            );
        }

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
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);

        // Save Progress
        if (nextDeck.length === 0) {
            // Deck empty, mark chapter finished
            updateMissionProgress('finish_chapter', 1);
            setDeck([]);
            setCurrentWord(null);
            setSelectedOption(null);
            setIsQuizComplete(true);
            clearSessionProgress(sessionId);
        } else {
            setDeck(nextDeck);
            setupQuestion(nextDeck[0]);

            saveSessionProgress(sessionId, {
                fullDeckIds,
                currentIndex: nextIndex,
                correctCount,
                streakCount
            });
        }
    };

    const handleRestart = () => {
        if (window.confirm("Restart this quiz?")) {
            clearSessionProgress(sessionId);
            initializeDeck();
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
            setCorrectCount(prev => prev + 1);
            const newStreak = streakCount + 1;
            setStreakCount(newStreak);

            if (newStreak >= 5) {
                updateMissionProgress('perfect_quiz', 1);
            }
            updateMissionProgress('complete_quiz', 1);

            // Check for Perfect Score (Simple heuristic: current streak == total deck size?)
            // Or better: correctCount + 1 == total deck size (assuming no mistakes reset streak)
            // But streak resets on mistake. So if streak == total deck size at end, it's perfect.
            // deck.length decreases. 
            // We need to know original deck size.
            // The quiz mode currently removes cards from deck.
            // Let's use `fullDeckIds.length`.
            if (newStreak === fullDeckIds.length) {
                if (quizMode === 'ko-en') recordChapterSuccess('quiz_ko_en');
                else if (quizMode === 'en-en-context') recordChapterSuccess('quiz_context');
                else if (quizMode === 'en-en-meaning') recordChapterSuccess('quiz_meaning');
            }
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

    const getModeLabel = () => {
        switch (quizMode) {
            case 'ko-en': return 'Meaning (KR)';
            case 'en-en-context': return 'Context';
            case 'en-en-meaning': return 'Meaning (EN)';
            default: return '';
        }
    };

    // 1. Mode Selection Screen
    if (!quizMode) {
        return (
            <div className="flex flex-col h-full bg-slate-50 relative pb-4">
                <div className="flex items-center justify-between p-4 bg-white shadow-sm z-10 w-full mb-2">
                    <BackButton />
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
                        className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-md border-2 border-transparent hover:border-indigo-500 hover:shadow-lg transition-all flex items-center gap-4 group relative"
                    >
                        <div className="absolute top-4 right-4 p-1 rounded-full shadow-sm bg-slate-50">
                            {chapterStats?.[`${currentLevel}-${currentGrade || 'all'}-${currentChapter}`]?.quiz_ko_en ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-50" />
                            ) : (
                                <Circle className="w-5 h-5 text-slate-300" />
                            )}
                        </div>
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
                        className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-md border-2 border-transparent hover:border-indigo-500 hover:shadow-lg transition-all flex items-center gap-4 group relative"
                    >
                        <div className="absolute top-4 right-4 p-1 rounded-full shadow-sm bg-slate-50">
                            {chapterStats?.[`${currentLevel}-${currentGrade || 'all'}-${currentChapter}`]?.quiz_context ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-50" />
                            ) : (
                                <Circle className="w-5 h-5 text-slate-300" />
                            )}
                        </div>
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
                        className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-md border-2 border-transparent hover:border-indigo-500 hover:shadow-lg transition-all flex items-center gap-4 group relative"
                    >
                        <div className="absolute top-4 right-4 p-1 rounded-full shadow-sm bg-slate-50">
                            {chapterStats?.[`${currentLevel}-${currentGrade || 'all'}-${currentChapter}`]?.quiz_meaning ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-50" />
                            ) : (
                                <Circle className="w-5 h-5 text-slate-300" />
                            )}
                        </div>
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

    // 3. Completion Screen
    if (isQuizComplete) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-slate-50">
                <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm animate-fade-in-up">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🏆</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Quiz Completed!</h1>
                    <p className="text-slate-500 mb-8">You've mastered this set of words.</p>

                    <div className="bg-indigo-50 p-4 rounded-xl mb-8">
                        <span className="text-sm text-indigo-500 uppercase font-bold tracking-wider">Correct Answers</span>
                        <div className="text-4xl font-bold text-indigo-600">
                            {correctCount} <span className="text-xl text-indigo-400">/ 30</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                initializeDeck();
                                setStreakCount(0);
                            }}
                            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" />
                            <span>Play Again</span>
                        </button>
                        <button
                            onClick={() => navigate('/chapters')} // Changed navigation to /chapters
                            className="block w-full py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Back to Chapters
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Quiz Screen Loading State
    if (!currentWord) return <div>Loading...</div>;

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
                <button
                    onClick={handleRestart}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Progress */}
            <div className="px-6 py-4">
                <ProgressBar
                    value={30 - deck.length + (currentWord ? 1 : 0)}
                    max={30}
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
                    <span>Remaining: {deck.length - 1}</span>
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
