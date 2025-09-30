import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchUsers, createUser, updateUser, deleteUser } from '../services/api.js';

const normalizePath = (input) => {
  if (typeof input !== 'string') {
    return '';
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
};

const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'dept-head', label: 'Department head' },
  { value: 'finance', label: 'Finance' },
  { value: 'procurement', label: 'Procurement' },
  { value: 'admin', label: 'Admin' },
];

const initialNewUser = {
  username: '',
  password: '',
  role: ROLE_OPTIONS[0].value,
};

const UserManagementPanel = ({ onUsersChanged }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [accessDraft, setAccessDraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState(initialNewUser);
  const [savingAccess, setSavingAccess] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);
  const selectedUsernameRef = useRef(selectedUsername);

  useEffect(() => {
    selectedUsernameRef.current = selectedUsername;
  }, [selectedUsername]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchUsers();
      const sorted = (data.users || []).slice().sort((a, b) => a.username.localeCompare(b.username));
      setUsers(sorted);
      if (sorted.length === 0) {
        setSelectedUsername('');
        setAccessDraft([]);
        return;
      }
      const existing = sorted.find((user) => user.username === selectedUsernameRef.current);
      const activeUser = existing || sorted[0];
      setSelectedUsername(activeUser.username);
      setAccessDraft(activeUser.access ? activeUser.access.map((entry) => ({ ...entry })) : []);
    } catch (err) {
      setError(err.message || 'Unable to load users.');
      setUsers([]);
      setSelectedUsername('');
      setAccessDraft([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!message) {
      return undefined;
    }
    const timeout = setTimeout(() => setMessage(''), 4000);
    return () => clearTimeout(timeout);
  }, [message]);

  const selectedUser = users.find((user) => user.username === selectedUsername) || null;

  const handleSelectUser = (username) => {
    setSelectedUsername(username);
    const target = users.find((user) => user.username === username);
    setAccessDraft(target?.access ? target.access.map((entry) => ({ ...entry })) : []);
  };

  const handleAccessChange = (index, field, value) => {
    setAccessDraft((entries) =>
      entries.map((entry, idx) => (idx === index ? { ...entry, [field]: value } : entry))
    );
  };

  const handleRemoveAccess = (index) => {
    setAccessDraft((entries) => entries.filter((_, idx) => idx !== index));
  };

  const handleAddAccess = () => {
    setAccessDraft((entries) => [...entries, { path: '', password: '' }]);
  };

  const handleSaveAccess = async () => {
    if (!selectedUser) {
      return;
    }
    setError('');
    setMessage('');
    const formatted = accessDraft.map((entry) => ({
      path: normalizePath(entry.path || ''),
      password: (entry.password || '').trim(),
    }));
    if (formatted.some((entry) => !entry.password)) {
      setError('Every folder access must include a password.');
      return;
    }
    setSavingAccess(true);
    try {
      await updateUser(selectedUser.username, { access: formatted });
      setMessage('Updated folder access.');
      await loadUsers();
      onUsersChanged?.();
    } catch (err) {
      setError(err.message || 'Unable to update folder access.');
    } finally {
      setSavingAccess(false);
    }
  };

  const handleRoleChange = async (event) => {
    const role = event.target.value;
    if (!selectedUser || role === selectedUser.role) {
      return;
    }
    setError('');
    setMessage('');
    setUpdatingUser(true);
    try {
      await updateUser(selectedUser.username, { role });
      setMessage(`Updated role for ${selectedUser.username}.`);
      await loadUsers();
      onUsersChanged?.();
    } catch (err) {
      setError(err.message || 'Unable to update role.');
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) {
      return;
    }
    setError('');
    setMessage('');
    const password = window.prompt(`Enter a new password for ${selectedUser.username}`);
    if (!password) {
      setMessage('Password update cancelled.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    setUpdatingUser(true);
    try {
      await updateUser(selectedUser.username, { password });
      setMessage(`Password updated for ${selectedUser.username}.`);
      await loadUsers();
      onUsersChanged?.();
    } catch (err) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || selectedUser.username === 'Admin') {
      return;
    }
    setError('');
    setMessage('');
    const confirmed = window.confirm(`Remove user “${selectedUser.username}”?`);
    if (!confirmed) {
      return;
    }
    setUpdatingUser(true);
    try {
      await deleteUser(selectedUser.username);
      setMessage(`Removed ${selectedUser.username}.`);
      await loadUsers();
      onUsersChanged?.();
    } catch (err) {
      setError(err.message || 'Unable to delete user.');
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    const username = newUser.username.trim();
    const password = newUser.password;
    const role = ROLE_OPTIONS.find((option) => option.value === newUser.role)?.value || ROLE_OPTIONS[0].value;
    setError('');
    setMessage('');
    if (!username || !password) {
      setError('Username and password are required to create a user.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    setCreating(true);
    try {
      await createUser({ username, password, role });
      setMessage(`Created user ${username}.`);
      setNewUser(initialNewUser);
      await loadUsers();
      onUsersChanged?.();
    } catch (err) {
      setError(err.message || 'Unable to create user.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="glass-panel relative flex flex-col gap-5 overflow-hidden p-5">
        <div className="pointer-events-none chroma-grid" />
        <div className="relative z-10 space-y-1">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">User management</h2>
          <p className="text-sm font-medium text-slate-600">Review accounts, assign folder access, and manage credentials.</p>
        </div>
        {error && (
          <div
            className="relative z-10 rounded-2xl border border-rose-200/70 bg-rose-100/80 px-4 py-3 text-sm font-semibold text-rose-600 shadow-[0_12px_30px_-18px_rgba(244,63,94,0.45)]"
            role="alert"
          >
            {error}
          </div>
        )}
        {message && (
          <div
            className="relative z-10 rounded-2xl border border-emerald-200/70 bg-emerald-100/75 px-4 py-3 text-sm font-semibold text-emerald-600 shadow-[0_12px_30px_-18px_rgba(16,185,129,0.4)]"
            role="status"
          >
            {message}
          </div>
        )}
        <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-white/25 bg-white/30 text-sm font-semibold text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                Loading users…
              </div>
            ) : (
              <ul className="flex max-h-[360px] flex-col gap-2 overflow-y-auto pr-1">
                {users.map((user) => {
                  const isActive = user.username === selectedUsername;
                  return (
                    <li key={user.username}>
                      <button
                        type="button"
                        className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                          isActive
                            ? 'border-blue-400/70 bg-gradient-to-r from-blue-500/35 via-blue-500/15 to-purple-400/20 text-white shadow-[0_24px_45px_-30px_rgba(59,130,246,0.7)]'
                            : 'border-white/25 bg-white/25 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] hover:border-white/35 hover:bg-white/35'
                        }`}
                        onClick={() => handleSelectUser(user.username)}
                      >
                        <span className={isActive ? 'text-white' : 'text-slate-700'}>{user.username}</span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                            isActive ? 'bg-white/30 text-white' : 'bg-white/60 text-slate-600'
                          }`}
                        >
                          {user.role}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="flex flex-col gap-5">
            {selectedUser ? (
              <>
                <div className="glass-panel relative flex flex-col gap-4 overflow-hidden p-4">
                  <div className="pointer-events-none chroma-grid" />
                  <div className="relative z-10 flex flex-col gap-1">
                    <h3 className="text-lg font-semibold text-slate-900">{selectedUser.username}</h3>
                    <p className="text-xs font-medium text-slate-400">
                      Created {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : '—'}
                    </p>
                    <p className="text-xs font-medium text-slate-400">
                      Updated {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleString() : '—'}
                    </p>
                  </div>
                  <label className="relative z-10 flex flex-col gap-2 text-xs font-semibold text-slate-500">
                    <span>Role</span>
                    <select
                      value={selectedUser.role}
                      onChange={handleRoleChange}
                      disabled={updatingUser || selectedUser.username === 'Admin'}
                      className="w-full appearance-none rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="glass-panel relative flex flex-col gap-3 overflow-hidden p-4">
                  <div className="pointer-events-none chroma-grid" />
                  <div className="relative z-10 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">Folder access</h4>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/30 px-3 py-1 text-xs font-semibold text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:border-white/35 hover:bg-white/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={handleAddAccess}
                      disabled={savingAccess}
                    >
                      + Add access
                    </button>
                  </div>
                  {accessDraft.length === 0 && (
                    <p className="relative z-10 rounded-2xl border border-white/20 bg-white/25 px-4 py-3 text-sm font-medium text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                      No folders assigned yet.
                    </p>
                  )}
                  <div className="relative z-10 flex flex-col gap-3">
                    {accessDraft.map((entry, index) => (
                      <div
                        className="flex flex-col gap-2 rounded-2xl border border-white/30 bg-white/35 p-3 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.4)] sm:flex-row sm:items-center"
                        key={`${entry.path}-${index}`}
                      >
                        <input
                          type="text"
                          value={entry.path}
                          onChange={(event) => handleAccessChange(index, 'path', event.target.value)}
                          placeholder="Folder path (e.g. Projects/TeamA)"
                          className="w-full rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                        />
                        <input
                          type="text"
                          value={entry.password}
                          onChange={(event) => handleAccessChange(index, 'password', event.target.value)}
                          placeholder="Password"
                          className="w-full rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                        />
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/30 px-4 py-2 text-sm font-semibold text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition hover:border-white/35 hover:bg-white/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() => handleRemoveAccess(index)}
                          disabled={savingAccess}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="relative z-10 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_20px_45px_-24px_rgba(79,70,229,0.85)] transition hover:shadow-[0_25px_55px_-22px_rgba(79,70,229,0.9)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={handleSaveAccess}
                      disabled={savingAccess}
                    >
                      {savingAccess ? 'Saving…' : 'Save access'}
                    </button>
                  </div>
                </div>
                <div className="relative z-10 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/30 px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition hover:border-white/35 hover:bg-white/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleResetPassword}
                    disabled={updatingUser}
                  >
                    Reset password
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 via-rose-500 to-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-[0_20px_45px_-24px_rgba(244,63,94,0.65)] transition hover:shadow-[0_28px_55px_-22px_rgba(248,113,113,0.7)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleDeleteUser}
                    disabled={selectedUser.username === 'Admin' || updatingUser}
                  >
                    Delete user
                  </button>
                </div>
              </>
            ) : (
              <p className="relative z-10 rounded-2xl border border-white/20 bg-white/25 px-4 py-3 text-sm font-medium text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                Select a user to view details.
              </p>
            )}
          </div>
        </div>
      </div>
      <form className="glass-panel relative flex flex-col gap-5 overflow-hidden p-5" onSubmit={handleCreateUser}>
        <div className="pointer-events-none chroma-grid" />
        <div className="relative z-10 space-y-1">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Create new user</h2>
          <p className="text-sm font-medium text-slate-600">Add a new account and assign access later.</p>
        </div>
        <div className="relative z-10 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500 sm:text-sm">
            <span>Username</span>
            <input
              type="text"
              value={newUser.username}
              onChange={(event) => setNewUser((state) => ({ ...state, username: event.target.value }))}
              placeholder="Unique username"
              className="w-full rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500 sm:text-sm">
            <span>Password</span>
            <input
              type="password"
              value={newUser.password}
              onChange={(event) => setNewUser((state) => ({ ...state, password: event.target.value }))}
              placeholder="Temporary password"
              className="w-full rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500 sm:text-sm sm:col-span-2">
            <span>Role</span>
            <select
              value={newUser.role}
              onChange={(event) => setNewUser((state) => ({ ...state, role: event.target.value }))}
              className="w-full appearance-none rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="relative z-10 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_20px_45px_-24px_rgba(79,70,229,0.85)] transition hover:shadow-[0_25px_55px_-22px_rgba(79,70,229,0.9)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={creating}
          >
            {creating ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserManagementPanel;
