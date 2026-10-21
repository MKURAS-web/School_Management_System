import { useEffect, useMemo, useState } from 'react';
import api from '../../../api/api';

function SubjectsPage() {
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [subjectForm, setSubjectForm] = useState({
        name: '',
        code: '',
        description: '',
    });

    const [editingSubjectId, setEditingSubjectId] = useState(null);
    const [showAddSubjectForm, setShowAddSubjectForm] = useState(false);
    const [showAssignClassForm, setShowAssignClassForm] = useState(false);
    const [showAssignTeacherForm, setShowAssignTeacherForm] = useState(false);
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showClassAssignmentModal, setShowClassAssignmentModal] = useState(false);
    const [showTeacherAssignmentModal, setShowTeacherAssignmentModal] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);

    const [assignClassForm, setAssignClassForm] = useState({
        subject_id: '',
        class_id: '',
    });

    const [assignTeacherForm, setAssignTeacherForm] = useState({
        subject_id: '',
        teacher_id: '',
        class_id: '',
    });

    const subjectOptions = useMemo(() => {
        return subjects.map((subject) => ({
            ...subject,
            label: `${subject.name} (${subject.code})`,
        }));
    }, [subjects]);

    const sortedClasses = useMemo(() => {
        return [...classes].sort((a, b) => {
            const left = (a.name || '').toString();
            const right = (b.name || '').toString();
            return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
        });
    }, [classes]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('school_token');

            const [subjectsRes, classesRes, teachersRes] = await Promise.all([
                api.get('/school/subjects', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                api.get('/school/classes', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                api.get('/school/teachers', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            const sortedSchoolClasses = [...(classesRes.data || [])].sort((a, b) => {
                const left = (a.name || '').toString();
                const right = (b.name || '').toString();
                return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
            });

            setSubjects(subjectsRes.data || []);
            setClasses(sortedSchoolClasses);
            setTeachers(teachersRes.data || []);

            setAssignClassForm((prev) => ({
                ...prev,
                subject_id: prev.subject_id || (subjectsRes.data[0]?.id ?? ''),
                class_id: prev.class_id || (classesRes.data[0]?.id ?? ''),
            }));

            setAssignTeacherForm((prev) => ({
                ...prev,
                subject_id: prev.subject_id || (subjectsRes.data[0]?.id ?? ''),
                teacher_id: prev.teacher_id || (teachersRes.data[0]?.id ?? ''),
                class_id: prev.class_id || (classesRes.data[0]?.id ?? ''),
            }));
        } catch (err) {
            console.error('Failed to load subject data:', err);
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Failed to load subjects.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubjectChange = (e) => {
        const { name, value } = e.target;
        setSubjectForm((prev) => ({ ...prev, [name]: value }));
    };

    const resetSubjectForm = () => {
        setSubjectForm({ name: '', code: '', description: '' });
        setEditingSubjectId(null);
        setShowAddSubjectForm(false);
        setShowSubjectModal(false);
    };

    const openSubjectForm = () => {
        setEditingSubjectId(null);
        setSubjectForm({ name: '', code: '', description: '' });
        setShowAddSubjectForm(true);
        setShowSubjectModal(true);
    };

    const closeSubjectForm = () => {
        setShowAddSubjectForm(false);
        setShowSubjectModal(false);
        setEditingSubjectId(null);
    };

    const resetAssignClassForm = () => {
        setAssignClassForm({ subject_id: '', class_id: '' });
        setShowAssignClassForm(false);
        setShowClassAssignmentModal(false);
    };

    const openAssignClassForm = () => {
        setAssignClassForm((prev) => ({
            ...prev,
            subject_id: prev.subject_id || (subjects[0]?.id ?? ''),
            class_id: prev.class_id || (classes[0]?.id ?? ''),
        }));
        setShowAssignClassForm(true);
        setShowClassAssignmentModal(true);
    };

    const resetAssignTeacherForm = () => {
        setAssignTeacherForm({ subject_id: '', teacher_id: '', class_id: '' });
        setShowAssignTeacherForm(false);
        setShowTeacherAssignmentModal(false);
    };

    const openAssignTeacherForm = () => {
        setAssignTeacherForm((prev) => ({
            ...prev,
            subject_id: prev.subject_id || (subjects[0]?.id ?? ''),
            teacher_id: prev.teacher_id || (teachers[0]?.id ?? ''),
            class_id: prev.class_id || (classes[0]?.id ?? ''),
        }));
        setShowAssignTeacherForm(true);
        setShowTeacherAssignmentModal(true);
    };

    const handleSubjectSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('school_token');

        try {
            if (editingSubjectId) {
                await api.put(`/school/subjects/${editingSubjectId}`, subjectForm, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                await api.post('/school/subjects', subjectForm, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            resetSubjectForm();
            await fetchData();
        } catch (err) {
            console.error('Failed to save subject:', err);
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Failed to save subject.';
            setError(message);
        }
    };

    const handleEditSubject = (subject) => {
        setEditingSubjectId(subject.id);
        setShowAddSubjectForm(true);
        setSubjectForm({
            name: subject.name,
            code: subject.code,
            description: subject.description || '',
        });
    };

    const handleDeleteSubject = async (subjectId) => {
        if (!window.confirm('Delete this subject and all its assignments?')) {
            return;
        }

        try {
            const token = localStorage.getItem('school_token');
            await api.delete(`/school/subjects/${subjectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchData();
            if (selectedSubject?.id === subjectId) {
                setSelectedSubject(null);
            }
        } catch (err) {
            console.error('Failed to delete subject:', err);
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Failed to delete subject.';
            setError(message);
        }
    };

    const handleAssignClass = async (e) => {
        e.preventDefault();

        if (!assignClassForm.subject_id || !assignClassForm.class_id) {
            setError('Select both a subject and a class to assign.');
            return;
        }

        try {
            const token = localStorage.getItem('school_token');
            await api.post('/school/subjects/assign-class', assignClassForm, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchData();
        } catch (err) {
            console.error('Failed to assign subject to class:', err);
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Failed to assign subject to class.';
            setError(message);
        }
    };

    const handleAssignTeacher = async (e) => {
        e.preventDefault();

        if (!assignTeacherForm.subject_id || !assignTeacherForm.teacher_id || !assignTeacherForm.class_id) {
            setError('Select a subject, a class, and a teacher to assign.');
            return;
        }

        try {
            const token = localStorage.getItem('school_token');
            await api.post('/school/subjects/assign-teacher', assignTeacherForm, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchData();
        } catch (err) {
            console.error('Failed to assign subject to teacher:', err);
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Failed to assign subject to teacher.';
            setError(message);
        }
    };

    return (
        <div className="subjects-page">
            <div className="page-header">
                <div>
                    <h1>Subject Management</h1>
                    <p>Manage curriculum, class offerings, and teacher assignments.</p>
                </div>
                <div className="card-actions">
                    <button type="button" className="primary-button" onClick={openSubjectForm}>
                        {showAddSubjectForm ? 'Hide Form' : 'Add Subject'}
                    </button>
                    <button type="button" className="primary-button secondary-button" onClick={openAssignClassForm}>
                        {showAssignClassForm ? 'Hide Class Assignment' : 'Assign to Class'}
                    </button>
                    <button type="button" className="primary-button secondary-button" onClick={openAssignTeacherForm}>
                        {showAssignTeacherForm ? 'Hide Teacher Assignment' : 'Assign to Teacher'}
                    </button>
                </div>
            </div>

            <div className="student-statistics">
                <div className="student-stat-card">
                    <div>
                        <span>Total Subjects</span>
                        <strong>{subjects.length}</strong>
                    </div>
                    <div className="stat-icon">S</div>
                </div>

                <div className="student-stat-card">
                    <div>
                        <span>Classes Offering</span>
                        <strong>{classes.length}</strong>
                    </div>
                    <div className="stat-icon">C</div>
                </div>

                <div className="student-stat-card">
                    <div>
                        <span>Teachers Assigned</span>
                        <strong>{teachers.length}</strong>
                    </div>
                    <div className="stat-icon">T</div>
                </div>
            </div>

            {error && <div className="modal-error">{error}</div>}

            <div className="subject-layout">
                {showSubjectModal && (
                    <div className="modal-backdrop" onClick={closeSubjectForm}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editingSubjectId ? 'Edit Subject' : 'Add Subject'}</h3>
                                <button type="button" className="modal-close-button" onClick={closeSubjectForm}>
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleSubjectSubmit} className="class-form">
                                <div className="form-group">
                                    <label>Subject Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={subjectForm.name}
                                        onChange={handleSubjectChange}
                                        placeholder="e.g. Mathematics"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Subject Code</label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={subjectForm.code}
                                        onChange={handleSubjectChange}
                                        placeholder="e.g. MATH-101"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        value={subjectForm.description}
                                        onChange={handleSubjectChange}
                                        placeholder="Optional subject description"
                                        rows="4"
                                    />
                                </div>

                                <div className="class-form-actions">
                                    <button type="submit" className="primary-button">
                                        {editingSubjectId ? 'Update Subject' : 'Add Subject'}
                                    </button>
                                    <button type="button" className="cancel-button" onClick={closeSubjectForm}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showClassAssignmentModal && (
                    <div className="modal-backdrop" onClick={resetAssignClassForm}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Assign Subject to Class</h3>
                                <button type="button" className="modal-close-button" onClick={resetAssignClassForm}>
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleAssignClass} className="class-form">
                                <div className="form-group">
                                    <label>Subject</label>
                                    <select
                                        value={assignClassForm.subject_id}
                                        onChange={(e) =>
                                            setAssignClassForm((prev) => ({ ...prev, subject_id: e.target.value }))
                                        }
                                        required
                                    >
                                        <option value="">Select subject</option>
                                        {subjectOptions.map((subject) => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Class</label>
                                    <select
                                        value={assignClassForm.class_id}
                                        onChange={(e) =>
                                            setAssignClassForm((prev) => ({ ...prev, class_id: e.target.value }))
                                        }
                                        required
                                    >
                                        <option value="">Select class</option>
                                        {sortedClasses.map((schoolClass) => (
                                            <option key={schoolClass.id} value={schoolClass.id}>
                                                {schoolClass.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="class-form-actions">
                                    <button type="submit" className="primary-button">
                                        Assign to Class
                                    </button>
                                    <button type="button" className="cancel-button" onClick={resetAssignClassForm}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showTeacherAssignmentModal && (
                    <div className="modal-backdrop" onClick={resetAssignTeacherForm}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Assign Subject to Teacher</h3>
                                <button type="button" className="modal-close-button" onClick={resetAssignTeacherForm}>
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleAssignTeacher} className="class-form">
                                <div className="form-group">
                                    <label>Subject</label>
                                    <select
                                        value={assignTeacherForm.subject_id}
                                        onChange={(e) =>
                                            setAssignTeacherForm((prev) => ({ ...prev, subject_id: e.target.value }))
                                        }
                                        required
                                    >
                                        <option value="">Select subject</option>
                                        {subjectOptions.map((subject) => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Class</label>
                                    <select
                                        value={assignTeacherForm.class_id}
                                        onChange={(e) =>
                                            setAssignTeacherForm((prev) => ({ ...prev, class_id: e.target.value }))
                                        }
                                        required
                                    >
                                        <option value="">Select class</option>
                                        {sortedClasses.map((schoolClass) => (
                                            <option key={schoolClass.id} value={schoolClass.id}>
                                                {schoolClass.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Teacher</label>
                                    <select
                                        value={assignTeacherForm.teacher_id}
                                        onChange={(e) =>
                                            setAssignTeacherForm((prev) => ({ ...prev, teacher_id: e.target.value }))
                                        }
                                        required
                                    >
                                        <option value="">Select teacher</option>
                                        {teachers.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="class-form-actions">
                                    <button type="submit" className="primary-button">
                                        Assign to Teacher
                                    </button>
                                    <button type="button" className="cancel-button" onClick={resetAssignTeacherForm}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="empty-state">
                    <h3>Loading subjects...</h3>
                    <p>Please wait.</p>
                </div>
            ) : subjects.length === 0 ? (
                <div className="empty-state">
                    <h3>No subjects found</h3>
                    <p>Add a subject to begin organizing classes and teachers.</p>
                </div>
            ) : (
                <div className="subject-list">
                    {subjects.map((subject) => (
                        <div key={subject.id} className="subject-card">
                            <div className="subject-card-header">
                                <div>
                                    <h3>{subject.name}</h3>
                                    <span className="subject-code">{subject.code}</span>
                                </div>

                                <div className="card-actions">
                                    <button type="button" className="view-button" onClick={() => setSelectedSubject(subject)}>
                                        View
                                    </button>
                                    <button type="button" className="edit-button" onClick={() => handleEditSubject(subject)}>
                                        Edit
                                    </button>
                                    <button type="button" className="delete-button" onClick={() => handleDeleteSubject(subject.id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedSubject && (
                <div className="modal-backdrop" onClick={() => setSelectedSubject(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{selectedSubject.name}</h3>
                            <button type="button" className="modal-close-button" onClick={() => setSelectedSubject(null)}>
                                ×
                            </button>
                        </div>

                        <div className="teacher-profile-panel">
                            <div className="teacher-profile-grid">
                                <div className="detail-stat-box">
                                    <span>Code</span>
                                    <strong>{selectedSubject.code || 'Not provided'}</strong>
                                </div>
                                <div className="detail-stat-box">
                                    <span>Description</span>
                                    <strong>{selectedSubject.description || 'No description available'}</strong>
                                </div>
                            </div>

                            <div className="teacher-profile-sections">
                                <div>
                                    <h4>Offered to Classes</h4>
                                    {selectedSubject.classes?.length ? (
                                        <div className="tag-list">
                                            {selectedSubject.classes.map((schoolClass) => (
                                                <span key={schoolClass.id} className="subject-tag">
                                                    {schoolClass.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="muted">Not assigned to any class yet.</p>
                                    )}
                                </div>

                                <div>
                                    <h4>Assigned Teachers</h4>
                                    {selectedSubject.teachers?.length ? (
                                        <div className="tag-list">
                                            {selectedSubject.teachers.map((teacher) => (
                                                <span key={teacher.id} className="subject-tag teacher-tag">
                                                    {teacher.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="muted">No teacher assigned yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="class-form-actions">
                            <button type="button" className="cancel-button" onClick={() => setSelectedSubject(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SubjectsPage;
