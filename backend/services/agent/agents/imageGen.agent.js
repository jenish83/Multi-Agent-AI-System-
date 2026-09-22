import { getModel } from "../config/llmModels.js";
import axios from "axios";
import sharp from "sharp";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";

const SIGNED_URL_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days (IAM presign max)
const IMAGE_SIZE = 1280;
/** Extra bottom pixels generated so we can crop the Pollinations logo off. */
const WATERMARK_CROP_PX = 72;

const NEGATIVE_PROMPT =
    "blur, out of focus, soft focus, depth of field, bokeh, lowres, jpeg artifacts, noise, grain, watermark, logo, text, signature, stamp, UI overlay, caption";

/** Crop a thin strip from the bottom (where the Pollinations watermark sits). */
const stripBottomWatermark = async (buffer) => {
    const image = sharp(buffer);
    const meta = await image.metadata();
    const width = meta.width || IMAGE_SIZE;
    const height = meta.height || IMAGE_SIZE;
    const cropPx = Math.min(WATERMARK_CROP_PX, Math.floor(height * 0.08));
    const keepHeight = height - cropPx;
    if (keepHeight < 1) return buffer;

    return image
        .extract({ left: 0, top: 0, width, height: keepHeight })
        .jpeg({ quality: 92 })
        .toBuffer();
};

const toText = (content) => {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (typeof part === "string") return part;
                return part?.text ?? part?.content ?? "";
            })
            .join("");
    }
    return String(content ?? "");
};

export const imageGenAgent = async (state) => {
    try {
        const llm = await getModel("image");
        const res = await llm.invoke(`
You are an elite AI image prompt engineer for Flux.

Convert the user request into ONE detailed image generation prompt.

Rules:
- Describe subject, setting, lighting, camera angle, materials, and colors specifically.
- Prefer tack-sharp focus, crisp detail, and clean edges across the whole frame.
- Match the user's requested style (photo, illustration, 3D, etc.); do not force photorealism unless asked.
- Explicitly include: no watermark, no logo, no text, no signature.
- Do NOT mention: depth of field, bokeh, soft focus, film grain, 8K, ultra realistic buzzwords alone.
- Return only the image prompt — no quotes, labels, or explanation.

User Request:
${state.prompt}
        `);

        const prompt = toText(res.content).trim();
        const apiKey = (process.env.POLLINATIONS_API_KEY || "")
            .trim()
            .replace(/^["']+|["']+$/g, "");

        const params = new URLSearchParams({
            width: String(IMAGE_SIZE),
            // Generate slightly taller so the cropped result stays near square.
            height: String(IMAGE_SIZE + WATERMARK_CROP_PX),
            model: "flux",
            quality: "hd",
            nologo: "true",
            private: "true",
            negative_prompt: NEGATIVE_PROMPT,
        });
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;

        const headers = {};
        if (apiKey) {
            headers.Authorization = `Bearer ${apiKey}`;
        }

        const imageRes = await axios.get(imageUrl, {
            responseType: "arraybuffer",
            timeout: 90000,
            headers,
        });

        const cropped = await stripBottomWatermark(Buffer.from(imageRes.data));

        const filename = `images/${state.conversationId || "anon"}/${Date.now()}.jpg`;
        await uploadToS3(filename, cropped, "image/jpeg");
        const downloadUrl = await getFromS3(filename, SIGNED_URL_TTL_SECONDS);

        return {
            ...state,
            aiResponse: "Here's the image I generated for you.",
            images: [downloadUrl],
        };
    } catch (error) {
        return {
            ...state,
            aiResponse: `Failed to generate image: ${error.message}`,
            images: [],
        };
    }
};
