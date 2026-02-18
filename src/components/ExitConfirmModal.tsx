import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ExitConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    message?: string;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    title = "Are you sure you want to leave?",
    message = "Your progress in this session will be lost."
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 m-auto w-full max-w-sm h-fit bg-white rounded-3xl shadow-2xl z-50 p-6 overflow-hidden"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8 text-amber-500" />
                            </div>

                            <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
                            <p className="text-slate-500 mb-6">{message}</p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                                >
                                    Stay
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-md shadow-amber-200"
                                >
                                    Leave
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
