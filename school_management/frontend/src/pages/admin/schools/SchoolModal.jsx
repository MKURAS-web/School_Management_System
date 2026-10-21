import { useEffect, useState } from 'react';
import api from '../../../api/api';
import Modal from '../../../components/ui/Modal';
import ModalFooter from '../../../components/ui/ModalFooter';

function SchoolModal({
    isOpen,
    onClose,
    onSchoolSaved,
    school = null,
}) {
    const isEditing = Boolean(school);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        location: '',
        level: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (school) {
            setFormData({
                name: school.name || '',
                code: school.code || '',
                location: school.location || '',
                level: school.level || '',
            });
        } else {
            setFormData({
                name: '',
                code: '',
                location: '',
                level: '',
            });
        }

        setError('');
    }, [school, isOpen]);

    // Use shared Modal component

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError('');

        try {
            let response;

            if (isEditing) {
                response = await api.put(
                    `/schools/${school.id}`,
                    formData
                );
            } else {
                response = await api.post(
                    '/schools',
                    formData
                );
            }

            onSchoolSaved(response.data.school);

            onClose();

            setFormData({
                name: '',
                code: '',
                location: '',
                level: '',
            });
        } catch (error) {
            console.error(error);

            if (error.response?.data?.errors) {
                const validationErrors = Object.values(
                    error.response.data.errors
                )
                    .flat()
                    .join(' ');

                setError(validationErrors);
            } else {
                setError(
                    isEditing
                        ? 'Failed to update school.'
                        : 'Failed to add school.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={isOpen} title={isEditing ? 'Edit School' : 'Add New School'} onClose={onClose}>

            <p style={{ marginTop: 6, color: '#6b7280' }}>
                {isEditing
                    ? 'Update school information'
                    : 'Enter the school information below'}
            </p>

            {error && (
                <div className="modal-error">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="modal-form">

                    <div className="form-group">
                        <label>
                            School Name
                        </label>

                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter school name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            School Code
                        </label>

                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            placeholder="e.g. JSS001"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Location
                        </label>

                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Enter school location"
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            School Level
                        </label>

                        <select
                            name="level"
                            value={formData.level}
                            onChange={handleChange}
                            required
                        >
                            <option value="">
                                Select school level
                            </option>

                            <option value="O-Level">
                                O-Level Only
                            </option>

                            <option value="Advanced Level">
                                Advanced Level Only
                            </option>

                            <option value="O-Level & Advanced Level">
                                O-Level & Advanced Level
                            </option>
                        </select>
                    </div>

                <ModalFooter>
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="save-button"
                        disabled={loading}
                    >
                        {loading
                            ? 'Saving...'
                            : isEditing
                            ? 'Update School'
                            : 'Add School'}
                    </button>
                </ModalFooter>
            </form>
        </Modal>
    );
}

export default SchoolModal;