import { useEffect, useState } from 'react';
import api from '../../api/api';
import '../styles/teacher/MySubjects.css';

function MySubjects() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/teacher/subjects');

            setSubjects(response.data.subjects || []);
        } catch (err) {
            console.error('Failed to fetch subjects:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load your subjects.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="teacher-subjects-page">

            {/* Header */}
            <div className="teacher-subjects-header">
                <div>
                    <h1>My Subjects</h1>
                    <p>
                        View the subjects assigned to you.
                    </p>
                </div>

                <div className="subjects-count">
                    <span>{subjects.length}</span>
                    <small>Subjects</small>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="subjects-state">
                    <div className="subjects-spinner"></div>
                    <p>Loading your subjects...</p>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="subjects-error">
                    <strong>Unable to load subjects</strong>
                    <p>{error}</p>

                    <button onClick={fetchSubjects}>
                        Try Again
                    </button>
                </div>
            )}

            {/* Empty */}
            {!loading && !error && subjects.length === 0 && (
                <div className="subjects-empty">
                    <div className="empty-icon">📚</div>

                    <h3>No Subjects Assigned</h3>

                    <p>
                        You currently don't have any subjects assigned to you.
                    </p>
                </div>
            )}

            {/* Subjects */}
            {!loading && !error && subjects.length > 0 && (
                <div className="subjects-grid">

                    {subjects.map((subject) => (
                        <div
                            className="subject-card"
                            key={subject.id}
                        >
                            <div className="subject-card-top">
                                <div className="subject-icon">
                                    📚
                                </div>

                                <span className="subject-number">
                                    #{subject.id}
                                </span>
                            </div>

                            <div className="subject-card-body">
                                <h2>
                                    {subject.name}
                                </h2>

                                {subject.code && (
                                    <p className="subject-code">
                                        Code: {subject.code}
                                    </p>
                                )}

                                {subject.description && (
                                    <p className="subject-description">
                                        {subject.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}

                </div>
            )}

        </div>
    );
}

export default MySubjects;