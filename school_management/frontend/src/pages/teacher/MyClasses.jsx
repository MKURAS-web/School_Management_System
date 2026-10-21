import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import '../styles/teacher/MyClasses.css';

function MyClasses() {
    const navigate = useNavigate();

    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/teacher/classes');

            setClasses(response.data.classes || []);
        } catch (err) {
            console.error('Failed to fetch classes:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load your classes.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="teacher-classes-page">

            {/* Header */}
            <div className="teacher-classes-header">
                <div>
                    <h1>My Classes</h1>
                    <p>
                        View the classes assigned to you.
                    </p>
                </div>

                <div className="classes-count">
                    <span>{classes.length}</span>
                    <small>Classes</small>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="classes-state">
                    <div className="classes-spinner"></div>
                    <p>Loading your classes...</p>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="classes-error">
                    <strong>Unable to load classes</strong>

                    <p>{error}</p>

                    <button onClick={fetchClasses}>
                        Try Again
                    </button>
                </div>
            )}

            {/* Empty */}
            {!loading && !error && classes.length === 0 && (
                <div className="classes-empty">
                    <div className="empty-icon">
                        🏫
                    </div>

                    <h3>No Classes Assigned</h3>

                    <p>
                        You currently don't have any classes assigned to you.
                    </p>
                </div>
            )}

            {/* Classes */}
            {!loading && !error && classes.length > 0 && (
                <div className="classes-grid">

                    {classes.map((schoolClass) => (
                        <div
                            className="class-card"
                            key={schoolClass.id}
                            onClick={() =>
                                navigate(
                                    `/teacher/classes/${schoolClass.id}`
                                )
                            }
                        >

                            <div className="class-card-top">

                                <div className="class-icon">
                                    🏫
                                </div>

                                <span className="class-number">
                                    #{schoolClass.id}
                                </span>

                            </div>

                            <div className="class-card-body">

                                <h2>
                                    {schoolClass.name}
                                </h2>

                                {schoolClass.code && (
                                    <p className="class-code">
                                        Code: {schoolClass.code}
                                    </p>
                                )}

                                {schoolClass.description && (
                                    <p className="class-description">
                                        {schoolClass.description}
                                    </p>
                                )}

                            </div>

                            <div className="class-card-footer">
                                <span className="class-status">
                                    Active
                                </span>
                            </div>

                        </div>
                    ))}

                </div>
            )}

        </div>
    );
}

export default MyClasses;