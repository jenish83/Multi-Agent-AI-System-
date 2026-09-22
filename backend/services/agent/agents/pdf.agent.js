import { getModel } from "../config/llmModels.js"

export const pdfAgent = async (state) => {
    try {
        const llm = await getModel("pdf")
        const prompt  = `
        You are an expert Document Writer.

    Return ONLY valid JSON.

    DO NOT return markdown, HTML, or any other formatting.

    Do NOT return explanations or other text.

    structure the response as follows:
    {
        "title": "The title of the document",
        "subtitle": "The subtitle of the document",
        "sections": [
            {
        "heading": "The heading of the section",
        "points": []
        }
        ]
    }

    Generate 4-8 sections .

    Each Section Should have 3-6 concise points.



    Topic: ${state.prompt}
        `

        const res = await llm.invoke(prompt)
        const json = JSON.parse(res.content.trim())
        return {
            ...state,
            aiResponse: json,
        }
    } catch (error) {
        
    }
}
