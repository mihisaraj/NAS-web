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
    "flex w-full md:w-auto items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/40 backdrop-blur-lg px-3 py-2 text-sm font-medium text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition hover:bg-white/60 hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="relative flex flex-col gap-4 rounded-2xl border border-white/20 bg-gradient-to-br from-white/25 to-white/10 p-4 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] md:flex-row md:flex-wrap md:items-center md:justify-between">
      {/* Glow layer */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-blue-100/20 via-transparent to-indigo-100/20 opacity-70" />

      {/* LEFT SECTION */}
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 md:w-auto">
        <button onClick={onNavigateUp} disabled={!canNavigateUp} className={glassBtn}>
          <ArrowUp size={16} />
          Up
        </button>

        <div className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-blue-400/40 bg-gradient-to-r from-blue-100/70 to-blue-200/50 px-4 py-2 text-center text-sm font-semibold text-slate-800 shadow-inner backdrop-blur-md break-words sm:w-auto sm:justify-start sm:text-left">
          <FolderPlus size={16} />
          {currentPath || "Home"}
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
        {/* View Toggle */}
        {allowViewToggle && (
          <div className="flex w-full items-center justify-between rounded-xl border border-white/25 bg-white/40 backdrop-blur-md p-1 shadow-sm sm:w-auto sm:justify-start">
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
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400/40 bg-blue-100/60 backdrop-blur-lg px-4 py-2 text-sm font-semibold text-slate-900 shadow-md transition hover:bg-blue-200/80 hover:border-blue-300 disabled:opacity-50 sm:w-auto"
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
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400/40 bg-blue-100/60 backdrop-blur-lg px-3 py-2 text-sm font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition hover:bg-blue-200/80 hover:border-blue-300 sm:w-auto"
          >
            <Clipboard size={16} />
            Paste
          </button>
        )}

        {clipboardLabel && (
          <span className="w-full rounded-lg border border-blue-400/30 bg-blue-100/60 backdrop-blur-md px-3 py-1 text-center text-xs font-medium text-slate-900 shadow-inner sm:w-auto sm:text-left">
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
          <div className="relative w-full sm:w-auto">
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
