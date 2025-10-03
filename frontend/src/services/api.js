function resolveBaseUrl() {
  if (typeof window !== 'undefined' && typeof window.__HTS_API_URL__ === 'string') {
    return window.__HTS_API_URL__;
  }

  if (typeof process !== 'undefined' && process?.env) {
    const candidate = process.env.NEXT_PUBLIC_API_URL || process.env.HTS_NAS_API_URL;
    if (candidate) {
      return candidate;
    }
  }

  try {
    if (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  } catch (error) {
    // ignore – import.meta is not available in all runtimes
  }

  return '';
}

const rawBase = resolveBaseUrl();
const trimmedBase = rawBase.replace(/\/$/, '');
export const API_ROOT = trimmedBase
  ? trimmedBase.endsWith('/api')
    ? trimmedBase
    : `${trimmedBase}/api`
  : '/api';

let authToken = '';

export const setAuthToken = (token) => {
  authToken = token || '';
  restartEventStream();
};

export const getAuthToken = () => authToken;

export const clearAuthToken = () => {
  authToken = '';
  stopEventStream();
};

const eventListeners = new Set();
let eventStreamAbortController = null;
let eventStreamConnecting = false;
let eventStreamReconnectTimer = null;
let eventStreamBackoffAttempts = 0;
let eventSourceInstance = null;

function notifyEventListeners(event) {
  eventListeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      // Ignore listener errors to avoid breaking the stream
    }
  });
}

function stopEventStream() {
  if (eventStreamReconnectTimer) {
    clearTimeout(eventStreamReconnectTimer);
    eventStreamReconnectTimer = null;
  }
  if (eventStreamAbortController) {
    eventStreamAbortController.abort();
    eventStreamAbortController = null;
  }
  if (eventSourceInstance) {
    eventSourceInstance.close();
    eventSourceInstance = null;
  }
  eventStreamConnecting = false;
}

function scheduleEventStreamReconnect() {
  if (!authToken || eventListeners.size === 0) {
    return;
  }
  if (eventStreamReconnectTimer) {
    return;
  }
  const baseDelay = 2000;
  const delay = Math.min(30000, baseDelay * 2 ** eventStreamBackoffAttempts);
  eventStreamReconnectTimer = setTimeout(() => {
    eventStreamReconnectTimer = null;
    startEventStream();
  }, delay);
  eventStreamBackoffAttempts += 1;
}

async function startEventStream() {
  if (eventStreamConnecting || eventSourceInstance || eventStreamAbortController || !authToken || eventListeners.size === 0) {
    return;
  }
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return;
  }
  eventStreamConnecting = true;
  eventStreamBackoffAttempts = Math.max(eventStreamBackoffAttempts, 0);
  notifyEventListeners({ type: 'connection', data: { state: 'connecting' } });

  try {
    let eventUrl = `${API_ROOT.replace(/\/$/, '')}/events`;
    if (!eventUrl.startsWith('http')) {
      const baseOrigin = window.location.origin;
      if (!eventUrl.startsWith('/')) {
        eventUrl = `/${eventUrl}`;
      }
      eventUrl = `${baseOrigin}${eventUrl}`;
    }
    const url = new URL(eventUrl);
    url.searchParams.set('token', authToken);

    const source = new EventSource(url.toString());
    eventSourceInstance = source;

    const handleIncomingEvent = (evt) => {
      let payload = null;
      if (evt.data) {
        try {
          payload = JSON.parse(evt.data);
        } catch (parseError) {
          payload = evt.data;
        }
      }
      notifyEventListeners({ type: evt.type || 'message', data: payload });
    };

    source.onopen = () => {
      eventStreamConnecting = false;
      eventStreamBackoffAttempts = 0;
      notifyEventListeners({ type: 'connection', data: { state: 'open' } });
    };

    source.onmessage = handleIncomingEvent;
    source.addEventListener('items', handleIncomingEvent);

    source.onerror = (error) => {
      notifyEventListeners({
        type: 'connection',
        data: { state: 'error', message: error?.message || 'Event stream error' },
      });
      source.close();
      eventSourceInstance = null;
      eventStreamConnecting = false;
      if (!authToken || eventListeners.size === 0) {
        return;
      }
      scheduleEventStreamReconnect();
    };
  } catch (error) {
    eventStreamConnecting = false;
    notifyEventListeners({
      type: 'connection',
      data: { state: 'error', message: error.message || 'Event stream error' },
    });
    if (authToken && eventListeners.size > 0) {
      scheduleEventStreamReconnect();
    }
  }
}

