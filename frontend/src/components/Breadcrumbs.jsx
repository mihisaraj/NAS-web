import { ChevronRight } from "lucide-react";

const Breadcrumbs = ({ breadcrumbs, onNavigate }) => {
  const items = [{ name: "Home", path: "" }, ...(breadcrumbs || [])];

  return (
    <nav
      className="flex flex-wrap items-center gap-2 text-sm sm:text-base font-medium text-slate-300"
      aria-label="Breadcrumb"
    >
      {items.map((crumb, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={crumb.path || "root"} className="flex items-center">
            {!isLast ? (
              <button
                onClick={() => onNavigate(crumb.path)}
                className="flex items-center gap-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 px-3 py-1.5 
                text-slate-300 hover:text-blue-400 hover:bg-white/10 transition-all duration-200 shadow-sm"
              >
                {crumb.name || "Home"}
              </button>
            ) : (
              <span
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-blue-600/10 border border-blue-400/30 
                px-3 py-1.5 text-blue-400 font-semibold shadow-inner shadow-blue-500/20"
              >
                {crumb.name || "Home"}
              </span>
            )}
            {!isLast && (
              <ChevronRight className="mx-2 h-4 w-4 text-slate-500/60" />
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
