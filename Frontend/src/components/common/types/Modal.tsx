import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  disableBackdropClose?: boolean; // new prop!
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  disableBackdropClose = false, // default is false
}: ModalProps) {
  if (!open) return null;

  return createPortal(
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
    {/* Overlay comes first */}
    <div
      className="fixed inset-0"
      onClick={disableBackdropClose ? undefined : onClose}
      tabIndex={-1}
      aria-hidden="true"
    />
    {/* Modal content box */}
    <div
      className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl relative z-10"
      onClick={e => e.stopPropagation()}
    >
      {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
      {children}
      <button
        onClick={onClose}
        className="absolute top-3 right-4 text-gray-400 text-lg hover:text-gray-600 cursor-pointer"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  </div>,
  document.body
);
}
