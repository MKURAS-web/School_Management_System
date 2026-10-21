import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/api';
import '../styles/teacher/StudentDetails.css';

function StudentDetails() {
    const { studentId } = useParams();
    const navigate = useNavigate();

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStudent();
    }, [studentId]);

    const fetchStudent = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get(
                `/teacher/students/${studentId}`
            );

            setStudent(response.data.student);
        } catch (err) {
            console.error('Failed to fetch student:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load student details.'
            );
        } finally {
            setLoading(false);
        }
    };

    const fullName = [
        student?.first_name,
        student?.middle_name,
        student?.last_name,
    ]
        .filter(Boolean)
        .join(' ');

    if (loading) {
        return (
            <div className="student-details-page">
                <div className="student-details-loading">
                    <div className="student-details-spinner"></div>
                    <p>Loading student details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="student-details-page">
                <div className="student-details-error">
                    <h3>Unable to load student</h3>

                    <p>{error}</p>

                    <div className="student-error-actions">
                        <button onClick={() => navigate(-1)}>
                            ← Go Back
                        </button>

                        <button onClick={fetchStudent}>
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="student-details-page">

            {/* HEADER */}
            <div className="student-details-header">

                <button
                    className="student-back-button"
                    onClick={() => navigate(-1)}
                >
                    ← Back
                </button>

                <div>
                    <h1>Student Profile</h1>
                    <p>
                        View student information and academic details.
                    </p>
                </div>

            </div>

            {/* PROFILE CARD */}
            <div className="student-profile-card">

                <div className="student-profile-top">

                    <div className="student-profile-avatar">
                        {student?.first_name
                            ?.charAt(0)
                            ?.toUpperCase()}
                    </div>

                    <div className="student-profile-name">

                        <h2>{fullName || 'Student'}</h2>

                        <p>
                            {student?.admission_number ||
                                'No admission number'}
                        </p>

                    </div>

                </div>

                {/* BASIC INFORMATION */}
                <div className="student-section">

                    <div className="student-section-title">
                        <h3>Basic Information</h3>
                    </div>

                    <div className="student-info-grid">

                        <div className="student-info-item">
                            <span className="student-info-label">
                                First Name
                            </span>

                            <strong>
                                {student?.first_name || '—'}
                            </strong>
                        </div>

                        <div className="student-info-item">
                            <span className="student-info-label">
                                Middle Name
                            </span>

                            <strong>
                                {student?.middle_name || '—'}
                            </strong>
                        </div>

                        <div className="student-info-item">
                            <span className="student-info-label">
                                Last Name
                            </span>

                            <strong>
                                {student?.last_name || '—'}
                            </strong>
                        </div>

                        <div className="student-info-item">
                            <span className="student-info-label">
                                Admission Number
                            </span>

                            <strong>
                                {student?.admission_number || '—'}
                            </strong>
                        </div>

                        <div className="student-info-item">
                            <span className="student-info-label">
                                Gender
                            </span>

                            <strong>
                                {student?.gender || '—'}
                            </strong>
                        </div>

                        <div className="student-info-item">
                            <span className="student-info-label">
                                Phone
                            </span>

                            <strong>
                                {student?.phone || '—'}
                            </strong>
                        </div>

                    </div>

                </div>

                {/* SCHOOL INFORMATION */}
                <div className="student-section">

                    <div className="student-section-title">
                        <h3>School Information</h3>
                    </div>

                    <div className="student-info-grid">

                        <div className="student-info-item">
                            <span className="student-info-label">
                                Class
                            </span>

                            <strong>
                                {student?.class_name || '—'}
                            </strong>
                        </div>

                        <div className="student-info-item">
                            <span className="student-info-label">
                                Student ID
                            </span>

                            <strong>
                                {student?.id || '—'}
                            </strong>
                        </div>

                        {student?.status && (
                            <div className="student-info-item">
                                <span className="student-info-label">
                                    Status
                                </span>

                                <strong className="student-status">
                                    {student.status}
                                </strong>
                            </div>
                        )}

                    </div>

                </div>

                {/* OPTIONAL DATE OF BIRTH */}
                {student?.date_of_birth && (
                    <div className="student-section">

                        <div className="student-section-title">
                            <h3>Personal Information</h3>
                        </div>

                        <div className="student-info-grid">

                            <div className="student-info-item">
                                <span className="student-info-label">
                                    Date of Birth
                                </span>

                                <strong>
                                    {student.date_of_birth}
                                </strong>
                            </div>

                        </div>

                    </div>
                )}

            </div>

        </div>
    );
}

export default StudentDetails;