import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { motion } from "motion/react"

const cleanKey = (value) =>
    (value || "")
        .trim()
        .replace(/^\uFEFF/, "")
        .replace(/^["']+|["']+$/g, "");

let groq;
let groqCoding;
let gemini;

const getGroq = () => {
    if (!groq) {
        const apiKey = cleanKey(process.env.GROQ_API_KEY);
        if (!apiKey) {
            throw new Error("GROQ_API_KEY is missing in backend/services/agent/.env");
        }
        groq = new ChatGroq({
            model: "openai/gpt-oss-120b",
            apiKey,
        });
    }
    return groq;
};

/** Higher token budget for multi-file project JSON. */
const getGroqCoding = () => {
    if (!groqCoding) {
        const apiKey = cleanKey(process.env.GROQ_API_KEY);
        if (!apiKey) {
            throw new Error("GROQ_API_KEY is missing in backend/services/agent/.env");
        }
        groqCoding = new ChatGroq({
            model: "openai/gpt-oss-120b",
            apiKey,
            temperature: 0,
            maxTokens: 8000,
        });
    }
    return groqCoding;
};

const getGemini = () => {
    if (!gemini) {
        gemini = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: cleanKey(process.env.GOOGLE_API_KEY),
            maxRetries: 1,
            thinkingConfig: {
                thinkingBudget: 0,
                includeThoughts: false,
            },
        });
    }
    return gemini;
};

export const getModel = async (agent) => {
    switch (agent) {
        case "coding":
            // OpenRouter deepseek hits shared-pool rate limits; Groq is stable here.
            return getGroqCoding();
        case "chat":
            return getGemini();
        case "search":
            return getGroq();
        case "intent":
            return getGroq();

        default:
            return getGroq();
    }
};
