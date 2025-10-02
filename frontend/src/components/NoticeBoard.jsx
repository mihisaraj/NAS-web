import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchNotices, createNotice } from '../services/api.js';

const formatTimestamp = (timestamp) => {
  if (!timestamp) {
    return '';
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
};

const NoticeBadge = ({ label }) => (
  <span className="rounded-full border border-white/40 bg-white/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
    {label}
  </span>
);

const NoticeItem = ({ notice, isOwn }) => (
  <li
    className={`relative rounded-2xl border px-4 py-3 shadow-sm transition ${
      isOwn
        ? 'border-emerald-300/70 bg-gradient-to-br from-emerald-400/25 via-emerald-400/15 to-blue-400/15 text-emerald-800 shadow-[0_18px_45px_-32px_rgba(16,185,129,0.7)]'
        : 'border-white/35 bg-white/60 text-slate-700 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.25)]'
    }`}
  >
    <div className="flex items-baseline justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
      <div className="flex items-baseline gap-2">
        <span className="text-slate-600">{isOwn ? 'You' : notice.author}</span>
        {notice.timestamp ? (
          <time dateTime={notice.timestamp} className="text-slate-400">
            {formatTimestamp(notice.timestamp)}
          </time>
        ) : null}
      </div>
      <span className="rounded-full border border-white/40 bg-white/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-500">
        Notice
      </span>
    </div>
    <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-slate-700">{notice.message}</p>
  </li>
);

const NoticeTimeline = ({ notices, username }) => {
  if (!notices.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-white/35 bg-white/60 p-6 text-center text-sm font-semibold text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
        <span className="text-xs uppercase tracking-[0.35em] text-blue-500">No notices</span>
        <p className="max-w-sm text-sm font-medium text-slate-600">
          Be the first to share an update with your team.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1 text-sm">
      {notices.map((notice) => (
        <NoticeItem key={notice.id} notice={notice} isOwn={notice.author === username} />
      ))}
    </ul>
  );
};

const NoticeComposer = ({ draft, onChange, onSubmit, disabled }) => (
  <form className="relative z-10 flex flex-col gap-3" onSubmit={onSubmit}>
    <textarea
      value={draft}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Post a new notice for the team"
      rows={3}
      maxLength={2000}
      disabled={disabled}
      className="w-full rounded-2xl border border-white/35 bg-white/45 px-4 py-3 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 disabled:cursor-not-allowed disabled:opacity-60"
    />
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-400 sm:text-sm">
      <span>{draft.length}/2000</span>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_20px_45px_-24px_rgba(79,70,229,0.85)] transition hover:shadow-[0_25px_55px_-20px_rgba(79,70,229,0.9)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled || !draft.trim()}
      >
        {disabled ? 'Posting…' : 'Post notice'}
      </button>
    </div>
  </form>
);

const NoticeBoard = ({ currentUser }) => {
  const username = currentUser?.username || '';
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const loadNotices = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const data = await fetchNotices();
      const items = Array.isArray(data.notices) ? data.notices : [];
      const sorted = [...items].sort((a, b) => {
        const timeA = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });
      setNotices(sorted);
      return true;
    } catch (err) {
      if (!silent) {
        setError(err.message || 'Unable to load notices');
      }
      return false;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadNotices();
    const interval = setInterval(() => {
      if (!isMounted) {
        return;
      }
      loadNotices({ silent: true });
    }, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [loadNotices]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const trimmed = draft.trim();
      if (!trimmed || isPosting) {
        return;
      }
      setIsPosting(true);
      setError('');
      try {
        const response = await createNotice(trimmed);
        const newNotice = response?.notice;
        if (newNotice) {
          setNotices((current) => {
            const withoutDuplicate = current.filter((item) => item.id !== newNotice.id);
            return [newNotice, ...withoutDuplicate].sort((a, b) => {
              const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
              const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
              return timeB - timeA;
            });
          });
        } else {
          await loadNotices({ silent: true });
        }
        setDraft('');
      } catch (err) {
        setError(err.message || 'Unable to post notice');
      } finally {
        setIsPosting(false);
      }
    },
    [draft, isPosting, loadNotices]
  );

  const stats = useMemo(() => {
    const latest = notices[0];
    return {
      total: notices.length,
      latestAt: latest?.timestamp ? formatTimestamp(latest.timestamp) : null,
    };
  }, [notices]);

  return (
    <div className="glass-panel relative flex h-full flex-col gap-6 overflow-hidden p-6">
      <div className="pointer-events-none chroma-grid" />
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Team notices</h2>
            <p className="text-sm font-medium text-slate-600">
              Share quick updates that everyone can see. The board refreshes automatically every 10 seconds.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <NoticeBadge label={`Total ${stats.total}`} />
              <button
                type="button"
                onClick={() => loadNotices()}
                className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.3)] transition hover:bg-white/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                Refresh
              </button>
            </div>
            {stats.latestAt ? (
              <span className="text-[10px] uppercase tracking-[0.35em] text-slate-400">
                Latest: {stats.latestAt}
              </span>
            ) : null}
          </div>
        </div>
        {error ? (
          <div
            className="relative z-10 rounded-2xl border border-rose-200/70 bg-rose-100/80 px-4 py-3 text-sm font-semibold text-rose-600 shadow-[0_12px_30px_-18px_rgba(244,63,94,0.45)]"
            role="alert"
          >
            {error}
          </div>
        ) : null}
      </div>
      <div className="relative z-10 flex flex-1 flex-col gap-4 rounded-2xl border border-white/25 bg-white/30 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-sm font-semibold text-slate-500">
            Loading notices…
          </div>
        ) : (
          <NoticeTimeline notices={notices} username={username} />
        )}
      </div>
      <NoticeComposer draft={draft} onChange={setDraft} onSubmit={handleSubmit} disabled={isPosting} />
    </div>
  );
};

export default NoticeBoard;
