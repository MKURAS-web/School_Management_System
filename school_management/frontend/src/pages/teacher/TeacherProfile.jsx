import { useEffect, useState } from 'react';
import api from '../../api/api';
import '../styles/teacher/Profile.css';

function TeacherProfile() {
    const [teacher, setTeacher] = useState(null);
    const [editing, setEditing] = useState(false);

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // ==========================================
    // GET TEACHER PROFILE
    // ==========================================

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/teacher/profile');

            const data = response.data.teacher;

            setTeacher(data);

            setForm({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
            });

        } catch (err) {
            console.error('Failed to load teacher profile:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load your profile.'
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // LOAD PROFILE WHEN PAGE OPENS
    // ==========================================

    useEffect(() => {
        fetchProfile();
    }, []);

    // ==========================================
    // FORM CHANGE
    // ==========================================

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    // ==========================================
    // SAVE PROFILE
    // ==========================================

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');

            const response = await api.put(
                '/teacher/profile',
                form
            );

            const updatedTeacher = response.data.teacher;

            setTeacher(updatedTeacher);

            setForm({
                name: updatedTeacher.name || '',
                email: updatedTeacher.email || '',
                phone: updatedTeacher.phone || '',
            });

            setEditing(false);

            alert('Profile updated successfully.');

        } catch (err) {
            console.error('Failed to update profile:', err);

            setError(
                err.response?.data?.message ||
                'Failed to update your profile.'
            );
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // INITIALS
    // ==========================================

    const getInitials = (name) => {
        if (!name) return 'T';

        return name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    };

    // ==========================================
    // CANCEL EDITING
    // ==========================================

    const handleCancel = () => {
        setForm({
            name: teacher?.name || '',
            email: teacher?.email || '',
            phone: teacher?.phone || '',
        });

        setEditing(false);
        setError('');
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="teacher-page">
                <div className="teacher-profile-card">
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        Loading profile...
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // ERROR
    // ==========================================

    if (!teacher) {
        return (
            <div className="teacher-page">
                <div className="teacher-profile-card">
                    <div style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: '#dc2626'
                    }}>
                        {error || 'Unable to load profile.'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="teacher-page">

            {/* ======================================
                PAGE HEADER
            ====================================== */}

            <div className="teacher-page-header">

                <div>
                    <h1>My Profile</h1>

                    <p>
                        View and manage your teacher profile.
                    </p>
                </div>

                {!editing && (
                    <button
                        type="button"
                        className="teacher-profile-edit-button"
                        onClick={() => setEditing(true)}
                    >
                        Edit Profile
                    </button>
                )}

            </div>


            {/* ======================================
                ERROR MESSAGE
            ====================================== */}

            {error && (
                <div style={{
                    marginBottom: '20px',
                    padding: '12px 15px',
                    borderRadius: '8px',
                    background: '#fee2e2',
                    color: '#b91c1c',
                    fontSize: '13px'
                }}>
                    {error}
                </div>
            )}


            {/* ======================================
                PROFILE CARD
            ====================================== */}

            <div className="teacher-profile-card">

                {/* PROFILE HEADER */}

                <div className="teacher-profile-card-header">

                    <div className="teacher-profile-avatar">
                        {getInitials(teacher.name)}
                    </div>

                    <div className="teacher-profile-heading">

                        <h2>
                            {teacher.name || 'Teacher'}
                        </h2>

                        <span>
                            Teacher
                        </span>

                    </div>

                </div>


                {/* ==================================
                    PERSONAL INFORMATION
                ================================== */}

                <div className="teacher-profile-section">

                    <div className="teacher-profile-section-title">

                        <h3>
                            Personal Information
                        </h3>

                        <p>
                            Your basic account information.
                        </p>

                    </div>


                    <div className="teacher-profile-grid">

                        {/* NAME */}

                        <div className="teacher-profile-field">

                            <label>
                                Full Name
                            </label>

                            {editing ? (
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                />
                            ) : (
                                <div className="teacher-profile-value">
                                    {teacher.name || '-'}
                                </div>
                            )}

                        </div>


                        {/* EMAIL */}

                        <div className="teacher-profile-field">

                            <label>
                                Email Address
                            </label>

                            {editing ? (
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                />
                            ) : (
                                <div className="teacher-profile-value">
                                    {teacher.email || '-'}
                                </div>
                            )}

                        </div>


                        {/* PHONE */}

                        <div className="teacher-profile-field">

                            <label>
                                Phone Number
                            </label>

                            {editing ? (
                                <input
                                    type="text"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                />
                            ) : (
                                <div className="teacher-profile-value">
                                    {teacher.phone || '-'}
                                </div>
                            )}

                        </div>


                        {/* ROLE */}

                        <div className="teacher-profile-field">

                            <label>
                                Role
                            </label>

                            <div className="teacher-profile-value">
                                Teacher
                            </div>

                        </div>

                    </div>

                </div>


                {/* ==================================
                    TEACHING INFORMATION
                ================================== */}

                <div className="teacher-profile-section">

                    <div className="teacher-profile-section-title">

                        <h3>
                            Teaching Information
                        </h3>

                        <p>
                            Information about your teaching assignments.
                        </p>

                    </div>


                    <div className="teacher-profile-grid">

                        {/* SUBJECTS */}

                        <div className="teacher-profile-field">

                            <label>
                                Subjects
                            </label>

                            <div className="teacher-profile-value">

                                {teacher.subjects?.length > 0
                                    ? teacher.subjects
                                        .map(subject => subject.name)
                                        .join(', ')
                                    : 'No subjects assigned yet'
                                }

                            </div>

                        </div>


                        {/* CLASSES */}

                        <div className="teacher-profile-field">

                            <label>
                                Classes
                            </label>

                            <div className="teacher-profile-value">

                                {teacher.classes?.length > 0
                                    ? teacher.classes
                                        .map(schoolClass => schoolClass.name)
                                        .join(', ')
                                    : 'No classes assigned yet'
                                }

                            </div>

                        </div>


                        {/* DESIGNATION */}

                        <div className="teacher-profile-field">

                            <label>
                                Designation
                            </label>

                            <div className="teacher-profile-value">
                                {teacher.designation || '-'}
                            </div>

                        </div>


                        {/* RESPONSIBILITY */}

                        <div className="teacher-profile-field">

                            <label>
                                Responsibility
                            </label>

                            <div className="teacher-profile-value">
                                {teacher.responsibility || '-'}
                            </div>

                        </div>

                    </div>

                </div>


                {/* ==================================
                    EDIT ACTIONS
                ================================== */}

                {editing && (

                    <div className="teacher-profile-actions">

                        <button
                            type="button"
                            className="teacher-profile-cancel-button"
                            onClick={handleCancel}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="teacher-profile-save-button"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? 'Saving...'
                                : 'Save Changes'
                            }
                        </button>

                    </div>

                )}

            </div>

        </div>
    );
}

export default TeacherProfile;