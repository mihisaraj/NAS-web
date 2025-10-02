import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { listProcurementRequests } from '../services/api.js';

const STATUS_LABELS = {
  department_review: 'Awaiting department approval',
  department_rejected: 'Rejected by department',
  finance_review: 'Awaiting finance budget review',
  finance_rejected: 'Rejected by finance',
  procurement: 'Awaiting procurement',
  po_sent: 'Purchase order sent',
  awaiting_receipt: 'Awaiting asset receipt',
  department_receipt_review: 'Receipt under department review',
  finance_invoice_review: 'Awaiting finance invoice check',
  completed: 'Completed',
};

const FORM_TYPES = [
  { key: 'equipment', label: 'Equipment' },
  { key: 'software', label: 'Software' },
];

const RoleCopy = {
  user: {
    title: 'Procurement requests',
    subtitle: 'Raise new equipment or software needs and track their progress.',
  },
  'dept-head': {
    title: 'Department approvals',
    subtitle: 'Review pending procurement requests and confirm asset receipts.',
  },
  finance: {
    title: 'Finance checkpoints',
    subtitle: 'Validate budgets and final invoices tied to procurement requests.',
  },
  procurement: {
    title: 'Procurement operations',
    subtitle: 'Select suppliers, issue purchase orders, and monitor fulfilment.',
  },
  admin: {
    title: 'Procurement oversight',
    subtitle: 'Full visibility into every procurement workflow and status.',
  },
};

const stageBadgeClass = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'finance_rejected':
    case 'department_rejected':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'finance_review':
    case 'finance_invoice_review':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'procurement':
    case 'po_sent':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-blue-100 text-blue-700 border-blue-200';
  }
};

