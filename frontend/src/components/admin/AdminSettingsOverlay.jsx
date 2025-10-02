import AccountSettingsCard from './AccountSettingsCard.jsx';
import ChangePasswordForm from '../ChangePasswordForm.jsx';

const AdminSettingsOverlay = ({ user, onClose, onProfileUpdated, onPasswordChange }) => (
  <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/75 backdrop-blur">
    <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col gap-6 overflow-y-auto rounded-3xl border border-white/20 bg-white/70 p-6 shadow-[0_40px_80px_-35px_rgba(15,23,42,0.65)]">
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Workspace settings</h2>
          <p className="text-sm font-medium text-slate-600">
            Adjust your administrator account, update your password, and manage personal preferences.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/60 text-slate-600 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          aria-label="Close settings"
        >
          ×
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <AccountSettingsCard user={user} onProfileUpdated={onProfileUpdated} />
        <ChangePasswordForm title="Update your password" onSubmit={onPasswordChange} />
      </div>
    </div>
  </div>
);

export default AdminSettingsOverlay;
