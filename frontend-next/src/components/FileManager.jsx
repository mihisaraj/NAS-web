import { useEffect, useMemo, useRef, useState } from 'react';
import Breadcrumbs from './Breadcrumbs.jsx';
import FileList from './FileList.jsx';
import QuickLook from './QuickLook.jsx';
import Toolbar from './Toolbar.jsx';
import {
  listItems,
  createFolder,
  uploadFiles,
  deleteItem,
  renameItem,
  lockItem,
  unlockItem,
  fetchFileContent,
  subscribeToEvents,
} from '../services/api.js';

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

const joinPath = (base, name) => {
  const sanitizedBase = sanitizePath(base);
  if (!sanitizedBase) {
    return name;
  }
  return `${sanitizedBase}/${name}`;
};

const formatBytes = (bytes) => {
  if (!bytes || Number.isNaN(bytes)) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value < 10 && unitIndex > 0 ? value.toFixed(1) : Math.round(value)} ${units[unitIndex]}`;
};

const initialUploadState = {
  active: false,
  percent: 0,
  loaded: 0,
  total: 0,
  files: 0,
};

const initialQuickLookState = {
  open: false,
  loading: false,
  error: '',
  url: '',
  mimeType: '',
  textContent: '',
  item: null,
};

const FileManager = ({
  title = 'HTS NAS',
  subtitle = 'Browse, organize, and secure your shared storage.',
  initialPath = '',
  rootPath = '',
  allowCreate = true,
  allowUpload = true,
  allowRename = true,
  allowDelete = true,
  allowLockToggle = true,
  allowQuickLook = true,
  allowViewToggle = true,
  passwordLookup,
}) => {
  const normalizedRoot = useMemo(() => sanitizePath(rootPath), [rootPath]);
  const normalizedInitial = useMemo(() => sanitizePath(initialPath), [initialPath]);
  const startingPath = normalizedInitial || normalizedRoot || '';

  const [currentPath, setCurrentPath] = useState(startingPath);
  const [items, setItems] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('hts-view-mode') || 'grid';
    }
    return 'grid';
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploadState, setUploadState] = useState(initialUploadState);
  const [quickLook, setQuickLook] = useState(initialQuickLookState);
  const previewUrlRef = useRef('');
  const uploadResetTimeoutRef = useRef(null);
  const currentPathRef = useRef(currentPath);
  const refreshRef = useRef(() => {});
  const updatePathRef = useRef(() => {});
  const lastRealtimeUpdateRef = useRef(0);
  const fallbackRefreshIntervalRef = useRef(null);

  useEffect(() => {
    setCurrentPath(startingPath);
  }, [startingPath]);

  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    listItems(currentPath)
      .then((data) => {
        if (!active) {
          return;
        }
        const nextItems = data.items || [];
        setItems(nextItems);
        setBreadcrumbs(data.breadcrumbs || []);
        const normalizedPath = data.path || '';
        if (normalizedPath !== currentPath) {
          setCurrentPath(normalizedPath);
        }
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        setError(err.message || 'Failed to load items');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currentPath, refreshToken]);

  useEffect(() => {
    if (!message) {
      return undefined;
    }
    const timeout = setTimeout(() => setMessage(''), 4000);
    return () => clearTimeout(timeout);
  }, [message]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('hts-view-mode', viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    setSelectedItem(null);
  }, [currentPath]);

  useEffect(() => {
    setSelectedItem((current) => {
      if (!current) {
        return current;
      }
      return items.find((item) => item.path === current.path) || null;
    });
  }, [items]);

  useEffect(
    () => () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      if (uploadResetTimeoutRef.current) {
        clearTimeout(uploadResetTimeoutRef.current);
        uploadResetTimeoutRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    if (!quickLook.open || !quickLook.item) {
      return;
    }
    const exists = items.some((item) => item.path === quickLook.item.path);
    if (!exists) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = '';
      }
      setQuickLook(initialQuickLookState);
    }
  }, [items, quickLook.open, quickLook.item]);

  useEffect(() => {
    const MIN_REALTIME_REFRESH_INTERVAL = 600;

    const requestRefresh = () => {
      const now = Date.now();
      if (now - lastRealtimeUpdateRef.current < MIN_REALTIME_REFRESH_INTERVAL) {
        return;
      }
      lastRealtimeUpdateRef.current = now;
      refreshRef.current();
    };

    const stopFallbackRefresh = () => {
      if (fallbackRefreshIntervalRef.current) {
        clearInterval(fallbackRefreshIntervalRef.current);
        fallbackRefreshIntervalRef.current = null;
      }
    };

    const scheduleFallbackRefresh = (intervalMs = 10000) => {
      if (fallbackRefreshIntervalRef.current) {
        return;
      }
      const delay = Math.max(3000, intervalMs);
      fallbackRefreshIntervalRef.current = setInterval(() => {
        requestRefresh();
      }, delay);
    };

    const handleItemsEvent = (event) => {
      const data = event?.data || {};
      const normalizedCurrent = sanitizePath(currentPathRef.current || '');
      const normalizedPaths = Array.isArray(data.paths)
        ? data.paths.map((value) => sanitizePath(value || ''))
        : [];
      const normalizedItems = Array.isArray(data.items)
        ? data.items.map((item) => ({
            action: data.action,
            name: item?.name || '',
            type: item?.type || 'file',
            path: sanitizePath(item?.path || ''),
            previousPath: sanitizePath(item?.previousPath || ''),
            parent: sanitizePath(item?.parent || ''),
            removed: Boolean(item?.removed),
          }))
        : [];

      let desiredPath = null;

      normalizedItems.forEach((item) => {
        if (
          item.removed &&
          normalizedCurrent &&
          (normalizedCurrent === item.path || normalizedCurrent.startsWith(`${item.path}/`))
        ) {
          desiredPath = item.parent;
        }

        if (
          data.action === 'item-renamed' &&
          item.previousPath &&
          item.path &&
          normalizedCurrent &&
          (normalizedCurrent === item.previousPath || normalizedCurrent.startsWith(`${item.previousPath}/`))
        ) {
          if (normalizedCurrent === item.previousPath) {
            desiredPath = item.path;
          } else {
            const suffix = normalizedCurrent.slice(item.previousPath.length);
            desiredPath = `${item.path}${suffix}`;
          }
        }
      });

      if (typeof desiredPath === 'string') {
        const sanitizedDesired = sanitizePath(desiredPath);
        if (sanitizedDesired !== normalizedCurrent) {
          updatePathRef.current(sanitizedDesired);
          return;
        }
        if (sanitizedDesired === normalizedCurrent) {
          requestRefresh();
          return;
        }
      }

      const shouldRefresh =
        normalizedPaths.includes(normalizedCurrent) ||
        normalizedItems.some((item) => {
          const candidates = [item.path, item.previousPath].filter(Boolean);
          return candidates.some((candidate) => {
            if (candidate === normalizedCurrent) {
              return true;
            }
            if (!candidate || !normalizedCurrent) {
              return false;
            }
            return normalizedCurrent.startsWith(`${candidate}/`);
          });
        });

      if (shouldRefresh) {
        requestRefresh();
      }
    };

    const unsubscribe = subscribeToEvents((event) => {
      if (!event) {
        return;
      }

      if (event.type === 'connection') {
        const state = event.data?.state;
        if (state === 'open') {
          lastRealtimeUpdateRef.current = Date.now();
          stopFallbackRefresh();
        } else if (state === 'error') {
          scheduleFallbackRefresh(6000);
        } else if (state === 'closed') {
          scheduleFallbackRefresh(10000);
        }
        return;
      }

      if (event.type === 'items' || event.type === 'message') {
        handleItemsEvent(event);
        return;
      }

      if (event.data && (Array.isArray(event.data.paths) || Array.isArray(event.data.items))) {
        handleItemsEvent(event);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      stopFallbackRefresh();
    };
  }, []);

  const isWithinRoot = useMemo(() => {
    if (!normalizedRoot) {
      return () => true;
    }
    return (candidate) => {
      const sanitizedCandidate = sanitizePath(candidate);
      if (!sanitizedCandidate) {
        return normalizedRoot === '';
      }
      if (sanitizedCandidate === normalizedRoot) {
        return true;
      }
      return sanitizedCandidate.startsWith(`${normalizedRoot}/`);
    };
  }, [normalizedRoot]);

  const refresh = () => {
    setRefreshToken((token) => token + 1);
  };
  refreshRef.current = refresh;

  const updatePath = (path) => {
    const sanitized = sanitizePath(path);
    if (!isWithinRoot(sanitized)) {
      setError('You can only browse within your assigned folder.');
      return;
    }
    setError('');
    setCurrentPath(sanitized);
  };
  updatePathRef.current = updatePath;

  const handleNavigate = (path) => {
    updatePath(path || '');
  };

  const parentPath = useMemo(() => {
    if (!currentPath) {
      return '';
    }
    const segments = currentPath.split('/');
    segments.pop();
    return segments.join('/');
  }, [currentPath]);

  const canNavigateUp = useMemo(() => {
    if (!currentPath) {
      return false;
    }
    if (!normalizedRoot) {
      return Boolean(currentPath);
    }
    return currentPath !== normalizedRoot && isWithinRoot(currentPath);
  }, [currentPath, normalizedRoot, isWithinRoot]);

  const handleNavigateUp = () => {
    if (!currentPath) {
      return;
    }
    if (!normalizedRoot) {
      updatePath(parentPath);
      return;
    }
    if (!parentPath) {
      updatePath(normalizedRoot);
      return;
    }
    if (!isWithinRoot(parentPath)) {
      updatePath(normalizedRoot);
      return;
    }
    updatePath(parentPath);
  };

  const performAction = async (action, successMessage) => {
    try {
      setError('');
      setMessage('');
      await action();
      if (successMessage) {
        setMessage(successMessage);
      }
      refresh();
      return true;
    } catch (err) {
      setError(err.message || 'Something went wrong');
      return false;
    }
  };

  const getStoredPassword = (path) => {
    if (!passwordLookup) {
      return undefined;
    }
    const sanitized = sanitizePath(path);
    if (!sanitized) {
      return undefined;
    }
    return passwordLookup(sanitized);
  };

  const handleCreateFolder = async () => {
    if (!allowCreate) {
      return;
    }
    const name = window.prompt('Folder name');
    if (!name) {
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Folder name cannot be empty');
      return;
    }
    await performAction(
      () => createFolder(currentPath, trimmed),
      `Folder “${trimmed}” created`
    );
  };

  const handleUpload = async (files) => {
    if (!allowUpload) {
      return;
    }
    if (!files || files.length === 0) {
      return;
    }
    if (uploadResetTimeoutRef.current) {
      clearTimeout(uploadResetTimeoutRef.current);
      uploadResetTimeoutRef.current = null;
    }

    const fileArray = Array.from(files);
    const totalBytes = fileArray.reduce((sum, file) => sum + (file?.size || 0), 0);
    setUploadState({
      active: true,
      percent: 0,
      loaded: 0,
      total: totalBytes,
      files: fileArray.length,
    });

    const success = await performAction(
      () =>
        uploadFiles(currentPath, fileArray, {
          onProgress: ({ loaded, total, percent }) => {
            setUploadState((current) => {
              if (!current.active) {
                return current;
              }
              const nextTotal = total || current.total || totalBytes;
              const cappedPercent = Math.min(100, Math.max(0, Number.isFinite(percent) ? percent : current.percent));
              return {
                ...current,
                loaded: typeof loaded === 'number' ? loaded : current.loaded,
                total: nextTotal,
                percent: cappedPercent,
              };
            });
          },
        }),
      fileArray.length === 1 ? `Uploaded “${fileArray[0].name}”` : `Uploaded ${fileArray.length} files`
    );

    if (success) {
      setUploadState((current) => ({
        ...current,
        percent: 100,
        loaded: current.total || totalBytes,
      }));
      uploadResetTimeoutRef.current = setTimeout(() => {
        setUploadState(initialUploadState);
        uploadResetTimeoutRef.current = null;
      }, 750);
      return;
    }

    setUploadState(initialUploadState);
  };

  const handleOpen = (item) => {
    if (item.type === 'directory') {
      handleNavigate(item.path || joinPath(currentPath, item.name));
    }
  };

  const handleDelete = async (item) => {
    if (!allowDelete) {
      return;
    }
    const confirmed = window.confirm(
      `Delete ${item.type === 'directory' ? 'folder' : 'file'} “${item.name}”?`
    );
    if (!confirmed) {
      return;
    }
    let password;
    if (item.isLocked) {
      password = getStoredPassword(item.path || joinPath(currentPath, item.name));
      if (!password) {
        password = window.prompt('Enter the password to delete this locked item');
      }
      if (!password) {
        setMessage('Deletion cancelled');
        return;
      }
    }

    await performAction(
      () => deleteItem(item.path || joinPath(currentPath, item.name), password || undefined),
      `Deleted “${item.name}”`
    );
  };

  const handleRename = async (item) => {
    if (!allowRename) {
      return;
    }
    const newName = window.prompt('Enter the new name', item.name);
    if (!newName) {
      return;
    }
    const trimmed = newName.trim();
    if (!trimmed) {
      setError('New name cannot be empty');
      return;
    }
    if (trimmed === item.name) {
      return;
    }

    let password;
    if (item.isLocked) {
      password = getStoredPassword(item.path || joinPath(currentPath, item.name));
      if (!password) {
        password = window.prompt('Enter the password to rename this locked item');
      }
      if (!password) {
        setMessage('Rename cancelled');
        return;
      }
    }

    await performAction(
      () => renameItem(item.path || joinPath(currentPath, item.name), trimmed, password || undefined),
      `Renamed to “${trimmed}”`
    );
  };

  const handleToggleLock = async (item) => {
    if (!allowLockToggle) {
      return;
    }
    const targetPath = item.path || joinPath(currentPath, item.name);
    if (item.isLocked) {
      const stored = getStoredPassword(targetPath);
      const password = stored || window.prompt('Enter the password to unlock this item');
      if (!password) {
        setMessage('Unlock cancelled');
        return;
      }
      await performAction(
        () => unlockItem(targetPath, password),
        `Unlocked “${item.name}”`
      );
      return;
    }

    const password = window.prompt('Set a password to lock this item');
    if (!password) {
      setMessage('Lock cancelled');
      return;
    }
    await performAction(
      () => lockItem(targetPath, password),
      `Locked “${item.name}”`
    );
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
  };

  const closeQuickLook = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }
    setQuickLook(initialQuickLookState);
  };

  const handleQuickLook = async (targetItem) => {
    if (!allowQuickLook) {
      return;
    }
    const item = targetItem || selectedItem;
    if (!item || item.type !== 'file') {
      return;
    }

    let password;
    if (item.isLocked) {
      password = getStoredPassword(item.path || joinPath(currentPath, item.name));
      if (!password) {
        const input = window.prompt('Enter the password to preview this locked file');
        if (!input) {
          setMessage('Preview cancelled');
          return;
        }
        password = input;
      }
    }

    setError('');
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }

    setQuickLook({
      open: true,
      loading: true,
      error: '',
      url: '',
      mimeType: '',
      textContent: '',
      item,
    });

    try {
      const { blob, contentType } = await fetchFileContent(
        item.path || joinPath(currentPath, item.name),
        {
          password,
        }
      );
      let textContent = '';
      if (contentType.startsWith('text/') || contentType === 'application/json') {
        textContent = await blob.text();
      }
      const objectUrl = URL.createObjectURL(blob);
      previewUrlRef.current = objectUrl;
      setQuickLook({
        open: true,
        loading: false,
        error: '',
        url: objectUrl,
        mimeType: contentType,
        textContent,
        item,
      });
    } catch (err) {
      setQuickLook({
        open: true,
        loading: false,
        error: err.message || 'Unable to preview file',
        url: '',
        mimeType: '',
        textContent: '',
        item,
      });
    }
  };

  const handleDownload = async (item) => {
    if (!item || item.type !== 'file') {
      return;
    }

    let password;
    if (item.isLocked) {
      password = getStoredPassword(item.path || joinPath(currentPath, item.name));
      if (!password) {
        const input = window.prompt('Enter the password to download this locked file');
        if (!input) {
          setMessage('Download cancelled');
          return;
        }
        password = input;
      }
    }

    try {
      setError('');
      const { blob, filename } = await fetchFileContent(
        item.path || joinPath(currentPath, item.name),
        {
          password,
          download: true,
        }
      );
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = filename || item.name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(downloadUrl);
      setMessage(`Download started for “${filename || item.name}”`);
    } catch (err) {
      setError(err.message || 'Unable to download file');
    }
  };

  const handleOpenPreviewInNewTab = () => {
    if (!quickLook.url) {
      return;
    }
    const opened = window.open(quickLook.url, '_blank', 'noopener');
    if (!opened) {
      setError('Unable to open the preview in a new tab. Please allow pop-ups for this site.');
    }
  };

  const canQuickLook = allowQuickLook && selectedItem?.type === 'file';
  const quickLookDownloadHandler = quickLook.item ? () => handleDownload(quickLook.item) : undefined;

  return (
    <div className="glass-panel relative flex h-full flex-col gap-6 overflow-hidden p-5">
      <div className="pointer-events-none chroma-grid" />
      <div
        className="orb-glow"
        style={{
          bottom: '-32%',
          right: '-24%',
          width: '360px',
          height: '360px',
          background: 'radial-gradient(circle, rgba(79,70,229,0.38), transparent 65%)',
        }}
      />
      <div className="relative z-10 flex flex-col gap-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">
            File Explorer
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
          {subtitle ? <p className="text-sm font-medium text-slate-600 sm:text-base">{subtitle}</p> : null}
        </header>

        <Toolbar
          currentPath={currentPath}
          onCreateFolder={handleCreateFolder}
          onUpload={handleUpload}
          onRefresh={refresh}
          onNavigateUp={handleNavigateUp}
          canNavigateUp={canNavigateUp}
          onQuickLook={() => handleQuickLook()}
          canQuickLook={canQuickLook}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          allowCreate={allowCreate}
          allowUpload={allowUpload}
          allowQuickLook={allowQuickLook}
          allowViewToggle={allowViewToggle}
          uploadState={uploadState}
        />

        <Breadcrumbs breadcrumbs={breadcrumbs} onNavigate={handleNavigate} />

        {error && (
          <div
            className="rounded-2xl border border-rose-200/70 bg-rose-100/80 px-4 py-3 text-sm font-semibold text-rose-600 shadow-[0_12px_30px_-18px_rgba(244,63,94,0.45)]"
            role="alert"
          >
            {error}
          </div>
        )}
        {message && (
          <div
            className="rounded-2xl border border-emerald-200/70 bg-emerald-100/75 px-4 py-3 text-sm font-semibold text-emerald-600 shadow-[0_12px_30px_-18px_rgba(16,185,129,0.4)]"
            role="status"
          >
            {message}
          </div>
        )}
        {uploadState.active && (
          <div className="rounded-2xl border border-blue-200/70 bg-blue-50/80 px-4 py-3 text-sm shadow-[0_12px_30px_-20px_rgba(59,130,246,0.45)]" role="status">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
              Uploading Files
              <span className="text-[11px] font-medium normal-case tracking-normal text-blue-500/80">
                {uploadState.files === 1 ? '1 item' : `${uploadState.files} items`}
              </span>
            </div>
            <div className="mt-1 text-sm font-semibold text-blue-600">
              {`${Math.min(100, Math.round(uploadState.percent || 0))}% complete`}
            </div>
            {(uploadState.total || uploadState.loaded) && (
              <div className="mt-0.5 text-xs font-medium text-blue-600/80">
                {`${formatBytes(uploadState.loaded)}${uploadState.total ? ` of ${formatBytes(uploadState.total)}` : ''}`}
              </div>
            )}
            <div className="mt-3 h-2 w-full rounded-full bg-white/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, uploadState.percent || 0))}%` }}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-white/25 bg-white/30 text-sm font-semibold text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
            Loading…
          </div>
        ) : (
          <FileList
            items={items}
            viewMode={viewMode}
            selectedItem={selectedItem}
            onSelect={handleSelectItem}
            onOpen={handleOpen}
            onQuickLook={handleQuickLook}
            onRename={handleRename}
            onDelete={handleDelete}
            onToggleLock={handleToggleLock}
            onDownload={handleDownload}
            allowRename={allowRename}
            allowDelete={allowDelete}
            allowLockToggle={allowLockToggle}
            allowQuickLook={allowQuickLook}
          />
        )}
      </div>

      <QuickLook
        isOpen={quickLook.open}
        item={quickLook.item}
        previewUrl={quickLook.url}
        mimeType={quickLook.mimeType}
        textContent={quickLook.textContent}
        loading={quickLook.loading}
        error={quickLook.error}
        onClose={closeQuickLook}
        onDownload={quickLookDownloadHandler}
        onOpenInNewTab={handleOpenPreviewInNewTab}
      />
    </div>
  );
};

export default FileManager;
