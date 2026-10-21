import Modal from '../../../components/ui/Modal';
import ModalFooter from '../../../components/ui/ModalFooter';

function ConfirmModal({
    isOpen,
    title = 'Delete School',
    message,
    onConfirm,
    onCancel,
    loading = false,
}) {
    return (
        <Modal open={isOpen} title={title} onClose={onCancel}>
            <div className="confirm-icon">!</div>

            <p>{message}</p>

            <ModalFooter>
                <button
                    type="button"
                    className="cancel-button"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancel
                </button>

                <button
                    type="button"
                    className="confirm-delete-button"
                    onClick={onConfirm}
                    disabled={loading}
                >
                    {loading ? 'Deleting...' : 'Delete'}
                </button>
            </ModalFooter>
        </Modal>
    );
}

export default ConfirmModal;