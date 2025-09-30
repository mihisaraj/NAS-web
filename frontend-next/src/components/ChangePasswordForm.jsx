import { useState } from 'react';

const ChangePasswordForm = ({ title = 'Change Password', onSubmit }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ error: '', success: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ error: '', success: '' });
    if (!currentPassword || !newPassword) {
      setStatus({ error: 'Please provide your current and new password.', success: '' });
      return;
    }
    if (newPassword.length < 4) {
      setStatus({ error: 'New password must be at least 4 characters long.', success: '' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ error: 'The new password and confirmation do not match.', success: '' });
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({ currentPassword, newPassword });
      setStatus({ error: '', success: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setStatus({ error: err.message || 'Unable to update password.', success: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="glass-panel relative flex flex-col gap-5 overflow-hidden p-5"
      onSubmit={handleSubmit}
    >
      <div className="pointer-events-none chroma-grid" />
      <div className="relative z-10 space-y-1">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
        <p className="text-sm font-medium text-slate-600">
          Update your account password to keep your storage secure.
        </p>
      </div>
      {status.error && (
        <div
          className="relative z-10 rounded-2xl border border-rose-200/70 bg-rose-100/80 px-4 py-3 text-sm font-semibold text-rose-600 shadow-[0_12px_30px_-18px_rgba(244,63,94,0.45)]"
          role="alert"
        >
          {status.error}
        </div>
      )}
      {status.success && (
        <div
          className="relative z-10 rounded-2xl border border-emerald-200/70 bg-emerald-100/75 px-4 py-3 text-sm font-semibold text-emerald-600 shadow-[0_12px_30px_-18px_rgba(16,185,129,0.4)]"
          role="status"
        >
          {status.success}
        </div>
      )}
      <div className="relative z-10 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600 sm:text-sm">
          <span>Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Current password"
            className="rounded-2xl border border-white/45 bg-white/55 px-4 py-2.5 text-sm font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600 sm:text-sm">
          <span>New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="New password"
            className="rounded-2xl border border-white/45 bg-white/55 px-4 py-2.5 text-sm font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600 sm:text-sm sm:col-span-2">
          <span>Confirm new password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Confirm password"
            className="rounded-2xl border border-white/45 bg-white/55 px-4 py-2.5 text-sm font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
          />
        </label>
      </div>
      <div className="relative z-10 flex items-center justify-end">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_20px_45px_-24px_rgba(79,70,229,0.85)] transition hover:shadow-[0_25px_55px_-20px_rgba(79,70,229,0.9)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
