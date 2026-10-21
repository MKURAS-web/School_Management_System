import { useEffect, useState } from 'react';
import api from '../../../api/api';
import '../../styles/Announcements.css';

function Announcements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        title: '',
        message: '',
    });

    const [creating, setCreating] = useState(false);
    const [success, setSuccess] = useState('');

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/announcements');

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

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!form.title.trim() || !form.message.trim()) {
            setError('Please enter both title and message.');
            return;
        }

        try {
            setCreating(true);
            setError('');
            setSuccess('');

            const response = await api.post('/announcements', {
                title: form.title.trim(),
                message: form.message.trim(),
            });

            setSuccess('Announcement created successfully.');
            setForm({ title: '', message: '' });

            const newAnnouncement = response.data.data;
            setAnnouncements((current) => [
                newAnnouncement,
                ...current,
            ]);
        } catch (err) {
            console.error('Failed to create announcement:', err);

            setError(
                err.response?.data?.message ||
                'Failed to create announcement.'
            );
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (
            !window.confirm(
                'Are you sure you want to delete this announcement?'
            )
        ) {
            return;
        }

        try {
            await api.delete(`/announcements/${id}`);

            setSuccess('Announcement deleted successfully.');
            setAnnouncements((current) =>
                current.filter((a) => a.id !== id)
            );
        } catch (err) {
            console.error('Failed to delete announcement:', err);

            setError(
                err.response?.data?.message ||
                'Failed to delete announcement.'
            );
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <h1>Announcements</h1>
                        <p>Loading announcements...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1>Announcements</h1>
                    <p>
                        Create announcements visible to all teachers in your
                        school.
                    </p>
                </div>
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
                        onClick={fetchAnnouncements}
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

            {/* Create Announcement Form */}
            <div className="admin-card admin-announcements-form">
                <div className="admin-card-header">
                    <h2>Create Announcement</h2>
                    <p>
                        Send an announcement to all teachers in your school.
                    </p>
                </div>

                <form onSubmit={handleCreate} className="admin-form">
                    <div className="admin-form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="e.g. Staff Meeting Tomorrow"
                            required
                        />
                    </div>

                    <div className="admin-form-group">
                        <label>Message *</label>
                        <textarea
                            name="message"
                            value={form.message}
                            onChange={handleChange}
                            placeholder="Enter your announcement message..."
                            rows="4"
                            required
                        />
                    </div>

                    <div className="admin-form-actions">
                        <button
                            type="button"
                            className="admin-button-secondary"
                            onClick={() => setForm({ title: '', message: '' })}
                            disabled={creating}
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            className="admin-button-primary"
                            disabled={creating}
                        >
                            {creating ? 'Creating...' : 'Create Announcement'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Announcements List */}
            <div className="admin-card">
                <div className="admin-card-header">
                    <h2>School Announcements</h2>
                    <p>
                        Announcements created by admins in your school.
                    </p>
                </div>

                {announcements.length === 0 ? (
                    <div className="admin-empty-state">
                        <div>📢</div>
                        <h3>No announcements yet</h3>
                        <p>
                            Create your first announcement to notify teachers.
                        </p>
                    </div>
                ) : (
                    <div className="admin-announcements-list">
                        {announcements.map((announcement) => (
                            <div
                                key={announcement.id}
                                className="admin-announcement-item"
                            >
                                <div className="admin-announcement-content">
                                    <div className="admin-announcement-header">
                                        <h3>{announcement.title}</h3>
                                        <span className="admin-announcement-date">
                                            {new Date(
                                                announcement.created_at
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="admin-announcement-meta">
                                        <span>By: </span>
                                        <strong>
                                            {announcement.creator?.name ||
                                                'Admin'}
                                        </strong>
                                    </div>

                                    <p className="admin-announcement-message">
                                        {announcement.message}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="admin-button-danger"
                                    onClick={() =>
                                        handleDelete(announcement.id)
                                    }
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Announcements;
