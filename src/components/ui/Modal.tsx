"use client";

import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";

export function Modal({
  title,
  trigger,
  children,
}: {
  title: string;
  trigger: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const modal = open ? (
    <div
      className="lp-modal-layer"
      role="presentation"
      style={overlayStyle}
      onMouseDown={() => setOpen(false)}
    >
      <section
        className="lp-modal lp-panel lp-padded-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={modalStyle}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="lp-modal-head">
          <h3 id={titleId}>{title}</h3>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)} aria-label={`Close ${title}`}>
            Close
          </Button>
        </div>
        {children}
      </section>
    </div>
  ) : null;

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {modal && typeof document !== "undefined" ? createPortal(modal, document.body) : null}
    </>
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  display: "grid",
  placeItems: "center",
  padding: 20,
  background: "rgba(19, 24, 43, 0.38)",
  backdropFilter: "blur(8px)",
};

const modalStyle: CSSProperties = {
  width: "min(560px, 100%)",
  maxHeight: "calc(100vh - 40px)",
  overflow: "auto",
  boxShadow: "0 24px 80px rgba(18, 23, 44, 0.28)",
};
