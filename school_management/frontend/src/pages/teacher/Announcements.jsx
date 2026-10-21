import { useEffect, useState } from 'react';
import api from '../../api/api';
import '../styles/teacher/Announcements.css';

function TeacherAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/teacher/announcements');

            setAnnouncements(response.data.data || []);
        } catch (err) {
            console.error('Failed to load announcements:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load announcements.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    // Mark all announcements as read when the teacher views this page
    useEffect(() => {
        const markAsRead = async () => {
            try {
                await api.post('/teacher/announcements/read-all');
            } catch (err) {
                console.error('Failed to mark announcements as read:', err);
            }
        };

        markAsRead();
    }, [announcements]);

    if (loading) {
        return (
            <div className="teacher-page">
                <div className="teacher-page-header">
                    <div>
                        <h1>Announcements</h1>
                        <p>Loading announcements...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="teacher-page">
                <div className="teacher-page-header">
                    <div>
                        <h1>Announcements</h1>
                        <p>View announcements from your school admin.</p>
                    </div>
                </div>

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
                        style={{ marginLeft: '10px', cursor: 'pointer' }}
                        onClick={() => {
                            window.location.reload();
                        }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="teacher-page">
            <div className="teacher-page-header">
                <div>
                    <h1>Announcements</h1>
                    <p>
                        View announcements from your school administration.
                    </p>
                </div>
            </div>

            {announcements.length === 0 ? (
                <div className="teacher-empty-state">
                    <div>📢</div>
                    <h3>No announcements</h3>
                    <p>
                        There are no announcements from your school admin yet.
                    </p>
                </div>
            ) : (
                <div className="teacher-announcements-list">
                    {announcements.map((announcement) => (
                        <div
                            key={announcement.id}
                            className="teacher-announcement-card"
                        >
                            <div className="teacher-announcement-icon">
                                📢
                            </div>

                            <div className="teacher-announcement-content">
                                <div className="teacher-announcement-header">
                                    <h3>{announcement.title}</h3>
                                    <span className="teacher-announcement-date">
                                        {new Date(
                                            announcement.created_at
                                        ).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="teacher-announcement-meta">
                                    <span>From: </span>
                                    <strong>
                                        {announcement.creator?.name ||
                                            'School Admin'}
                                    </strong>
                                </div>

                                <p className="teacher-announcement-message">
                                    {announcement.message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TeacherAnnouncements;
