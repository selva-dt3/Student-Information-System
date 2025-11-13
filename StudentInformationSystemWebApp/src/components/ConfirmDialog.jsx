import React from "react";

/**
 * PUBLIC_INTERFACE
 * ConfirmDialog: Accessible confirm dialog for destructive actions
 */
export default function ConfirmDialog({ open, title = "Confirm", message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="sis-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="sis-modal">
        <h3 id="confirm-title">{title}</h3>
        <p>{message}</p>
        <div className="sis-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
