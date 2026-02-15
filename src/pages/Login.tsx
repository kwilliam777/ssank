import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';

export function Login() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const { loadFromFirestore } = useGameStore(); // We'll implement this later

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Sync user data
            await loadFromFirestore(user.uid);

            navigate('/');
        } catch (err: any) {
            console.error("Login failed:", err);
            setError(err.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center"
            >
                <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-white font-bold text-3xl">S</span>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to SSANK</h1>
                <p className="text-slate-500 mb-8">Sign in to sync your progress across devices</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 p-4 rounded-xl text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    Sign in with Google
                </button>
            </motion.div>
        </div>
    );
}
