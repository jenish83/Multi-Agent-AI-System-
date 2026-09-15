import { getModel } from "../config/llmModels.js";

const AGENTS = ["chat", "search", "coding", "pdf", "ppt", "imageGen"];

const pickAgent = (content) => {
    const text = String(content ?? "").trim().toLowerCase();
    return AGENTS.find((name) => text.includes(name.toLowerCase())) || "chat";
};

export const router = async (state) => {

    console.log("🔥 ROUTER STARTED");
    console.log("Prompt:", state.prompt);

    const llm = await getModel("router");

    console.log("🔥 GROQ MODEL CREATED");

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
    questions.

    search:
    Current events
    Latest news
    Research
    Information gathering

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

    console.log("🔥 CALLING GROQ FROM ROUTER");

    const response = await llm.invoke(prompt);

    console.log("🔥 GROQ RESPONSE:", response.content);

    return {
        ...state,
        agent: pickAgent(response.content),
    };
};  