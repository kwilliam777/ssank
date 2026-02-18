
import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function GradeSelection() {
    const { currentLevel, setCurrentGrade } = useGameStore();
    const navigate = useNavigate();

    const handleGradeSelect = (grade: string) => {
        setCurrentGrade(grade);
        navigate('/chapters');
    };

    const grades = React.useMemo(() => {
        if (currentLevel === 'Elementary') {
            return [
                { id: '1-2', label: '1-2 학년', emoji: '🌱' },
                { id: '3-4', label: '3-4 학년', emoji: '🌿' },
                { id: '5-6', label: '5-6 학년', emoji: '🌳' },
            ];
        } else if (currentLevel === 'Middle School' || currentLevel === 'High School') {
            return [
                { id: '1', label: '1 학년', emoji: '1️⃣' },
                { id: '2', label: '2 학년', emoji: '2️⃣' },
                { id: '3', label: '3 학년', emoji: '3️⃣' },
            ];
        }
        return [];
    }, [currentLevel]);

    if (!currentLevel) {
        navigate('/');
        return null;
    }

    return (
        <div className="p-6">
            <header className="mb-8 flex items-center gap-4">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{currentLevel}</h1>
                    <p className="text-gray-500">Select your grade</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {grades.map((grade) => (
                    <button
                        key={grade.id}
                        onClick={() => handleGradeSelect(grade.id)}
                        className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col items-center gap-3 group"
                    >
                        <span className="text-4xl">{grade.emoji}</span>
                        <span className="font-bold text-gray-700 group-hover:text-indigo-600 text-lg">
                            {grade.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
