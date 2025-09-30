import { useState } from 'react';

const LoginForm = ({ onSubmit, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setLocalError('Please enter both username and password.');
      return;
    }
    setLocalError('');
    onSubmit({ username: username.trim(), password });
  };

  return (
    <form
      className="glass-panel relative flex w-full flex-col gap-6 overflow-hidden p-6 sm:p-8"
      onSubmit={handleSubmit}
    >
      <div className="pointer-events-none chroma-grid" />
      <div
        className="orb-glow"
        style={{
          top: '-18%',
          left: '12%',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.4), transparent 60%)',
        }}
      />
      <div className="relative z-10 flex flex-col gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-blue-600">Access Portal</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Sign in to HTS NAS
          </h1>
          <p className="text-sm font-medium text-slate-600 sm:text-base">
            Enter your account credentials to access the dashboard.
          </p>
        </div>
        {(error || localError) && (
          <div
            className="rounded-2xl border border-rose-200/70 bg-rose-100/80 px-4 py-3 text-sm font-semibold text-rose-600 shadow-[0_12px_30px_-18px_rgba(244,63,94,0.5)]"
            role="alert"
          >
            {error || localError}
          </div>
        )}
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
          <span>Username</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="e.g. Admin"
            className="rounded-2xl border border-white/45 bg-white/55 px-4 py-3 text-base font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Your password"
            className="rounded-2xl border border-white/45 bg-white/55 px-4 py-3 text-base font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-5 py-3 text-base font-semibold text-white shadow-[0_20px_45px_-24px_rgba(79,70,229,0.85)] transition hover:shadow-[0_25px_55px_-20px_rgba(79,70,229,0.9)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Sign In
        </button>
        <p className="rounded-2xl border border-white/20 bg-white/30 px-4 py-3 text-sm font-medium text-slate-600 shadow-inner shadow-white/20">
          Try the default admin account: <strong className="font-semibold text-slate-900">Admin / HTS</strong>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
