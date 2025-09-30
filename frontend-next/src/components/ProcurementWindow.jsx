import { useEffect, useMemo, useState } from 'react';
import {
  createProcurementRequest,
  getProcurementRequest,
  submitDepartmentReview,
  submitFinanceReview,
  submitProcurementSelection,
  submitReceipt,
  submitReceiptReview,
} from '../services/api.js';

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

const FORM_DEFAULTS = {
  title: '',
  department: '',
  description: '',
  justification: '',
  amount: '',
  currency: 'USD',
  neededBy: '',
  supplierPreference: '',
  notes: '',
  assignee: '',
  attachments: '',
};

const DEPARTMENT_OPTIONS = [
  'People Ops',
  'IT Desk',
  'Finance Desk',
  'Facilities',
  'Quality & Training',
  'Workforce',
  'Client Success',
  'Security & Compliance',
];

const DECISION_OPTIONS = [
  { value: 'approved', label: 'Approve' },
  { value: 'rejected', label: 'Reject' },
];

const parseAttachments = (raw) => {
  if (!raw) {
    return [];
  }
  return raw
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const formatDate = (value) => {
  if (!value) {
    return '—';
  }
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};

const ProcurementWindow = ({
  mode,
  formType = 'equipment',
  request = null,
  onClose,
  onSuccess,
}) => {
  const [formValues, setFormValues] = useState({ ...FORM_DEFAULTS, formType });
  const [decisionValues, setDecisionValues] = useState({ decision: 'approved', notes: '' });
  const [financeValues, setFinanceValues] = useState({ decision: 'approved', budgetCode: '', notes: '' });
  const [financeFinalValues, setFinanceFinalValues] = useState({
    decision: 'approved',
    invoiceNumber: '',
    paymentReference: '',
    notes: '',
  });
  const [procurementValues, setProcurementValues] = useState({
    supplier: '',
    poNumber: '',
    poDate: '',
    notes: '',
    emailLog: '',
  });
  const [receiptValues, setReceiptValues] = useState({ reference: '', notes: '', attachments: '' });
  const [receiptReviewValues, setReceiptReviewValues] = useState({ decision: 'approved', assignee: '', notes: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(request);
  const activeId = request?.id;

  useEffect(() => {
    if (mode !== 'details' && !['department', 'finance', 'finance-final', 'procurement', 'receipt-submit', 'receipt-review'].includes(mode)) {
      setCurrentRequest(request);
      return;
    }
    if (!activeId) {
      setCurrentRequest(null);
      return;
    }
    setLoading(true);
    getProcurementRequest(activeId)
      .then((data) => {
        setCurrentRequest(data.request || null);
        setError('');
      })
      .catch((err) => {
        setError(err.message || 'Unable to load request details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeId, mode, request]);

  useEffect(() => {
    setError('');
    setFormValues({ ...FORM_DEFAULTS, formType });
    if (currentRequest) {
      setDecisionValues({ decision: 'approved', notes: '' });
      setFinanceValues({ decision: 'approved', budgetCode: '', notes: '' });
      setFinanceFinalValues({ decision: 'approved', invoiceNumber: '', paymentReference: '', notes: '' });
      setProcurementValues({
        supplier: currentRequest.supplierPreference || '',
        poNumber: '',
        poDate: '',
        notes: '',
        emailLog: '',
      });
      setReceiptValues({ reference: '', notes: '', attachments: '' });
      setReceiptReviewValues({ decision: 'approved', assignee: currentRequest.assignee || '', notes: '' });
    }
  }, [mode, formType, currentRequest]);

  const title = useMemo(() => {
    switch (mode) {
      case 'create':
        return `New ${formType === 'software' ? 'software' : 'equipment'} request`;
      case 'department':
        return `Department review (${currentRequest?.id || ''})`;
      case 'finance':
        return `Finance budget review (${currentRequest?.id || ''})`;
      case 'finance-final':
        return `Finance invoice review (${currentRequest?.id || ''})`;
      case 'procurement':
        return `Procurement action (${currentRequest?.id || ''})`;
      case 'receipt-submit':
        return `Submit receipt (${currentRequest?.id || ''})`;
      case 'receipt-review':
        return `Receipt review (${currentRequest?.id || ''})`;
      case 'details':
        return `Request ${currentRequest?.id || ''}`;
      default:
        return 'Procurement';
    }
  }, [mode, formType, currentRequest?.id]);

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        formType,
        title: formValues.title,
        department: formValues.department,
        description: formValues.description,
        justification: formValues.justification,
        amount: formValues.amount,
        currency: formValues.currency,
        neededBy: formValues.neededBy,
        supplierPreference: formValues.supplierPreference,
        notes: formValues.notes,
        assignee: formValues.assignee,
        attachments: parseAttachments(formValues.attachments),
      };
      const { request: created } = await createProcurementRequest(payload);
      onSuccess?.(`Request ${created.id} submitted`);
    } catch (err) {
      setError(err.message || 'Unable to submit procurement request');
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionSubmit = async (event) => {
    event.preventDefault();
    if (!currentRequest) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { decision, notes } = decisionValues;
      const { request: updated } = await submitDepartmentReview(currentRequest.id, { decision, notes });
      onSuccess?.(`Updated ${updated.id}`);
    } catch (err) {
      setError(err.message || 'Unable to update request');
    } finally {
      setLoading(false);
    }
  };

  const handleFinanceSubmit = async (event) => {
    event.preventDefault();
    if (!currentRequest) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        decision: financeValues.decision,
        notes: financeValues.notes,
        budgetCode: financeValues.budgetCode,
      };
      const { request: updated } = await submitFinanceReview(currentRequest.id, payload);
      onSuccess?.(`Updated ${updated.id}`);
    } catch (err) {
      setError(err.message || 'Unable to update request');
    } finally {
      setLoading(false);
    }
  };

  const handleFinanceFinalSubmit = async (event) => {
    event.preventDefault();
    if (!currentRequest) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        decision: financeFinalValues.decision,
        notes: financeFinalValues.notes,
        invoiceNumber: financeFinalValues.invoiceNumber,
        paymentReference: financeFinalValues.paymentReference,
      };
      const { request: updated } = await submitFinanceReview(currentRequest.id, payload);
      onSuccess?.(`Updated ${updated.id}`);
    } catch (err) {
      setError(err.message || 'Unable to update request');
    } finally {
      setLoading(false);
    }
  };

  const handleProcurementSubmit = async (event) => {
    event.preventDefault();
    if (!currentRequest) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { request: updated } = await submitProcurementSelection(currentRequest.id, procurementValues);
      onSuccess?.(`Updated ${updated.id}`);
    } catch (err) {
      setError(err.message || 'Unable to update request');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptSubmit = async (event) => {
    event.preventDefault();
    if (!currentRequest) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        reference: receiptValues.reference,
        notes: receiptValues.notes,
        attachments: parseAttachments(receiptValues.attachments),
      };
      const { request: updated } = await submitReceipt(currentRequest.id, payload);
      onSuccess?.(`Updated ${updated.id}`);
    } catch (err) {
      setError(err.message || 'Unable to update request');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptReviewSubmit = async (event) => {
    event.preventDefault();
    if (!currentRequest) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        decision: receiptReviewValues.decision,
        notes: receiptReviewValues.notes,
        assignee: receiptReviewValues.assignee,
      };
      const { request: updated } = await submitReceiptReview(currentRequest.id, payload);
      onSuccess?.(`Updated ${updated.id}`);
    } catch (err) {
      setError(err.message || 'Unable to update request');
    } finally {
      setLoading(false);
    }
  };

  const renderFormBody = () => {
    switch (mode) {
      case 'create':
        return (
          <form className="space-y-5" onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                <span>Request title</span>
                <input
                  required
                  type="text"
                  value={formValues.title}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="e.g. 5 analyst laptops"
                  className="rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                <span>Department</span>
                <select
                  required
                  value={formValues.department}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, department: event.target.value }))
                  }
                  className="rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                >
                  <option value="">Select department</option>
                  {DEPARTMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                <span>Cost estimate</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formValues.amount}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  placeholder="e.g. 1200"
                  className="rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                <span>Currency</span>
                <input
                  type="text"
                  value={formValues.currency}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))
                  }
                  placeholder="USD"
                  className="uppercase rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>Description</span>
              <textarea
                required
                rows={4}
                value={formValues.description}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Outline what is needed and key specifications"
                className="rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>Business justification</span>
              <textarea
                rows={4}
                value={formValues.justification}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, justification: event.target.value }))
                }
                placeholder="Explain why this request is important now"
                className="rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                <span>Needed by</span>
                <input
                  type="date"
                  value={formValues.neededBy}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, neededBy: event.target.value }))
                  }
                  className="rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                <span>Preferred supplier</span>
                <input
                  type="text"
                  value={formValues.supplierPreference}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, supplierPreference: event.target.value }))
                  }
                  placeholder="Optional suggestion"
                  className="rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>Suggested assignee</span>
              <input
                type="text"
                value={formValues.assignee}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, assignee: event.target.value }))
                }
                placeholder="Who should receive the asset"
                className="rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>Notes to approver</span>
              <textarea
                rows={3}
                value={formValues.notes}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, notes: event.target.value }))
                }
                placeholder="Provide additional context for reviewers"
                className="rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>Attachments (comma or newline separated)</span>
              <textarea
                rows={2}
                value={formValues.attachments}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, attachments: event.target.value }))
                }
                placeholder="Shared drive links, specs, quotes"
                className="rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              />
            </label>
            <FormActions loading={loading} onClose={onClose} primaryLabel="Submit request" />
          </form>
        );
      case 'department':
        return (
          <form className="space-y-5" onSubmit={handleDecisionSubmit}>
            <DecisionSelect
              label="Decision"
              value={decisionValues.decision}
              onChange={(value) =>
                setDecisionValues((prev) => ({ ...prev, decision: value }))
              }
            />
            <NotesArea
              label="Notes for requester"
              value={decisionValues.notes}
              onChange={(value) =>
                setDecisionValues((prev) => ({ ...prev, notes: value }))
              }
            />
            <FormActions loading={loading} onClose={onClose} />
          </form>
        );
      case 'finance':
        return (
          <form className="space-y-5" onSubmit={handleFinanceSubmit}>
            <DecisionSelect
              label="Decision"
              value={financeValues.decision}
              onChange={(value) =>
                setFinanceValues((prev) => ({ ...prev, decision: value }))
              }
            />
            <InputField
              label="Budget / cost centre"
              placeholder="e.g. FIN-042"
              required={financeValues.decision === 'approved'}
              value={financeValues.budgetCode}
              onChange={(value) =>
                setFinanceValues((prev) => ({ ...prev, budgetCode: value }))
              }
            />
            <NotesArea
              label="Finance notes"
              value={financeValues.notes}
              onChange={(value) =>
                setFinanceValues((prev) => ({ ...prev, notes: value }))
              }
            />
            <FormActions loading={loading} onClose={onClose} />
          </form>
        );
      case 'finance-final':
        return (
          <form className="space-y-5" onSubmit={handleFinanceFinalSubmit}>
            <DecisionSelect
              label="Decision"
              value={financeFinalValues.decision}
              onChange={(value) =>
                setFinanceFinalValues((prev) => ({ ...prev, decision: value }))
              }
            />
            <InputField
              label="Invoice number"
              placeholder="e.g. INV-20017"
              required={financeFinalValues.decision === 'approved'}
              value={financeFinalValues.invoiceNumber}
              onChange={(value) =>
                setFinanceFinalValues((prev) => ({ ...prev, invoiceNumber: value }))
              }
            />
            <InputField
              label="Payment reference"
              placeholder="Bank transaction / receipt reference"
              required={financeFinalValues.decision === 'approved'}
              value={financeFinalValues.paymentReference}
              onChange={(value) =>
                setFinanceFinalValues((prev) => ({ ...prev, paymentReference: value }))
              }
            />
            <NotesArea
              label="Finance notes"
              value={financeFinalValues.notes}
              onChange={(value) =>
                setFinanceFinalValues((prev) => ({ ...prev, notes: value }))
              }
            />
            <FormActions loading={loading} onClose={onClose} />
          </form>
        );
      case 'procurement':
        return (
          <form className="space-y-5" onSubmit={handleProcurementSubmit}>
            <InputField
              label="Selected supplier"
              placeholder="Supplier name"
              required
              value={procurementValues.supplier}
              onChange={(value) =>
                setProcurementValues((prev) => ({ ...prev, supplier: value }))
              }
            />
            <InputField
              label="Purchase order number"
              placeholder="PO-000123"
              required
              value={procurementValues.poNumber}
              onChange={(value) =>
                setProcurementValues((prev) => ({ ...prev, poNumber: value }))
              }
            />
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>PO date</span>
              <input
                required
                type="date"
                value={procurementValues.poDate}
                onChange={(event) =>
                  setProcurementValues((prev) => ({ ...prev, poDate: event.target.value }))
                }
                className="rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              />
            </label>
            <NotesArea
              label="Notes"
              value={procurementValues.notes}
              onChange={(value) =>
                setProcurementValues((prev) => ({ ...prev, notes: value }))
              }
            />
            <NotesArea
              label="Email summary"
              placeholder="Record how the PO was issued"
              rows={2}
              value={procurementValues.emailLog}
              onChange={(value) =>
                setProcurementValues((prev) => ({ ...prev, emailLog: value }))
              }
            />
            <FormActions loading={loading} onClose={onClose} />
          </form>
        );
      case 'receipt-submit':
        return (
          <form className="space-y-5" onSubmit={handleReceiptSubmit}>
            <InputField
              label="Asset receipt reference"
              placeholder="e.g. Delivery note ID"
              required
              value={receiptValues.reference}
              onChange={(value) =>
                setReceiptValues((prev) => ({ ...prev, reference: value }))
              }
            />
            <NotesArea
              label="Notes"
              placeholder="Condition on arrival, serial numbers, etc."
              value={receiptValues.notes}
              onChange={(value) =>
                setReceiptValues((prev) => ({ ...prev, notes: value }))
              }
            />
            <NotesArea
              label="Attachments (comma or newline separated)"
              rows={2}
              value={receiptValues.attachments}
              onChange={(value) =>
                setReceiptValues((prev) => ({ ...prev, attachments: value }))
              }
            />
            <FormActions loading={loading} onClose={onClose} primaryLabel="Submit receipt" />
          </form>
        );
      case 'receipt-review':
        return (
          <form className="space-y-5" onSubmit={handleReceiptReviewSubmit}>
            <DecisionSelect
              label="Decision"
              value={receiptReviewValues.decision}
              onChange={(value) =>
                setReceiptReviewValues((prev) => ({ ...prev, decision: value }))
              }
            />
            <InputField
              label="Assign asset to"
              placeholder="Employee name or ID"
              value={receiptReviewValues.assignee}
              onChange={(value) =>
                setReceiptReviewValues((prev) => ({ ...prev, assignee: value }))
              }
            />
            <NotesArea
              label="Notes"
              placeholder="Confirmation details to share with finance"
              value={receiptReviewValues.notes}
              onChange={(value) =>
                setReceiptReviewValues((prev) => ({ ...prev, notes: value }))
              }
            />
            <FormActions loading={loading} onClose={onClose} />
          </form>
        );
      case 'details':
      default:
        if (loading) {
          return <p className="text-sm font-medium text-slate-500">Loading request…</p>;
        }
        if (!currentRequest) {
          return <p className="text-sm font-medium text-rose-600">Unable to load request.</p>;
        }
        return (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow label="Reference">{currentRequest.id}</DetailRow>
              <DetailRow label="Status">{STATUS_LABELS[currentRequest.status] || currentRequest.status}</DetailRow>
              <DetailRow label="Department">{currentRequest.department}</DetailRow>
              <DetailRow label="Type">{currentRequest.formType}</DetailRow>
              <DetailRow label="Requested by">{currentRequest.requester}</DetailRow>
              <DetailRow label="Needed by">{formatDate(currentRequest.neededBy)}</DetailRow>
              <DetailRow label="Estimate">
                {currentRequest.amount ? `${currentRequest.currency} ${currentRequest.amount}` : '—'}
              </DetailRow>
              <DetailRow label="Preferred supplier">{currentRequest.supplierPreference || '—'}</DetailRow>
              <DetailRow label="Assignee">{currentRequest.assignee || '—'}</DetailRow>
            </div>
            <DetailBlock title="Description" body={currentRequest.description} />
            <DetailBlock title="Business justification" body={currentRequest.justification} />
            {Array.isArray(currentRequest.attachments) && currentRequest.attachments.length > 0 && (
              <DetailBlock
                title="Attachments"
                body={
                  <ul className="list-disc pl-5">
                    {currentRequest.attachments.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                }
              />
            )}
            {Array.isArray(currentRequest.history) && currentRequest.history.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-600">Timeline</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  {currentRequest.history
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <li key={entry.id} className="rounded-2xl border border-white/35 bg-white/45 px-4 py-2">
                        <div className="flex justify-between text-xs font-semibold text-slate-500">
                          <span>{formatDate(entry.timestamp)}</span>
                          <span>{entry.actor}</span>
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-700">{entry.action}</div>
                        {entry.notes && <p className="text-xs text-slate-500">{entry.notes}</p>}
                      </li>
                    ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                className="rounded-full border border-white/40 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-600"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-40 overflow-auto bg-slate-900/60 px-4 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <div className="glass-panel relative flex flex-col gap-4 overflow-hidden p-6">
          <div className="pointer-events-none chroma-grid" />
          <header className="relative z-10 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
              {error && (
                <p className="mt-2 rounded-2xl border border-rose-200/70 bg-rose-100/75 px-3 py-2 text-sm font-semibold text-rose-700">
                  {error}
                </p>
              )}
            </div>
            <button
              type="button"
              className="glass-chip text-xs font-semibold"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </button>
          </header>
          <div className="relative z-10">
            {renderFormBody()}
          </div>
        </div>
      </div>
    </div>
  );
};

const FormActions = ({ loading, onClose, primaryLabel = 'Confirm' }) => (
  <div className="flex justify-end gap-3">
    <button
      type="button"
      className="rounded-full border border-white/40 bg-white/55 px-4 py-2 text-sm font-semibold text-slate-600"
      onClick={onClose}
      disabled={loading}
    >
      Cancel
    </button>
    <button
      type="submit"
      className="rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(79,70,229,0.75)]"
      disabled={loading}
    >
      {loading ? 'Saving…' : primaryLabel}
    </button>
  </div>
);

const DecisionSelect = ({ label, value, onChange }) => (
  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
    <span>{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
    >
      {DECISION_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const NotesArea = ({ label, value, onChange, placeholder = '', rows = 3 }) => (
  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
    <span>{label}</span>
    <textarea
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
    />
  </label>
);

const InputField = ({ label, value, onChange, placeholder = '', required = false }) => (
  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
    <span>{label}</span>
    <input
      required={required}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="rounded-2xl border border-white/35 bg-white/40 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
    />
  </label>
);

const DetailRow = ({ label, children }) => (
  <div>
    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
    <div className="text-sm font-semibold text-slate-700">{children}</div>
  </div>
);

const DetailBlock = ({ title, body }) => (
  <div>
    <h4 className="text-sm font-semibold text-slate-600">{title}</h4>
    <div className="mt-1 text-sm text-slate-600">{body || '—'}</div>
  </div>
);

export default ProcurementWindow;
