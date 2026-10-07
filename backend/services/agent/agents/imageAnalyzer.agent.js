import fs from "fs";
import { readFile } from "fs/promises";
import sharp from "sharp";
import { getModel } from "../config/llmModels.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { deductCredits } from "../utils/deductCredits.js";

const MIN_IMAGE_PX = 32;

/** Groq vision rejects images smaller than 32px on either side. */
const prepareImage = async (buffer, mimeType) => {
    const meta = await sharp(buffer, { failOn: "none" }).metadata();
    const width = meta.width || 0;
    const height = meta.height || 0;
    if (width >= MIN_IMAGE_PX && height >= MIN_IMAGE_PX) {
        return { buffer, mimeType };
    }

    const resized = await sharp(buffer, { failOn: "none" })
        .resize({
            width: Math.max(width, MIN_IMAGE_PX),
            height: Math.max(height, MIN_IMAGE_PX),
            fit: "fill",
        })
        .jpeg()
        .toBuffer();

    return { buffer: resized, mimeType: "image/jpeg" };
};

export const imageAnalyzerAgent = async (state) => {
    try {
        const llm = await getModel("imageAnalyzer");
        const rawBuffer = await readFile(state.file.path);
        const prepared = await prepareImage(rawBuffer, state.file.mimetype || "image/jpeg");
        const base64image = prepared.buffer.toString("base64");
        const mimeType = prepared.mimeType;

        const messages = [
            new SystemMessage(` you are NexoraAI image analyzer agent. you are given an image and you need to analyze it and return the result in a structured format.
             
            Rules:
            
            - Analyze only the uploaded image.
            - Answet the user's question accurately
            - If text exists in the image, extract it and return it in a structured format.
            -If chart or table exist, explain the data in the chart or table in a structured format.
            - If something is unclear, say so and ask the user to provide more information.
            - Use markdown to format your response.
            - Keep your response concise and to the point.
            - Use emojis to make your response more engaging.
            - Use bold and italic to highlight important information.
            - Use lists to summarize the information.
            - Use tables to summarize the information.
            - Use images to summarize the information.
            - Use links to provide more information.
            - Use code blocks to provide more information.
            - Use images to summarize the information.
            - Do not hallucinate or make up information.
                `),
            new HumanMessage({
                content: [
                    {
                        type: "text",
                        text: state.prompt || "Analyze the image",
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${mimeType};base64,${base64image}`,
                        },
                    },
                ],
            }),
        ];

        const response = await llm.invoke(messages);
        await deductCredits(state.userId, "imageAnalyzer");
        return {
            ...state,
            aiResponse: response.content,
        };
    } catch (error) {
        console.error("Image analyzer agent error:", error);
        throw error;
    } finally {
        if (state.file?.path) {
            fs.unlinkSync(state.file.path);
        }
    }
};
