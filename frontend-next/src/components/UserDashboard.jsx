import { useEffect, useMemo, useRef, useState } from 'react';
import FileManager from './FileManager.jsx';
import AccessList from './AccessList.jsx';
import ChangePasswordForm from './ChangePasswordForm.jsx';
import ProtocolHub from './ProtocolHub.jsx';
import NoticeBoard from './NoticeBoard.jsx';
import ProcurementWorkspace from './ProcurementWorkspace.jsx';
import ProcurementWindow from './ProcurementWindow.jsx';

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

const UserDashboard = ({ user, onPasswordChange }) => {
  const accessList = Array.isArray(user.access) ? user.access : [];
  const [selectedPath, setSelectedPath] = useState(accessList[0]?.path || '');
  const procurementRef = useRef(null);
  const [windowState, setWindowState] = useState(null);

  useEffect(() => {
    setSelectedPath(accessList[0]?.path || '');
  }, [user.username, accessList]);

  const passwordLookup = useMemo(() => {
    return (path) => {
      const normalized = normalizePath(path);
      const match = accessList.find((entry) => normalizePath(entry.path || '') === normalized);
      return match?.password;
    };
  }, [accessList]);

  const hasAssignedAccess = accessList.length > 0;

  const handleProtocolAction = (action) => {
    if (!procurementRef.current) {
      return;
    }
    if (action === 'procurement:create-equipment') {
      procurementRef.current.openForm('equipment');
    } else if (action === 'procurement:create-software') {
      procurementRef.current.openForm('software');
    }
  };

  const handleOpenWindow = (payload) => {
    setWindowState(payload || null);
  };

  const handleWindowClose = () => {
    setWindowState(null);
  };

  const handleWindowSuccess = (message) => {
    procurementRef.current?.refresh();
    if (message) {
      procurementRef.current?.flashMessage(message);
    }
    setWindowState(null);
  };

  return (
    <div className="flex flex-col gap-7 text-slate-900">
      <header className="glass-panel relative flex flex-col gap-4 overflow-hidden p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="pointer-events-none chroma-grid" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">
            User Workspace
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-[2rem]">
              Welcome, {user.username}
            </h1>
            <p className="text-sm font-medium text-slate-600 sm:text-base">
              Browse and manage the folders shared with your account.
            </p>
          </div>
        </div>
        <span className="relative z-10 glass-chip text-xs tracking-[0.35em] text-blue-700">Member</span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <section>
            <AccessList access={accessList} selectedPath={selectedPath} onSelect={setSelectedPath} />
          </section>

          {hasAssignedAccess && (
            <section>
              <FileManager
                title="Your file explorer"
                subtitle="All changes you make stay within your assigned folders."
                initialPath={selectedPath}
                rootPath={selectedPath}
                allowLockToggle={false}
                passwordLookup={passwordLookup}
              />
            </section>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <section>
            <ProtocolHub onAction={handleProtocolAction} />
          </section>

          <section>
            <ProcurementWorkspace
              ref={procurementRef}
              role={user.role}
              currentUser={user}
              onOpenWindow={handleOpenWindow}
            />
          </section>

          <section>
            <NoticeBoard currentUser={user} />
          </section>

          <section>
            <ChangePasswordForm title="Update your password" onSubmit={onPasswordChange} />
          </section>
        </div>
    </div>
      {windowState && (
        <ProcurementWindow
          mode={windowState.type}
          formType={windowState.formType}
          request={windowState.request}
          onClose={handleWindowClose}
          onSuccess={handleWindowSuccess}
        />
      )}
    </div>
  );
};

export default UserDashboard;
