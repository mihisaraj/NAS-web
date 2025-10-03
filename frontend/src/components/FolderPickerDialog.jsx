import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { listItems } from '../services/api.js';

const sanitizePath = (input) => {
  if (typeof input !== 'string') {
    return '';
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
};

const FolderPickerDialog = ({
  initialPath = '',
  onSelect,
  onCancel,
  multiSelect = false,
  selectedPaths = [],
  existingPaths = [],
  onSelectMultiple,
}) => {
  const startingPath = useMemo(() => sanitizePath(initialPath), [initialPath]);
  const [currentPath, setCurrentPath] = useState(startingPath);
  const [resolvedPath, setResolvedPath] = useState(startingPath);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [portalContainer, setPortalContainer] = useState(null);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }
    const container = document.createElement('div');
    container.setAttribute('data-folder-picker-portal', '');
    document.body.appendChild(container);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setPortalContainer(container);

    return () => {
      document.body.style.overflow = previousOverflow;
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);

  const assignedInfo = useMemo(() => {
    if (!multiSelect) {
      return { set: new Set(), key: '[]' };
    }
    const raw = Array.isArray(existingPaths) ? existingPaths : [];
    const seen = new Set();
    const cleaned = [];
    raw.forEach((path) => {
      const normalized = sanitizePath(path || '');
      if (!seen.has(normalized)) {
        seen.add(normalized);
        cleaned.push(normalized);
      }
    });
    cleaned.sort();
    return { set: new Set(cleaned), key: JSON.stringify(cleaned) };
  }, [JSON.stringify(existingPaths ?? []), multiSelect]);

  const normalizedInitialSelection = useMemo(() => {
    if (!multiSelect) {
      return [];
    }
    const incoming = Array.isArray(selectedPaths) ? selectedPaths : [];
    const seen = new Set();
    const prepared = [];
    incoming.forEach((path) => {
      const normalized = sanitizePath(path || '');
      if (!seen.has(normalized) && !assignedInfo.set.has(normalized)) {
        seen.add(normalized);
        prepared.push(normalized);
      }
    });
    prepared.sort();
    return prepared;
  }, [assignedInfo.key, multiSelect, JSON.stringify(selectedPaths ?? [])]);

  const normalizedInitialSelectionKey = useMemo(
    () => (multiSelect ? JSON.stringify(normalizedInitialSelection) : '[]'),
    [multiSelect, normalizedInitialSelection]
  );

  const [selectedSet, setSelectedSet] = useState(() => new Set(normalizedInitialSelection));

  useEffect(() => {
    if (!multiSelect) {
      return;
    }
    setSelectedSet((previous) => {
      const next = new Set(normalizedInitialSelection);
      if (previous.size === next.size) {
        let identical = true;
        // eslint-disable-next-line no-restricted-syntax
        for (const value of previous) {
          if (!next.has(value)) {
            identical = false;
            break;
          }
        }
        if (identical) {
          return previous;
        }
      }
      return next;
    });
  }, [multiSelect, normalizedInitialSelectionKey, normalizedInitialSelection]);

  const selectedList = useMemo(() => {
    if (!multiSelect) {
      return [];
    }
    return Array.from(selectedSet).sort();
  }, [multiSelect, selectedSet]);

  const toggleSelection = (path) => {
    if (!multiSelect) {
      return;
    }
    const normalized = sanitizePath(path || '');
    if (assignedInfo.set.has(normalized)) {
      return;
    }
    setSelectedSet((previous) => {
      const next = new Set(previous);
      if (next.has(normalized)) {
        next.delete(normalized);
      } else {
        next.add(normalized);
      }
      return next;
    });
  };

  const handleConfirmMultiple = () => {
    if (!multiSelect || !onSelectMultiple) {
      return;
    }
    onSelectMultiple(selectedList);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    listItems(currentPath)
      .then((data) => {
        if (!active) {
          return;
        }
        const normalizedPath = sanitizePath(data.path || '');
        setResolvedPath(normalizedPath);
        setBreadcrumbs(Array.isArray(data.breadcrumbs) ? data.breadcrumbs : []);
        const directoryItems = Array.isArray(data.items)
          ? data.items.filter((item) => item?.type === 'directory')
          : [];
        setFolders(directoryItems);
        if (normalizedPath !== currentPath) {
          setCurrentPath(normalizedPath);
        }
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        setError(err.message || 'Unable to load folders');
        setFolders([]);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currentPath]);

  const handleNavigate = (path) => {
    const normalized = sanitizePath(path || '');
    setCurrentPath(normalized);
  };

  const handleSelect = (path) => {
    const normalized = sanitizePath(path || '');
    onSelect?.(normalized);
  };

  const handleSelectCurrent = () => {
    if (multiSelect) {
      toggleSelection(resolvedPath);
      return;
    }
    handleSelect(resolvedPath);
  };

  const handleSelectRoot = () => {
    if (multiSelect) {
      toggleSelection('');
      return;
    }
    handleSelect('');
  };

  const resolveFolderPath = (folder) => {
    if (folder?.path) {
      return sanitizePath(folder.path);
    }
    return sanitizePath(resolvedPath ? `${resolvedPath}/${folder?.name ?? ''}` : folder?.name ?? '');
  };

  const dialog = (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center overflow-y-auto bg-slate-900/70 p-4 backdrop-blur">
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/20 bg-white/65 p-6 text-slate-900 shadow-[0_35px_70px_-30px_rgba(15,23,42,0.6)]">
        <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/35" aria-hidden="true" />
        <div className="relative flex flex-col gap-5">
          <header className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Select folder{multiSelect ? 's' : ''}</h2>
              <p className="text-sm font-medium text-slate-600">
                {multiSelect
                  ? 'Browse the NAS structure and choose one or more folders to grant access. Already assigned folders are shown as unavailable.'
                  : 'Browse the NAS structure and pick a folder to grant access.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/40 px-4 py-2 text-sm font-semibold text-slate-600 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] transition hover:bg-white/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              Close
            </button>
          </header>

          <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-700">
            <button
              type="button"
              onClick={() => handleNavigate('')}
              className={`rounded-full px-3 py-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                !resolvedPath ? 'bg-blue-500 text-white shadow-[0_10px_30px_-18px_rgba(59,130,246,0.8)]' : 'bg-white/60 text-blue-600 hover:bg-white/80'
              }`}
            >
              Root
            </button>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <button
                  key={crumb.path}
                  type="button"
                  onClick={() => handleNavigate(crumb.path)}
                  className={`rounded-full px-3 py-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                    isLast
                      ? 'bg-blue-500 text-white shadow-[0_10px_30px_-18px_rgba(59,130,246,0.8)]'
                      : 'bg-white/60 text-blue-600 hover:bg-white/80'
                  }`}
                >
                  {crumb.name || 'Root'}
                </button>
              );
            })}
          </nav>

          <div className="min-h-[240px] rounded-3xl border border-white/30 bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            {error ? (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-rose-600">
                {error}
              </div>
            ) : null}
            {!error && loading ? (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-600">
                Loading folders…
              </div>
            ) : null}
            {!error && !loading && folders.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-600">
                No subfolders found in this location.
              </div>
            ) : null}
            {!error && !loading && folders.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {folders.map((folder) => {
                  const folderPath = resolveFolderPath(folder);
                  const alreadyAssigned = assignedInfo.set.has(folderPath);
                  const isSelected = multiSelect && selectedSet.has(folderPath);
                  return (
                    <li key={folder.path || folder.name}>
                      <div
                        className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition shadow-[0_18px_45px_-32px_rgba(15,23,42,0.4)] sm:flex-row sm:items-center sm:justify-between ${
                          isSelected
                            ? 'border-blue-400/70 bg-blue-50/60 text-blue-900'
                            : alreadyAssigned
                            ? 'border-emerald-300/50 bg-emerald-50/45 text-emerald-900/90'
                            : 'border-white/40 bg-white/55 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-base">
                          <span className="text-lg" aria-hidden="true">
                            📁
                          </span>
                          <span>{folder.name}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {alreadyAssigned ? (
                            <span className="rounded-full border border-emerald-300/80 bg-emerald-200/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-900">
                              Assigned
                            </span>
                          ) : null}
                          {multiSelect ? (
                            <button
                              type="button"
                              onClick={() => toggleSelection(folderPath)}
                              className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                                isSelected
                                  ? 'border border-blue-400/80 bg-blue-500 text-white shadow-[0_20px_35px_-24px_rgba(59,130,246,0.7)]'
                                  : 'border border-white/30 bg-white/40 text-blue-600 hover:border-blue-300/60 hover:bg-blue-50/70'
                              }`}
                              disabled={alreadyAssigned}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleNavigate(folderPath)}
                            className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/40 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-300/60 hover:bg-blue-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-semibold text-slate-500">
                Current location:{' '}
                <span className="font-mono text-sm text-slate-700">
                  {resolvedPath || 'Root'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectRoot}
                  className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                    multiSelect
                      ? assignedInfo.set.has('')
                        ? 'cursor-not-allowed border-white/20 bg-white/30 text-slate-400'
                        : 'border-white/30 bg-white/40 text-slate-600 hover:bg-white/55'
                      : 'border-white/30 bg-white/40 text-slate-600 hover:bg-white/55'
                  }`}
                  disabled={multiSelect && assignedInfo.set.has('')}
                >
                  {multiSelect ? 'Toggle full access' : 'Give full storage access'}
                </button>
                <button
                  type="button"
                  onClick={handleSelectCurrent}
                  className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                    multiSelect
                      ? assignedInfo.set.has(resolvedPath)
                        ? 'cursor-not-allowed border border-white/20 bg-white/30 text-slate-400'
                        : 'border border-white/30 bg-white/40 text-blue-600 hover:border-blue-300/60 hover:bg-blue-50/60'
                      : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-[0_25px_55px_-24px_rgba(79,70,229,0.9)] hover:shadow-[0_28px_60px_-22px_rgba(79,70,229,0.95)]'
                  }`}
                  disabled={multiSelect && assignedInfo.set.has(resolvedPath)}
                >
                  {multiSelect ? 'Toggle current folder' : 'Use this folder'}
                </button>
              </div>
            </div>
            {multiSelect ? (
              <div className="rounded-3xl border border-dashed border-blue-300/60 bg-white/50 p-4">
                <h3 className="text-sm font-semibold text-blue-900">Selected folders</h3>
                {selectedList.length === 0 ? (
                  <p className="text-xs font-medium text-blue-700/80">
                    No new folders selected yet.
                  </p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {selectedList.map((path) => (
                      <li key={path}>
                        <button
                          type="button"
                          onClick={() => toggleSelection(path)}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-400/80 bg-blue-500/90 px-3 py-1 text-xs font-semibold text-white shadow-[0_14px_35px_-22px_rgba(59,130,246,0.75)] transition hover:bg-blue-500"
                        >
                          <span>{path || 'Root'}</span>
                          <span aria-hidden="true">×</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmMultiple}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_25px_55px_-24px_rgba(79,70,229,0.9)] transition hover:shadow-[0_28px_60px_-22px_rgba(79,70,229,0.95)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={selectedList.length === 0}
                  >
                    Assign selected folders
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  if (!portalContainer) {
    return null;
  }

  return createPortal(dialog, portalContainer);
};

export default FolderPickerDialog;
