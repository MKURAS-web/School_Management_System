import { useEffect, useState } from 'react';
import api from '../../../api/api';
import Modal from '../../../components/ui/Modal';
import ModalFooter from '../../../components/ui/ModalFooter';

function StudentModal({
    onClose,
    onStudentAdded,
    onStudentUpdated,
    student,
}) {
    const isEditing = Boolean(student);

    const [formData, setFormData] = useState({
        admission_number: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: '',
        date_of_birth: '',
        phone: '',
        address: '',
        class_name: '',
        stream: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // =========================
    // LOAD STUDENT DATA FOR EDIT
    // =========================

    useEffect(() => {
        if (student) {
            setFormData({
                admission_number: student.admission_number || '',
                first_name: student.first_name || '',
                middle_name: student.middle_name || '',
                last_name: student.last_name || '',
                gender: student.gender || '',
                date_of_birth: student.date_of_birth || '',
                phone: student.phone || '',
                address: student.address || '',
                class_name: student.class_name || '',
                stream: student.stream || '',
            });
        }
    }, [student]);

    // =========================
    // HANDLE INPUT CHANGE
    // =========================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =========================
    // SUBMIT
    // =========================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setLoading(true);

        try {
            const token = localStorage.getItem('school_token');

            let response;

            if (isEditing) {
                // =========================
                // UPDATE STUDENT
                // =========================

                response = await api.put(
                    `/school/students/${student.id}`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                onStudentUpdated(response.data.student);

            } else {
                // =========================
                // ADD STUDENT
                // =========================

                response = await api.post(
                    '/school/students',
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                onStudentAdded(response.data.student);
            }

            onClose();

        } catch (error) {
            console.error(
                isEditing
                    ? 'Failed to update student:'
                    : 'Failed to add student:',
                error
            );

            const serverMessage =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message;

            if (error.response?.status === 422) {
                const errors = error.response.data.errors;

                if (errors) {
                    const firstError =
                        Object.values(errors)[0]?.[0];

                    setError(
                        firstError ||
                        serverMessage ||
                        'Please check the form.'
                    );
                } else {
                    setError(
                        serverMessage ||
                        'Validation failed.'
                    );
                }

            } else if (error.response?.status === 401) {

                setError(
                    'Your session has expired. Please login again.'
                );

            } else if (error.response?.status === 403) {

                setError(
                    'You are not authorized to perform this action.'
                );

            } else if (error.response?.status === 500) {

                setError(
                    serverMessage ||
                    'The server could not complete this request. Please try again.'
                );

            } else {

                setError(
                    serverMessage ||
                    (isEditing
                        ? 'Failed to update student.'
                        : 'Failed to add student.')
                );
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={true} title={isEditing ? 'Edit Student' : 'Add Student'} onClose={onClose}>
            <p style={{ marginTop: 6, color: '#6b7280' }}>
                {isEditing
                    ? 'Update student information.'
                    : 'Add a new student to your school.'}
            </p>


                {/* =========================
                    ERROR
                ========================= */}

            {error && (
                <div className="modal-error">
                    {error}
                </div>
            )}


                {/* =========================
                    FORM
                ========================= */}

                <form onSubmit={handleSubmit} className="modal-form student-form">

                    {/* ADMISSION NUMBER */}

                    <div className="form-group">

                        <label>
                            Admission Number
                        </label>

                        <input
                            type="text"
                            name="admission_number"
                            value={formData.admission_number}
                            onChange={handleChange}
                            placeholder="e.g. S001"
                            required
                        />

                    </div>


                    {/* FIRST NAME */}

                    <div className="form-group">

                        <label>
                            First Name
                        </label>

                        <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            placeholder="Enter first name"
                            required
                        />

                    </div>


                    {/* MIDDLE NAME */}

                    <div className="form-group">

                        <label>
                            Middle Name
                        </label>

                        <input
                            type="text"
                            name="middle_name"
                            value={formData.middle_name}
                            onChange={handleChange}
                            placeholder="Enter middle name"
                        />

                    </div>


                    {/* LAST NAME */}

                    <div className="form-group">

                        <label>
                            Last Name
                        </label>

                        <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            placeholder="Enter last name"
                            required
                        />

                    </div>


                    {/* GENDER */}

                    <div className="form-group">

                        <label>
                            Gender
                        </label>

                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            required
                        >

                            <option value="">
                                Select gender
                            </option>

                            <option value="Male">
                                Male
                            </option>

                            <option value="Female">
                                Female
                            </option>

                        </select>

                    </div>


                    {/* DATE OF BIRTH */}

                    <div className="form-group">

                        <label>
                            Date of Birth
                        </label>

                        <input
                            type="date"
                            name="date_of_birth"
                            value={formData.date_of_birth}
                            onChange={handleChange}
                        />

                    </div>


                    {/* PHONE */}

                    <div className="form-group">

                        <label>
                            Phone
                        </label>

                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Enter phone number"
                        />

                    </div>


                    {/* ADDRESS */}

                    <div className="form-group">

                        <label>
                            Address
                        </label>

                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter address"
                        />

                    </div>

                    {/* CLASS */}

                    <div className="form-group">

                        <label>
                            Class
                        </label>

                        <input
                            type="text"
                            name="class_name"
                            value={formData.class_name}
                            onChange={handleChange}
                            placeholder="e.g. Grade 7"
                        />

                    </div>

                    {/* STREAM */}

                    <div className="form-group">

                        <label>
                            Stream
                        </label>

                        <input
                            type="text"
                            name="stream"
                            value={formData.stream}
                            onChange={handleChange}
                            placeholder="e.g. Science / East"
                        />

                    </div>


                    {/* ACTIONS */}

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
                                    ? 'Update Student'
                                    : 'Save Student'}
                        </button>
                    </ModalFooter>

                </form>
        </Modal>
    );
}

export default StudentModal;