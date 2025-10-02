const AdminHero = ({ user, onOpenSettings }) => (
  <header className="glass-panel relative flex flex-col gap-5 overflow-hidden p-6 sm:flex-row sm:items-center sm:justify-between">
    <div className="pointer-events-none chroma-grid" />
    <div className="relative z-10 space-y-3">
      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">
        Admin Control Center
      </div>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.1rem]">
          Welcome, {user.username}
        </h1>
        <p className="max-w-xl text-sm font-medium text-slate-600 sm:text-base">
          Manage teams, notices, and procurement from a streamlined workspace. Open settings to adjust
          your own account and system preferences.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">
        <span className="glass-chip">Administrator</span>
        <span className="glass-chip">Full access</span>
      </div>
    </div>
    <div className="relative z-10 flex flex-col items-end gap-3">
      <button
        type="button"
        onClick={onOpenSettings}
        className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/40 px-5 py-2 text-sm font-semibold text-slate-700 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.35)] transition hover:bg-white/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
        Workspace settings
      </button>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
        Role: {user.role}
      </p>
    </div>
  </header>
);

export default AdminHero;
