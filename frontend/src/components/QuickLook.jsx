import { useEffect } from 'react';

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
    if (!isOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const title = item?.name || 'Preview';
  const normalizedMime = mimeType || (item?.type === 'file' ? 'application/octet-stream' : '');

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  let content = (
    <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
      No preview available.
    </div>
  );

  if (loading) {
    content = (
      <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
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
      <pre
        className="h-full w-full overflow-auto rounded-2xl bg-slate-900/90 p-4 text-xs text-slate-100"
        aria-label={`Preview of ${title}`}
      >
        {textContent}
      </pre>
    );
  } else if (previewUrl) {
    if (mimeType?.startsWith('image/')) {
      content = <img className="h-full max-h-[70vh] w-full rounded-2xl object-contain" src={previewUrl} alt={title} />;
    } else if (mimeType?.startsWith('audio/')) {
      content = (
        <div className="flex h-full items-center justify-center">
          <audio className="w-full max-w-xl" controls src={previewUrl} aria-label={title} />
        </div>
      );
    } else if (mimeType?.startsWith('video/')) {
      content = <video className="h-full max-h-[70vh] w-full rounded-2xl" controls src={previewUrl} aria-label={title} />;
    } else if (mimeType === 'application/pdf') {
      content = (
        <iframe
          title={`Preview of ${title}`}
          src={previewUrl}
          className="h-full w-full rounded-2xl"
        />
      );
    } else {
      content = (
        <div className="flex h-full flex-col gap-3">
          <iframe title={`Preview of ${title}`} src={previewUrl} className="h-full w-full rounded-2xl" />
          <p className="text-center text-xs font-semibold text-slate-400">
            If the preview does not render, use “Open in new tab” or download the file.
          </p>
        </div>
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label={`Quick look for ${title}`}
      onClick={handleBackdropClick}
    >
      <div className="glass-panel relative flex w-full max-w-5xl flex-col overflow-hidden">
        <div className="pointer-events-none chroma-grid" />
        <div
          className="orb-glow"
          style={{
            top: '-25%',
            left: '-15%',
            width: '320px',
            height: '320px',
            background: 'radial-gradient(circle, rgba(59,130,246,0.4), transparent 65%)',
          }}
        />
        <header className="relative z-10 flex items-start justify-between gap-4 border-b border-white/20 bg-white/30 px-6 py-4">
          <div className="space-y-1">
            <div className="text-lg font-semibold text-slate-900">{title}</div>
            {normalizedMime && !loading && !error && (
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{normalizedMime}</div>
            )}
          </div>
          <button
            type="button"
            className="rounded-full border border-white/30 bg-white/40 px-3 py-1 text-xl font-semibold text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            onClick={onClose}
            aria-label="Close quick look"
          >
            ×
          </button>
        </header>
        <div className="relative z-10 flex min-h-[320px] flex-1 items-stretch justify-center bg-white/25 px-4 py-4">
          <div className="h-full w-full max-w-full overflow-hidden rounded-2xl bg-white/40 p-2">
            {content}
          </div>
        </div>
        <footer className="relative z-10 flex items-center justify-end gap-3 border-t border-white/20 bg-white/30 px-6 py-4">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/35 px-4 py-2 text-sm font-semibold text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition hover:border-white/35 hover:bg-white/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onDownload}
            disabled={!onDownload}
          >
            Download
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_20px_45px_-24px_rgba(79,70,229,0.85)] transition hover:shadow-[0_25px_55px_-22px_rgba(79,70,229,0.9)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onOpenInNewTab}
            disabled={!previewUrl}
          >
            Open in new tab
          </button>
        </footer>
      </div>
    </div>
  );
};

export default QuickLook;
