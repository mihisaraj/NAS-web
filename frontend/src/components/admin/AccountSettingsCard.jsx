import { useEffect, useState } from 'react';
import { updateMyProfile } from '../../services/api.js';

const AccountSettingsCard = ({ user, onProfileUpdated }) => {
  const [username, setUsername] = useState(user.username);
  const [status, setStatus] = useState({ error: '', success: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUsername(user.username);
  }, [user.username]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ error: '', success: '' });
    const trimmed = username.trim();
    if (!trimmed) {
      setStatus({ error: 'Username cannot be empty.', success: '' });
      return;
    }
    if (trimmed === user.username) {
      setStatus({ error: '', success: 'Username is already up to date.' });
      return;
    }

    setSaving(true);
    try {
      await updateMyProfile({ username: trimmed });
      setStatus({ error: '', success: 'Username updated successfully.' });
      onProfileUpdated?.();
    } catch (err) {
      setStatus({ error: err.message || 'Unable to update username.', success: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="glass-panel relative flex flex-col gap-5 overflow-hidden p-6" onSubmit={handleSubmit}>
      <div className="pointer-events-none chroma-grid" />
      <div className="relative z-10 space-y-2">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Account profile</h2>
        <p className="text-sm font-medium text-slate-600">
          Update your administrator username and review account metadata.
        </p>
      </div>
      {status.error && (
        <div className="relative z-10 rounded-2xl border border-rose-200/70 bg-rose-100/80 px-4 py-3 text-sm font-semibold text-rose-600 shadow-[0_12px_30px_-18px_rgba(244,63,94,0.45)]">
          {status.error}
        </div>
      )}
      {status.success && (
        <div className="relative z-10 rounded-2xl border border-emerald-200/70 bg-emerald-100/75 px-4 py-3 text-sm font-semibold text-emerald-600 shadow-[0_12px_30px_-18px_rgba(16,185,129,0.4)]">
          {status.success}
        </div>
      )}
      <div className="relative z-10 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600 sm:text-sm sm:col-span-2">
          <span>Username</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="Administrator username"
            className="rounded-2xl border border-white/45 bg-white/55 px-4 py-2.5 text-sm font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
          />
        </label>
        <div className="flex flex-col gap-2 rounded-2xl border border-white/35 bg-white/60 p-4 text-xs text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] sm:text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Role</span>
          <span className="text-base font-semibold text-slate-700">{user.role}</span>
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Created</span>
          <time dateTime={user.createdAt} className="font-semibold text-slate-700">
            {user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
          </time>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-white/35 bg-white/60 p-4 text-xs text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] sm:text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Last updated</span>
          <time dateTime={user.updatedAt} className="text-base font-semibold text-slate-700">
            {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : '—'}
          </time>
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Access entries</span>
          <span className="text-base font-semibold text-slate-700">{user.access?.length || 0}</span>
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-end">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_20px_45px_-24px_rgba(79,70,229,0.85)] transition hover:shadow-[0_25px_55px_-20px_rgba(79,70,229,0.9)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
};

export default AccountSettingsCard;
