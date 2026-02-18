import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { CheckCircle, Circle, Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ProgressBar } from '../components/ProgressBar';
import { AnimatePresence, motion } from 'framer-motion';
import { auth } from '../lib/firebase';

export function Home() {
    const { dailyMissions, checkDailyReset, setCurrentLevel, notification, fetchNotification, userData } = useGameStore();
    const navigate = useNavigate();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    useEffect(() => {
        checkDailyReset();
        fetchNotification();
    }, [checkDailyReset, fetchNotification]);

    const handleLevelSelect = (level: 'Elementary' | 'Middle School' | 'High School' | 'CSAT') => {
        setCurrentLevel(level);
        if (level === 'CSAT') {
            navigate('/chapters');
        } else {
            navigate('/grades');
        }
    };

    const colorMap: Record<string, { bg: string, hoverBg: string, border: string, hoverBorder: string, text: string }> = {
        green: { bg: 'bg-green-50', hoverBg: 'hover:bg-green-50', border: 'border-green-100', hoverBorder: 'hover:border-green-200', text: 'text-green-900' },
        teal: { bg: 'bg-teal-50', hoverBg: 'hover:bg-teal-50', border: 'border-teal-100', hoverBorder: 'hover:border-teal-200', text: 'text-teal-900' },
        blue: { bg: 'bg-blue-50', hoverBg: 'hover:bg-blue-50', border: 'border-blue-100', hoverBorder: 'hover:border-blue-200', text: 'text-blue-900' },
        purple: { bg: 'bg-purple-50', hoverBg: 'hover:bg-purple-50', border: 'border-purple-100', hoverBorder: 'hover:border-purple-200', text: 'text-purple-900' },
    };

    const LevelButton = ({ level, label, emoji, color }: { level: 'Elementary' | 'Middle School' | 'High School' | 'CSAT', label: string, emoji: string, color: string }) => {
        const styles = colorMap[color];
        return (
            <button
                onClick={() => handleLevelSelect(level)}
                className={`bg-white p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-2 aspect-square ${styles.hoverBg} transition-colors border border-gray-100 ${styles.hoverBorder} shadow-sm group`}
            >
                <span className="text-4xl filter drop-shadow-sm">{emoji}</span>
                <span className={`font-bold text-gray-700 group-hover:${styles.text.replace('text-', 'text-')}`}>{label}</span>
            </button>
        );
    };

    const completedCount = dailyMissions.filter(m => m.completed).length;
    const progressPercentage = (completedCount / dailyMissions.length) * 100;

    const displayName = userData.displayName || auth.currentUser?.email?.split('@')[0] || 'Scholar';

    return (
        <div className="p-6 pb-24 relative">
            {/* Notification Popup Modal */}
            <AnimatePresence>
                {isNotificationOpen && notification && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsNotificationOpen(false)}
                            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 m-auto w-full max-w-sm h-fit bg-white rounded-3xl shadow-2xl z-50 p-6 overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="bg-amber-100 p-2 rounded-full">
                                        <Bell className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">Announcement</h2>
                                </div>
                                <button onClick={() => setIsNotificationOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto pr-2 custom-scrollbar">
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {notification.content}
                                </p>
                            </div>

                            <div className="mt-6 text-right text-xs text-gray-400">
                                Posted on {new Date(notification.date).toLocaleDateString()}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    {`Welcome ${displayName}!`}
                </h1>
                <p className="text-gray-500 mb-6">Ready to conquer today's goals?</p>

                {/* Notification Banner */}
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 cursor-pointer hover:bg-amber-100/50 transition-colors shadow-sm"
                        onClick={() => setIsNotificationOpen(true)}
                    >
                        <div className="bg-white p-2 rounded-full shadow-sm shrink-0">
                            <Bell className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 mb-1">New Announcement</h3>
                            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                                {notification.content}
                            </p>
                        </div>
                    </motion.div>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Level Selection - Now First */}
                <div className="md:col-span-7">
                    <section className="flex flex-col">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Select Level</h2>
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                            <LevelButton
                                level="Elementary"
                                label="Elementary"
                                emoji="🌱"
                                color="green"
                            />
                            <LevelButton
                                level="Middle School"
                                label="Middle School"
                                emoji="🏫"
                                color="blue"
                            />
                            <LevelButton
                                level="High School"
                                label="High School"
                                emoji="🎓"
                                color="purple"
                            />
                            <LevelButton
                                level="CSAT"
                                label="CSAT"
                                emoji="📝"
                                color="teal"
                            />
                        </div>
                    </section>
                </div>

                {/* Progress & Missions */}
                <div className="md:col-span-5 space-y-6">
                    <section className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-lg font-semibold mb-2">Daily Goals</h2>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-indigo-100">{completedCount} / {dailyMissions.length} Completed</span>
                                <span className="font-bold">{Math.round(progressPercentage)}%</span>
                            </div>
                            <div className="h-2 bg-indigo-900/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white transition-all duration-500 rounded-full"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </div>

                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl" />
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Missions</h2>
                        <div className="space-y-3">
                            {dailyMissions.map(mission => (
                                <div key={mission.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className={clsx("shrink-0 transition-colors", mission.completed ? "text-green-500" : "text-gray-300")}>
                                        {mission.completed ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={clsx("font-medium text-sm", mission.completed && "text-gray-500 line-through")}>{mission.title}</h3>
                                        <div className="mt-2 text-xs text-gray-400 flex justify-between">
                                            <span>{mission.progress} / {mission.target}</span>
                                            <span className="font-semibold text-indigo-500">+{mission.rewardPoints} pts</span>
                                        </div>
                                        <ProgressBar value={mission.progress} max={mission.target} className="h-1.5 mt-1" colorClass={mission.completed ? "bg-green-500" : "bg-indigo-500"} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
