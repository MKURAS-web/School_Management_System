import { useEffect, useState } from 'react';
import api from '../../api/api';
import '../styles/teacher/Assignments.css';

function Assignments() {
    const [search, setSearch] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('All Subjects');

    const [assignments, setAssignments] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const EXAM_TYPE_LABELS = {
        quiz: 'Quiz',
        test: 'Test',
        midterm: 'Midterm Examination',
        terminal: 'Terminal Examination',
        annual: 'Annual Examination',
        mock: 'Mock Examination',
        other: 'Other',
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            const results = await Promise.allSettled([
                api.get('/teacher/examinations'),
                api.get('/teacher/subjects'),
            ]);

            const [examsResult, subjectsResult] = results;

            if (examsResult.status === 'fulfilled') {
                const data = examsResult.value.data;
                const exams = Array.isArray(data) ? data : (data?.data || []);
                setAssignments(exams);
            } else {
                console.error('Could not load examinations:', examsResult.reason);
            }

            if (subjectsResult.status === 'fulfilled') {
                const data = subjectsResult.data;
                const subjectList = Array.isArray(data)
                    ? data
                    : data?.subjects || [];
                setSubjects(subjectList);
            } else {
                console.error('Could not load subjects:', subjectsResult.reason);
            }
        } catch (err) {
            console.error('Failed to load assignments:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load your assignments. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const filteredAssignments = assignments.filter((assignment) => {
        const title = (assignment.title || '').toLowerCase();
        const className =
            (assignment.school_class?.name ||
                assignment.schoolClass?.name ||
                '').toLowerCase();

        const matchesSearch =
            title.includes(search.toLowerCase()) ||
            className.includes(search.toLowerCase());

        const subjectName =
            (assignment.subject?.name || '').toLowerCase();
        const matchesSubject =
            selectedSubject === 'All Subjects' ||
            subjectName === selectedSubject.toLowerCase();

        return matchesSearch && matchesSubject;
    });

    const allSubjectNames = [
        ...new Set(subjects.map((s) => s.name).filter(Boolean)),
    ];

    if (loading) {
        return (
            <div className="teacher-page">
                <div className="teacher-page-header">
                    <div>
                        <h1>Assignments</h1>
                        <p>Loading your assignments...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="teacher-page">

            {/* Header */}
            <div className="teacher-page-header">

                <div>
                    <h1>Assignments</h1>

                    <p>
                        Create, manage and track your student assignments.
                    </p>
                </div>

                <button
                    type="button"
                    className="teacher-create-assignment-button"
                    onClick={() => {
                        const exam = assignments[0];
                        if (exam) {
                            alert(
                                `Viewing assignment: ${exam.title}\n\nClass: ${exam.school_class?.name || exam.schoolClass?.name || 'N/A'}\nSubject: ${exam.subject?.name || 'N/A'}\nType: ${EXAM_TYPE_LABELS[exam.exam_type] || exam.exam_type}\nDate: ${exam.exam_date || 'N/A'}\nTotal Marks: ${exam.total_marks || 'N/A'}\nStatus: ${exam.status || 'N/A'}`
                            );
                        } else {
                            alert('No assignments available to view.');
                        }
                    }}
                >
                    + Create Assignment
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

            {/* Filters */}
            <div className="teacher-assignment-filters">

                <div className="teacher-assignment-search">
                    <input
                        type="text"
                        placeholder="Search assignments..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="teacher-filter-group">
                    <select
                        value={selectedSubject}
                        onChange={(e) =>
                            setSelectedSubject(e.target.value)
                        }
                    >
                        <option>All Subjects</option>
                        {allSubjectNames.map((subjectName) => (
                            <option key={subjectName}>
                                {subjectName}
                            </option>
                        ))}
                    </select>
                </div>

            </div>

            {/* Assignment Cards */}
            <div className="teacher-assignments-list">

                {filteredAssignments.length === 0 ? (

                    <div className="teacher-empty-state">
                        <div>☷</div>
                        <h3>No assignments found</h3>
                        <p>
                            Try changing your search or subject filter.
                        </p>
                    </div>

                ) : (

                    filteredAssignments.map((assignment) => {

                        const totalStudents =
                            assignment.submission?.students?.length || 0;

                        const submittedCount =
                            assignment.submission?.students?.filter(
                                (s) => s.marks_obtained !== null
                            ).length || 0;

                        const submissionRate =
                            totalStudents > 0
                                ? Math.round(
                                      (submittedCount / totalStudents) *
                                          100
                                  )
                                : 0;

                        const examTypeLabel =
                            EXAM_TYPE_LABELS[assignment.exam_type] ||
                            assignment.exam_type;

                        return (
                            <div
                                className="teacher-assignment-card"
                                key={assignment.id}
                            >

                                {/* Assignment Header */}
                                <div className="teacher-assignment-header">

                                    <div className="teacher-assignment-icon">
                                        ☷
                                    </div>

                                    <div className="teacher-assignment-title">
                                        <h2>{assignment.title}</h2>

                                        <span>
                                            {assignment.subject?.name || '—'} •{' '}
                                            {assignment.school_class?.name ||
                                                assignment.schoolClass?.name ||
                                                '—'}
                                        </span>
                                    </div>

                                    <span
                                        className={`teacher-assignment-status ${
                                            assignment.status ===
                                            'Active' ||
                                            assignment.status === 'submitted'
                                                ? 'active'
                                                : 'completed'
                                        }`}
                                    >
                                        {assignment.status}
                                    </span>

                                </div>

                                {/* Details */}
                                <div className="teacher-assignment-details">

                                    <div>
                                        <span>Due Date</span>
                                        <strong>
                                            {assignment.exam_date ||
                                                '—'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Type</span>
                                        <strong>{examTypeLabel}</strong>
                                    </div>

                                    <div>
                                        <span>Total Marks</span>
                                        <strong>
                                            {assignment.total_marks || '—'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Submission Rate</span>
                                        <strong>
                                            {submissionRate}%
                                        </strong>
                                    </div>

                                </div>

                                {/* Progress */}
                                <div className="teacher-assignment-progress">

                                    <div className="teacher-assignment-progress-label">
                                        <span>
                                            Submission Progress
                                        </span>

                                        <strong>
                                            {submissionRate}%
                                        </strong>
                                    </div>

                                    <div className="teacher-progress-bar">
                                        <div
                                            style={{
                                                width: `${submissionRate}%`,
                                            }}
                                        />
                                    </div>

                                </div>

                                {/* Footer */}
                                <div className="teacher-assignment-footer">

                                    <button
                                        type="button"
                                        className="teacher-assignment-view-button"
                                        onClick={() =>
                                            alert(
                                                `Viewing ${assignment.title}\n\nClass: ${assignment.school_class?.name || assignment.schoolClass?.name || 'N/A'}\nSubject: ${assignment.subject?.name || 'N/A'}\nType: ${examTypeLabel}\nDate: ${assignment.exam_date || 'N/A'}\nTotal Marks: ${assignment.total_marks || 'N/A'}\nStatus: ${assignment.status || 'N/A'}\nStudents with marks: ${submittedCount}/${totalStudents}`
                                            )
                                        }
                                    >
                                        View Assignment
                                    </button>

                                    <button
                                        type="button"
                                        className="teacher-assignment-secondary-button"
                                        onClick={() =>
                                            alert(
                                                `Student submissions for ${assignment.title}\n\n${submittedCount} of ${totalStudents} students have marks entered.`
                                            )
                                        }
                                    >
                                        Submissions
                                    </button>

                                </div>

                            </div>
                        );
                    })
                )}

            </div>

        </div>
    );
}

export default Assignments;
