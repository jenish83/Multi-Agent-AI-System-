import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "motion/react";
import Editor from "@monaco-editor/react";
import { Check, Code2, Copy, Eye, PanelRight } from "lucide-react";

const DEFAULT_WIDTH = 360;
const COLLAPSED_WIDTH = 52;
const MIN_WIDTH = 320;
const MAX_WIDTH_RATIO = 0.5;
const CHAT_MIN_WIDTH = 480; //

const iconBtnClass =
  "flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50";

// this is the mapping of the file extensions to the languages
const EXT_TO_LANG = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  css: "css",
  scss: "scss",
  html: "html",
  htm: "html",
  json: "json",
  md: "markdown",
  mdx: "markdown",
  yml: "yaml",
  yaml: "yaml",
  sh: "shell",
  bash: "shell",
  sql: "sql",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  rb: "ruby",
  php: "php",
  c: "c",
  cpp: "cpp",
  h: "c",
  hpp: "cpp",
  xml: "xml",
  svg: "xml",
  txt: "plaintext",
};

const getExt = (name = "") => name.split(".").pop()?.toLowerCase() || "";

const languageFromName = (name = "") =>
  EXT_TO_LANG[getExt(name)] || "plaintext";

const isHtmlFile = (name = "") => ["html", "htm"].includes(getExt(name));
const isCssFile = (name = "") => getExt(name) === "css";
const isJsFile = (name = "") => ["js", "mjs", "cjs"].includes(getExt(name));

const getLatestArtifacts = (messages = []) => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg?.role !== "assistant") continue;
    const artifacts = Array.isArray(msg.artifacts) ? msg.artifacts : [];
    const valid = artifacts.filter((a) => a?.name);
    if (valid.length) return valid;
  }
  return [];
};

const seedDrafts = (artifacts) => {
  const next = {};
  artifacts.forEach((file) => {
    next[file.name] = file.content ?? "";
  });
  return next;
};

const escapeForScript = (code = "") =>
  code.replace(/<\/script/gi, "<\\/script");

const injectBefore = (html, tag, snippet) => {
  const re = new RegExp(`</${tag}\\s*>`, "i");
  if (re.test(html)) return html.replace(re, `${snippet}</${tag}>`);
  return html;
};

const buildPreviewHtml = (files, activeName) => {
  const list = Array.isArray(files) ? files : [];
  if (!list.length) return null;

  const active = list.find((f) => f.name === activeName);
  const entry =
    (active && isHtmlFile(active.name) ? active : null) ||
    list.find((f) => isHtmlFile(f.name));

  if (!entry) return null;

  let html = entry.content ?? "";
  if (!html.trim()) {
    html =
      '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>';
  }

  if (!/<html[\s>]/i.test(html)) {
    html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
  } else if (!/<head[\s>]/i.test(html)) {
    html = html.replace(
      /<html([^>]*)>/i,
      `<html$1><head><meta charset="utf-8"></head>`,
    );
  } else if (!/<body[\s>]/i.test(html)) {
    html = injectBefore(html, "html", "<body></body>");
  }

  const byName = Object.fromEntries(list.map((f) => [f.name, f.content ?? ""]));

  // Inline matching relative stylesheet / script links that exist in artifacts
  html = html.replace(
    /<link\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi,
    (tag, href) => {
      const base = href.split("/").pop()?.split("?")[0] || "";
      if (byName[base] != null && isCssFile(base)) {
        return `<style data-artifact="${base}">\n${byName[base]}\n</style>`;
      }
      if (byName[href] != null && isCssFile(href)) {
        return `<style data-artifact="${href}">\n${byName[href]}\n</style>`;
      }
      return tag;
    },
  );

  html = html.replace(
    /<script\b[^>]*src\s*=\s*["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (tag, src) => {
      const base = src.split("/").pop()?.split("?")[0] || "";
      const key =
        byName[base] != null ? base : byName[src] != null ? src : null;
      if (key != null && isJsFile(key)) {
        return `<script data-artifact="${key}">\n${escapeForScript(byName[key])}\n</script>`;
      }
      return tag;
    },
  );

  const cssFiles = list.filter(
    (f) => isCssFile(f.name) && f.name !== entry.name,
  );
  const jsFiles = list.filter((f) => isJsFile(f.name) && f.name !== entry.name);

  // Avoid double-injecting files already inlined via link/script rewrite
  const alreadyInlined = new Set();
  const styleMatches = html.matchAll(/data-artifact=["']([^"']+)["']/g);
  for (const m of styleMatches) alreadyInlined.add(m[1]);

  const styleBlock = cssFiles
    .filter((f) => !alreadyInlined.has(f.name))
    .map(
      (f) => `<style data-artifact="${f.name}">\n${f.content ?? ""}\n</style>`,
    )
    .join("\n");

  const scriptBlock = jsFiles
    .filter((f) => !alreadyInlined.has(f.name))
    .map(
      (f) =>
        `<script data-artifact="${f.name}">\n${escapeForScript(f.content ?? "")}\n</script>`,
    )
    .join("\n");

  if (styleBlock) html = injectBefore(html, "head", styleBlock);
  if (scriptBlock) html = injectBefore(html, "body", scriptBlock);

  return html;
};

