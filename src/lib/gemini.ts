import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";
import type { Content } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("VITE_GEMINI_API_KEY is not set in .env file. Writing Center features will not work.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// For single-turn requests (legacy or simple use cases)
export const getGeminiResponse = async (prompt: string): Promise<string> => {
    if (!API_KEY) {
        return "Error: API Key is missing. Please set VITE_GEMINI_API_KEY in your .env file.";
    }

    try {
        // Fallback to pro-latest if 1.5-flash is unavailable (as per previous debugging)
        // But for chat session we prefer 1.5-flash if possible. 
        // Let's stick to what worked: 'gemini-pro-latest' for safety if user had issues with 1.5
        const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("Error calling Gemini API:", error);

        if (error.message?.includes('404')) {
            return "Error: Model not found. Please ensure your API Key support the selected model.";
        }

        if (error.message?.includes('403')) {
            return "Error: API Disabled. Please enable Generative Language API in Google Console.";
        }

        return "Sorry, I encountered an error. Please check console.";
    }
};

// For multi-turn chat sessions with system instructions
export const createChatSession = async (history: Content[] = []): Promise<ChatSession | null> => {
    if (!API_KEY) {
        console.error("API Key is missing.");
        return null;
    }

    try {
        // Use gemini-pro-latest as 1.5-flash is unavailable
        const model = genAI.getGenerativeModel({
            model: "gemini-pro-latest",
            // systemInstruction is removed as we will pass it in the prompt for compatibility
        });

        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        return chat;
    } catch (error) {
        console.error("Error creating chat session:", error);
        return null;
    }
};
