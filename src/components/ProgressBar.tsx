import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface ProgressBarProps {
    value: number;
    max: number;
    className?: string;
    colorClass?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, className, colorClass = "bg-indigo-500" }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={clsx("h-2.5 bg-gray-200 rounded-full overflow-hidden", className)}>
            <motion.div
                className={clsx("h-full rounded-full transition-all duration-500", colorClass)}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
            />
        </div>
    );
};
