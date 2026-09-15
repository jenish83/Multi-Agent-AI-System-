import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"

const cleanKey = (value) =>
    (value || "")
        .trim()
        .replace(/^\uFEFF/, "")
        .replace(/^["']+|["']+$/g, "");

let groq;
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
            return getGemini();
        default:
            return getGroq();
    }
}
