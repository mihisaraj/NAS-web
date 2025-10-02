import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DialogContext } from './DialogContext.jsx';

const defaultLabels = {
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  acknowledgeLabel: 'OK',
};

const DialogOverlay = ({
  dialog,
  inputValue,
  onInputChange,
  onConfirm,
  onCancel,
}) => {
  const {
    title,
    message,
    variant,
    confirmLabel,
    cancelLabel,
    acknowledgeLabel,
    placeholder,
    description,
    destructive,
  } = dialog;

  const renderActions = () => {
    if (variant === 'alert') {
      return (
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex min-w-[120px] items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_20px_45px_-24px_rgba(79,70,229,0.85)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {acknowledgeLabel || defaultLabels.acknowledgeLabel}
        </button>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-w-[120px] items-center justify-center rounded-full border border-white/40 bg-white/30 px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.3)] transition hover:bg-white/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
        >
          {cancelLabel || defaultLabels.cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`inline-flex min-w-[120px] items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-[0_20px_45px_-24px_rgba(79,70,229,0.85)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
            destructive
              ? 'bg-gradient-to-r from-rose-500 via-rose-500 to-orange-500 hover:shadow-[0_25px_55px_-20px_rgba(244,63,94,0.6)]'
              : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:shadow-[0_25px_55px_-20px_rgba(79,70,229,0.9)]'
          }`}
        >
          {confirmLabel || defaultLabels.confirmLabel}
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/70 backdrop-blur">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-white/60 p-6 text-slate-900 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.55)]">
        <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/40" aria-hidden="true" />
        <div className="relative space-y-4">
          {title ? <h2 className="text-xl font-bold text-slate-900">{title}</h2> : null}
          {description ? (
            <p className="text-sm font-medium text-slate-600">{description}</p>
          ) : null}
          {message ? (
            <p className="whitespace-pre-line text-sm font-medium text-slate-700">{message}</p>
          ) : null}
          {variant === 'prompt' ? (
            <input
              type={dialog.inputType || 'text'}
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder={placeholder}
              className="w-full rounded-2xl border border-white/45 bg-white/55 px-4 py-2.5 text-sm font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
              autoFocus
            />
          ) : null}
          <div className="flex items-center justify-end gap-3 pt-2">{renderActions()}</div>
        </div>
      </div>
    </div>
  );
};

const DialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const resolverRef = useRef(null);

  const closeDialog = useCallback(
    (result) => {
      const resolver = resolverRef.current;
      resolverRef.current = null;
      setDialog(null);
      setInputValue('');
      if (resolver) {
        resolver(result);
      }
    },
    []
  );

  const openDialog = useCallback((nextDialog) => {
    if (!nextDialog) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setInputValue(nextDialog.defaultValue || '');
      setDialog(nextDialog);
    });
  }, []);

  const confirm = useCallback(
    (options = {}) =>
      openDialog({ variant: 'confirm', destructive: Boolean(options.destructive), ...options }).then(
        (result) => Boolean(result && result.confirmed)
      ),
    [openDialog]
  );

  const alert = useCallback(
    (options = {}) =>
      openDialog({ variant: 'alert', ...options }).then((result) => Boolean(result && result.confirmed)),
    [openDialog]
  );

  const prompt = useCallback(
    (options = {}) =>
      openDialog({ variant: 'prompt', ...options }).then((result) => {
        if (!result || !result.confirmed) {
          return null;
        }
        return 'value' in result ? result.value : inputValue;
      }),
    [openDialog, inputValue]
  );

  const handleConfirm = useCallback(() => {
    if (!dialog) {
      return;
    }
    if (dialog.variant === 'prompt') {
      closeDialog({ confirmed: true, value: inputValue });
      return;
    }
    closeDialog({ confirmed: true });
  }, [closeDialog, dialog, inputValue]);

  const handleCancel = useCallback(() => {
    closeDialog({ confirmed: false });
  }, [closeDialog]);

  const contextValue = useMemo(
    () => ({
      confirm,
      alert,
      prompt,
    }),
    [alert, confirm, prompt]
  );

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      {dialog ? (
        <DialogOverlay
          dialog={dialog}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      ) : null}
    </DialogContext.Provider>
  );
};

export default DialogProvider;