const ProcurementWorkspace = forwardRef(({ role, currentUser, onOpenWindow }, ref) => {
  const copy = RoleCopy[role] || RoleCopy.user;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listProcurementRequests();
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (err) {
      setRequests([]);
      setError(err.message || 'Unable to load procurement requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [role]);

  useEffect(() => {
    if (!message) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setMessage(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const actionable = useMemo(() => {
    if (role === 'dept-head') {
      return requests.filter(
        (request) =>
          request.status === 'department_review' ||
          request.status === 'awaiting_receipt' ||
          request.status === 'department_receipt_review'
      );
    }
    if (role === 'finance') {
      return requests.filter(
        (request) =>
          request.status === 'finance_review' || request.status === 'finance_invoice_review'
      );
    }
    if (role === 'procurement') {
      return requests.filter(
        (request) => request.status === 'procurement' || request.status === 'po_sent'
      );
    }
    if (role === 'user' && currentUser?.username) {
      return requests.filter((request) => request.requester === currentUser.username);
    }
    return requests;
  }, [requests, role, currentUser?.username]);

  const openWindow = (payload) => {
    if (typeof onOpenWindow === 'function') {
      onOpenWindow(payload);
    }
  };

  const handleCreateRequest = (formType) => {
    openWindow({ type: 'create', formType });
  };

  const handleViewDetails = (request) => {
    openWindow({ type: 'details', request });
  };

  const renderActionButtons = (request) => {
    if (role === 'user') {
      const username = currentUser?.username;
      const isOwner = username && request.requester === username;
      if (!isOwner) {
        return null;
      }
      const canSubmitReceipt =
        request.status === 'po_sent' ||
        request.status === 'awaiting_receipt' ||
        request.assetReceipt?.status === 'pending';
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-white/25 bg-white/35 px-3 py-1 text-xs font-semibold text-blue-600"
            onClick={() => handleViewDetails(request)}
          >
            View details
          </button>
          {canSubmitReceipt && (
            <button
              type="button"
              className="rounded-full bg-blue-500/90 px-3 py-1 text-xs font-semibold text-white shadow-[0_12px_30px_-18px_rgba(37,99,235,0.7)]"
              onClick={() => openWindow({ type: 'receipt-submit', request })}
            >
              Submit receipt
            </button>
          )}
        </div>
      );
    }

    if (role === 'dept-head') {
      const canDepartmentApprove = request.status === 'department_review';
      const canReceiptApprove =
        request.status === 'awaiting_receipt' || request.status === 'department_receipt_review';
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-white/25 bg-white/35 px-3 py-1 text-xs font-semibold text-slate-600"
            onClick={() => handleViewDetails(request)}
          >
            Details
          </button>
          {canDepartmentApprove && (
            <button
              type="button"
              className="rounded-full bg-blue-500/90 px-3 py-1 text-xs font-semibold text-white"
              onClick={() => openWindow({ type: 'department', request })}
            >
              Review request
            </button>
          )}
          {canReceiptApprove && (
            <button
              type="button"
              className="rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white"
              onClick={() => openWindow({ type: 'receipt-review', request })}
            >
              Review receipt
            </button>
          )}
        </div>
      );
    }

    if (role === 'finance') {
      const isBudget = request.status === 'finance_review';
      const isInvoice = request.status === 'finance_invoice_review';
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-white/25 bg-white/35 px-3 py-1 text-xs font-semibold text-slate-600"
            onClick={() => handleViewDetails(request)}
          >
            Details
          </button>
          {(isBudget || isInvoice) && (
            <button
              type="button"
              className="rounded-full bg-indigo-500/90 px-3 py-1 text-xs font-semibold text-white"
              onClick={() => openWindow({ type: isBudget ? 'finance' : 'finance-final', request })}
            >
              {isBudget ? 'Budget review' : 'Invoice review'}
            </button>
          )}
        </div>
      );
    }

    if (role === 'procurement') {
      const canAction = request.status === 'procurement';
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-white/25 bg-white/35 px-3 py-1 text-xs font-semibold text-slate-600"
            onClick={() => handleViewDetails(request)}
          >
            Details
          </button>
          {canAction && (
            <button
              type="button"
              className="rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-white"
              onClick={() => openWindow({ type: 'procurement', request })}
            >
              Select supplier
            </button>
          )}
        </div>
      );
    }

    return (
      <button
        type="button"
        className="rounded-full border border-white/25 bg-white/35 px-3 py-1 text-xs font-semibold text-slate-600"
        onClick={() => handleViewDetails(request)}
      >
        View
      </button>
    );
  };

  useImperativeHandle(ref, () => ({
    openForm: (formType) => handleCreateRequest(formType),
    refresh,
    flashMessage: (text) => setMessage(text || ''),
  }));

  return (
    <section className="glass-panel relative flex flex-col gap-5 overflow-hidden p-5">
      <div className="pointer-events-none chroma-grid" />
      <header className="relative z-10 flex flex-col gap-1">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{copy.title}</h2>
        <p className="text-sm font-medium text-slate-600">{copy.subtitle}</p>
      </header>
      {message && (
        <div className="relative z-10 rounded-2xl border border-emerald-200/70 bg-emerald-100/70 px-4 py-2 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="relative z-10 rounded-2xl border border-rose-200/70 bg-rose-100/70 px-4 py-2 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}
      <div className="relative z-10 flex flex-wrap items-center gap-3">
        {role === 'user' && (
          FORM_TYPES.map((option) => (
            <button
              key={option.key}
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/35 px-4 py-2 text-sm font-semibold text-blue-600 shadow-[0_18px_35px_-28px_rgba(37,99,235,0.65)] transition hover:border-white/45 hover:bg-white/45"
              onClick={() => handleCreateRequest(option.key)}
            >
              + New {option.label} request
            </button>
          ))
        )}
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/35 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-white/45 hover:bg-white/45"
          onClick={refresh}
        >
          ↻ Refresh
        </button>
      </div>
      <div className="relative z-10 overflow-hidden rounded-2xl border border-white/25 bg-white/40 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.5)]">
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center text-sm font-semibold text-slate-500">
            Loading requests…
          </div>
        ) : actionable.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center text-sm font-semibold text-slate-500">
            <span>No procurement requests found.</span>
            {role === 'user' && (
              <span className="text-xs font-medium text-slate-400">
                Use the buttons above to raise a new request.
              </span>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/50 text-sm text-slate-700">
              <thead className="bg-white/60 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {actionable.map((request) => (
                  <tr key={request.id} className="bg-white/55">
                    <td className="px-4 py-3 font-semibold text-slate-900">{request.id}</td>
                    <td className="px-4 py-3">{request.title}</td>
                    <td className="px-4 py-3">{request.department}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stageBadgeClass(request.status)}`}
                      >
                        {STATUS_LABELS[request.status] || request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {request.updatedAt ? new Date(request.updatedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">{renderActionButtons(request)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
});

export default ProcurementWorkspace;

