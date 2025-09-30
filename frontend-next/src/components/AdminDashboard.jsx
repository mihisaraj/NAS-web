import FileManager from './FileManager.jsx';
import UserManagementPanel from './UserManagementPanel.jsx';
import ChangePasswordForm from './ChangePasswordForm.jsx';
import ProtocolHub from './ProtocolHub.jsx';
import NoticeBoard from './NoticeBoard.jsx';

const AdminDashboard = ({ user, onPasswordChange, onRefreshUser }) => (
  <div className="flex flex-col gap-7 text-slate-900">
    <header className="glass-panel relative flex flex-col gap-4 overflow-hidden p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="pointer-events-none chroma-grid" />
      <div className="relative z-10 space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">
          Admin Control
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[2rem]">
            Welcome, {user.username}
          </h1>
          <p className="text-sm font-medium text-slate-600 sm:text-base">
            You have administrator access to the HTS NAS.
          </p>
        </div>
      </div>
      <span className="relative z-10 glass-chip text-xs tracking-[0.35em] text-blue-700">Administrator</span>
    </header>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <section>
          <FileManager
            title="NAS file explorer"
            subtitle="Manage all files and folders stored on the NAS."
          />
        </section>

        <section>
          <UserManagementPanel onUsersChanged={onRefreshUser} />
        </section>
      </div>

      <div className="flex flex-col gap-6">
        <section>
          <ProtocolHub />
        </section>

        <section>
          <NoticeBoard currentUser={user} />
        </section>

        <section>
          <ChangePasswordForm title="Update your administrator password" onSubmit={onPasswordChange} />
        </section>
      </div>
    </div>
  </div>
);

export default AdminDashboard;
