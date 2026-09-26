import { getModel } from "../config/llmModels.js";
import { generatePPT } from "../utils/generatePPT.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";


export const pptAgent = async (state) => {
  try {
    const llm = await getModel("groq");

    const prompt = `
You are a professional presentation designer and content strategist.

Your task is to generate polished, presentation-ready content for a PowerPoint presentation based on the topic provided below.

Topic: ${state.prompt}

Follow these requirements strictly:

1. PRESENTATION STRUCTURE

- Generate exactly 6 content slides.
- Create a clear, logical narrative from the first slide to the final slide.
- Give every slide a concise, specific, and engaging title.
- Each slide must contain exactly 4-6 concise bullet points.
- Every bullet point should communicate one meaningful idea.

2. CONTENT QUALITY

- Keep all content directly relevant to the given topic.
- Prioritize accuracy, clarity, relevance, and practical value.
- Use concise presentation language rather than paragraph-style writing.
- Avoid unnecessary repetition, filler content, and excessive jargon.
- Where appropriate, include key concepts, facts, examples, applications, challenges, benefits, or takeaways.
- Do not invent unsupported statistics, sources, quotations, or factual claims.

3. NARRATIVE FLOW

- Slide 1: Introduce the topic/personality and establish context.
- Slide 2: Explain the core concepts, background, or fundamentals of the topic/personality.
- Slide 3: Present key components, features, or important aspects.
- Slide 4: Explore applications, examples, benefits, or real-world relevance.
- Slide 5: Discuss challenges, limitations, risks, trends, or considerations.
- Slide 6: Summarize the most important insights and provide clear takeaways or conclusions.
- Adapt this structure when necessary to better fit the topic while maintaining a coherent story.

4. WRITING STYLE

- Use professional, modern, and audience-friendly language.
- Keep bullet points short and easy to scan on a presentation slide.
- Prefer strong keywords and concise phrases over long sentences.
- Maintain consistent terminology, tone, and level of detail across all slides.

5. OUTPUT FORMAT

Return ONLY a single valid JSON object.

Do not include Markdown.
Do not include explanations.
Do not include introductory or concluding text.
Do not use code fences.
Do not add any fields other than the specified fields.

Use exactly this JSON structure:

{
  "title": "",
  "subtitle": "",
  "slides": [
    {
      "title": "",
      "points": [
        "",
        "",
        "",
        ""
      ]
    }
  ]
}

6. JSON VALIDATION

- The "slides" array must contain exactly 6 objects.
- Every slide object must contain exactly two fields: "title" and "points".
- Every "points" array must contain 4-6 strings.
- Escape quotation marks and special characters correctly so the output is valid JSON.
- Do not use trailing commas.
- Ensure the final response can be parsed directly as JSON without modification.
`;

    const response = await llm.invoke(prompt);

const data = JSON.parse(response.content.trim());

console.log("Parsed PPT data:");
console.log(data);

const ppt = await generatePPT(data);

const buffer = await ppt.write({
    outputType: "nodebuffer"
});

const filename = `ppt-${Date.now()}.pptx`;

await uploadToS3(
    filename,
    buffer,
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
);

const downloadUrl = await getFromS3(
    filename,
    24 * 60 * 60
);

return {
    ...state,
    aiResponse: `
# ✅ Presentation Generated

**${data.title}**

📩 [Download PPT](${downloadUrl})

Link Expires in 24 hours
`,
    artifacts: [],
};



  } catch (error) {
    console.error("PPT Agent Error:", error);
    console.error("Message:", error.message);

    throw error;
  }
};
