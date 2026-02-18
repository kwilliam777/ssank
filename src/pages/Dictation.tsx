import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle, XCircle, Lightbulb, RefreshCw } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { vocabulary } from '../data/vocabulary';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import clsx from 'clsx';
import { playSound } from '../utils/sound';

export function Dictation() {
    const navigate = useNavigate();
    const { currentLevel, currentGrade, currentChapter, addPoints, updateMissionProgress, incrementStreak, resetStreak, saveSessionProgress, getSessionProgress, clearSessionProgress, recordChapterSuccess } = useGameStore();

    const [input, setInput] = useState('');
    const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const [currentWord, setCurrentWord] = useState<typeof vocabulary[0] | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [deck, setDeck] = useState<typeof vocabulary>([]);
    const [fullDeckIds, setFullDeckIds] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);

    // Session ID
    const sessionId = `dictation-${currentLevel}-${currentGrade || 'all'}-${currentChapter}`;

    // Filter words for current level/chapter
    const availableWords = React.useMemo(() =>
        vocabulary.filter(w => w.category === currentLevel &&
            w.chapter === currentChapter &&
            (!currentGrade || w.grade === currentGrade)),
        [currentLevel, currentGrade, currentChapter]);

    // Initialize deck on mount or level change
    useEffect(() => {
        // Check for saved session
        const saved = getSessionProgress(sessionId);

        if (saved && saved.fullDeckIds && saved.progress < saved.fullDeckIds.length) {
            // Resume
            setFullDeckIds(saved.fullDeckIds);
            const restoredDeck = saved.fullDeckIds.map((id: string) => vocabulary.find(w => w.id === id)).filter((w): w is typeof vocabulary[0] => !!w);
            setDeck(restoredDeck);
            setProgress(saved.progress);
            setCorrectCount(saved.correctCount || 0);

            if (restoredDeck.length > saved.progress) {
                setCurrentWord(restoredDeck[saved.progress]);
            } else {
                setCurrentWord(null); // Finished?
            }
        } else {
            // Start New
            const shuffled = [...availableWords].sort(() => Math.random() - 0.5); // Use all words
            const ids = shuffled.map(w => w.id);
            setFullDeckIds(ids);
            setDeck(shuffled);
            setProgress(0);
            setCorrectCount(0);
            if (shuffled.length > 0) {
                setCurrentWord(shuffled[0]);
            }
            // Save initial
            saveSessionProgress(sessionId, {
                fullDeckIds: ids,
                progress: 0,
                correctCount: 0
            });
        }

        setInput('');
        setFeedback('idle');
    }, [availableWords, sessionId]);

    const handleRestart = () => {
        if (window.confirm("Restart Dictation session?")) {
            clearSessionProgress(sessionId);
            // Re-trigger effect by forcing a remount or just manually calling logic.
            // Simplest is to clear progress and let effect see "no progress" but effect deps might not change.
            // Let's manually reset.
            const shuffled = [...availableWords].sort(() => Math.random() - 0.5);
            const ids = shuffled.map(w => w.id);
            setFullDeckIds(ids);
            setDeck(shuffled);
            setProgress(0);
            setCorrectCount(0);
            setCurrentWord(shuffled[0]);
            setInput('');
            setFeedback('idle');
            saveSessionProgress(sessionId, {
                fullDeckIds: ids,
                progress: 0,
                correctCount: 0
            });
        }
    };

    const nextWord = () => {
        if (progress >= deck.length - 1) {
            // Finished
            setCurrentWord(null);
            clearSessionProgress(sessionId);
            return;
        }

        const nextIndex = progress + 1;
        setProgress(nextIndex);
        setCurrentWord(deck[nextIndex]);
        setInput('');
        setFeedback('idle');

        saveSessionProgress(sessionId, {
            fullDeckIds,
            progress: nextIndex,
            correctCount
        });

        if (inputRef.current) inputRef.current.focus();
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentWord) return;

        if (input.trim().toLowerCase() === currentWord.word.toLowerCase()) {
            setFeedback('correct');
            playSound('correct');
            addPoints(10);
            incrementStreak();
            updateMissionProgress('dictation_practice', 1);
            setCorrectCount(prev => prev + 1);

            setTimeout(() => {
                nextWord();
            }, 1000);
        } else {
            setFeedback('wrong');
            playSound('wrong');
            resetStreak();
            setTimeout(() => setFeedback('idle'), 1000);
        }
    };

    // Check for Perfect Score when finished
    // We need to do this when `currentWord` becomes null (finished)
    useEffect(() => {
        if (!currentWord && deck.length > 0 && progress >= deck.length - 1) {
            // Finished
            if (correctCount === deck.length) {
                recordChapterSuccess('dictation');
            }
        }
    }, [currentWord, deck.length, progress, correctCount, recordChapterSuccess]);

    const handleHint = () => {
        if (!currentWord) return;
        setInput(currentWord.word.charAt(0));
        inputRef.current?.focus();
    };

    // Completion Screen
    if (!currentWord && deck.length > 0) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-slate-50">
                <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm animate-fade-in-up">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">✍️</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Dictation Complete!</h1>
                    <p className="text-slate-500 mb-8">Excellent spelling practice.</p>

                    <div className="bg-indigo-50 p-4 rounded-xl mb-8">
                        <span className="text-sm text-indigo-500 uppercase font-bold tracking-wider">Correct Answers</span>
                        <div className="text-4xl font-bold text-indigo-600">
                            {correctCount} <span className="text-xl text-indigo-400">/ {deck.length}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                const shuffled = [...availableWords].sort(() => Math.random() - 0.5);
                                setDeck(shuffled);
                                setProgress(0);
                                setCorrectCount(0);
                                setCurrentWord(shuffled[0]);
                                setInput('');
                                setFeedback('idle');
                            }}
                            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" />
                            <span>Play Again</span>
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="block w-full py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentWord) return <div>Loading...</div>;

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="flex items-center justify-between p-4 bg-white shadow-sm z-10 w-full mb-2">
                <BackButton />
                <div className="flex flex-col items-center">
                    <span className="font-bold text-slate-800">Dictation</span>
                    <span className="text-xs text-slate-500">{currentLevel} - Ch.{currentChapter}</span>
                </div>
                <button
                    onClick={handleRestart}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <div className="px-6 py-2 text-center">
                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    Words Left: {Math.max(0, deck.length - progress)}
                </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
                {/* Meaning Card */}
                <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-lg text-center transform transition-all hover:scale-[1.02] relative">
                    <span className="text-sm font-medium text-indigo-500 uppercase tracking-wider mb-2 block">Type the English Word</span>
                    <h2 className="text-3xl font-bold text-slate-800 mb-6 break-keep leading-tight">
                        {currentWord.meaningKR}
                    </h2>
                    {/* Hint Button */}
                    <button
                        onClick={handleHint}
                        className="absolute top-4 right-4 p-2 text-amber-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-colors"
                        title="Show Hint"
                    >
                        <Lightbulb className="w-6 h-6" />
                    </button>
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="w-full max-w-lg flex flex-col items-center gap-8">
                    <div className="relative w-full" onClick={() => inputRef.current?.focus()}>
                        <div className="flex flex-wrap justify-center gap-3">
                            {currentWord.word.split('').map((char, index) => {
                                const userChar = input[index] || '';
                                const isFocused = index === input.length && input.length < currentWord.word.length;
                                const isSpace = char === ' ';

                                if (isSpace) return <div key={index} className="w-4" />;

                                return (
                                    <div
                                        key={index}
                                        className={clsx(
                                            "w-12 h-16 border-b-4 flex items-center justify-center text-4xl font-bold transition-all duration-200",
                                            userChar ? "border-slate-800 text-slate-800" : "border-slate-200 text-transparent",
                                            (isFocused && !userChar) && "border-indigo-400 animate-pulse",
                                            feedback === 'correct' && "border-green-500 text-green-600",
                                            feedback === 'wrong' && "border-red-500 text-red-500"
                                        )}
                                    >
                                        {userChar}
                                    </div>
                                );
                            })}
                        </div>

                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer caret-transparent"
                            autoCapitalize="off"
                            autoCorrect="off"
                            autoComplete="off"
                            maxLength={currentWord.word.length}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={input.length === 0}
                        className={clsx(
                            "w-full max-w-xs py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2",
                            input.length > 0
                                ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5"
                                : "bg-slate-100 text-slate-300 cursor-not-allowed"
                        )}
                    >
                        {feedback === 'correct' ? <CheckCircle className="w-6 h-6" /> :
                            feedback === 'wrong' ? <XCircle className="w-6 h-6" /> :
                                <Send className="w-6 h-6" />}
                        <span>Check Answer</span>
                    </button>
                </form>

                {/* Feedback Text */}
                <div className="h-6">
                    {feedback === 'correct' && (
                        <p className="text-green-600 font-bold animate-pulse">Correct! Perfect!</p>
                    )}
                    {feedback === 'wrong' && (
                        <p className="text-red-500 font-medium">Try again!</p>
                    )}
                </div>
            </div>
        </div>
    );
}
