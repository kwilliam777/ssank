import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { BackButton } from '../components/BackButton';
import { Send, Sparkles, User, Bot, RefreshCw } from 'lucide-react';
import { createChatSession } from '../lib/gemini';
import { ChatSession } from "@google/generative-ai";
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: number;
}

const SYSTEM_INSTRUCTION = `
Using Korean purely.
Your specific role is an "English Writing Tutor" for a Korean student.
Your goal is to test and improve the student's English writing and grammar skills.

Follow this strict interaction flow:
1.  **Start**: Introduce yourself as the Writing Tutor and ask the student for their desired difficulty level (Low / Mid / High).
2.  **Wait**: Wait for the student to reply with the difficulty.
3.  **Quiz Loop**:
    a.  **IMPORTANT**: Do NOT include any welcome message or pleasantries (e.g., "네, 알겠습니다", "시작하겠습니다"). Start data collection immediately.
    b.  Provide a Korean sentence that matches the chosen difficulty. Ask the student to translate it into English.
    c.  Wait for the student's English translation.
    d.  **Judge**: Analyze their translation.
        -   If **Correct**: Praise them (in Korean) and explain *why* it is good or mention alternative natural expressions.
        -   If **Incorrect** or **Unnatural**: Correct the sentence. Explain the grammar/vocabulary mistake clearly in Korean.
    e.  **Next**: Immediately provide the *next* Korean sentence to translate.
4.  **Tone**: Encouraging, educational, and professional. Always explain in Korean.
`;

