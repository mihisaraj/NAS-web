"use client";

import { useEffect } from "react";
import { X, Download, ExternalLink } from "lucide-react";

const QuickLook = ({
  isOpen,
  item,
  previewUrl,
  mimeType,
  textContent,
  loading,
  error,
  onClose,
  onDownload,
  onOpenInNewTab,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const title = item?.name || "Preview";
  const normalizedMime =
    mimeType || (item?.type === "file" ? "application/octet-stream" : "");

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  // --- CONTENT LOGIC ---
  let content;
  if (loading) {
    content = (
      <div className="flex h-full items-center justify-center text-sm font-medium text-slate-600">
        Preparing preview…
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex h-full items-center justify-center text-sm font-semibold text-rose-600">
        {error}
      </div>
    );
  } else if (textContent) {
    content = (
      <pre className="h-full max-h-[75vh] w-full overflow-auto rounded-xl bg-slate-950/90 p-4 text-xs text-slate-100 shadow-inner">
        {textContent}
      </pre>
    );
  } else if (previewUrl) {
    // ✅ IMAGE
    if (mimeType?.startsWith("image/")) {
      content = (
        <img
          src={previewUrl}
          alt={title}
          className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
        />
      );
    }
    // ✅ AUDIO
    else if (mimeType?.startsWith("audio/")) {
      content = (
        <div className="flex h-full items-center justify-center">
          <audio
            className="w-full max-w-lg rounded-xl bg-white/20 backdrop-blur-md p-2"
            controls
            src={previewUrl}
          />
        </div>
      );
    }
    // ✅ VIDEO
    else if (mimeType?.startsWith("video/")) {
      content = (
        <video
          controls
          src={previewUrl}
          className="max-h-[75vh] w-auto max-w-full rounded-xl shadow-md"
        />
      );
    }
    // ✅ PDF
    else if (mimeType === "application/pdf" || previewUrl.endsWith(".pdf")) {
      content = (
        <iframe
          title={title}
          src={previewUrl}
          className="h-[75vh] w-full rounded-xl bg-white shadow-inner"
        />
      );
    }
    // ✅ Word, Excel, PowerPoint (Office Viewer)
    else if (
      mimeType?.includes("word") ||
      mimeType?.includes("excel") ||
      mimeType?.includes("presentation") ||
      previewUrl?.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i)
    ) {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        previewUrl
      )}`;
      content = (
        <iframe
          title={title}
          src={officeViewerUrl}
          className="h-[75vh] w-full rounded-xl bg-white shadow-inner"
        />
      );
    }
    // ✅ Fallback (Google Docs Viewer)
    else {
      const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
        previewUrl
      )}&embedded=true`;
      content = (
        <iframe
          title={title}
          src={googleViewerUrl}
          className="h-[75vh] w-full rounded-xl bg-white shadow-inner"
        />
      );
    }
  } else {
    // ✅ No Preview
    content = (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        No preview available.
      </div>
    );
  }

  // --- MODAL RETURN ---
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md transition-all"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex w-full max-w-5xl flex-col rounded-2xl border border-white/20 bg-white/30 p-0 backdrop-blur-xl shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-blue-200/40 to-indigo-300/30 blur-2xl" />

        {/* Header */}
        <header className="flex items-center justify-between rounded-t-2xl border-b border-white/30 bg-white/40 px-6 py-3 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            {normalizedMime && (
              <p className="text-xs font-medium uppercase text-slate-500 tracking-wide">
                {normalizedMime}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="rounded-full border border-white/40 bg-white/50 p-2 text-slate-600 hover:bg-white/70 hover:text-slate-900 transition-all shadow-inner"
          >
            <X size={18} />
          </button>
        </header>

        {/* Content */}
        <div className="flex flex-1 items-center justify-center bg-white/30 p-4 overflow-auto rounded-b-2xl">
          <div className="flex w-full flex-col items-center justify-center">
            {content}
          </div>
        </div>

        {/* Footer (floating like macOS) */}
        <footer className="absolute bottom-5 right-6 flex gap-3">
          {onDownload && (
            <button
              onClick={onDownload}
              className="flex items-center gap-2 rounded-xl border border-white/40 bg-white/50 px-4 py-2 text-sm font-semibold text-slate-800 backdrop-blur-md transition hover:bg-white/70 hover:border-white/50 shadow-sm"
            >
              <Download size={16} /> Download
            </button>
          )}
          {previewUrl && (
            <button
              onClick={onOpenInNewTab}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-blue-600/30 transition"
            >
              <ExternalLink size={16} /> Open in New Tab
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default QuickLook;
