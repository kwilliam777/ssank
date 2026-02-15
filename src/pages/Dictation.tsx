import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { vocabulary } from '../data/vocabulary';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../components/BackButton';

// ...

return (
    <div className="flex flex-col h-full bg-slate-50">
        <div className="flex items-center justify-between p-4 bg-white shadow-sm z-10">
            <BackButton />
            <div className="flex flex-col items-center">
                <span className="font-bold text-slate-800">Dictation</span>
                <span className="text-xs text-slate-500">{currentLevel} - Ch.{currentChapter}</span>
            </div>
            <div className="w-10" />
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
            <form onSubmit={handleSubmit} className="w-full max-w-md relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type here..."
                    className={clsx(
                        "w-full bg-white text-center text-2xl font-bold py-6 px-6 rounded-2xl shadow-sm border-2 outline-none transition-all placeholder:text-slate-300",
                        feedback === 'idle' && "border-transparent focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100",
                        feedback === 'correct' && "border-green-500 bg-green-50 text-green-700",
                        feedback === 'wrong' && "border-red-500 bg-red-50 text-red-700 animate-shake"
                    )}
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoComplete="off"
                />

                <button
                    type="submit"
                    disabled={input.length === 0}
                    className={clsx(
                        "absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-xl transition-all",
                        input.length > 0 ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700" : "bg-slate-100 text-slate-300"
                    )}
                >
                    {feedback === 'correct' ? <CheckCircle className="w-6 h-6" /> :
                        feedback === 'wrong' ? <XCircle className="w-6 h-6" /> :
                            <Send className="w-6 h-6" />}
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
