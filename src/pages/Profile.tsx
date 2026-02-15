import React, { useState, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Badge } from '../components/Badge';
import { achievements } from '../data/achievements';
import { User, LogOut, Edit2, Camera, School, Settings, Volume2, VolumeX, Mail } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';

export function Profile() {
    const { points, level, streak, badges, userData, updateProfile, logout, isMuted, toggleMute } = useGameStore();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editName, setEditName] = useState(userData.displayName || '');
    const [editSchool, setEditSchool] = useState(userData.schoolName || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handleSave = () => {
        updateProfile({
            displayName: editName,
            schoolName: editSchool
        });
        setIsEditing(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 100 * 1024) {
                alert("Image too large. Please use an image under 100KB.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                updateProfile({ photoURL: base64String });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="bg-slate-50 min-h-full pb-24 relative">
            {/* Settings Modal */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSettingsOpen(false)}
                            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 m-auto w-full max-w-sm h-fit bg-white rounded-3xl shadow-2xl z-50 p-6 overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Settings</h2>
                                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                    <Settings className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Email */}
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                                    <div className="p-2 bg-white rounded-full shadow-sm">
                                        <Mail className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-500 font-medium uppercase">Signed in as</p>
                                        <p className="text-sm font-semibold text-slate-800 truncate">{auth.currentUser?.email || 'No Email'}</p>
                                    </div>
                                </div>

                                {/* Mute Toggle */}
                                <button
                                    onClick={toggleMute}
                                    className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={clsx("p-2 rounded-full shadow-sm transition-colors", isMuted ? "bg-gray-200" : "bg-indigo-100")}>
                                            {isMuted ? <VolumeX className="w-5 h-5 text-gray-500" /> : <Volume2 className="w-5 h-5 text-indigo-500" />}
                                        </div>
                                        <span className="font-semibold text-slate-700">Sound Effects</span>
                                    </div>
                                    <div className={clsx("w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out", isMuted ? "bg-gray-300" : "bg-indigo-500")}>
                                        <div className={clsx("bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200", isMuted ? "translate-x-0" : "translate-x-6")} />
                                    </div>
                                </button>

                                {/* Logout */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 p-4 mt-6 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-bold"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Sign Out</span>
                                </button>
                            </div>

                            <div className="mt-6 text-center text-xs text-slate-400">
                                v1.0.0 • 생각이 크는 학원
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <header className="bg-white p-6 pb-12 rounded-b-3xl shadow-sm border-b border-indigo-50/50 relative">
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <Settings className="w-6 h-6" />
                </button>

                <div className="flex flex-col items-center">
                    <div className="relative group">
                        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md overflow-hidden">
                            {userData.photoURL ? (
                                <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-indigo-500" />
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-4 right-0 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    {isEditing ? (
                        <div className="flex flex-col gap-3 w-full max-w-xs items-center">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Enter your name"
                                className="text-center text-xl font-bold text-gray-900 border-b-2 border-indigo-200 focus:border-indigo-500 outline-none bg-transparent px-2 py-1 w-full"
                            />
                            <div className="flex items-center gap-2 w-full">
                                <School className="w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={editSchool}
                                    onChange={(e) => setEditSchool(e.target.value)}
                                    placeholder="Enter school name"
                                    className="text-center text-sm text-indigo-500 border-b border-indigo-100 focus:border-indigo-400 outline-none bg-transparent px-2 py-1 flex-1"
                                />
                            </div>
                            <button
                                onClick={handleSave}
                                className="mt-2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-indigo-700"
                            >
                                Save Profile
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold text-gray-900">{userData.displayName || 'Scholar'}</h1>
                                <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-indigo-600">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-indigo-500 font-medium text-sm bg-indigo-50 px-3 py-1 rounded-full">
                                <School className="w-3 h-3" />
                                <span>{userData.schoolName || 'No School Selected'}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="bg-gray-50 p-3 rounded-2xl text-center">
                        <span className="block text-xl font-bold text-gray-900">{points}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Points</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl text-center">
                        <span className="block text-xl font-bold text-gray-900">{streak}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Streak</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl text-center">
                        <span className="block text-xl font-bold text-gray-900">{badges.length}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Achievements</span>
                    </div>
                </div>
            </header>

            <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Achievements</h2>
                <div className="space-y-3">
                    {achievements.map((achievement) => (
                        <Badge
                            key={achievement.id}
                            title={achievement.title}
                            description={achievement.description}
                            icon={achievement.icon}
                            isUnlocked={badges.includes(achievement.id) || achievement.condition({ points, level, streak })}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
