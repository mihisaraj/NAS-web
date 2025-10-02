import { useCallback, useEffect, useState } from 'react';
import AdminDashboard from './components/AdminDashboard.jsx';
import UserDashboard from './components/UserDashboard.jsx';
import DepartmentHeadDashboard from './components/DepartmentHeadDashboard.jsx';
import FinanceDashboard from './components/FinanceDashboard.jsx';
import ProcurementDashboard from './components/ProcurementDashboard.jsx';
import LoginForm from './components/LoginForm.jsx';
import DialogProvider from './components/dialog/DialogProvider.jsx';
import AppShell from './components/layout/AppShell.jsx';
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

  let align = 'stretch';
  let content = null;
  const user = authState.status === 'authenticated' ? authState.user : null;

  if (authState.status === 'loading') {
    align = 'center';
    content = (
      <div className="flex flex-col items-center gap-4 text-center text-slate-200">
        <span className="glass-chip text-xs tracking-[0.35em] text-blue-700">Loading…</span>
        <p className="text-sm font-medium text-slate-400">
          Preparing your storage workspace. Please hold on for a moment.
        </p>
      </div>
    );
  } else if (!user) {
    align = 'center';
    content = (
      <div className="mx-auto w-full max-w-xl">
        <LoginForm onSubmit={handleLogin} error={authError} />
      </div>
    );
  } else if (user.role === 'admin') {
    content = (
      <AdminDashboard user={user} onPasswordChange={handlePasswordChange} onRefreshUser={refreshUser} />
    );
  } else if (user.role === 'dept-head') {
    content = <DepartmentHeadDashboard user={user} onPasswordChange={handlePasswordChange} />;
  } else if (user.role === 'finance') {
    content = <FinanceDashboard user={user} onPasswordChange={handlePasswordChange} />;
  } else if (user.role === 'procurement') {
    content = <ProcurementDashboard user={user} onPasswordChange={handlePasswordChange} />;
  } else {
    content = <UserDashboard user={user} onPasswordChange={handlePasswordChange} />;
  }

  return (
    <DialogProvider>
      <AppShell align={align} user={user} onLogout={handleLogout}>
        {content}
      </AppShell>
    </DialogProvider>
  );
};

export default App;
