import { useEffect, useState } from 'react';
import api from '../../api/api';
import '../styles/teacher/LessonPlan.css';

const STATUS_LABELS = {
    draft: 'Draft',
    prepared: 'Prepared',
    completed: 'Completed',
};

function LessonPlans() {
    const [search, setSearch] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('All Subjects');
    const [selectedStatus, setSelectedStatus] = useState('All Status');

    const [lessonPlans, setLessonPlans] = useState([]);
    const [subjects, setSubjects] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            const results = await Promise.allSettled([
                api.get('/lesson-plans'),
                api.get('/teacher/subjects'),
            ]);

            const [plansResult, subjectsResult] = results;

            if (plansResult.status === 'fulfilled') {
                const data = plansResult.value.data;
                const plans = Array.isArray(data) ? data : (data?.data || []);
                setLessonPlans(plans);
            } else {
                console.error(
                    'Could not load lesson plans:',
                    plansResult.reason
                );
            }

            if (subjectsResult.status === 'fulfilled') {
                const data = subjectsResult.data;
                const subjectList = Array.isArray(data)
                    ? data
                    : data?.subjects || [];
                setSubjects(subjectList);
            } else {
                console.error(
                    'Could not load subjects:',
                    subjectsResult.reason
                );
            }
        } catch (err) {
            console.error('Failed to load lesson plans:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load your lesson plans. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);

        const topic = formData.get('topic');
        const subject_id = formData.get('subject_id') || undefined;
        const class_id = formData.get('class_id') || undefined;
        const lesson_date = formData.get('lesson_date') || undefined;
        const duration = formData.get('duration') || undefined;
        const status = formData.get('status') || 'draft';
        const notes = formData.get('notes') || undefined;

        if (!topic || !lesson_date) {
            setError('Please enter a topic and lesson date.');
            return;
        }

        try {
            const response = await api.post('/lesson-plans', {
                topic,
                subject_id: subject_id ? Number(subject_id) : null,
                class_id: class_id ? Number(class_id) : null,
                lesson_date,
                duration,
                status,
                notes,
            });

            setSuccess('Lesson plan created successfully.');
            event.target.reset();

            const newPlan = response.data.data;
            setLessonPlans((current) => [newPlan, ...current]);
        } catch (err) {
            console.error('Failed to create lesson plan:', err);

            setError(
                err.response?.data?.message ||
                'Failed to create lesson plan.'
            );
        }
    };

    const handleUpdateStatus = async (planId, newStatus) => {
        try {
            const response = await api.put(`/lesson-plans/${planId}`, {
                status: newStatus,
            });

            const updated = response.data.data;

            setLessonPlans((current) =>
                current.map((plan) =>
                    plan.id === planId ? updated : plan
                )
            );

            setSuccess(`Lesson plan marked as ${STATUS_LABELS[newStatus]}.`);
        } catch (err) {
            console.error('Failed to update lesson plan:', err);

            setError(
                err.response?.data?.message ||
                'Failed to update lesson plan.'
            );
        }
    };

    const handleDelete = async (planId) => {
        if (!window.confirm('Are you sure you want to delete this lesson plan?')) {
            return;
        }

        try {
            await api.delete(`/lesson-plans/${planId}`);

            setSuccess('Lesson plan deleted successfully.');
            setLessonPlans((current) =>
                current.filter((plan) => plan.id !== planId)
            );
        } catch (err) {
            console.error('Failed to delete lesson plan:', err);

            setError(
                err.response?.data?.message ||
                'Failed to delete lesson plan.'
            );
        }
    };

    const filteredPlans = lessonPlans.filter((plan) => {
        const matchesSearch =
            plan.topic.toLowerCase().includes(search.toLowerCase()) ||
            (plan.schoolClass?.name || '')
                .toLowerCase()
                .includes(search.toLowerCase());

        const matchesSubject =
            selectedSubject === 'All Subjects' ||
            (plan.subject?.name || '').toLowerCase() ===
                selectedSubject.toLowerCase();

        const matchesStatus =
            selectedStatus === 'All Status' ||
            plan.status === selectedStatus.toLowerCase();

        return matchesSearch && matchesSubject && matchesStatus;
    });

    if (loading) {
        return (
            <div className="teacher-page">
                <div className="teacher-page-header">
                    <div>
                        <h1>Lesson Plans</h1>
                        <p>Loading your lesson plans...</p>
                    </div>
                </div>
            </div>
        );
    }

    const totalPrepared = lessonPlans.filter(
        (p) => p.status === 'prepared'
    ).length;
    const totalDrafts = lessonPlans.filter((p) => p.status === 'draft').length;
    const totalCompleted = lessonPlans.filter(
        (p) => p.status === 'completed'
    ).length;

    return (
        <div className="teacher-page">

            {/* Header */}
            <div className="teacher-page-header">

                <div>
                    <h1>Lesson Plans</h1>

                    <p>
                        Prepare and manage your lesson plans.
                    </p>
                </div>

                <button
                    type="button"
                    className="teacher-create-lesson-button"
                    onClick={() => {
                        document
                            .getElementById('create-lesson-form')
                            ?.scrollIntoView({ behavior: 'smooth' });
                    }}
                >
                    + Create Lesson Plan
                </button>

            </div>

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
                    <button
                        onClick={loadData}
                        style={{ marginLeft: '10px', cursor: 'pointer' }}
                    >
                        Try Again
                    </button>
                </div>
            )}

            {success && (
                <div style={{
                    marginBottom: '20px',
                    padding: '12px 15px',
                    borderRadius: '8px',
                    background: '#dcfce7',
                    color: '#166534',
                    fontSize: '13px'
                }}>
                    {success}
                    <button
                        onClick={() => setSuccess('')}
                        style={{ marginLeft: '10px', cursor: 'pointer' }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Statistics */}
            <div className="teacher-lesson-plan-summary">

                <div className="teacher-lesson-summary-card">
                    <span>Total Plans</span>
                    <strong>{lessonPlans.length}</strong>
                </div>

                <div className="teacher-lesson-summary-card">
                    <span>Prepared</span>
                    <strong>{totalPrepared}</strong>
                </div>

                <div className="teacher-lesson-summary-card">
                    <span>Drafts</span>
                    <strong>{totalDrafts}</strong>
                </div>

                <div className="teacher-lesson-summary-card">
                    <span>Completed</span>
                    <strong>{totalCompleted}</strong>
                </div>

            </div>

            {/* Create Form */}
            <div className="teacher-dashboard-card teacher-lesson-plan-create-card" id="create-lesson-form">
                <div className="teacher-card-header">
                    <div>
                        <h2>Create Lesson Plan</h2>
                        <p>Enter the lesson plan details below.</p>
                    </div>
                </div>

                <form onSubmit={handleCreate} className="teacher-lesson-plan-create-form">
                    <div className="teacher-filter-group">
                        <label htmlFor="plan-topic">Topic *</label>
                        <input
                            id="plan-topic"
                            type="text"
                            name="topic"
                            placeholder="e.g. Linear Equations"
                            maxLength={255}
                            required
                        />
                    </div>

                    <div className="teacher-filter-group">
                        <label htmlFor="plan-subject">Subject</label>
                        <select
                            id="plan-subject"
                            name="subject_id"
                        >
                            <option value="">No subject</option>
                            {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                    {subject.code ? ` (${subject.code})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="teacher-filter-group">
                        <label htmlFor="plan-class">Class</label>
                        <select id="plan-class" name="class_id">
                            <option value="">No class</option>
                        </select>
                    </div>

                    <div className="teacher-filter-group">
                        <label htmlFor="plan-date">Lesson Date *</label>
                        <input
                            id="plan-date"
                            type="date"
                            name="lesson_date"
                            required
                        />
                    </div>

                    <div className="teacher-filter-group">
                        <label htmlFor="plan-duration">Duration</label>
                        <input
                            id="plan-duration"
                            type="text"
                            name="duration"
                            placeholder="e.g. 40 minutes"
                            maxLength={50}
                        />
                    </div>

                    <div className="teacher-filter-group">
                        <label htmlFor="plan-status">Status</label>
                        <select id="plan-status" name="status" defaultValue="draft">
                            <option value="draft">Draft</option>
                            <option value="prepared">Prepared</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div className="teacher-filter-group teacher-lesson-plan-notes">
                        <label htmlFor="plan-notes">Notes (Optional)</label>
                        <textarea
                            id="plan-notes"
                            name="notes"
                            rows="3"
                            placeholder="Additional lesson details..."
                        />
                    </div>

                    <div className="teacher-lesson-plan-form-actions">
                        <button
                            type="button"
                            className="teacher-lesson-cancel-button"
                            onClick={() => {
                                document.getElementById('create-lesson-form')?.scrollIntoView();
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="teacher-save-lesson-button"
                        >
                            Create Lesson Plan
                        </button>
                    </div>
                </form>
            </div>

            {/* Filters */}
            <div className="teacher-lesson-plan-filters">

                <input
                    type="text"
                    placeholder="Search by topic or class..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    value={selectedSubject}
                    onChange={(e) =>
                        setSelectedSubject(e.target.value)
                    }
                >
                    <option>All Subjects</option>
                    {subjects.map((subject) => (
                        <option key={subject.id}>
                            {subject.name}
                            {subject.code ? ` (${subject.code})` : ''}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedStatus}
                    onChange={(e) =>
                        setSelectedStatus(e.target.value)
                    }
                >
                    <option>All Status</option>
                    <option>Draft</option>
                    <option>Prepared</option>
                    <option>Completed</option>
                </select>

            </div>

            {/* Plans */}
            <div className="teacher-lesson-plans-list">

                {filteredPlans.length === 0 ? (

                    <div className="teacher-empty-state">
                        <div>▤</div>
                        <h3>No lesson plans found</h3>
                        <p>
                            Try changing your search or filters.
                        </p>
                    </div>

                ) : (

                    filteredPlans.map((plan) => (

                        <div
                            className="teacher-lesson-plan-card"
                            key={plan.id}
                        >

                            <div className="teacher-lesson-plan-icon">
                                ▤
                            </div>

                            <div className="teacher-lesson-plan-main">

                                <div className="teacher-lesson-plan-top">

                                    <div>
                                        <h2>{plan.topic}</h2>

                                        <p>
                                            {plan.subject?.name || 'No subject'} •{' '}
                                            {plan.schoolClass?.name || 'No class'}
                                        </p>
                                    </div>

                                    <span
                                        className={`teacher-lesson-status ${plan.status}`}
                                    >
                                        {STATUS_LABELS[plan.status] || plan.status}
                                    </span>

                                </div>

                                <div className="teacher-lesson-plan-info">

                                    <div>
                                        <span>Lesson Date</span>
                                        <strong>
                                            {plan.lesson_date || '—'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Duration</span>
                                        <strong>
                                            {plan.duration || '—'}
                                        </strong>
                                    </div>

                                </div>

                                <div className="teacher-lesson-plan-footer">

                                    <button
                                        type="button"
                                        className="teacher-lesson-view-button"
                                        onClick={() =>
                                            alert(
                                                `Viewing ${plan.topic}\n\nSubject: ${plan.subject?.name || 'N/A'}\nClass: ${plan.schoolClass?.name || 'N/A'}\nDate: ${plan.lesson_date || 'N/A'}\nDuration: ${plan.duration || 'N/A'}\nStatus: ${STATUS_LABELS[plan.status]}\nNotes: ${plan.notes || 'None'}`
                                            )
                                        }
                                    >
                                        View Plan
                                    </button>

                                    <select
                                        value={plan.status}
                                        onChange={(e) =>
                                            handleUpdateStatus(plan.id, e.target.value)
                                        }
                                        className="teacher-lesson-status-select"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="prepared">Prepared</option>
                                        <option value="completed">Completed</option>
                                    </select>

                                    <button
                                        type="button"
                                        className="teacher-lesson-delete-button"
                                        onClick={() => handleDelete(plan.id)}
                                    >
                                        Delete
                                    </button>

                                </div>

                            </div>

                        </div>

                    ))
                )}

            </div>

        </div>
    );
}

export default LessonPlans;
