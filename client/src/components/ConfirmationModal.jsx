import React from 'react';
import './ConfirmationModal.css';

function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, type = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <span className="confirm-icon">
          {type === 'danger' ? '⚠️' : 'ℹ️'}
        </span>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button onClick={onCancel} className="btn-cancel">
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={`btn-confirm ${type}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
