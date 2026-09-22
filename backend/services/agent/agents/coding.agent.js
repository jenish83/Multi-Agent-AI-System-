import { getModel } from "../config/llmModels.js";
import { getMemory } from "../config/memory.js";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

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

const INTENTS = [
    "CODE_GENERATION",
    "CODE_REVIEW",
    "CODE_EXPAINATION",
    "CODE_DEBUGGING",
    "CODE_OPTIMIZATION",
    "CODE_CONVERSATION",
    "CODE_DOCUMENTATION",
];

const INTENT_INSTRUCTIONS = {
    CODE_GENERATION: "Write complete, working code. Explain important parts after the code.",
    CODE_REVIEW: "Review the code. Point out bugs, risks, and concrete improvements.",
    CODE_EXPAINATION: "Explain the code clearly, including how it works and why.",
    CODE_DEBUGGING: "Find the bug, explain the cause, and provide the fixed code.",
    CODE_OPTIMIZATION: "Improve performance or structure and show the optimized code.",
    CODE_CONVERSATION: "Answer the programming question clearly and helpfully.",
    CODE_DOCUMENTATION: "Write clear documentation, comments, or usage notes for the code.",
};

const normalizeIntent = (raw) => {
    const text = toText(raw).toUpperCase();
    return INTENTS.find((name) => text.includes(name)) || "CODE_CONVERSATION";
};

const parseGeneratedProject = (raw) => {
    const text = toText(raw).trim();
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = (fenced ? fenced[1] : text).trim();
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;

    try {
        const parsed = JSON.parse(candidate.slice(start, end + 1));
        const files = Array.isArray(parsed?.files)
            ? parsed.files
                  .map((file) => ({
                      name: String(file?.name || "").trim(),
                      content: String(file?.content ?? ""),
                  }))
                  .filter((file) => file.name)
            : [];
        return files.length ? files : null;
    } catch {
        return null;
    }
};

const confirmationMessage = (files) => {
    const names = files.map((file) => `- ${file.name}`).join("\n");
    return `I've generated your project. The files are available in Artifacts:\n\n${names}`;
};

const GENERATION_PROMPT = (userRequest) => `You are NexoraAI Coding Agent.

Generate the requested project.

Default stack:
- HTML
- CSS
- JavaScript

Use React / Next.js / Vue ONLY if explicitly requested.

Rules:
- Responsive
- Modern UI
- CSS Variables
- Flexbox/Grid
- Smooth Scroll
- Hover Effects
- Beautiful spacing
- Single page unless user asks otherwise.

IMAGES:

Always use unsplash images for the project.

never use place holders
never use placeholder text.
never use placeholder images.
never use placeholder text.


Return ONLY valid JSON.

Schema:
{
  "files": [
    {
      "name": "index.html",
      "content": "..."
    },
    {
      "name": "style.css",
      "content": "..."
    },
    {
      "name": "script.js",
      "content": "..."
    }
  ]
}

Rules:
- Output must start with {
- Output must end with }
- No markdown
- No explanation
- No extra text
- Do not wrap the JSON in markdown code fences
- Never mention intent

User Request: ${userRequest}`;

const RETRY_PROMPT = (userRequest) => `You are NexoraAI Coding Agent.

Your previous output was invalid. Return ONLY valid JSON — nothing else.

Schema:
{"files":[{"name":"index.html","content":"..."},{"name":"style.css","content":"..."},{"name":"script.js","content":"..."}]}

Rules:
- Output must start with {
- Output must end with }
- No markdown fences
- No explanation
- Escape all special characters in content strings correctly

User Request: ${userRequest}`;

const generateProjectFiles = async (llm, userRequest) => {
    const first = await llm.invoke(GENERATION_PROMPT(userRequest));
    let files = parseGeneratedProject(toText(first.content));
    if (files) return files;

    const second = await llm.invoke(RETRY_PROMPT(userRequest));
    files = parseGeneratedProject(toText(second.content));
    return files;
};

export const codingAgent = async (state) => {
    const intentLlm = await getModel("intent");
    const llm = await getModel("coding");
    const intentRes = await intentLlm.invoke(`
        you are an intent classifier.

    Return ONLY one of these valuse:
    
    - CODE_GENERATION
    - CODE_REVIEW
    - CODE_EXPAINATION
    - CODE_DEBUGGING
    - CODE_OPTIMIZATION
    - CODE_CONVERSATION
    - CODE_DOCUMENTATION

    user Request: 

    ${state.prompt}


    `);

    const intent = normalizeIntent(intentRes.content);

    if (intent === "CODE_GENERATION") {
        const files = await generateProjectFiles(llm, state.prompt);

        if (files) {
            return {
                ...state,
                artifacts: files,
                aiResponse: confirmationMessage(files),
            };
        }

        return {
            ...state,
            artifacts: [],
            aiResponse:
                "I couldn't generate valid project files. Please try again with a clearer description.",
        };
    }

    const history = Array.isArray(state.memory)
        ? state.memory
        : await getMemory(state.conversationId);

    const systemPrompt = `You are NexoraAI, a coding assistant.

Task type: ${intent}
${INTENT_INSTRUCTIONS[intent]}

Always identify yourself as NexoraAI.
Never mention the underlying model, provider, API, or framework.
Use Markdown. Put code in fenced blocks with a language tag.
Give complete working code when practical.
Never generate a multi-file project JSON. Answer in markdown only.`;

    const messages = [new SystemMessage(systemPrompt)];

    for (const message of history) {
        const content = toText(message?.content).trim();
        if (!content) continue;

        if (message.role === "user") {
            messages.push(new HumanMessage(content));
        } else if (message.role === "assistant" || message.role === "ai") {
            messages.push(new AIMessage(content));
        }
    }

    const last = messages[messages.length - 1];
    if (!(last instanceof HumanMessage) || last.content !== state.prompt) {
        messages.push(new HumanMessage(state.prompt));
    }

    const response = await llm.invoke(messages);
    const aiResponse = toText(response.content).trim();

    return {
        ...state,
        artifacts: [],
        aiResponse,
    };
};
