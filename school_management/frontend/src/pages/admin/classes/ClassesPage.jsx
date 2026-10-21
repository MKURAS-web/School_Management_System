import { useEffect, useMemo, useState } from 'react';
import api from '../../../api/api';

function ClassesPage() {
    const currentUser = JSON.parse(localStorage.getItem('school_user') || 'null');
    const isAutoClassSchool =
        currentUser?.school?.level === 'O-Level' ||
        currentUser?.school?.level === 'Advanced Level' ||
        currentUser?.school?.level === 'O-Level & Advanced Level' ||
        currentUser?.school_level === 'O-Level' ||
        currentUser?.school_level === 'Advanced Level' ||
        currentUser?.school_level === 'O-Level & Advanced Level';

    const [classes, setClasses] = useState([]);
    const [streams, setStreams] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [classForm, setClassForm] = useState({
        name: '',
        description: '',
    });

    const [streamForm, setStreamForm] = useState({
        class_id: '',
        name: '',
        description: '',
    });

    const [editingClassId, setEditingClassId] = useState(null);
    const [editingStreamId, setEditingStreamId] = useState(null);
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [showAddClassForm, setShowAddClassForm] = useState(false);
    const [showAddStreamForm, setShowAddStreamForm] = useState(false);
    const [showStreamModal, setShowStreamModal] = useState(false);

    const selectedClass = classes.find((schoolClass) => String(schoolClass.id) === String(selectedClassId)) || null;
    const sortedClasses = useMemo(() => {
        return [...classes].sort((a, b) => {
            const left = (a.name || '').toString();
            const right = (b.name || '').toString();
            return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
        });
    }, [classes]);

    const studentCountByClass = useMemo(() => {
        return classes.reduce((counts, schoolClass) => {
            counts[schoolClass.id] = students.filter((student) => {
                return (student.class_name || '').trim().toLowerCase() === schoolClass.name.trim().toLowerCase();
            }).length;
            return counts;
        }, {});
    }, [classes, students]);

    const streamsByClass = useMemo(() => {
        return classes.reduce((result, schoolClass) => {
            result[schoolClass.id] = streams.filter((stream) => String(stream.class_id) === String(schoolClass.id));
            return result;
        }, {});
    }, [classes, streams]);

    const studentCountByStream = (schoolClassId, streamName) => {
        return students.filter((student) => {
            return (
                (student.class_name || '').trim().toLowerCase() === (classes.find((item) => String(item.id) === String(schoolClassId))?.name || '').trim().toLowerCase() &&
                (student.stream || '').trim().toLowerCase() === streamName.trim().toLowerCase()
            );
        }).length;
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('school_token');

            const [classesRes, streamsRes, studentsRes] = await Promise.all([
                api.get('/school/classes', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                api.get('/school/streams', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                api.get('/school/students', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { per_page: 1000 },
                }),
            ]);

            const sortedSchoolClasses = [...(classesRes.data || [])].sort((a, b) => {
                const left = (a.name || '').toString();
                const right = (b.name || '').toString();
                return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
            });

            setClasses(sortedSchoolClasses);
            setStreams(streamsRes.data || []);
            const studentsPayload = studentsRes.data;
            setStudents(
                Array.isArray(studentsPayload)
                    ? studentsPayload
                    : studentsPayload.data || []
            );
        } catch (err) {
            console.error('Failed to load classes:', err);

            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Failed to load classes and streams.';

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleClassChange = (e) => {
        const { name, value } = e.target;
        setClassForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleStreamChange = (e) => {
        const { name, value } = e.target;
        setStreamForm((prev) => ({ ...prev, [name]: value }));
    };

    const resetClassForm = () => {
        setClassForm({ name: '', description: '' });
        setEditingClassId(null);
        setShowAddClassForm(false);
    };

    const resetStreamForm = () => {
        setStreamForm({ class_id: classes[0]?.id || '', name: '', description: '' });
        setEditingStreamId(null);
        setShowAddStreamForm(false);
        setShowStreamModal(false);
    };

    const openClassForm = () => {
        setEditingClassId(null);
        setClassForm({ name: '', description: '' });
        setShowAddClassForm((prev) => !prev);
    };

    const openStreamForm = () => {
        setEditingStreamId(null);
        setStreamForm({ class_id: classes[0]?.id || '', name: '', description: '' });
        setShowAddStreamForm(true);
        setShowStreamModal(true);
    };

    const handleClassSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('school_token');

        try {
            if (editingClassId) {
                await api.put(`/school/classes/${editingClassId}`, classForm, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                await api.post('/school/classes', classForm, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            resetClassForm();
            await fetchData();
        } catch (err) {
            console.error('Failed to save class:', err);
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Failed to save class.';
            setError(message);
        }
    };

    const handleStreamSubmit = async (e) => {
        e.preventDefault();

        if (!streamForm.class_id) {
            setError('Please select a class before creating a stream.');
            return;
        }

        const token = localStorage.getItem('school_token');

        try {
            if (editingStreamId) {
                await api.put(`/school/streams/${editingStreamId}`, streamForm, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                await api.post('/school/streams', streamForm, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            resetStreamForm();
            await fetchData();
        } catch (err) {
            console.error('Failed to save stream:', err);
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Failed to save stream.';
            setError(message);
        }
    };

    const handleViewClass = (schoolClass) => {
        setSelectedClassId(schoolClass.id);
    };

    const handleEditClass = (schoolClass) => {
        setEditingClassId(schoolClass.id);
        setClassForm({
            name: schoolClass.name,
            description: schoolClass.description || '',
        });
    };

    const handleDeleteClass = async (schoolClassId) => {
        if (!window.confirm('Delete this class and all its streams?')) {
            return;
        }

        try {
            const token = localStorage.getItem('school_token');
            await api.delete(`/school/classes/${schoolClassId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchData();
            if (streamForm.class_id === String(schoolClassId)) {
                resetStreamForm();
            }
        } catch (err) {
            console.error('Failed to delete class:', err);
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Failed to delete class.';
            setError(message);
        }
    };

    const handleEditStream = (stream) => {
        setEditingStreamId(stream.id);
        setStreamForm({
            class_id: stream.class_id || '',
            name: stream.name,
            description: stream.description || '',
        });
    };

    const handleDeleteStream = async (streamId) => {
        if (!window.confirm('Delete this stream?')) {
            return;
        }

        try {
            const token = localStorage.getItem('school_token');
            await api.delete(`/school/streams/${streamId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchData();
        } catch (err) {
            console.error('Failed to delete stream:', err);
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Failed to delete stream.';
            setError(message);
        }
    };

    useEffect(() => {
        if (!streamForm.class_id && classes.length > 0) {
            setStreamForm((prev) => ({
                ...prev,
                class_id: prev.class_id || String(classes[0].id),
            }));
        }
    }, [classes, streamForm.class_id]);

    const selectedClassStreams = selectedClass ? streamsByClass[selectedClass.id] || [] : [];
    const selectedClassStudents = selectedClass
        ? students.filter(
              (student) =>
                  (student.class_name || '').trim().toLowerCase() ===
                  (selectedClass.name || '').trim().toLowerCase()
          )
        : [];

    return (
        <div className="classes-page">
            <div className="page-header">
                <div>
                    <h1>Class Management</h1>
                    <p>Manage classes, streams, and student placement.</p>
                </div>
                <div className="card-actions">
                    {!isAutoClassSchool && (
                        <button type="button" className="primary-button" onClick={openClassForm}>
                            {showAddClassForm ? 'Hide Form' : 'Add Class'}
                        </button>
                    )}
                    <button type="button" className="primary-button secondary-button" onClick={openStreamForm}>
                        {showAddStreamForm ? 'Hide Stream Form' : 'Add Stream'}
                    </button>
                </div>
            </div>

            <div className="student-statistics">
                <div className="student-stat-card">
                    <div>
                        <span>Total Classes</span>
                        <strong>{classes.length}</strong>
                    </div>
                    <div className="stat-icon">C</div>
                </div>

                <div className="student-stat-card">
                    <div>
                        <span>Total Streams</span>
                        <strong>{streams.length}</strong>
                    </div>
                    <div className="stat-icon">S</div>
                </div>

                <div className="student-stat-card">
                    <div>
                        <span>Students Assigned</span>
                        <strong>{students.length}</strong>
                    </div>
                    <div className="stat-icon">ST</div>
                </div>
            </div>

            {error && <div className="modal-error">{error}</div>}

            <div className="class-layout">
                {!isAutoClassSchool && showAddClassForm && (
                    <div className="class-panel">
                        <h2>{editingClassId ? 'Edit Class' : 'Create Class'}</h2>

                        <form onSubmit={handleClassSubmit} className="class-form">
                            <div className="form-group">
                                <label>Class Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={classForm.name}
                                    onChange={handleClassChange}
                                    placeholder="e.g. Form One"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={classForm.description}
                                    onChange={handleClassChange}
                                    placeholder="Optional description"
                                />
                            </div>

                            <div className="class-form-actions">
                                <button type="submit" className="primary-button">
                                    {editingClassId ? 'Update Class' : 'Add Class'}
                                </button>
                                {editingClassId && (
                                    <button type="button" className="cancel-button" onClick={resetClassForm}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {showStreamModal && (
                    <div className="modal-backdrop" onClick={resetStreamForm}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editingStreamId ? 'Edit Stream' : 'Create Stream'}</h3>
                                <button type="button" className="modal-close-button" onClick={resetStreamForm}>
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleStreamSubmit} className="class-form">
                                <div className="form-group">
                                    <label>Class</label>
                                    <select
                                        name="class_id"
                                        value={streamForm.class_id}
                                        onChange={handleStreamChange}
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
                                    <label>Stream Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={streamForm.name}
                                        onChange={handleStreamChange}
                                        placeholder="e.g. Stream A"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        name="description"
                                        value={streamForm.description}
                                        onChange={handleStreamChange}
                                        placeholder="Optional description"
                                    />
                                </div>

                                <div className="class-form-actions">
                                    <button type="submit" className="primary-button">
                                        {editingStreamId ? 'Update Stream' : 'Add Stream'}
                                    </button>
                                    <button type="button" className="cancel-button" onClick={resetStreamForm}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isAutoClassSchool && (
                    <div className="class-panel">
                        <h2>Default School Classes</h2>
                        <p>
                            This school is set to a fixed class structure and the default classes are created automatically.
                            No extra class can be added manually.
                        </p>
                    </div>
                )}
            </div>

            {selectedClass && (
                <div className="modal-backdrop" onClick={() => setSelectedClassId(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{selectedClass.name}</h3>
                            <button type="button" className="modal-close-button" onClick={() => setSelectedClassId(null)}>
                                ×
                            </button>
                        </div>

                        <div className="teacher-profile-panel">
                            <p className="class-detail-description">
                                {selectedClass.description || 'No description provided for this class.'}
                            </p>

                            <div className="class-detail-grid">
                                <div className="detail-stat-box">
                                    <span>Streams</span>
                                    <strong>{selectedClassStreams.length}</strong>
                                </div>
                                <div className="detail-stat-box">
                                    <span>Students</span>
                                    <strong>{selectedClassStudents.length}</strong>
                                </div>
                            </div>

                            <div className="class-detail-streams">
                                {selectedClassStreams.length === 0 ? (
                                    <p className="muted">No streams created for this class yet.</p>
                                ) : (
                                    selectedClassStreams.map((stream) => {
                                        const streamStudents = students.filter((student) => {
                                            return (
                                                (student.class_name || '').trim().toLowerCase() ===
                                                    (selectedClass.name || '').trim().toLowerCase() &&
                                                (student.stream || '').trim().toLowerCase() ===
                                                    (stream.name || '').trim().toLowerCase()
                                            );
                                        });

                                        return (
                                            <div key={stream.id} className="class-detail-stream-item">
                                                <div className="class-detail-stream-header">
                                                    <h4>{stream.name}</h4>
                                                    <span>{streamStudents.length} student(s)</span>
                                                </div>
                                                <p>{stream.description || 'No description.'}</p>
                                                {streamStudents.length > 0 ? (
                                                    <ul className="student-mini-list">
                                                        {streamStudents.map((student) => (
                                                            <li key={student.id}>
                                                                {student.first_name} {student.middle_name || ''} {student.last_name}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="muted">No students assigned to this stream yet.</p>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="class-form-actions">
                            <button type="button" className="cancel-button" onClick={() => setSelectedClassId(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="empty-state">
                    <h3>Loading classes...</h3>
                    <p>Please wait.</p>
                </div>
            ) : classes.length === 0 ? (
                <div className="empty-state">
                    <h3>No classes found</h3>
                    <p>Create your first class to start managing streams and student placement.</p>
                </div>
            ) : (
                <div className="class-list">
                    {classes.map((schoolClass) => (
                        <div key={schoolClass.id} className="class-card">
                            <div className="class-card-header">
                                <div>
                                    <h3>{schoolClass.name}</h3>
                                </div>

                                <div className="card-actions">
                                    <button
                                        type="button"
                                        className="view-button"
                                        onClick={() => handleViewClass(schoolClass)}
                                    >
                                        View
                                    </button>
                                    <button
                                        type="button"
                                        className="edit-button"
                                        onClick={() => handleEditClass(schoolClass)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        className="delete-button"
                                        onClick={() => handleDeleteClass(schoolClass.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ClassesPage;
