import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import fs from "fs";
import { PDFParse } from "pdf-parse";
import vectorStore from "../config/vectorDb.js";
import { getModel } from "../config/llmModels.js";
import { deductCredits } from "../utils/deductCredits.js";

export const pdfRAGAgent = async (state) => {
    let parser;
    try {
        const buffer = fs.readFileSync(state.file.path);
        parser = new PDFParse({ data: buffer });

        const result = await parser.getText();
        const text = result.text;

        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });

        const docs = await splitter.createDocuments([text]);
        const collectionName = `pdf-${Date.now()}`;
        const store = await vectorStore(docs, collectionName);

        const relevantDocs = await store.similaritySearch(state.prompt, 5);

        const context = relevantDocs.map((d) => d.pageContent).join("\n\n");

        const llm = await getModel("pdf-rag");

        const messages = [
            new SystemMessage(`You are CortexAI PDF Assistant.

                Rules:
                
                - Answer ONLY from the uploaded PDF.
                
                - Never make up information.
                
                - If the answer is not present in the PDF, reply:
                
                "I couldn't find this information in the uploaded PDF."
                
                - Use Markdown formatting.`),
            new HumanMessage(`
                Context: ${context}
                Question: ${state.prompt}
            `),
        ];

        const response = await llm.invoke(messages);
        await deductCredits(state.userId, "pdf-rag");
        return {
            ...state,
            aiResponse: response.content,
        };
    } catch (error) {
        console.error("PDF RAG agent error:", error);
        throw error;
    } finally {
        if (parser) {
            await parser.destroy().catch(() => {});
        }
        if (state.file?.path) {
            fs.unlinkSync(state.file.path);
        }
    }
};
