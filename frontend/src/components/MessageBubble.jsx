import React, { useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Download, FileText, Presentation, X } from "lucide-react";

const IMAGE_URL_RE = /^https?:\/\//i;
const PDF_DOWNLOAD_RE =
  /(?:📩\s*)?\*{0,2}\[Download PDF\]\((https?:\/\/[^)\s]+)\)\*{0,2}/i;

const toImageUrl = (image) => {
  if (typeof image === "string") return image.trim();
  if (image && typeof image === "object") {
    return String(
      image.url || image.src || image.image || image.image_url || "",
    ).trim();
  }
  return "";
};

const decodeUrl = (url = "") =>
  url
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const getAttr = (tag, name) => {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return decodeUrl(match?.[1] || "").trim();
};

const extractImagesFromContent = (text) => {
  if (!text) return [];
  const urls = [];
  const markdown = /!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi;
  const html = /<img\b[^>]*\bsrc\s*=\s*["'](https?:\/\/[^"']+)["'][^>]*>/gi;
  let match;
  while ((match = markdown.exec(text))) urls.push(decodeUrl(match[1]));
  while ((match = html.exec(text))) urls.push(decodeUrl(match[1]));
  return urls;
};

const stripInlineImages = (content) => {
  if (!content || typeof content !== "string") return content;

  return content
    .replace(
      /\[!\[[^\]]*]\((https?:\/\/[^)\s]+)\)\]\((https?:\/\/[^)\s]+)\)/gi,
      "",
    )
    .replace(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi, "")
    .replace(/<a\b[^>]*>\s*<img\b[^>]*>\s*<\/a>/gi, "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/\|(\s*\|)+\s*$/gm, "|")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

/** Remove leftover Pollinations-era image-gen markdown copy. */
const stripGeneratedImageCopy = (content) => {
  if (!content || typeof content !== "string") return content;

  return content
    .replace(/^\s*🖼️?\s*Image Generated Successfully\s*$/gim, "")
    .replace(/^\s*🗃️?\s*\[Download Image\]\([^)]+\)\s*$/gim, "")
    .replace(/^\s*🔗?\s*Link expires in \d+ minutes\.?\s*$/gim, "")
    .replace(/^\s*Download Image\s*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const extractTitleNearPdfLink = (content) => {
  if (!content) return "Document";
  const boldMatch = content.match(/\*\*([^*]+)\*\*/);
  if (boldMatch?.[1]?.trim() && !/download pdf/i.test(boldMatch[1])) {
    return boldMatch[1].trim();
  }
  return "Document";
};

/** Parse legacy PDF markdown replies into file card data. */
const extractPdfFilesFromContent = (text) => {
  if (!text || typeof text !== "string") return [];
  const match = text.match(PDF_DOWNLOAD_RE);
  if (!match?.[1]) return [];
  return [
    {
      kind: "pdf",
      title: extractTitleNearPdfLink(text),
      url: decodeUrl(match[1]),
      fileName: "document.pdf",
    },
  ];
};

const stripGeneratedPdfCopy = (content) => {
  if (!content || typeof content !== "string") return content;

  return content
    .replace(/^\s*#\s*PDF Generate(?:d)? Successfully\s*$/gim, "")
    .replace(/^\s*#\s*PDF Generation Failed\s*$/gim, "")
    .replace(/^\s*\*\*[^*]+\*\*\s*$/gim, "")
    .replace(PDF_DOWNLOAD_RE, "")
    .replace(
      /^\s*_?Link (?:will )?expire(?:s)? in \d+ (?:hours?|minutes?)\.?_?\s*$/gim,
      "",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const toFile = (file) => {
  if (!file || typeof file !== "object") return null;

  const url = decodeUrl(String(file.url || "").trim());

  if (!IMAGE_URL_RE.test(url)) return null;

  return {
    kind: String(file.kind || "pdf").toLowerCase(),
    title: String(file.title || "Document").trim() || "Document",
    url,
    fileName:
      String(file.fileName || "").trim() ||
      (file.kind === "ppt" ? "presentation.pptx" : "document.pdf"),
  };
};

const FileCard = ({ kind, title, url, fileName }) => {
  const isPpt = kind === "ppt";
  const label = isPpt ? "PPT" : "PDF";
  const downloadLabel = isPpt ? "Download PPT" : "Download PDF";

  const handleDownload = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-400/20">
          {isPpt ? (
            <Presentation size={20} className="text-indigo-300" />
          ) : (
            <FileText size={20} className="text-indigo-300" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-300">
              {label}
            </span>
          </div>

          <p className="mt-1.5 truncate text-[14px] font-medium text-slate-100">
            {title || "Document"}
          </p>

          <p className="mt-0.5 text-[12px] text-slate-500">
            Link expires in 24 hours
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        aria-label={`Download ${fileName || title || label}`}
        className="mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500/90 px-3.5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-indigo-500 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
      >
        <Download size={15} />
        {downloadLabel}
      </button>
    </div>
  );
};

const htmlImagesToMarkdown = (content) => {
  if (!content || typeof content !== "string") return content;

  return content
    .replace(/<a\b[^>]*>\s*<img\b[^>]*>\s*<\/a>/gi, (tag) => {
      const href = getAttr(tag, "href");
      const src = getAttr(tag, "src");
      const alt = getAttr(tag, "alt") || "image";
      if (!IMAGE_URL_RE.test(src)) return "";
      return href ? `[![${alt}](${src})](${href})` : `![${alt}](${src})`;
    })
    .replace(/<img\b[^>]*>/gi, (tag) => {
      const src = getAttr(tag, "src");
      const alt = getAttr(tag, "alt") || "image";
      return IMAGE_URL_RE.test(src) ? `![${alt}](${src})` : "";
    });
};

const uniqueUrls = (urls) => {
  const seen = new Set();
  return urls.filter((url) => {
    if (!IMAGE_URL_RE.test(url) || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
};

const downloadImage = async (src, filename = "nexora-image.png") => {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(src, "_blank", "noopener,noreferrer");
  }
};

const ChatImage = ({ src, alt, className, onOpen, showDownload = false }) => {
  const [failed, setFailed] = useState(false);
  const imageSrc = decodeUrl(src);

  if (!IMAGE_URL_RE.test(imageSrc) || failed) return null;

  return (
    <div className="chat-image group/image relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <button
        type="button"
        onClick={() => onOpen?.(imageSrc, alt || "Chat image")}
        className="block w-full cursor-zoom-in p-0 border-none bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
      >
        <img
          src={imageSrc}
          alt={alt || "Chat image"}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={
            className ||
            "block w-full h-auto max-h-[28rem] sm:max-h-[32rem] object-contain transition-transform duration-200 group-hover/image:scale-[1.01]"
          }
        />
      </button>

      {showDownload && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            downloadImage(imageSrc, "nexora-image.png");
          }}
          aria-label="Download image"
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/60 px-2.5 py-1.5 text-[12px] font-medium text-slate-100 opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover/image:opacity-100 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 cursor-pointer hover:bg-black/75"
        >
          <Download size={14} />
          Download
        </button>
      )}
    </div>
  );
};

const ImageLightbox = ({ src, alt, onClose }) => {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            downloadImage(src, "nexora-image.png");
          }}
          className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-full bg-white/10 border border-white/15 text-slate-100 hover:bg-white/20 transition-colors cursor-pointer text-[13px] font-medium"
          aria-label="Download image"
        >
          <Download size={16} />
          Download
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/15 text-slate-100 hover:bg-white/20 transition-colors cursor-pointer"
          aria-label="Close image preview"
        >
          <X size={20} />
        </button>
      </div>

      <img
        src={src}
        alt={alt || "Preview"}
        referrerPolicy="no-referrer"
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/10"
      />
    </div>
  );
};

const CodeBlock = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.06] px-3 py-1.5">
        <span className="text-[12px] font-medium lowercase text-slate-400">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 cursor-pointer"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "0.75rem",
          background: "transparent",
          fontSize: "13px",
          lineHeight: 1.625,
        }}
        codeTagProps={{
          style: {
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

const MessageBubble = ({ role, content, images, files }) => {
  const isUser = role === "user";
  const [preview, setPreview] = useState(null);

  const galleryImages = useMemo(() => {
    const fromResponse = uniqueUrls(
      (Array.isArray(images) ? images : []).map(toImageUrl),
    );
    const fromContent = uniqueUrls(extractImagesFromContent(content));
    return uniqueUrls([...fromResponse, ...fromContent]);
  }, [images, content]);

  const filesToDisplay = useMemo(() => {
    const fromResponse = (Array.isArray(files) ? files : [])
      .map(toFile)
      .filter(Boolean)
      .filter((file) => file.kind === "pdf" || file.kind === "ppt");

    return fromResponse;
  }, [files]);

  const isSingleImage = galleryImages.length === 1;
  const hasFileCard = filesToDisplay.length > 0;

  const markdownContent = useMemo(() => {
    const withMarkdownImages = htmlImagesToMarkdown(content);
    let cleaned =
      galleryImages.length > 0
        ? stripGeneratedImageCopy(stripInlineImages(withMarkdownImages))
        : withMarkdownImages;
    if (hasFileCard) {
      cleaned = stripGeneratedPdfCopy(cleaned);
    }
    return cleaned;
  }, [content, galleryImages.length, hasFileCard]);

  const markdownComponents = useMemo(
    () => ({
      img: ({ src, alt }) => (
        <ChatImage
          src={src}
          alt={alt}
          onOpen={(url, label) => setPreview({ src: url, alt: label })}
          showDownload
          className="block w-full h-auto max-h-[28rem] sm:max-h-[32rem] object-contain transition-transform duration-200 group-hover/image:scale-[1.01]"
        />
      ),
      a: ({ href, children, ...props }) => (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-indigo-300 hover:text-indigo-200 underline decoration-indigo-400/30 underline-offset-2"
          {...props}
        >
          {children}
        </a>
      ),
      table: ({ children }) => (
        <div className="my-3 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full border-collapse text-left text-[13px] sm:text-[14px]">
            {children}
          </table>
        </div>
      ),
      th: ({ children }) => (
        <th className="px-3 py-2.5 font-medium text-slate-200 bg-white/[0.04] border-b border-white/10 align-middle">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="px-3 py-2.5 text-slate-300 border-b border-white/[0.06] align-middle">
          {children}
        </td>
      ),
      code: ({ className, children, ...props }) => {
        const language = /language-(\w+)/.exec(className || "")?.[1];
        const text = String(children).replace(/\n$/, "");
        const isBlock = Boolean(className) || text.includes("\n");
        if (!isBlock) {
          return (
            <code
              className="rounded-md bg-white/10 px-1.5 py-0.5 text-[13px]"
              {...props}
            >
              {children}
            </code>
          );
        }
        return <CodeBlock language={language} code={text} />;
      },
      pre: ({ children }) => <>{children}</>,
    }),
    [],
  );

  const openPreview = (src, alt) => setPreview({ src, alt });

  return (
    <>
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[88%] sm:max-w-[80%] min-w-0 rounded-2xl px-3.5 py-2.5 sm:px-4 text-[14px] leading-relaxed break-words ${
            isUser
              ? "bg-indigo-500/20 text-slate-100 border border-indigo-400/20 whitespace-pre-wrap"
              : isSingleImage
                ? "w-full sm:max-w-xl border-transparent"
                : hasFileCard
                  ? "w-full sm:max-w-md border-transparent"
                  : "border-white/[0.06]"
          }`}
        >
          {isUser ? (
            content
          ) : (
            <>
              {galleryImages.length > 0 && (
                <div
                  className={`mb-3 grid gap-2 ${
                    isSingleImage
                      ? "grid-cols-1 w-full"
                      : galleryImages.length === 2
                        ? "grid-cols-2"
                        : "grid-cols-2 sm:grid-cols-3"
                  }`}
                >
                  {galleryImages.map((image, index) => (
                    <ChatImage
                      key={`${image}-${index}`}
                      src={image}
                      alt={`message image ${index + 1}`}
                      onOpen={openPreview}
                      showDownload={isSingleImage}
                      className={
                        isSingleImage
                          ? "block w-full h-auto max-h-[28rem] sm:max-h-[32rem] object-contain transition-transform duration-200 group-hover/image:scale-[1.01]"
                          : "block w-full h-36 sm:h-44 object-contain bg-black/20 transition-transform duration-200 group-hover/image:scale-[1.01]"
                      }
                    />
                  ))}
                </div>
              )}

              {markdownContent ? (
                <div
                  className={`markdown-body [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:mb-3 [&_ol]:mb-3 [&_li]:mb-1 [&_h1]:text-lg [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mb-2 ${
                    filesToDisplay.length > 0 ? "mb-3" : ""
                  }`}
                >
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {markdownContent}
                  </Markdown>
                </div>
              ) : null}

              {filesToDisplay.length > 0 && (
                <div className="flex flex-col gap-2">
                  {filesToDisplay.map((file, index) => (
                    <FileCard
                      key={`${file.url}-${index}`}
                      kind={file.kind}
                      title={file.title}
                      url={file.url}
                      fileName={file.fileName}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {preview && (
        <ImageLightbox
          src={preview.src}
          alt={preview.alt}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
};

export default MessageBubble;