function restartEventStream() {
  stopEventStream();
  if (authToken && eventListeners.size > 0) {
    startEventStream();
  }
}

export function subscribeToEvents(listener) {
  if (typeof listener !== 'function') {
    throw new Error('Listener must be a function');
  }
  eventListeners.add(listener);
  if (authToken) {
    startEventStream();
  }
  return () => {
    eventListeners.delete(listener);
    if (eventListeners.size === 0) {
      stopEventStream();
    }
  };
}

async function request(path, options = {}) {
  const url = `${API_ROOT}${path}`;
  const opts = { ...options };
  const isFormData = opts.body instanceof FormData;
  const headers = { ...(options.headers || {}) };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
    if (opts.body && typeof opts.body !== 'string') {
      opts.body = JSON.stringify(opts.body);
    }
  }

  opts.headers = headers;

  const response = await fetch(url, opts);
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.message || 'Something went wrong';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function getStorageStatus() {
  return request('/storage/status');
}

export function listItems(path = '') {
  const params = new URLSearchParams();
  if (path) {
    params.set('path', path);
  }
  const query = params.toString();
  return request(`/items${query ? `?${query}` : ''}`);
}

export function createFolder(path, name) {
  return request('/folders', {
    method: 'POST',
    body: { path, name },
  });
}

