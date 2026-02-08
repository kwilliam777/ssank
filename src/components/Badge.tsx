import React from 'react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface BadgeProps {
    title: string;
    description: string;
    icon: LucideIcon;
    isUnlocked: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ title, description, icon: Icon, isUnlocked }) => {
    return (
        <motion.div
            className={clsx(
                "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                isUnlocked ? "bg-white border-indigo-100 shadow-sm" : "bg-gray-50 border-gray-100 opacity-60 grayscale"
            )}
            whileHover={isUnlocked ? { scale: 1.02 } : {}}
        >
            <div className={clsx(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                isUnlocked ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-400"
            )}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <h3 className={clsx("font-bold text-sm", isUnlocked ? "text-gray-900" : "text-gray-500")}>{title}</h3>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
        </motion.div>
    );
};
