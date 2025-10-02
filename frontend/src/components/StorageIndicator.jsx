import { useEffect, useState } from 'react';
import { getStorageStatus } from '../services/api.js';

const REFRESH_INTERVAL_MS = 30000;

const formatBytes = (value) => {
  if (!Number.isFinite(value) || value < 0) {
    return 'N/A';
  }
  if (value === 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let index = 0;
  let current = value;
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index += 1;
  }
  const precision = current >= 100 ? 0 : current >= 10 ? 1 : 2;
  return `${current.toFixed(precision)} ${units[index]}`;
};

const formatPercentage = (value) => {
  if (!Number.isFinite(value)) {
    return 'N/A';
  }
  return `${Math.round(value)}%`;
};

const StorageIndicator = () => {
  const [state, setState] = useState({ info: null, loading: true, error: '' });

  useEffect(() => {
    let active = true;
    let timerId = null;

    const fetchStatus = async () => {
      try {
        const data = await getStorageStatus();
        if (!active) {
          return;
        }
        setState({ info: data, loading: false, error: '' });
      } catch (error) {
        if (!active) {
          return;
        }
        setState((prev) => ({
          info: prev.info,
          loading: false,
          error: error?.message || 'Unable to load storage status',
        }));
      } finally {
        if (!active) {
          return;
        }
        timerId = setTimeout(fetchStatus, REFRESH_INTERVAL_MS);
      }
    };

    fetchStatus();

    return () => {
      active = false;
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, []);

  const { info, loading, error } = state;

  if (!info && !loading && error) {
    return (
      <span className="glass-chip storage-indicator" title={error}>
        Storage unavailable
      </span>
    );
  }

  if (!info) {
    return (
      <span className="glass-chip storage-indicator" aria-live="polite">
        Checking storage...
      </span>
    );
  }

  const { freeBytes, totalBytes, usedBytes, freePercentage, usedPercentage } = info;
  const formattedFree = formatBytes(freeBytes);
  const formattedTotal = formatBytes(totalBytes);
  const formattedUsed = formatBytes(usedBytes);
  const freePercentText = formatPercentage(freePercentage);
  const usedPercentText = formatPercentage(usedPercentage);

  const tooltip = `Free: ${formattedFree} (${freePercentText})\nUsed: ${formattedUsed} (${usedPercentText})\nTotal: ${formattedTotal}`;

  return (
    <span className="glass-chip storage-indicator" title={tooltip} aria-live="polite">
      Free {formattedFree}
    </span>
  );
};

export default StorageIndicator;
