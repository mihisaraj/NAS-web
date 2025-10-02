const Breadcrumbs = ({ breadcrumbs, onNavigate }) => {
  const items = [{ name: 'Home', path: '' }, ...(breadcrumbs || [])];

  return (
    <nav
      className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400 sm:text-sm"
      aria-label="Breadcrumb"
    >
      {items.map((crumb, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={crumb.path || 'root'} className="flex items-center gap-2">
            {isLast ? (
              <span className="rounded-full border border-white/25 bg-white/35 px-3 py-1 text-blue-700 shadow-inner shadow-white/40">
                {crumb.name || 'Home'}
              </span>
            ) : (
              <button
                type="button"
                className="rounded-full border border-white/20 bg-white/25 px-3 py-1 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                onClick={() => onNavigate(crumb.path)}
              >
                {crumb.name || 'Home'}
              </button>
            )}
            {!isLast && <span className="text-slate-300">/</span>}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
