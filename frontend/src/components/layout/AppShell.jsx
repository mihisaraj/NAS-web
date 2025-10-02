import StorageIndicator from '../StorageIndicator.jsx';

const Orb = ({ style }) => (
  <div className="orb-glow" style={style} />
);

const AppShell = ({ align = 'stretch', user, onLogout, children }) => {
  const mainClass = align === 'center' ? 'app-main app-main--center' : 'app-main';

  return (
    <div className="app-shell">
      <div className="app-shell__layer">
        <Orb
          style={{
            top: '-22%',
            left: '-10%',
            width: '540px',
            height: '540px',
            background: 'radial-gradient(circle, rgba(59,130,246,0.3), transparent 65%)',
          }}
        />
        <Orb
          style={{
            bottom: '-28%',
            right: '-14%',
            width: '620px',
            height: '620px',
            background: 'radial-gradient(circle, rgba(236,72,153,0.24), transparent 68%)',
          }}
        />
        <Orb
          style={{
            top: '30%',
            right: '12%',
            width: '320px',
            height: '320px',
            background: 'radial-gradient(circle, rgba(56,189,248,0.3), transparent 62%)',
          }}
        />
      </div>
      <div className="app-shell__inner">
        <header className="app-topbar glass-panel backdrop-sheen">
          <div className="app-brand">
            <span className="app-brand__mark">HTS</span>
            <div>
              <span className="app-brand__title">Network Access Storage</span>
              <span className="app-brand__subtitle">Fluid workspace</span>
            </div>
          </div>
          {user ? (
            <div className="app-topbar__meta">
              <StorageIndicator />
              <div className="app-topbar__user">
                <span>{user.username}</span>
                <span className="app-topbar__chip">{user.role}</span>
              </div>
              <button type="button" className="app-topbar__logout" onClick={onLogout}>
                Sign out
              </button>
            </div>
          ) : (
            <span className="glass-chip">Secure access</span>
          )}
        </header>
        <main className={mainClass}>
          <div className="app-main__background">
            <div className="chroma-grid" />
            <Orb
              style={{
                top: '-18%',
                left: '12%',
                width: '320px',
                height: '320px',
                background: 'radial-gradient(circle, rgba(59,130,246,0.35), transparent 62%)',
              }}
            />
            <Orb
              style={{
                bottom: '-24%',
                right: '-10%',
                width: '420px',
                height: '420px',
                background: 'radial-gradient(circle, rgba(99,102,241,0.28), transparent 65%)',
              }}
            />
          </div>
          <div className="app-main__content">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
