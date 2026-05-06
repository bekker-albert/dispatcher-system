"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

type UserProfileModalProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  disableClose?: boolean;
  onClose: () => void;
};

export function UserProfileModal({
  title,
  description,
  children,
  footer,
  disableClose = false,
  onClose,
}: UserProfileModalProps) {
  const requestClose = useCallback(() => {
    if (disableClose) return;
    onClose();
  }, [disableClose, onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div style={backdropStyle} onMouseDown={requestClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={modalStyle}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div style={headerStyle}>
          <div style={{ minWidth: 0 }}>
            <div style={titleStyle}>{title}</div>
            {description ? <div style={descriptionStyle}>{description}</div> : null}
          </div>
          <button type="button" onClick={requestClose} disabled={disableClose} style={closeButtonStyle} title="Закрыть">
            <X size={16} aria-hidden />
          </button>
        </div>

        <div style={bodyStyle}>{children}</div>
        {footer ? <div style={footerStyle}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

const backdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: "rgba(15, 23, 42, 0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 18,
};

const modalStyle: CSSProperties = {
  width: "min(760px, calc(100vw - 36px))",
  maxHeight: "calc(100vh - 36px)",
  overflow: "auto",
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  boxShadow: "0 24px 56px rgba(15, 23, 42, 0.24)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  padding: "14px 16px",
  borderBottom: "1px solid #e2e8f0",
};

const titleStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: 18,
  lineHeight: 1.2,
};

const descriptionStyle: CSSProperties = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 12,
  lineHeight: 1.35,
};

const closeButtonStyle: CSSProperties = {
  width: 30,
  height: 30,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  flex: "0 0 auto",
};

const bodyStyle: CSSProperties = {
  padding: 16,
};

const footerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  padding: "12px 16px",
  borderTop: "1px solid #e2e8f0",
};
