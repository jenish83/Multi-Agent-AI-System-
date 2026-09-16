import { getModel } from "../config/llmModels.js";

const AGENTS = ["chat", "search", "coding", "pdf", "ppt", "imageGen"];
const AUTO_AGENTS = new Set(["agent", "auto", ""]);

const LIVE_SEARCH_RE =
    /\b(current time|what(?:'s| is) the time|time (?:in|now|right now)|right now|latest news|breaking news|weather|stock price|live (?:score|update)|who won)\b/i;

export const resolveRequestedAgent = (agent) => {
    const key = String(agent ?? "agent").trim().toLowerCase();
    if (key === "image") return "imageGen";
    if (key === "imagegen") return "imageGen";
    if (AGENTS.includes(key)) return key;
    return "agent";
};

const pickAgent = (content) => {
    const text = String(content ?? "").trim().toLowerCase();
    return AGENTS.find((name) => text.includes(name.toLowerCase())) || "chat";
};

export const router = async (state) => {
    if (state.agent && !AUTO_AGENTS.has(String(state.agent).toLowerCase())) {
        return {
            ...state,
            agent: resolveRequestedAgent(state.agent),
        };
    }

    if (LIVE_SEARCH_RE.test(String(state.prompt ?? ""))) {
        return {
            ...state,
            agent: "search",
        };
    }

    const llm = await getModel("router");

    const prompt = `You are an agent router.

    Available agents:

    - chat
    - search
    - coding
    - pdf
    - ppt
    - imageGen

    Rules:

    chat:
    General conversation,
    explanations,
    learning,
    questions that do not need live web data.

    search:
    Current events,
    latest news,
    research,
    live or real-time facts,
    current time or date in a city or country,
    weather, sports scores, stock prices,
    anything that needs up-to-date information from the web.

    coding:
    Code generation
    Code review
    Code optimization
    Code debugging
    Code documentation
    Code refactoring
    Code performance optimization
    Code security optimization
    Architecture design
    API development

    pdf:
    Questions about generate PDFs
    or PDF related tasks

    ppt:
    Questions about generate PPTs
    or PPT related tasks

    imageGen:
    Questions about generate images
    or image generation tasks

    Return ONLY one word:

    chat, search, coding, pdf, ppt, imageGen

    User query: ${state.prompt}
    `;

    const response = await llm.invoke(prompt);

    return {
        ...state,
        agent: pickAgent(response.content),
    };
};  
