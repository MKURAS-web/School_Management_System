import React from 'react';

function ModalFooter({ children, align = 'right' }) {
    return (
        <div className="modal-actions" style={{ justifyContent: align === 'center' ? 'center' : 'flex-end' }}>
            {children}
        </div>
    );
}

export default ModalFooter;
