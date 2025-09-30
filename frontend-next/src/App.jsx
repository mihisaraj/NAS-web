import { useCallback, useEffect, useState } from 'react';
import AdminDashboard from './components/AdminDashboard.jsx';
import UserDashboard from './components/UserDashboard.jsx';
import DepartmentHeadDashboard from './components/DepartmentHeadDashboard.jsx';
import FinanceDashboard from './components/FinanceDashboard.jsx';
import ProcurementDashboard from './components/ProcurementDashboard.jsx';
import LoginForm from './components/LoginForm.jsx';
import {
  setAuthToken,
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
  changeMyPassword,
} from './services/api.js';

const AUTH_TOKEN_KEY = 'hts-auth-token';

const App = () => {
  const [authState, setAuthState] = useState({ status: 'loading', user: null, token: '' });
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_TOKEN_KEY) : '';
    if (!token) {
      setAuthState({ status: 'guest', user: null, token: '' });
      return;
    }
    setAuthToken(token);
    getCurrentUser()
      .then((data) => {
        setAuthState({ status: 'authenticated', user: data.user, token });
      })
      .catch(() => {
        setAuthToken('');
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(AUTH_TOKEN_KEY);
        }
        setAuthState({ status: 'guest', user: null, token: '' });
      });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      if (authState.status === 'authenticated') {
        await apiLogout();
      }
    } catch (err) {
      // ignore logout errors
    } finally {
      setAuthToken('');
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
      }
      setAuthState({ status: 'guest', user: null, token: '' });
    }
  }, [authState.status]);

  const refreshUser = useCallback(async () => {
    if (!authState.token) {
      return;
    }
    try {
      const data = await getCurrentUser();
      setAuthState((prev) => ({ status: 'authenticated', user: data.user, token: prev.token }));
    } catch (err) {
      handleLogout();
    }
  }, [authState.token, handleLogout]);

  const handleLogin = async ({ username, password }) => {
    try {
      setAuthError('');
      const { token, user } = await apiLogin(username, password);
      setAuthToken(token);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      }
      setAuthState({ status: 'authenticated', user, token });
    } catch (err) {
      setAuthError(err.message || 'Unable to sign in');
    }
  };

  const handlePasswordChange = async ({ currentPassword, newPassword }) => {
    await changeMyPassword(currentPassword, newPassword);
    await refreshUser();
  };

  const renderShell = ({ content, align = 'stretch', user = null }) => {
    const mainClass = align === 'center' ? 'app-main app-main--center' : 'app-main';

    return (
      <div className="app-shell">
        <div className="app-shell__layer">
          <div
            className="orb-glow"
            style={{
              top: '-22%',
              left: '-10%',
              width: '540px',
              height: '540px',
              background: 'radial-gradient(circle, rgba(59,130,246,0.3), transparent 65%)',
            }}
          />
          <div
            className="orb-glow"
            style={{
              bottom: '-28%',
              right: '-14%',
              width: '620px',
              height: '620px',
              background: 'radial-gradient(circle, rgba(236,72,153,0.24), transparent 68%)',
            }}
          />
          <div
            className="orb-glow"
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
                <div className="app-topbar__user">
                  <span>{user.username}</span>
                  <span className="app-topbar__chip">{user.role}</span>
                </div>
                <button type="button" className="app-topbar__logout" onClick={handleLogout}>
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
              <div
                className="orb-glow"
                style={{
                  top: '-18%',
                  left: '12%',
                  width: '320px',
                  height: '320px',
                  background: 'radial-gradient(circle, rgba(59,130,246,0.35), transparent 62%)',
                }}
              />
              <div
                className="orb-glow"
                style={{
                  bottom: '-24%',
                  right: '-10%',
                  width: '420px',
                  height: '420px',
                  background: 'radial-gradient(circle, rgba(99,102,241,0.28), transparent 65%)',
                }}
              />
            </div>
            <div className="app-main__content">{content}</div>
          </main>
        </div>
      </div>
    );
  };

  if (authState.status === 'loading') {
    return renderShell({
      align: 'center',
      content: (
        <div className="flex flex-col items-center gap-4 text-center text-slate-200">
          <span className="glass-chip text-xs tracking-[0.35em] text-blue-700">Loading…</span>
          <p className="text-sm font-medium text-slate-400">
            Preparing your storage workspace. Please hold on for a moment.
          </p>
        </div>
      ),
    });
  }

  if (authState.status !== 'authenticated' || !authState.user) {
    return renderShell({
      align: 'center',
      content: (
        <div className="mx-auto w-full max-w-xl">
          <LoginForm onSubmit={handleLogin} error={authError} />
        </div>
      ),
    });
  }

  const { user } = authState;
  if (user.role === 'admin') {
    return renderShell({
    user,
      content: (
        <AdminDashboard
          user={user}
          onPasswordChange={handlePasswordChange}
          onRefreshUser={refreshUser}
        />
      ),
    });
  }

  if (user.role === 'dept-head') {
    return renderShell({
      user,
      content: <DepartmentHeadDashboard user={user} onPasswordChange={handlePasswordChange} />,
    });
  }

  if (user.role === 'finance') {
    return renderShell({
      user,
      content: <FinanceDashboard user={user} onPasswordChange={handlePasswordChange} />,
    });
  }

  if (user.role === 'procurement') {
    return renderShell({
      user,
      content: <ProcurementDashboard user={user} onPasswordChange={handlePasswordChange} />,
    });
  }

  return renderShell({
    user,
    content: <UserDashboard user={user} onPasswordChange={handlePasswordChange} />,
  });
};

export default App;
