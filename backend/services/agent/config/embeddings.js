import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import "./env.js";

const clean = (value) =>
    (value || "")
        .trim()
        .replace(/^\uFEFF/, "")
        .replace(/^["']+|["']+$/g, "");

const apiKey = clean(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);

export const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
    apiKey,
    outputDimensionality: 768,
});
