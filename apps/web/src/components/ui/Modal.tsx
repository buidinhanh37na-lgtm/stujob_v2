"use client";

import { useEffect, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { backdropVariants, modalVariants } from "@/components/motion/variants";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
  footer?: ReactNode;
  hideClose?: boolean;
  closeOnBackdrop?: boolean;
}

const SIZE_CLASS: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  icon,
  size = "md",
  children,
  footer,
  hideClose = false,
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          variants={backdropVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          onClick={(e) =>
            closeOnBackdrop && e.target === e.currentTarget && onClose()
          }
        >
          <motion.div
            className={`bg-white rounded-2xl w-full ${SIZE_CLASS[size]} shadow-2xl my-8 max-h-[90vh] flex flex-col`}
            variants={modalVariants}
          >
            {(title || !hideClose) && (
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  {icon}
                  {title && (
                    <h3 className="font-bold text-slate-900 truncate">
                      {title}
                    </h3>
                  )}
                </div>
                {!hideClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 flex-shrink-0 transition"
                    aria-label="Đóng"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            <div className="p-5 overflow-y-auto flex-1">{children}</div>

            {footer && (
              <div className="border-t border-slate-200 px-5 py-3 flex justify-end gap-2 flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}