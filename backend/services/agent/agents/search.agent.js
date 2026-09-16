import { searchTool } from "../config/tavily.config.js";

const extractImages = (raw) => {
  if (!Array.isArray(raw?.images)) return [];
  return raw.images
    .map((image) => (typeof image === "string" ? image : image?.url))
    .filter(Boolean);
};

const formatSearchResults = (raw) => {
  const now = new Date();
  const lines = [
    `Authoritative current UTC datetime: ${now.toISOString()}`,
    `Authoritative current UTC time: ${now.toUTCString()}`,
  ];

  if (!raw || raw.error) {
    lines.push("", `Web search did not return usable results${raw?.error ? `: ${raw.error}` : "."}`);
    return lines.join("\n");
  }

  if (raw.answer) {
    lines.push("", `Tavily answer: ${raw.answer}`);
  }

  const results = Array.isArray(raw.results) ? raw.results : [];
  if (results.length) {
    lines.push("", "Web results:");
    results.forEach((result, index) => {
      lines.push(
        `${index + 1}. ${result.title || "Untitled"}`,
        `   URL: ${result.url || ""}`,
        `   ${result.content || ""}`,
      );
    });
  }

  return lines.join("\n");
};

const normalizeResults = (results) => {
  if (typeof results === "string") {
    try {
      return JSON.parse(results);
    } catch {
      return { error: results };
    }
  }
  return results;
};

export const searchAgent = async (state) => {
  try {
    const results = normalizeResults(
      await searchTool.invoke({
        query: state.prompt,
      }),
    );

    if (results?.error) {
      console.error("Tavily search error:", results.error);
      return {
        ...state,
        searchResults: formatSearchResults(results),
        images: [],
      };
    }

    return {
      ...state,
      searchResults: formatSearchResults(results),
      images: extractImages(results),
    };
  } catch (error) {
    console.error("Error in searchAgent:", error);
    return {
      ...state,
      searchResults: formatSearchResults({ error: error.message }),
      images: [],
    };
  }
};
