import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"

const cleanKey = (value) =>
    (value || "")
        .trim()
        .replace(/^\uFEFF/, "")
        .replace(/^["']+|["']+$/g, "");

let groq;
let groqCoding;
let groqPdf;
let groqVision;
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

/** Higher token budget for structured PDF document JSON. */
const getGroqPdf = () => {
    if (!groqPdf) {
        const apiKey = cleanKey(process.env.GROQ_API_KEY);
        if (!apiKey) {
            throw new Error("GROQ_API_KEY is missing in backend/services/agent/.env");
        }
        groqPdf = new ChatGroq({
            model: "openai/gpt-oss-120b",
            apiKey,
            temperature: 0.2,
            maxTokens: 4000,
        });
    }
    return groqPdf;
};

/** Image understanding. Gemini 3.8 Flash is returning 503s under load. */
const getGroqVision = () => {
    if (!groqVision) {
        const apiKey = cleanKey(process.env.GROQ_API_KEY);
        if (!apiKey) {
            throw new Error("GROQ_API_KEY is missing in backend/services/agent/.env");
        }
        groqVision = new ChatGroq({
            model: "qwen/qwen3.8-27b",
            apiKey,
            temperature: 0.2,
            maxTokens: 4096,
            reasoningEffort: "none",
        });
    }
    return groqVision;
};

const getGemini = () => {
    if (!gemini) {
        gemini = new ChatGoogleGenerativeAI({
            // gemini-3.8-flash never returns a body from this network, so fetch fails.
            model: "gemini-3.5-flash",
            apiKey: cleanKey(process.env.GOOGLE_API_KEY),
            maxRetries: 0,
            thinkingConfig: {
                thinkingLevel: "low",
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
        case "pdf":
            return getGroqPdf();
        case "chat":
            return getGemini();
        case "search":
            return getGroq();
        case "intent":
            return getGroq();
        case "image":
            return getGroq();
        case "ppt":
            return getGroq();
        case "imageGen":
            return getGroq();
        case "imageAnalyzer":
            return getGroqVision();
        case "pdf-rag":
            return getGroqPdf();
        default:
            return getGroq();
    }
};
