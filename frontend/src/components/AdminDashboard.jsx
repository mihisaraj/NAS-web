import { useState } from 'react';
import FileManager from './FileManager.jsx';
import UserManagementPanel from './UserManagementPanel.jsx';
import ProtocolHub from './ProtocolHub.jsx';
import NoticeBoard from './NoticeBoard.jsx';
import AdminHero from './admin/AdminHero.jsx';
import AdminControlPanel from './admin/AdminControlPanel.jsx';
import AdminSettingsOverlay from './admin/AdminSettingsOverlay.jsx';

const AdminDashboard = ({ user, onPasswordChange, onRefreshUser }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-7 text-slate-900">
      <AdminHero user={user} onOpenSettings={() => setSettingsOpen(true)} />

      <AdminControlPanel
        primary={[
          <section key="file-manager">
            <FileManager title="NAS file explorer" subtitle="Manage all files and folders stored on the NAS." />
          </section>,
          <section key="user-management">
            <UserManagementPanel onUsersChanged={onRefreshUser} />
          </section>,
        ]}
        secondary={[
          <section key="protocols">
            <ProtocolHub />
          </section>,
          <section key="notices">
            <NoticeBoard currentUser={user} />
          </section>,
        ]}
      />

      {settingsOpen ? (
        <AdminSettingsOverlay
          user={user}
          onClose={() => setSettingsOpen(false)}
          onProfileUpdated={onRefreshUser}
          onPasswordChange={onPasswordChange}
        />
      ) : null}
    </div>
  );
};

export default AdminDashboard;
