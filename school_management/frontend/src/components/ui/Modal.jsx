import React, { useEffect, useRef } from 'react';

function Modal({ open, title, children, onClose }) {
    const backdropRef = useRef(null);
    const dialogRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        // Focus first focusable element in modal
        const dialog = dialogRef.current;
        const focusable = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length) focusable[0].focus();

        // Trap focus inside modal
        const handleKey = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose && onClose();
                return;
            }

            if (e.key !== 'Tab') return;

            const focusableEls = Array.from(focusable).filter((el) => !el.disabled && el.offsetParent !== null);
            if (focusableEls.length === 0) return;

            const firstEl = focusableEls[0];
            const lastEl = focusableEls[focusableEls.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstEl) {
                    e.preventDefault();
                    lastEl.focus();
                }
            } else {
                if (document.activeElement === lastEl) {
                    e.preventDefault();
                    firstEl.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKey);

        return () => document.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="modal-backdrop" ref={backdropRef} onMouseDown={onClose}>
            <div className="modal" ref={dialogRef} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                {title && (
                    <div className="modal-header">
                        <h3>{title}</h3>
                        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
                    </div>
                )}

                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
}

export default Modal;
