import { getModel } from "../config/llmModels.js";

export const router = async (state) => {
    const llm = await getModel("router");

    const prompt = `You are an agent router.

    Available agents:
    
    - chat
    - search
    - coding
    - pdf
    - ppt
    - image
    
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
    Code performance optimization  
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

    Return ONLY onw word:

    chat, search, coding, pdf, ppt, imageGen

    User query: ${state.prompt}

    `

    const response = await llm.invoke(prompt);

    console.log(response)
    return {
        ...state,
        agent: response.content.trim().toLowerCase(),
    }
}