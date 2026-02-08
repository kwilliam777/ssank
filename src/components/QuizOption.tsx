import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface QuizOptionProps {
    text: string;
    state: 'idle' | 'selected' | 'correct' | 'wrong';
    disabled: boolean;
    onClick: () => void;
}

export const QuizOption: React.FC<QuizOptionProps> = ({ text, state, disabled, onClick }) => {
    const variants = {
        idle: { scale: 1, backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#1e293b' },
        selected: { scale: 0.98, backgroundColor: '#e0e7ff', borderColor: '#6366f1', color: '#312e81' },
        correct: { scale: 1.02, backgroundColor: '#dcfce7', borderColor: '#22c55e', color: '#14532d' },
        wrong: { scale: 1, backgroundColor: '#fee2e2', borderColor: '#ef4444', color: '#7f1d1d' },
    };

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            initial="idle"
            animate={state}
            variants={variants as any}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            className={clsx(
                "w-full p-4 rounded-xl border-2 text-left font-medium transition-all flex items-center justify-between",
                disabled && "cursor-default"
            )}
        >
            <span className="flex-1">{text}</span>
            {state === 'correct' && <Check className="w-5 h-5 text-green-600" />}
            {state === 'wrong' && <X className="w-5 h-5 text-red-600" />}
        </motion.button>
    );
};
