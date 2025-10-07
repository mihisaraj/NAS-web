"use client";

import { useRef } from "react";
import {
  ArrowUp,
  Eye,
  FolderPlus,
  Upload,
  RefreshCw,
  Copy,
  Scissors,
  Clipboard,
  LayoutGrid,
  List,
} from "lucide-react";

const Toolbar = ({
  currentPath,
  onCreateFolder,
  onUpload,
  onRefresh,
  onNavigateUp,
  canNavigateUp,
  onQuickLook,
  canQuickLook,
  viewMode,
  onViewModeChange,
  allowCreate = true,
  allowUpload = true,
  allowQuickLook = true,
  allowViewToggle = true,
  uploadState = {},
  onCopy,
  onCut,
  onPaste,
  canCopy = false,
  canCut = false,
  canPaste = false,
  clipboardLabel = "",
  isRefreshing = false,
}) => {
  const inputRef = useRef(null);
  const isUploading = Boolean(uploadState.active);
  const uploadPercent = Math.min(100, Math.max(0, Math.round(uploadState.percent || 0)));

  const handleUploadClick = () => {
    if (!allowUpload) return;
    inputRef.current?.click();
  };

  const handleFilesSelected = (event) => {
    const { files } = event.target;
    if (files?.length > 0) {
      onUpload(files);
      event.target.value = "";
    }
  };

  const glassBtn =
    "flex items-center gap-2 rounded-xl border border-white/25 bg-white/40 backdrop-blur-lg px-3 py-2 text-sm font-medium text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition hover:bg-white/60 hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="relative flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/20 bg-gradient-to-br from-white/25 to-white/10 p-4 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
      {/* Glow layer */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-blue-100/20 via-transparent to-indigo-100/20 opacity-70" />

      {/* LEFT SECTION */}
      <div className="flex items-center gap-3">
        <button onClick={onNavigateUp} disabled={!canNavigateUp} className={glassBtn}>
          <ArrowUp size={16} />
          Up
        </button>

        <div className="flex items-center gap-2 rounded-xl border border-blue-400/40 bg-gradient-to-r from-blue-100/70 to-blue-200/50 px-4 py-2 text-sm font-semibold text-slate-800 shadow-inner backdrop-blur-md">
          <FolderPlus size={16} />
          {currentPath || "Home"}
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        {/* View Toggle */}
        {allowViewToggle && (
          <div className="flex items-center rounded-xl border border-white/25 bg-white/40 backdrop-blur-md p-1 shadow-sm">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`flex items-center justify-center rounded-lg px-3 py-1 transition-all ${
                viewMode === "grid"
                  ? "bg-blue-200/80 text-slate-900 font-semibold"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`flex items-center justify-center rounded-lg px-3 py-1 transition-all ${
                viewMode === "list"
                  ? "bg-blue-200/80 text-slate-900 font-semibold"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              <List size={16} />
            </button>
          </div>
        )}

        {/* Quick Look */}
        {allowQuickLook && (
          <button
            onClick={onQuickLook}
            disabled={!canQuickLook}
            className="flex items-center gap-2 rounded-xl border border-blue-400/40 bg-blue-100/60 backdrop-blur-lg px-4 py-2 text-sm font-semibold text-slate-900 shadow-md transition hover:bg-blue-200/80 hover:border-blue-300 disabled:opacity-50"
          >
            <Eye size={16} />
            Quick Look
          </button>
        )}

        {/* Copy / Cut / Paste */}
        {onCopy && (
          <button onClick={onCopy} disabled={!canCopy} className={glassBtn}>
            <Copy size={16} />
            Copy
          </button>
        )}

        {onCut && (
          <button onClick={onCut} disabled={!canCut} className={glassBtn}>
            <Scissors size={16} />
            Cut
          </button>
        )}

        {onPaste && (
          <button
            onClick={onPaste}
            disabled={!canPaste}
            className="flex items-center gap-2 rounded-xl border border-blue-400/40 bg-blue-100/60 backdrop-blur-lg px-3 py-2 text-sm font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition hover:bg-blue-200/80 hover:border-blue-300"
          >
            <Clipboard size={16} />
            Paste
          </button>
        )}

        {clipboardLabel && (
          <span className="rounded-lg border border-blue-400/30 bg-blue-100/60 backdrop-blur-md px-3 py-1 text-xs font-medium text-slate-900 shadow-inner">
            {clipboardLabel}
          </span>
        )}

        {/* Create Folder */}
        {allowCreate && (
          <button onClick={onCreateFolder} className={glassBtn}>
            <FolderPlus size={16} />
            New Folder
          </button>
        )}

        {/* Upload */}
        {allowUpload && (
          <div className="relative">
            <button onClick={handleUploadClick} disabled={isUploading} className={glassBtn}>
              <Upload size={16} />
              {isUploading ? `Uploading ${uploadPercent}%` : "Upload"}
            </button>
            {isUploading && (
              <div className="absolute left-2 right-2 bottom-1 h-[3px] rounded-full bg-blue-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-200"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Refresh */}
        <button onClick={onRefresh} className={glassBtn}>
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          Refresh
        </button>

        <input ref={inputRef} type="file" multiple hidden onChange={handleFilesSelected} />
      </div>
    </div>
  );
};

export default Toolbar;
