const formatSize = (size) => {
  if (size === null || size === undefined) {
    return '—';
  }
  if (size === 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** index;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
};

const getFileGlyph = (item) => {
  if (item.type === 'directory') {
    return '📁';
  }
  const extension = item.name.split('.').pop()?.toLowerCase();
  if (!extension) {
    return '📄';
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
    return '🖼️';
  }
  if (['mp4', 'mov', 'mkv', 'webm', 'avi'].includes(extension)) {
    return '🎬';
  }
  if (['mp3', 'wav', 'aac', 'flac'].includes(extension)) {
    return '🎵';
  }
  if (['pdf'].includes(extension)) {
    return '📕';
  }
  if (['ppt', 'pptx'].includes(extension)) {
    return '📊';
  }
  if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return '📈';
  }
  if (['doc', 'docx'].includes(extension)) {
    return '📄';
  }
  if (['zip', 'rar', '7z'].includes(extension)) {
    return '🗜️';
  }
  return '📄';
};

const FileList = ({
  items,
  viewMode,
  selectedItem,
  onSelect,
  onOpen,
  onQuickLook,
  onRename,
  onDelete,
  onToggleLock,
  onDownload,
  allowRename = true,
  allowDelete = true,
  allowLockToggle = true,
  allowQuickLook = true,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-white/30 bg-white/30 text-sm font-semibold text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
        This folder is empty.
      </div>
    );
  }

  const selectedPath = selectedItem?.path;

  const primaryButtonClass =
    'inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/30 px-3 py-1 text-xs font-semibold text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:border-blue-300 hover:bg-white/45';
  const secondaryButtonClass =
    'inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/25 px-3 py-1 text-xs font-semibold text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition hover:border-white/35 hover:bg-white/35';
  const dangerButtonClass =
    'inline-flex items-center gap-1 rounded-full border border-rose-200/70 bg-rose-100/70 px-3 py-1 text-xs font-semibold text-rose-600 shadow-[0_12px_30px_-20px_rgba(244,63,94,0.45)] transition hover:border-rose-300/80 hover:bg-rose-100';

  const renderGridView = () => (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" role="list">
      {items.map((item) => {
        const isDirectory = item.type === 'directory';
        const isSelected = selectedPath === item.path;
        const glyph = getFileGlyph(item);
        const modified = new Date(item.modified).toLocaleString();

        return (
          <div
            key={item.path || item.name}
            role="listitem"
            tabIndex={0}
            className={`group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-2xl border px-4 py-4 text-left shadow-[0_24px_48px_-32px_rgba(15,23,42,0.45)] transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
              isSelected
                ? 'border-blue-400/70 bg-gradient-to-br from-blue-500/25 via-blue-500/10 to-purple-400/10 text-blue-900 ring-1 ring-blue-300/60'
                : 'border-white/30 bg-white/45 text-slate-800 hover:-translate-y-1 hover:border-blue-300/60 hover:bg-white/55'
            }`}
            onClick={(event) => {
              event.preventDefault();
              onSelect(item);
            }}
            onDoubleClick={() => {
              onSelect(item);
              if (isDirectory) {
                onOpen(item);
              } else if (allowQuickLook) {
                onQuickLook(item);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                if (isDirectory) {
                  onOpen(item);
                } else if (allowQuickLook) {
                  onQuickLook(item);
                }
              }
              if (event.key === ' ' && !isDirectory && allowQuickLook) {
                event.preventDefault();
                onQuickLook(item);
              }
            }}
          >
            <div className={`text-3xl ${isSelected ? 'text-blue-700' : 'text-slate-700'}`} aria-hidden="true">
              {glyph}
            </div>
            <div className={`text-base font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-900'}`} title={item.name}>
              {item.name}
            </div>
            <div className="text-xs font-medium text-slate-500" title={modified}>
              {isDirectory ? 'Folder' : formatSize(item.size)} · {modified}
            </div>
            <div className="flex flex-wrap gap-2">
              {isDirectory ? (
                <button
                  type="button"
                  className={primaryButtonClass}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen(item);
                  }}
                >
                  Open
                </button>
              ) : (
                <>
                  {allowQuickLook && (
                    <button
                      type="button"
                      className={primaryButtonClass}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(item);
                        onQuickLook(item);
                      }}
                    >
                      Quick Look
                    </button>
                  )}
                  <button
                    type="button"
                    className={primaryButtonClass}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(item);
                      onDownload(item);
                    }}
                  >
                    Download
                  </button>
                </>
              )}
              {allowRename && (
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(item);
                    onRename(item);
                  }}
                >
                  Rename
                </button>
              )}
              {allowDelete && (
                <button
                  type="button"
                  className={dangerButtonClass}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(item);
                    onDelete(item);
                  }}
                >
                  Delete
                </button>
              )}
              {allowLockToggle && (
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(item);
                    onToggleLock(item);
                  }}
                >
                  {item.isLocked ? 'Unlock' : 'Lock'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="overflow-hidden rounded-2xl border border-white/30 bg-white/45 shadow-[0_24px_48px_-32px_rgba(15,23,42,0.45)]">
      <table className="min-w-full divide-y divide-white/30 text-sm">
        <thead className="bg-white/40 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-right">Size</th>
            <th className="px-4 py-3 text-left">Modified</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/20">
          {items.map((item) => {
            const isDirectory = item.type === 'directory';
            const icon = getFileGlyph(item);
            const lockIcon = item.isLocked ? '🔒' : '🔓';
            const modified = new Date(item.modified).toLocaleString();
            const isSelected = selectedPath === item.path;

            return (
              <tr
                key={item.path || item.name}
                tabIndex={0}
                className={
                  isSelected
                    ? 'bg-gradient-to-r from-blue-500/15 via-blue-500/5 to-purple-400/10 text-blue-800 transition'
                    : 'transition hover:bg-white/40'
                }
                onClick={() => {
                  onSelect(item);
                }}
                onDoubleClick={() => {
                  onSelect(item);
                  if (isDirectory) {
                    onOpen(item);
                  } else if (allowQuickLook) {
                    onQuickLook(item);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    if (isDirectory) {
                      onOpen(item);
                    } else if (allowQuickLook) {
                      onQuickLook(item);
                    }
                  }
                  if (event.key === ' ' && !isDirectory && allowQuickLook) {
                    event.preventDefault();
                    onQuickLook(item);
                  }
                }}
              >
                <td className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-700">
                  <span className="mr-2 text-lg" aria-hidden="true">
                    {icon}
                  </span>
                  {item.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-left text-slate-500">
                  {isDirectory ? 'Folder' : 'File'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-slate-500">
                  {formatSize(item.size)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-left text-slate-500">
                  {modified}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-left text-slate-500">
                  {item.isLocked ? 'Locked' : 'Unlocked'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {isDirectory ? (
                    <button
                      type="button"
                      className={primaryButtonClass}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(item);
                        onOpen(item);
                      }}
                  >
                    Open
                  </button>
                  ) : (
                    <>
                      {allowQuickLook && (
                        <button
                          type="button"
                          className={primaryButtonClass}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelect(item);
                          onQuickLook(item);
                        }}
                      >
                        Quick Look
                      </button>
                      )}
                      <button
                        type="button"
                        className={primaryButtonClass}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelect(item);
                        onDownload(item);
                      }}
                    >
                      Download
                    </button>
                  </>
                )}
                {allowRename && (
                  <button
                    type="button"
                    className={secondaryButtonClass}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(item);
                      onRename(item);
                    }}
                  >
                    Rename
                  </button>
                )}
                {allowDelete && (
                  <button
                    type="button"
                    className={dangerButtonClass}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(item);
                      onDelete(item);
                    }}
                  >
                    Delete
                  </button>
                )}
                {allowLockToggle && (
                  <button
                    type="button"
                    className={secondaryButtonClass}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(item);
                      onToggleLock(item);
                    }}
                  >
                    {lockIcon} {item.isLocked ? 'Unlock' : 'Lock'}
                  </button>
                )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return viewMode === 'grid' ? renderGridView() : renderListView();
};

export default FileList;
