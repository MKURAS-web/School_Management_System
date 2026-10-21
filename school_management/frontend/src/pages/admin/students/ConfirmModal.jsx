import Modal from '../../../components/ui/Modal';
import ModalFooter from '../../../components/ui/ModalFooter';

function ConfirmModal({
    student,
    onClose,
    onConfirm,
    loading,
}) {
    if (!student) return null;

    const fullName = [
        student.first_name,
        student.middle_name,
        student.last_name,
    ]
        .filter(Boolean)
        .join(' ')
        .trim();

    const title = 'Delete Student?';

    const handleConfirm = async () => {
        if (loading || !onConfirm) return;

        await onConfirm();
    };

    return (
        <Modal open={true} title={title} onClose={onClose}>
            <div className="confirm-icon">!</div>

            <p>
                Are you sure you want to delete{' '}

                <strong>{fullName || 'this student'}</strong>
                ?

                <br />

                This action cannot be undone.
            </p>

            <ModalFooter align="center">
                <button
                    type="button"
                    className="cancel-button"
                    onClick={onClose}
                    disabled={loading}
                >
                    Cancel
                </button>

                <button
                    type="button"
                    className="confirm-delete-button"
                    onClick={handleConfirm}
                    disabled={loading}
                >
                    {loading ? 'Deleting...' : 'Delete'}
                </button>
            </ModalFooter>
        </Modal>
    );
}

export default ConfirmModal;