export function WritingCenter() {
    const { chatHistory, chatLastDate, addChatMessage, clearChatHistory } = useGameStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatSession = useRef<ChatSession | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Initialize & Load Persistence
    useEffect(() => {
        const init = async () => {
            const today = new Date().toDateString();

            // Check if we should clear history (new day)
            if (chatLastDate !== today) {
                clearChatHistory();
                setMessages([{
                    id: 'welcome',
                    text: `안녕하세요! 저는 여러분의 영어 작문 실력을 쑥쑥 키워드릴 **영작 튜터**입니다.\n\n저와 함께 한국어 문장을 영어로 바꿔보며, 정확한 문법과 자연스러운 표현을 익혀보도록 해요. 작성해 주신 문장에 대해 꼼꼼하게 피드백해 드리겠습니다.\n\n시작하기 전에, 원하시는 학습 **난이도**를 선택해 주세요.\n\n**( 초급 / 중급 / 고급 )**`,
                    sender: 'ai',
                    timestamp: Date.now()
                }]);
            } else {
                // Restore history
                if (chatHistory.length > 0) {
                    setMessages(chatHistory);
                } else {
                    // Fallback if empty even on same day (e.g. manual clear)
                    setMessages([{
                        id: 'welcome',
                        text: `안녕하세요! 저는 여러분의 영어 작문 실력을 쑥쑥 키워드릴 **영작 튜터**입니다.\n\n저와 함께 한국어 문장을 영어로 바꿔보며, 정확한 문법과 자연스러운 표현을 익혀보도록 해요. 작성해 주신 문장에 대해 꼼꼼하게 피드백해 드리겠습니다.\n\n시작하기 전에, 원하시는 학습 **난이도**를 선택해 주세요.\n\n**( 초급 / 중급 / 고급 )**`,
                        sender: 'ai',
                        timestamp: Date.now()
                    }]);
                }
            }

            // Initialize Chat Session (Context Restoration)
            const historyForGemini = chatHistory.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

            // Filter out system/welcome messages that shouldn't be in history context?
            // Actually, the Welcome message is from 'ai'. If we include it, the model thinks it said it.
            // That's fine, it provides context of who it is.
            // BUT, the welcome message in our new logic is static text.
            // If we include it, the model sees: Model: "Hello...". User: "High".
            // That works.

            const session = await createChatSession(historyForGemini);
            if (session) {
                chatSession.current = session;
            } else {
                setMessages(prev => [...prev, {
                    id: 'error',
                    text: "API Key 설정 오류: .env 파일을 확인해주세요.",
                    sender: 'ai',
                    timestamp: Date.now()
                }]);
            }
            setIsLoading(false);
        };
        init();
    }, []); // Run once on mount

    const handleSend = async () => {
        if (!input.trim() || isLoading || !chatSession.current) return;

        const userText = input.trim();
        const userMessage: Message = {
            id: Date.now().toString(),
            text: userText,
            sender: 'user',
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);
        addChatMessage(userMessage); // Persist
        setInput('');
        setIsLoading(true);

        try {
            let result;
            // Check if this is the FIRST interaction (user replying to welcome)
            // We can check if messages length is 1 (Welcome only) OR check history length.
            // Actually, checking if chatHistory was empty before this addition is safer.
            const isFirstInteraction = messages.length === 1 && messages[0].id === 'welcome';

            if (isFirstInteraction) {
                const combinedPrompt = `${SYSTEM_INSTRUCTION}\n\n[System]: The user has selected the difficulty level: "${userText}". Skip any welcome message. Start immediately by providing the first Korean sentence to translate.`;
                result = await chatSession.current.sendMessage(combinedPrompt);
            } else {
                result = await chatSession.current.sendMessage(userText);
            }

            const response = await result.response;
            const text = response.text();

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: text,
                sender: 'ai',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, aiMessage]);
            addChatMessage(aiMessage); // Persist
        } catch (error: any) {
            console.error("Chat Error:", error);
            let errorMsg = "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.";
            if (error.message?.includes('403')) errorMsg = "API 키 권한 오류: 콘솔에서 API를 활성화해야 합니다.";

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: errorMsg,
                sender: 'ai',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
            // Do NOT persist error messages? Or maybe yes.
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setMessages([{
            id: 'welcome',
            text: `안녕하세요! 저는 여러분의 영어 작문 실력을 쑥쑥 키워드릴 **영작 튜터**입니다.\n\n저와 함께 한국어 문장을 영어로 바꿔보며, 정확한 문법과 자연스러운 표현을 익혀보도록 해요. 작성해 주신 문장에 대해 꼼꼼하게 피드백해 드리겠습니다.\n\n시작하기 전에, 원하시는 학습 **난이도**를 선택해 주세요.\n\n**( 초급 / 중급 / 고급 )**`,
            sender: 'ai',
            timestamp: Date.now()
        }]);
        clearChatHistory();
        chatSession.current = null;
        // Re-init session
        createChatSession([]).then(session => {
            chatSession.current = session;
        }).catch(e => {
            console.error("Failed to re-initialize chat session on reset:", e);
            setMessages(prev => [...prev, {
                id: 'error-reset',
                text: "세션을 다시 시작하는 데 문제가 발생했습니다. (API Key 확인 필요)",
                sender: 'ai',
                timestamp: Date.now()
            }]);
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative pb-16 md:pb-0">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm border-b border-gray-100 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <BackButton />
                    <div>
                        <h1 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            Writing Center <Sparkles className="w-4 h-4 text-purple-500 fill-purple-500" />
                        </h1>
                        <span className="text-xs text-slate-500">Powered by Gemini</span>
                    </div>
                </div>
                <button
                    onClick={handleReset}
                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                    title="Restart Conversation"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={clsx(
                                "flex w-full mb-4",
                                msg.sender === 'user' ? "justify-end" : "justify-start"
                            )}
                        >
                            <div className={clsx(
                                "flex max-w-[80%] md:max-w-[70%] gap-2",
                                msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
                            )}>
                                {/* Avatar */}
                                <div className={clsx(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                    msg.sender === 'user' ? "bg-indigo-100" : "bg-purple-100"
                                )}>
                                    {msg.sender === 'user' ?
                                        <User className="w-5 h-5 text-indigo-600" /> :
                                        <Bot className="w-5 h-5 text-purple-600" />
                                    }
                                </div>

                                {/* Message Bubble */}
                                <div className={clsx(
                                    "p-3 rounded-2xl shadow-sm border text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words overflow-x-hidden",
                                    msg.sender === 'user'
                                        ? "bg-indigo-600 text-white border-indigo-600 rounded-tr-none"
                                        : "bg-white text-slate-700 border-gray-100 rounded-tl-none"
                                )}>
                                    {msg.text}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start w-full"
                        >
                            <div className="flex items-center gap-2 max-w-[80%]">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                    <Bot className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1">
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 z-10">
                <div className="max-w-4xl mx-auto relative flex items-center gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all max-h-32 min-h-[50px] scrollbar-hide"
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
