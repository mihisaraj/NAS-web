"use client";

import { useEffect, useState } from "react";
import { getStorageStatus } from "../services/api.js";
import { HardDrive, Database, Loader2 } from "lucide-react";

const REFRESH_INTERVAL_MS = 30000;

const formatBytes = (value) => {
  if (!Number.isFinite(value) || value < 0) return "N/A";
  if (value === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
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
  if (!Number.isFinite(value)) return "N/A";
  return `${Math.round(value)}%`;
};

const StorageIndicator = () => {
  const [state, setState] = useState({ info: null, loading: true, error: "" });

  useEffect(() => {
    let active = true;
    let timerId = null;

    const fetchStatus = async () => {
      try {
        const data = await getStorageStatus();
        if (!active) return;
        setState({ info: data, loading: false, error: "" });
      } catch (error) {
        if (!active) return;
        setState((prev) => ({
          info: prev.info,
          loading: false,
          error: error?.message || "Unable to load storage status",
        }));
      } finally {
        if (!active) return;
        timerId = setTimeout(fetchStatus, REFRESH_INTERVAL_MS);
      }
    };

    fetchStatus();
    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  const { info, loading, error } = state;

  if (!info && !loading && error) {
    return (
      <div
        className="flex w-full items-center gap-2 rounded-xl border border-white/20 bg-white/20 backdrop-blur-lg px-4 py-2 text-sm font-medium text-rose-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] sm:w-auto"
        title={error}
      >
        <HardDrive size={16} />
        Storage unavailable
      </div>
    );
  }

  if (!info) {
    return (
      <div
        className="flex w-full items-center gap-2 rounded-xl border border-white/25 bg-white/25 backdrop-blur-md px-4 py-2 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] animate-pulse sm:w-auto"
        aria-live="polite"
      >
        <Loader2 size={16} className="animate-spin text-blue-500" />
        Checking storage...
      </div>
    );
  }

  const { freeBytes, totalBytes, usedBytes, freePercentage, usedPercentage } = info;
  const formattedFree = formatBytes(freeBytes);
  const formattedTotal = formatBytes(totalBytes);
  const formattedUsed = formatBytes(usedBytes);
  const freePercentText = formatPercentage(freePercentage);
  const usedPercentText = formatPercentage(usedPercentage);

  const tooltip = `Free: ${formattedFree} (${freePercentText})\nUsed: ${formattedUsed} (${usedPercentText})\nTotal: ${formattedTotal}`;

  const usagePercent = Math.min(100, Math.round(usedPercentage || 0));

  return (
    <div
      className="group relative flex w-full items-center justify-between gap-3 rounded-xl border border-white/20 bg-gradient-to-r from-white/30 to-blue-100/20 backdrop-blur-2xl px-4 py-2 text-sm font-medium text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] hover:border-blue-300 transition-all sm:w-auto sm:justify-start"
      title={tooltip}
      aria-live="polite"
    >
      <Database size={16} className="text-blue-500" />
      <div className="flex w-full flex-col items-start">
        <span className="font-semibold text-slate-800">Free {formattedFree}</span>
        <div className="relative mt-1 h-[6px] w-32 overflow-hidden rounded-full bg-white/50 backdrop-blur-sm">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default StorageIndicator;
