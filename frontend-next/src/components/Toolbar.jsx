import { useRef } from 'react';

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
  clipboardLabel = '',
}) => {
  const inputRef = useRef(null);
  const isUploading = Boolean(uploadState.active);
  const uploadPercent = Math.min(100, Math.max(0, Math.round(uploadState.percent || 0)));

  const handleUploadClick = () => {
    if (!allowUpload) {
      return;
    }
    inputRef.current?.click();
  };

  const handleFilesSelected = (event) => {
    const { files } = event.target;
    if (files && files.length > 0) {
      onUpload(files);
      event.target.value = '';
    }
  };

  return (
    <div className="glass-panel relative flex flex-wrap items-center justify-between gap-3 overflow-hidden p-4">
      <div className="pointer-events-none chroma-grid" />
      <div className="relative z-10 flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/25 px-4 py-2 text-sm font-semibold text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:border-white/35 hover:bg-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onNavigateUp}
          disabled={!canNavigateUp}
        >
          ⬆️ Up
        </button>
        <span className="inline-flex min-w-0 items-center gap-2 truncate rounded-full border border-white/25 bg-white/35 px-3 py-1 text-sm font-semibold text-blue-700 shadow-inner shadow-white/40">
          <span aria-hidden="true">📁</span>
          {currentPath || 'Home'}
        </span>
      </div>
      <div className="relative z-10 flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        {allowViewToggle && (
          <div
            className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/25 p-1 text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
            role="group"
            aria-label="Change view"
          >
            <button
              type="button"
              className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-[0_12px_25px_-18px_rgba(79,70,229,0.75)]'
                  : 'text-slate-500'
              }`}
              onClick={() => onViewModeChange('grid')}
              aria-label="Icon view"
            >
              🗂️
            </button>
            <button
              type="button"
              className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-[0_12px_25px_-18px_rgba(79,70,229,0.75)]'
                  : 'text-slate-500'
              }`}
              onClick={() => onViewModeChange('list')}
              aria-label="List view"
            >
              📄
            </button>
          </div>
        )}
        {allowQuickLook && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_20px_45px_-24px_rgba(79,70,229,0.85)] transition hover:shadow-[0_25px_55px_-22px_rgba(79,70,229,0.9)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onQuickLook}
            disabled={!canQuickLook}
          >
            👁️ Quick Look
          </button>
        )}
        {onCopy && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/25 px-4 py-2 text-sm font-semibold text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:border-white/35 hover:bg-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onCopy}
            disabled={!canCopy}
          >
            📄 Copy
          </button>
        )}
        {onCut && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/25 px-4 py-2 text-sm font-semibold text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:border-white/35 hover:bg-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onCut}
            disabled={!canCut}
          >
            ✂️ Cut
          </button>
        )}
        {onPaste && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-100/60 px-4 py-2 text-sm font-semibold text-blue-700 shadow-[0_20px_45px_-28px_rgba(59,130,246,0.7)] transition hover:border-blue-300 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onPaste}
            disabled={!canPaste}
          >
            📥 Paste
          </button>
        )}
        {clipboardLabel ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/20 px-3 py-1 text-xs font-semibold text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
            {clipboardLabel}
          </span>
        ) : null}
        {allowCreate && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/25 px-4 py-2 text-sm font-semibold text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:border-white/35 hover:bg-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            onClick={onCreateFolder}
          >
            📁 New Folder
          </button>
        )}
        {allowUpload && (
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/25 px-4 py-2 text-sm font-semibold text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:border-white/35 hover:bg-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleUploadClick}
              disabled={isUploading}
              aria-live="polite"
            >
              <span aria-hidden="true">⬆️</span>
              {isUploading ? `Uploading… ${uploadPercent}%` : 'Upload Files'}
            </button>
            {isUploading && (
              <div className="pointer-events-none absolute inset-x-2 bottom-1 h-[3px] overflow-hidden rounded-full bg-blue-100/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/25 px-4 py-2 text-sm font-semibold text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:border-white/35 hover:bg-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          onClick={onRefresh}
        >
          🔄 Refresh
        </button>
        <input ref={inputRef} type="file" multiple onChange={handleFilesSelected} hidden />
      </div>
    </div>
  );
};

export default Toolbar;
