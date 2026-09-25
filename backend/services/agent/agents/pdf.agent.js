import { getModel } from "../config/llmModels.js";
import generatePdf from "../utils/generatePdf.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";


export const pdfAgent = async (state) => {
  try {
    const llm = await getModel("pdf");
    const prompt = `
You are an expert professional document writer. You create well-structured, informative content that will be rendered as a PDF.

SUBJECT EXTRACTION (do this first):
- The user message is a request to generate a PDF. It is NOT always the document subject.
- Strip command words such as: generate, create, make, write, prepare, produce, give me, pdf, document, report, guide, about, on, for, of, a, an, the.
- The remaining phrase is the SUBJECT to write about.
- Examples:
  - "generate pdf on JavaScript" → subject is JavaScript (the programming language)
  - "create a pdf about photosynthesis" → subject is photosynthesis
  - "pdf on machine learning basics" → subject is machine learning basics
  - "write a document on the French Revolution" → subject is the French Revolution
- Title the document after the SUBJECT itself (e.g. "JavaScript"), never after the generation request (never "Generating PDFs with JavaScript").
- Do NOT write about PDF file formats, PDF libraries, PDF tools, or how to create PDFs unless the extracted subject is actually about those topics (e.g. "PDF file format").

IMPORTANT OUTPUT RULES:
- Return ONLY a single valid JSON object.
- Do NOT return Markdown.
- Do NOT return HTML.
- Do NOT use code fences.
- Do NOT include explanations.
- Do NOT include introductory or concluding text outside the JSON.
- The response must be directly parseable using JSON.parse().
- Do not include trailing commas.
- Properly escape special characters inside JSON strings.
- Use single spaces between words. Never insert double spaces.

Use EXACTLY this JSON structure:

{
  "title": "Short title naming the subject",
  "subtitle": "A short descriptive subtitle for the document",
  "sections": [
    {
      "heading": "Section heading",
      "points": [
        "Point 1",
        "Point 2",
        "Point 3"
      ]
    }
  ]
}

TITLE AND SUBTITLE:
- title: concise name of the SUBJECT only (e.g. "JavaScript", "Photosynthesis", "Machine Learning").
- subtitle: one short line describing what the document covers about that subject.
- Do not put "PDF", "Document", or "Guide to generating" in the title.

CONTENT REQUIREMENTS:
- Generate between 5 and 7 sections that progress logically from basics to practical use.
- Each section must contain between 3 and 6 points.
- Arrange sections in a natural teaching order.
- Avoid repeating the same information across sections.
- Each point must be one clear, specific, accurate sentence with real substance (named concepts, how things work, concrete details).
- Prefer complete sentences. Keep points concise but informative.
- Avoid filler, vague outlines, and generic statements that could apply to any topic.
- Do not invent statistics, citations, research findings, or specific facts when uncertain.
- Make section headings specific and meaningful for the subject.

TOPIC ADAPTATION:
- Programming languages: what it is, history/role, how it runs, core syntax and types, functions and objects, runtime environments (e.g. browser and Node.js where relevant), common uses, practical habits.
- Sciences: definition, key processes, important components, real-world examples, practical significance.
- History or events: background, causes, major developments, key figures, outcomes, lasting impact.
- Business topics: objectives, processes, benefits, challenges, strategies, practical considerations.
- General topics: background, key concepts, important details, examples, useful takeaways.

Before returning the response, verify that:
1. The output is valid JSON.
2. The title names the extracted SUBJECT, not the PDF request.
3. Content is about the SUBJECT, not about generating PDFs.
4. There are 5-7 sections.
5. Every section contains 3-6 points.
6. There is no text outside the JSON object.
7. There are no Markdown or code fences.
8. There are no double spaces in any string.

USER REQUEST:
${state.prompt}`;

    const res = await llm.invoke(prompt);
    const json = JSON.parse(res.content.trim());
    const pdfBuffer = await generatePdf(json);
    const pdfFileName = `pdfs/${state.conversationId || "anon"}/${Date.now()}.pdf`;
    await uploadToS3(pdfFileName, pdfBuffer, "application/pdf");

    const downloadUrl = await getFromS3(pdfFileName, 24 * 60 * 60);
    const title = json.title || "Document";

    return {
        ...state,
        aiResponse: "Your PDF is ready.",
        files: [
            {
                kind: "pdf",
                title,
                url: downloadUrl,
                fileName: pdfFileName.split("/").pop() || `${title}.pdf`,
            },
        ],
    };
  } catch (error) {
    console.error("PDF Agent Error:", error);
    return {
        ...state,
        aiResponse: `Failed to generate PDF: ${error.message}`,
        files: [],
    };
  }
};
