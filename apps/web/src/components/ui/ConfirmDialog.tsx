"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "./Modal";

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  withReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequired?: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
  onClose: () => void;
}

const VARIANT = {
  danger: {
    icon: "bg-red-100 text-red-600",
    btn: "bg-red-500 hover:bg-red-600",
  },
  warning: {
    icon: "bg-amber-100 text-amber-600",
    btn: "bg-amber-500 hover:bg-amber-600",
  },
  info: {
    icon: "bg-blue-100 text-blue-600",
    btn: "bg-indigo-500 hover:bg-indigo-600",
  },
};

export function ConfirmDialog({
  open,
  title = "Xác nhận",
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  variant = "info",
  withReason = false,
  reasonLabel = "Lý do",
  reasonPlaceholder = "Nhập lý do...",
  reasonRequired = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const v = VARIANT[variant];

  async function handleConfirm() {
    if (withReason && reasonRequired && !reason.trim()) return;
    setBusy(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
    } finally {
      setBusy(false);
    }
  }

  function handleClose() {
    if (busy) return;
    setReason("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition disabled:opacity-50 ${v.btn}`}
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${v.icon}`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
          <p className="text-sm text-slate-600 whitespace-pre-line">
            {message}
          </p>

          {withReason && (
            <div className="mt-4">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                {reasonLabel}
                {reasonRequired && <span className="text-red-500"> *</span>}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                rows={3}
                disabled={busy}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50"
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}