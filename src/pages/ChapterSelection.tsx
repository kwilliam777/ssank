import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Star, Lock } from 'lucide-react';
import clsx from 'clsx';
import { BackButton } from '../components/BackButton';

export function ChapterSelection() {
    const { currentLevel, setCurrentChapter } = useGameStore();
    const navigate = useNavigate();

    // In a real app, we might check if a chapter is unlocked.
    // For now, all 5 chapters are available.
    const chapters = [1, 2, 3, 4, 5];

    const handleChapterSelect = (chapter: number) => {
        setCurrentChapter(chapter);
        navigate('/modes');
    };

    return (
        <div className="p-6 pb-24 max-w-4xl mx-auto">
            <header className="mb-8 flex items-center">
                <BackButton className="mr-4" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Select Chapter</h1>
                    <p className="text-gray-500">Current Level: <span className="font-semibold text-indigo-600">{currentLevel}</span></p>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {chapters.map((chapter) => (
                    <button
                        key={chapter}
                        onClick={() => handleChapterSelect(chapter)}
                        className="group relative bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all duration-300 text-left"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                                <BookOpen className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                            </div>
                            <div className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                30 Words
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1">
                            Chapter {chapter}
                        </h3>
                        <p className="text-sm text-gray-400">
                            Master the vocabulary
                        </p>

                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-gradient-to-br from-indigo-500/0 to-indigo-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                ))}
            </div>
        </div>
    );
}