export function uploadFiles(path, files, { onProgress, signal } = {}) {
  const formData = new FormData();
  const fileArray = Array.from(files);
  const totalBytes = fileArray.reduce((sum, file) => sum + (file?.size || 0), 0);
  formData.append('path', path || '');
  fileArray.forEach((file) => {
    formData.append('files', file);
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${API_ROOT}/upload`;

    const cleanup = () => {
      if (signal && cleanup.abortHandler) {
        signal.removeEventListener('abort', cleanup.abortHandler);
      }
    };

    xhr.open('POST', url);

    if (authToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
    }

    if (signal) {
      if (signal.aborted) {
        cleanup();
        reject(new DOMException('Upload aborted', 'AbortError'));
        return;
      }
      cleanup.abortHandler = () => {
        xhr.abort();
      };
      signal.addEventListener('abort', cleanup.abortHandler, { once: true });
    }

    xhr.upload.onprogress = (event) => {
      if (!onProgress) {
        return;
      }
      const total = event.lengthComputable && event.total ? event.total : totalBytes;
      const percent = total ? Math.min(100, Math.round((event.loaded / total) * 100)) : 0;
      onProgress({ loaded: event.loaded, total, percent });
    };

    xhr.onload = () => {
      cleanup();
      const { status } = xhr;
      const responseText = xhr.responseText || '';
      let payload = null;
      if (responseText) {
        try {
          payload = JSON.parse(responseText);
        } catch (error) {
          // Ignore JSON parse errors – backend might return plain text.
        }
      }

      if (status >= 200 && status < 300) {
        if (onProgress) {
          onProgress({ loaded: totalBytes, total: totalBytes, percent: 100 });
        }
        resolve(payload);
        return;
      }

      const message = payload?.message || 'Upload failed';
      const error = new Error(message);
      error.status = status;
      error.payload = payload;
      reject(error);
    };

    xhr.onerror = () => {
      cleanup();
      reject(new Error('Network error while uploading files'));
    };

    xhr.onabort = () => {
      cleanup();
      reject(new DOMException('Upload aborted', 'AbortError'));
    };

    try {
      xhr.send(formData);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

export function deleteItem(path, password) {
  return request('/items', {
    method: 'DELETE',
    body: { path, password },
  });
}

export function renameItem(path, newName, password) {
  return request('/items/rename', {
    method: 'PUT',
    body: { path, newName, password },
  });
}

export function copyItem(source, destination, { newName, password } = {}) {
  const payload = { source, destination };
  if (newName) {
    payload.newName = newName;
  }
  if (password) {
    payload.password = password;
  }
  return request('/items/copy', {
    method: 'POST',
    body: payload,
  });
}

export function moveItem(source, destination, { newName, password } = {}) {
  const payload = { source, destination };
  if (newName) {
    payload.newName = newName;
  }
  if (password) {
    payload.password = password;
  }
  return request('/items/move', {
    method: 'POST',
    body: payload,
  });
}

export function lockItem(path, password) {
  return request('/items/lock', {
    method: 'POST',
    body: { path, password },
  });
}

export function unlockItem(path, password) {
  return request('/items/unlock', {
    method: 'POST',
    body: { path, password },
  });
}

export async function fetchFileContent(path, { password, download } = {}) {
  if (!path) {
    throw new Error('Path is required to fetch file content');
  }

  const params = new URLSearchParams();
  params.set('path', path);
  if (download) {
    params.set('download', '1');
  }

  const headers = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  if (password) {
    headers['x-item-password'] = password;
  }

  const url = `${API_ROOT}/items/content?${params.toString()}`;
  const response = await fetch(url, { headers });
  const contentType = response.headers.get('content-type') || 'application/octet-stream';

  if (!response.ok) {
    let message = 'Unable to fetch file';
    try {
      const text = await response.text();
      if (text) {
        try {
          const payload = JSON.parse(text);
          if (payload?.message) {
            message = payload.message;
          } else {
            message = text;
          }
        } catch (parseError) {
          message = text;
        }
      }
    } catch (readError) {
      message = readError.message || message;
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const encodedFileNameMatch = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  const basicFileNameMatch = /filename="?([^";]+)"?/i.exec(disposition);
  const encodedFileName = encodedFileNameMatch?.[1] || basicFileNameMatch?.[1] || '';
  let filename = path.split('/').pop() || 'download';
  if (encodedFileName) {
    try {
      filename = decodeURIComponent(encodedFileName);
    } catch (error) {
      filename = encodedFileName;
    }
  }

  return { blob, contentType, filename };
}

export function login(username, password) {
  return request('/auth/login', {
    method: 'POST',
    body: { username, password },
  });
}

export function logout() {
  return request('/auth/logout', { method: 'POST' });
}

export function getCurrentUser() {
  return request('/auth/me');
}

export function updateMyProfile(body) {
  return request('/users/me/profile', {
    method: 'PUT',
    body,
  });
}

export function changeMyPassword(currentPassword, newPassword) {
  return request('/users/me/password', {
    method: 'PUT',
    body: { currentPassword, newPassword },
  });
}

export function fetchUsers() {
  return request('/admin/users');
}

export function createUser(body) {
  return request('/admin/users', {
    method: 'POST',
    body,
  });
}

export function updateUser(username, body) {
  return request(`/admin/users/${encodeURIComponent(username)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteUser(username) {
  return request(`/admin/users/${encodeURIComponent(username)}`, {
    method: 'DELETE',
  });
}

export function fetchNotices() {
  return request('/notices');
}

export function createNotice(message) {
  return request('/notices', {
    method: 'POST',
    body: { message },
  });
}

export function listProcurementRequests() {
  return request('/procurement/requests');
}

export function getProcurementRequest(referenceId) {
  return request(`/procurement/requests/${encodeURIComponent(referenceId)}`);
}

export function createProcurementRequest(payload) {
  return request('/procurement/requests', {
    method: 'POST',
    body: payload,
  });
}

export function submitDepartmentReview(referenceId, payload) {
  return request(`/procurement/requests/${encodeURIComponent(referenceId)}/department-review`, {
    method: 'POST',
    body: payload,
  });
}

export function submitFinanceReview(referenceId, payload) {
  return request(`/procurement/requests/${encodeURIComponent(referenceId)}/finance-review`, {
    method: 'POST',
    body: payload,
  });
}

export function submitProcurementSelection(referenceId, payload) {
  return request(`/procurement/requests/${encodeURIComponent(referenceId)}/procurement-selection`, {
    method: 'POST',
    body: payload,
  });
}

export function submitReceipt(referenceId, payload) {
  return request(`/procurement/requests/${encodeURIComponent(referenceId)}/receipt`, {
    method: 'POST',
    body: payload,
  });
}

export function submitReceiptReview(referenceId, payload) {
  return request(`/procurement/requests/${encodeURIComponent(referenceId)}/receipt-review`, {
    method: 'POST',
    body: payload,
  });
}
