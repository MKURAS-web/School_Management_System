import { useEffect, useMemo, useState } from 'react';
import api from '../../../api/api';
import Modal from '../../../components/ui/Modal';
import ModalFooter from '../../../components/ui/ModalFooter';

const initialForm = {
    name: '',
    email: '',
    password: '',
    role: 'teacher',
    phone: '',
    designation: '',
    responsibility: '',
    gender: 'Male',
    status: 'Active',
    subject_ids: [],
    class_ids: [],
};

function TeachersPage() {
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [editingTeacherId, setEditingTeacherId] = useState(null);
    const [showTeacherForm, setShowTeacherForm] = useState(false);

    const filteredTeachers = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return teachers;

        return teachers.filter((teacher) => {
            const fullName = `${teacher.name || ''} ${teacher.designation || ''} ${teacher.responsibility || ''}`.toLowerCase();
            return fullName.includes(term) || (teacher.email || '').toLowerCase().includes(term);
        });
    }, [teachers, search]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('school_token');

            const [teachersRes, classesRes, subjectsRes] = await Promise.all([
                api.get('/school/teachers', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                api.get('/school/classes', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                api.get('/school/subjects', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            setTeachers(teachersRes.data || []);
            setClasses(classesRes.data || []);
            setSubjects(subjectsRes.data || []);
        } catch (err) {
            console.error('Failed to load teachers:', err);
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Failed to load teacher data.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (field, value) => {
        setForm((prev) => {
            const current = prev[field] || [];
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter((item) => item !== value) };
            }
            return { ...prev, [field]: [...current, value] };
        });
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditingTeacherId(null);
        setShowTeacherForm(false);
    };

    const openTeacherForm = () => {
        setSelectedTeacher(null);
        setEditingTeacherId(null);
        setForm(initialForm);
        setShowTeacherForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('school_token');

        try {
            const payload = { ...form, subject_ids: form.subject_ids, class_ids: form.class_ids };

            if (!payload.password) {
                delete payload.password;
            }

            if (editingTeacherId) {
                await api.put(`/school/teachers/${editingTeacherId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                await api.post('/school/teachers', payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            resetForm();
            await fetchData();
        } catch (err) {
            console.error('Failed to save teacher:', err);
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Failed to save teacher.';
            setError(message);
        }
    };

    const handleEdit = (teacher) => {
        setEditingTeacherId(teacher.id);
        setSelectedTeacher(teacher);
        setShowTeacherForm(true);
        setForm({
            name: teacher.name || '',
            email: teacher.email || '',
            password: '',
            role: teacher.role || 'teacher',
            phone: teacher.phone || '',
            designation: teacher.designation || '',
            responsibility: teacher.responsibility || '',
            gender: teacher.gender || 'Male',
            status: teacher.status || 'Active',
            subject_ids: (teacher.subjects || []).map((subject) => Number(subject.id)),
            class_ids: (teacher.classes || []).map((schoolClass) => Number(schoolClass.id)),
        });
    };

    const handleDelete = async (teacherId) => {
        if (!window.confirm('Delete this teacher account?')) {
            return;
        }

        try {
            const token = localStorage.getItem('school_token');
            await api.delete(`/school/teachers/${teacherId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchData();
            if (selectedTeacher?.id === teacherId) {
                setSelectedTeacher(null);
            }
        } catch (err) {
            console.error('Failed to delete teacher:', err);
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Failed to delete teacher.';
            setError(message);
        }
    };

    return (
        <div className="teachers-page">
            <div className="page-header">
                <div>
                    <h1>Teacher and Staff Management</h1>
                    <p>Manage teacher profiles, class assignments, and subject responsibilities.</p>
                </div>
                <button type="button" className="primary-button" onClick={openTeacherForm}>
                    {showTeacherForm ? 'Hide Form' : 'Add Teacher'}
                </button>
            </div>

            <div className="student-statistics">
                <div className="student-stat-card">
                    <div>
                        <span>Total Teachers</span>
                        <strong>{teachers.length}</strong>
                    </div>
                    <div className="stat-icon">T</div>
                </div>

                <div className="student-stat-card">
                    <div>
                        <span>Classes Assigned</span>
                        <strong>{teachers.reduce((sum, teacher) => sum + (teacher.classes?.length || 0), 0)}</strong>
                    </div>
                    <div className="stat-icon">C</div>
                </div>

                <div className="student-stat-card">
                    <div>
                        <span>Subjects Assigned</span>
                        <strong>{teachers.reduce((sum, teacher) => sum + (teacher.subjects?.length || 0), 0)}</strong>
                    </div>
                    <div className="stat-icon">S</div>
                </div>
            </div>

            {error && <div className="modal-error">{error}</div>}

            <div className="teacher-layout">
                <div className="teacher-panel">
                    <h2>Teacher Directory</h2>

                    <div className="form-group">
                        <label>Search teachers</label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, email, designation..."
                        />
                    </div>

                    <div className="teacher-list">
                        {filteredTeachers.length === 0 ? (
                            <div className="empty-state small">
                                <h3>No teachers found</h3>
                            </div>
                        ) : (
                            filteredTeachers.map((teacher) => (
                                <div key={teacher.id} className="teacher-card">
                                    <div className="teacher-card-header">
                                        <div>
                                            <h3>{teacher.name}</h3>
                                            <span>{teacher.role}</span>
                                        </div>
                                        <div className="card-actions">
                                            <button type="button" className="view-button" onClick={() => setSelectedTeacher(teacher)}>
                                                View
                                            </button>
                                            <button type="button" className="edit-button" onClick={() => handleEdit(teacher)}>
                                                Edit
                                            </button>
                                            <button type="button" className="delete-button" onClick={() => handleDelete(teacher.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    <p className="teacher-meta">
                                        {teacher.role || 'Teacher'}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {showTeacherForm && (
                <Modal open={showTeacherForm} title={editingTeacherId ? 'Edit Teacher' : 'Add Teacher'} onClose={resetForm}>
                    <form onSubmit={handleSubmit} className="teacher-form">
                        <div className="form-row two-columns">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleFieldChange}
                                    placeholder="e.g. Jane Doe"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleFieldChange}
                                    placeholder="teacher@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row two-columns">
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleFieldChange}
                                    placeholder={editingTeacherId ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
                                    required={!editingTeacherId}
                                />
                            </div>

                            <div className="form-group">
                                <label>Role</label>
                                <select name="role" value={form.role} onChange={handleFieldChange}>
                                    <option value="teacher">Teacher</option>
                                    <option value="staff">Staff</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row two-columns">
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleFieldChange}
                                    placeholder="0712 345 678"
                                />
                            </div>

                            <div className="form-group">
                                <label>Gender</label>
                                <select name="gender" value={form.gender} onChange={handleFieldChange}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row two-columns">
                            <div className="form-group">
                                <label>Designation</label>
                                <input
                                    type="text"
                                    name="designation"
                                    value={form.designation}
                                    onChange={handleFieldChange}
                                    placeholder="Mathematics Teacher"
                                />
                            </div>

                            <div className="form-group">
                                <label>Responsibility</label>
                                <input
                                    type="text"
                                    name="responsibility"
                                    value={form.responsibility}
                                    onChange={handleFieldChange}
                                    placeholder="Head of Department"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select name="status" value={form.status} onChange={handleFieldChange}>
                                <option value="Active">Active</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="checkbox-section">
                            <label>Assign Classes</label>
                            <div className="checkbox-grid">
                                {classes.map((schoolClass) => (
                                    <label key={schoolClass.id} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={form.class_ids.includes(Number(schoolClass.id))}
                                            onChange={() => handleCheckboxChange('class_ids', Number(schoolClass.id))}
                                        />
                                        <span>{schoolClass.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="checkbox-section">
                            <label>Assign Subjects</label>
                            <div className="checkbox-grid">
                                {subjects.map((subject) => (
                                    <label key={subject.id} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={form.subject_ids.includes(Number(subject.id))}
                                            onChange={() => handleCheckboxChange('subject_ids', Number(subject.id))}
                                        />
                                        <span>{subject.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="class-form-actions">
                            <button type="submit" className="primary-button">
                                {editingTeacherId ? 'Update Teacher' : 'Add Teacher'}
                            </button>
                            <button type="button" className="cancel-button" onClick={resetForm}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {selectedTeacher && (
                <Modal open={Boolean(selectedTeacher)} title="Teacher Details" onClose={() => setSelectedTeacher(null)}>
                    <div className="teacher-profile-panel">
                        <div className="teacher-profile-header">
                            <div>
                                <span className="eyebrow">Teacher Profile</span>
                                <h3>{selectedTeacher.name}</h3>
                            </div>
                        </div>

                        <div className="teacher-profile-grid">
                            <div className="detail-stat-box">
                                <span>Email</span>
                                <strong>{selectedTeacher.email || 'Not provided'}</strong>
                            </div>
                            <div className="detail-stat-box">
                                <span>Phone</span>
                                <strong>{selectedTeacher.phone || 'Not provided'}</strong>
                            </div>
                            <div className="detail-stat-box">
                                <span>Designation</span>
                                <strong>{selectedTeacher.designation || 'Not assigned'}</strong>
                            </div>
                            <div className="detail-stat-box">
                                <span>Responsibility</span>
                                <strong>{selectedTeacher.responsibility || 'Not assigned'}</strong>
                            </div>
                        </div>

                        <div className="teacher-profile-sections">
                            <div>
                                <h4>Classes</h4>
                                {(selectedTeacher.classes || []).length ? (
                                    <div className="tag-list">
                                        {selectedTeacher.classes.map((schoolClass) => (
                                            <span key={schoolClass.id} className="subject-tag">
                                                {schoolClass.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="muted">No classes assigned.</p>
                                )}
                            </div>

                            <div>
                                <h4>Subjects</h4>
                                {(selectedTeacher.subjects || []).length ? (
                                    <div className="tag-list">
                                        {selectedTeacher.subjects.map((subject) => (
                                            <span key={subject.id} className="subject-tag teacher-tag">
                                                {subject.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="muted">No subjects assigned.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <ModalFooter>
                        <button type="button" className="cancel-button" onClick={() => setSelectedTeacher(null)}>
                            Close
                        </button>
                    </ModalFooter>
                </Modal>
            )}
        </div>
    );
}

export default TeachersPage;
