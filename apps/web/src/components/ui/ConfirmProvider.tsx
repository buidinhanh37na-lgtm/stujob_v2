"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { ConfirmDialog } from "./ConfirmDialog";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  withReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequired?: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<string | null>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

interface PendingState {
  options: ConfirmOptions | null;
  resolve: ((value: string | null) => void) | null;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingState>({
    options: null,
    resolve: null,
  });

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<string | null> => {
      return new Promise((resolve) => {
        setPending({ options, resolve });
      });
    },
    []
  );

  function handleConfirm(reason: string) {
    pending.resolve?.(reason);
    setPending({ options: null, resolve: null });
  }

  function handleClose() {
    pending.resolve?.(null);
    setPending({ options: null, resolve: null });
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        open={!!pending.options}
        title={pending.options?.title}
        message={pending.options?.message || ""}
        confirmLabel={pending.options?.confirmLabel}
        cancelLabel={pending.options?.cancelLabel}
        variant={pending.options?.variant}
        withReason={pending.options?.withReason}
        reasonLabel={pending.options?.reasonLabel}
        reasonPlaceholder={pending.options?.reasonPlaceholder}
        reasonRequired={pending.options?.reasonRequired}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used inside <ConfirmProvider>");
  }
  return ctx.confirm;
}