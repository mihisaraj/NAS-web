const AccessList = ({ access = [], selectedPath, onSelect }) => {
  if (!Array.isArray(access) || access.length === 0) {
    return (
      <div className="glass-panel relative flex flex-col gap-4 overflow-hidden p-5">
        <div className="pointer-events-none chroma-grid" />
        <div className="relative z-10 space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Assigned folders</h2>
          <p className="text-sm font-medium text-slate-500">No folders have been assigned to this account yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel relative flex flex-col gap-4 overflow-hidden p-5">
      <div className="pointer-events-none chroma-grid" />
      <div className="relative z-10 space-y-1">
        <h2 className="text-lg font-bold text-slate-900">Assigned folders</h2>
        <p className="text-sm font-medium text-slate-500">Select a folder to browse files and see the associated password.</p>
      </div>
      <ul className="relative z-10 flex flex-col gap-3">
        {access.map((entry) => {
          const isActive = selectedPath === entry.path;
          return (
            <li key={entry.path || '(root)'}>
              <button
                type="button"
                className={`group flex w-full flex-col items-start gap-1 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                  isActive
                    ? 'border-blue-400/70 bg-gradient-to-br from-blue-500/30 via-blue-500/15 to-emerald-400/20 text-blue-900 shadow-[0_28px_50px_-35px_rgba(59,130,246,0.7)]'
                    : 'border-white/40 bg-white/35 text-slate-700 hover:border-blue-300/60 hover:bg-blue-50/40'
                }`}
                onClick={() => onSelect?.(entry.path)}
              >
                <span className={`text-base font-bold ${isActive ? 'text-blue-900' : 'text-slate-900'}`}>
                  {entry.path || 'Full storage access'}
                </span>
                <span className={`font-mono text-xs ${isActive ? 'text-blue-700/90' : 'text-slate-500/90'}`}>
                  Password: {entry.password}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AccessList;
