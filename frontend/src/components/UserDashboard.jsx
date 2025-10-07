"use client";

import { useEffect, useRef, useState } from "react";
import FileManager from "./FileManager.jsx";
import AccessList from "./AccessList.jsx";
import ChangePasswordForm from "./ChangePasswordForm.jsx";
import ProtocolHub from "./ProtocolHub.jsx";
import NoticeBoard from "./NoticeBoard.jsx";
import ProcurementWorkspace from "./ProcurementWorkspace.jsx";
import ProcurementWindow from "./ProcurementWindow.jsx";

const UserDashboard = ({ user, onPasswordChange }) => {
  const accessList = Array.isArray(user.access) ? user.access : [];
  const [selectedPath, setSelectedPath] = useState(accessList[0]?.path || "");
  const procurementRef = useRef(null);
  const [windowState, setWindowState] = useState(null);

  useEffect(() => {
    setSelectedPath(accessList[0]?.path || "");
  }, [user.username, accessList]);

  const hasAssignedAccess = accessList.length > 0;

  const handleProtocolAction = (action) => {
    if (!procurementRef.current) return;
    if (action === "procurement:create-equipment") {
      procurementRef.current.openForm("equipment");
    } else if (action === "procurement:create-software") {
      procurementRef.current.openForm("software");
    }
  };

  const handleOpenWindow = (payload) => setWindowState(payload || null);
  const handleWindowClose = () => setWindowState(null);

  const handleWindowSuccess = (message) => {
    procurementRef.current?.refresh();
    if (message) procurementRef.current?.flashMessage(message);
    setWindowState(null);
  };

  return (
    <div className="flex flex-col gap-10 text-slate-900 relative">
      {/* HEADER */}
      <header className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
        {/* soft glow */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-200/30 via-transparent to-indigo-200/25 blur-2xl opacity-70" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-blue-700">
              User Workspace
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800 drop-shadow-sm">
                Welcome, {user.username}
              </h1>
              <p className="text-sm font-medium text-slate-600 sm:text-base">
                Manage your assigned folders, procurement tasks, and notices — all from one place.
              </p>
            </div>
          </div>

          <span className="rounded-full border border-white/25 bg-white/40 backdrop-blur-md px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-700 shadow-inner">
            Member
          </span>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* LEFT SIDE */}
        <div className="flex flex-col gap-8">
          {/* Access List */}
          <section className="rounded-2xl border border-white/20 bg-white/20 backdrop-blur-xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
            <AccessList
              access={accessList}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
            />
          </section>

          {/* File Manager */}
          {hasAssignedAccess && (
            <section className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl p-5 shadow-[0_6px_20px_rgba(0,0,0,0.1)]">
              <FileManager
                title="Your File Explorer"
                subtitle="Changes you make stay within your assigned folders."
                initialPath={selectedPath}
                rootPath={selectedPath}
                allowLockToggle
              />
            </section>
          )}
        </div>

        {/* RIGHT SIDE PANELS */}
        <div className="flex flex-col gap-8">
          <section className="rounded-2xl border border-white/20 bg-white/20 backdrop-blur-xl p-5 shadow-inner">
            <ProtocolHub onAction={handleProtocolAction} />
          </section>

          <section className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl p-5 shadow-[0_6px_20px_rgba(0,0,0,0.1)]">
            <ProcurementWorkspace
              ref={procurementRef}
              role={user.role}
              currentUser={user}
              onOpenWindow={handleOpenWindow}
            />
          </section>

          <section className="rounded-2xl border border-white/20 bg-white/20 backdrop-blur-xl p-5 shadow-inner">
            <NoticeBoard currentUser={user} />
          </section>

          <section className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl p-5 shadow-[0_6px_20px_rgba(0,0,0,0.1)]">
            <ChangePasswordForm title="Update Your Password" onSubmit={onPasswordChange} />
          </section>
        </div>
      </div>

      {/* FLOATING PROCUREMENT WINDOW */}
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