const useDebouncedValue = (value, delay = 200) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

const ArtifactMonacoPane = ({ fileName, value, onChange }) => {
  const [copied, setCopied] = useState(false);
  const language = languageFromName(fileName);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    setCopied(false);
  }, [fileName]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value ?? "");
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]">
      <div className="flex items-center justify-between gap-3 shrink-0 border-b border-white/[0.06] bg-white/[0.04] px-3 py-1.5">
        <span className="text-[12px] font-medium lowercase text-slate-400 truncate">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 border-none bg-transparent"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          theme="vs-dark"
          language={language}
          path={fileName}
          value={value ?? ""}
          onChange={(next) => onChange(next ?? "")}
          options={{
            fontSize: 13,
            lineNumbers: "on",
            minimap: { enabled: false },
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: "line",
            tabSize: 2,
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}
        />
      </div>
    </div>
  );
};

const ArtifactPreviewPane = ({ html }) => {
  if (!html) {
    return (
      <div className="flex flex-col h-full min-h-0 items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-6 text-center">
        <Eye size={20} className="text-slate-600" />
        <p className="text-[13px] font-medium text-slate-400">
          Preview unavailable for this artifact
        </p>
        <p className="text-[12px] text-slate-600 leading-relaxed">
          Add an HTML file to preview HTML, CSS, and JS together.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden rounded-xl border border-white/[0.06] bg-white">
      <iframe
        title="Artifact preview"
        sandbox="allow-scripts allow-same-origin"
        srcDoc={html}
        className="h-full w-full border-0 rounded-xl bg-white"
      />
    </div>
  );
};

const Artifect = () => {
  const { messages } = useSelector((state) => state.message);
  const { selectedConversation } = useSelector((state) => state.conversation);

  const [collapsed, setCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState("code"); // "code" | "preview"
  const [drafts, setDrafts] = useState({});

  const dragRef = useRef(false);

  const artifacts = useMemo(() => getLatestArtifacts(messages), [messages]);
  const artifactKey = useMemo(
    () => artifacts.map((a) => `${a.name}\0${a.content ?? ""}`).join("|"),
    [artifacts],
  );
  const namesKey = useMemo(
    () => artifacts.map((a) => a.name).join("|"),
    [artifacts],
  );

  const panelTitle = selectedConversation?.title?.trim() || "New Chat";

  useEffect(() => {
    setActiveIndex(0);
    setViewMode("code");
  }, [namesKey]);

  // Seed / reset drafts when artifact files or their server content change
  useEffect(() => {
    setDrafts(seedDrafts(artifacts));
  }, [artifactKey]);

  const activeFile = artifacts[activeIndex] ?? artifacts[0] ?? null;
  const activeName = activeFile?.name ?? "";
  const activeValue = activeName ? (drafts[activeName] ?? "") : "";

  const draftFiles = useMemo(
    () =>
      artifacts.map((f) => ({
        name: f.name,
        content: drafts[f.name] ?? f.content ?? "",
      })),
    [artifacts, drafts],
  );

  const previewSource = useMemo(
    () => buildPreviewHtml(draftFiles, activeName),
    [draftFiles, activeName],
  );
  const debouncedPreview = useDebouncedValue(previewSource, 200);

  const handleDraftChange = useCallback(
    (next) => {
      if (!activeName) return;
      setDrafts((prev) => ({ ...prev, [activeName]: next }));
    },
    [activeName],
  );

  const clampWidth = useCallback((w) => {
    const maxByRatio = window.innerWidth * MAX_WIDTH_RATIO;
    const maxByChat = window.innerWidth - CHAT_MIN_WIDTH;
    const max = Math.max(MIN_WIDTH, Math.min(maxByRatio, maxByChat));
    return Math.min(max, Math.max(MIN_WIDTH, w));
  }, []);

  const onResizePointerDown = useCallback(
    (e) => {
      if (collapsed) return;
      e.preventDefault();
      dragRef.current = true;
      setIsDragging(true);

      const onMove = (ev) => {
        if (!dragRef.current) return;
        const next = clampWidth(window.innerWidth - ev.clientX);
        setPanelWidth(next);
      };

      const onUp = () => {
        dragRef.current = false;
        setIsDragging(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [collapsed, clampWidth],
  );

  useEffect(() => {
    if (collapsed || isDragging) return undefined;
    const onResize = () => setPanelWidth((w) => clampWidth(w));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [collapsed, isDragging, clampWidth]);

  const displayWidth = collapsed ? COLLAPSED_WIDTH : panelWidth;

  return (
    <motion.aside
      className="hidden lg:flex h-full border-l border-white/[0.06] flex-col overflow-hidden shrink-0 min-w-0 bg-[#0d0f14] relative"
      initial={false}
      animate={{ width: displayWidth }}
      style={{
        width: displayWidth,
        minWidth: collapsed ? COLLAPSED_WIDTH : 0,
        maxWidth: collapsed ? COLLAPSED_WIDTH : "50vw",
      }}
      transition={
        isDragging
          ? { duration: 0 }
          : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {/* Resize handle */}
      {!collapsed && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize artifacts panel"
          onPointerDown={onResizePointerDown}
          className={`absolute left-0 top-0 bottom-0 z-20 w-2 -ml-1 cursor-col-resize touch-none transition-colors ${
            isDragging
              ? "bg-indigo-500/50"
              : "bg-transparent hover:bg-indigo-500/40"
          }`}
        />
      )}

      <div className="flex flex-col h-full min-h-0 w-full">
        {/* Header */}
        <div
          className={`flex items-center shrink-0 border-b border-white/[0.06] h-14 ${
            collapsed ? "justify-center px-2" : "gap-2 px-3.5"
          }`}
        >
          {!collapsed && (
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0">
              <Code2 size={13} className="text-indigo-400" />
            </div>
          )}

          <AnimatePresence initial={false} mode="popLayout">
            {!collapsed && (
              <motion.span
                key={panelTitle}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                title={panelTitle}
                className="text-[14px] font-semibold text-slate-100 tracking-tight flex-1 truncate min-w-0"
              >
                {panelTitle}
              </motion.span>
            )}
          </AnimatePresence>

          {!collapsed && artifacts.length > 0 && (
            <div className="flex items-center shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.03] p-0.5">
              <button
                type="button"
                aria-label="Code view"
                onClick={() => setViewMode("code")}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium border-none cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 ${
                  viewMode === "code"
                    ? "bg-indigo-500/15 text-indigo-300"
                    : "bg-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <Code2 size={12} />
                Code
              </button>
              <button
                type="button"
                aria-label="Preview view"
                onClick={() => setViewMode("preview")}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium border-none cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 ${
                  viewMode === "preview"
                    ? "bg-indigo-500/15 text-indigo-300"
                    : "bg-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <Eye size={12} />
                Preview
              </button>
            </div>
          )}

          <button
            type="button"
            aria-label={collapsed ? "Expand artifacts" : "Collapse artifacts"}
            className={iconBtnClass}
            onClick={() => setCollapsed((prev) => !prev)}
          >
            <motion.span
              className="inline-flex"
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <PanelRight size={18} />
            </motion.span>
          </button>
        </div>

        {/* Body */}
        <AnimatePresence initial={false} mode="wait">
          {collapsed ? (
            <motion.div
              key="collapsed-rail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col items-center pt-3 gap-3"
            >
              <button
                type="button"
                aria-label="Expand artifacts"
                title="Expand artifacts"
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/15 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
                onClick={() => setCollapsed(false)}
              >
                <Code2 size={16} />
              </button>
              {artifacts.length > 0 && (
                <span className="text-[10px] font-semibold text-slate-500 tabular-nums">
                  {artifacts.length}
                </span>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="expanded-body"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col flex-1 min-h-0"
            >
              {artifacts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-600">
                    <Code2 size={20} />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-slate-400">
                      No artifacts yet
                    </p>
                    <p className="mt-1 text-[12px] text-slate-600 leading-relaxed">
                      Generated code files will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* File tabs */}
                  <div className="shrink-0 px-2.5 pt-2.5 pb-2 border-b border-white/[0.06]">
                    <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {artifacts.map((file, index) => {
                        const isActive = index === activeIndex;
                        return (
                          <button
                            key={`${file.name}-${index}`}
                            type="button"
                            title={file.name}
                            onClick={() => setActiveIndex(index)}
                            className={`shrink-0 max-w-[140px] truncate rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 ${
                              isActive
                                ? "bg-indigo-500/10 border-indigo-500/20 text-slate-100"
                                : "bg-transparent border-transparent text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"
                            }`}
                          >
                            {file.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Code / Preview */}
                  <div className="flex-1 min-h-0 p-2.5">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={`${viewMode}-${activeName}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.16 }}
                        className="h-full min-h-0"
                      >
                        {viewMode === "code" ? (
                          <ArtifactMonacoPane
                            fileName={activeName}
                            value={activeValue}
                            onChange={handleDraftChange}
                          />
                        ) : (
                          <ArtifactPreviewPane html={debouncedPreview} />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};

export default Artifect;
