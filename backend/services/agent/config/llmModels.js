import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"

export const groq = new ChatGroq({
    model: "llama3-8b-8192",
    apiKey: process.env.GROQ_API_KEY,
})

export const gemini = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GOOGLE_API_KEY,
})

export const getModel = async (agent) =>{
    switch(agent){
        case "chat":
            return groq;
        case "search":
            return groq;
        case "coding":
            return gemini;
            
        default:
            return groq;
    }   
}