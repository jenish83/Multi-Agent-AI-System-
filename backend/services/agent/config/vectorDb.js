import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "./embeddings.js";
import "./env.js";

const clean = (value) =>
    (value || "")
        .trim()
        .replace(/^\uFEFF/, "")
        .replace(/^["']+|["']+$/g, "");

const vectorStore = async (docs, collectionName) => {
    const url = clean(process.env.QDRANT_URL || process.env.QDRANT_ENDPOINT);
    const apiKey = clean(process.env.QDRANT_API_KEY);

    if (!url) {
        throw new Error("QDRANT_ENDPOINT is missing in backend/services/agent/.env");
    }

    try {
        return await QdrantVectorStore.fromDocuments(docs, embeddings, {
            url,
            apiKey: apiKey || undefined,
            collectionName,
        });
    } catch (error) {
        console.error("Error creating vector store:", error);
        throw error;
    }
};

export default vectorStore;
