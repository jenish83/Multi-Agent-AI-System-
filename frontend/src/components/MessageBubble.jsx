import React, { useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X } from "lucide-react";

const IMAGE_URL_RE = /^https?:\/\//i;

const toImageUrl = (image) => {
  if (typeof image === "string") return image.trim();
  if (image && typeof image === "object") {
    return String(image.url || image.src || image.image || image.image_url || "").trim();
  }
  return "";
};

const decodeUrl = (url = "") =>
  url.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

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
    .replace(/\[!\[[^\]]*]\((https?:\/\/[^)\s]+)\)\]\((https?:\/\/[^)\s]+)\)/gi, "")
    .replace(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi, "")
    .replace(/<a\b[^>]*>\s*<img\b[^>]*>\s*<\/a>/gi, "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/\|(\s*\|)+\s*$/gm, "|")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

const ChatImage = ({ src, alt, className, onOpen }) => {
  const [failed, setFailed] = useState(false);
  const imageSrc = decodeUrl(src);

  if (!IMAGE_URL_RE.test(imageSrc) || failed) return null;

  return (
    <button
      type="button"
      onClick={() => onOpen?.(imageSrc, alt || "Chat image")}
      className="chat-image group/image block w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] cursor-zoom-in p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
    >
      <img
        src={imageSrc}
        alt={alt || "Chat image"}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={
          className ||
          "block w-full h-auto max-h-72 sm:max-h-80 object-cover transition-transform duration-200 group-hover/image:scale-[1.02]"
        }
      />
    </button>
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
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/15 text-slate-100 hover:bg-white/20 transition-colors cursor-pointer"
        aria-label="Close image preview"
      >
        <X size={20} />
      </button>

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

const MessageBubble = ({ role, content, images }) => {
  const isUser = role === "user";
  const [preview, setPreview] = useState(null);

  const galleryImages = useMemo(() => {
    const fromResponse = uniqueUrls((Array.isArray(images) ? images : []).map(toImageUrl));
    const fromContent = uniqueUrls(extractImagesFromContent(content));
    return uniqueUrls([...fromResponse, ...fromContent]);
  }, [images, content]);

  const markdownContent = useMemo(() => {
    const withMarkdownImages = htmlImagesToMarkdown(content);
    // Avoid showing the same photos twice when we already render a top gallery
    return galleryImages.length > 0
      ? stripInlineImages(withMarkdownImages)
      : withMarkdownImages;
  }, [content, galleryImages.length]);

  const markdownComponents = useMemo(
    () => ({
      img: ({ src, alt }) => (
        <ChatImage
          src={src}
          alt={alt}
          onOpen={(url, label) => setPreview({ src: url, alt: label })}
          className="block w-full h-auto max-h-72 sm:max-h-80 object-cover transition-transform duration-200 group-hover/image:scale-[1.02]"
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
                    galleryImages.length === 1
                      ? "grid-cols-1 max-w-md"
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
                      className={`block w-full object-cover transition-transform duration-200 group-hover/image:scale-[1.02] ${
                        galleryImages.length === 1 ? "max-h-96 h-auto" : "h-36 sm:h-44"
                      }`}
                    />
                  ))}
                </div>
              )}

              <div className="markdown-body [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:mb-3 [&_ol]:mb-3 [&_li]:mb-1 [&_h1]:text-lg [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mb-2 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:p-3 [&_pre]:bg-white/[0.04]">
                <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {markdownContent}
                </Markdown>
              </div>
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
