"use client";

import { TriangleAlert, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useConfirm } from "@/lib/ui/confirm";
import { Modal } from "./modal";

/**
 * Renders ConfirmService requests. Mounted once, in the admin layout / shell.
 */
export function ConfirmDialog() {
  const { current, accept, cancel } = useConfirm();
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (current) {
      setReason("");
      setTyped("");
    }
  }, [current]);

  if (!current) {
    return null;
  }

  const reasonRequired =
    Boolean(current.reasonLabel) && current.reasonRequired !== false;

  const canConfirm = (() => {
    if (reasonRequired && !reason.trim()) {
      return false;
    }
    if (current.typeToConfirm && typed.trim() !== current.typeToConfirm) {
      return false;
    }
    return true;
  })();

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!canConfirm) return;
    accept(reason.trim());
  };

  return (
    <Modal
      open={Boolean(current)}
      onClose={cancel}
      role="alertdialog"
      className="sm:max-w-md"
      overlayClassName="z-60"
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* Head */}
        <div className="ui-modal-head">
          <div className="flex min-w-0 items-center gap-2">
            {current.tone === "danger" && (
              <TriangleAlert size={18} className="shrink-0 text-ui-danger" />
            )}
            <h2 className="ui-modal-title">{current.title}</h2>
          </div>
          <button
            type="button"
            className="ui-icon-btn min-h-[40px] min-w-[40px] sm:min-h-[32px] sm:min-w-[32px]"
            aria-label="Close dialog"
            onClick={cancel}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="ui-modal-body space-y-4">
          {current.message && (
            <p className="text-sm text-ui-body">{current.message}</p>
          )}

          {current.reasonLabel && (
            <div>
              <label htmlFor="confirm-reason" className="ui-label">
                {current.reasonLabel}
                {reasonRequired && (
                  <span className="text-ui-danger" aria-hidden="true">
                    *
                  </span>
                )}
              </label>
              <textarea
                id="confirm-reason"
                className="ui-input"
                rows={3}
                maxLength={500}
                data-autofocus
                placeholder={current.reasonPlaceholder ?? ""}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    handleSubmit(e);
                  }
                }}
              />
            </div>
          )}

          {current.typeToConfirm && (
            <div>
              <label htmlFor="confirm-typed" className="ui-label">
                Type{" "}
                <span className="font-mono font-semibold text-ui-ink">
                  {current.typeToConfirm}
                </span>{" "}
                to confirm
              </label>
              <input
                id="confirm-typed"
                className="ui-input font-mono"
                autoComplete="off"
                spellCheck={false}
                data-autofocus={current.reasonLabel ? undefined : ""}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Foot */}
        <div className="ui-modal-foot">
          <button
            type="button"
            className="ui-btn min-h-[40px] sm:min-h-[36px]"
            onClick={cancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`ui-btn min-h-[40px] sm:min-h-[36px] ${
              current.tone === "danger" ? "ui-btn-danger" : "ui-btn-primary"
            }`}
            disabled={!canConfirm}
            data-autofocus={
              current.reasonLabel || current.typeToConfirm ? undefined : ""
            }
          >
            {current.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
