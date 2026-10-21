import { useEffect, useState } from 'react';
import api from '../../api/api';
import '../styles/teacher/Notifications.css';

const TYPE_ICONS = {
    assignment: '☷',
    timetable: '▦',
    announcement: '📢',
    lesson: '▤',
    marks: '▤',
};

function Notifications() {
    const [filter, setFilter] = useState('All');

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError('');

            const filterParam = filter === 'All' ? '' : filter.toLowerCase();

            const response = await api.get('/notifications', {
                params: filterParam ? { filter: filterParam } : undefined,
            });

            const data = Array.isArray(response.data.data)
                ? response.data.data
                : [];

            setNotifications(data);
        } catch (err) {
            console.error('Failed to load notifications:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load your notifications. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const unreadCount = notifications.filter(
        (notification) => !notification.is_read
    ).length;

    const filteredNotifications = notifications.filter(
        (notification) => {
            if (filter === 'Unread') {
                return !notification.is_read;
            }

            if (filter === 'Read') {
                return notification.is_read;
            }

            return true;
        }
    );

    const markAsRead = async (id) => {
        try {
            await api.post(`/notifications/${id}/read`);

            setNotifications((current) =>
                current.map((notification) =>
                    notification.id === id
                        ? { ...notification, is_read: true }
                        : notification
                )
            );

            setSuccess('Notification marked as read.');
        } catch (err) {
            console.error('Failed to mark as read:', err);

            setError(
                err.response?.data?.message ||
                'Failed to mark notification as read.'
            );
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/read-all');

            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    is_read: true,
                }))
            );

            setSuccess('All notifications marked as read.');
        } catch (err) {
            console.error('Failed to mark all as read:', err);

            setError(
                err.response?.data?.message ||
                'Failed to mark all notifications as read.'
            );
        }
    };

    const deleteNotification = async (id) => {
        if (!window.confirm('Are you sure you want to delete this notification?')) {
            return;
        }

        try {
            await api.delete(`/notifications/${id}`);

            setNotifications((current) =>
                current.filter(
                    (notification) => notification.id !== id
                )
            );

            setSuccess('Notification deleted successfully.');
        } catch (err) {
            console.error('Failed to delete notification:', err);

            setError(
                err.response?.data?.message ||
                'Failed to delete notification.'
            );
        }
    };

    const getIcon = (type) => {
        return TYPE_ICONS[type] || '●';
    };

    if (loading) {
        return (
            <div className="teacher-page">
                <div className="teacher-page-header">
                    <div>
                        <h1>Notifications</h1>
                        <p>Loading your notifications...</p>
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
                    <h1>Notifications</h1>

                    <p>
                        Stay updated with important school activities.
                    </p>
                </div>

                {unreadCount > 0 && (
                    <button
                        type="button"
                        className="teacher-mark-all-button"
                        onClick={markAllAsRead}
                    >
                        Mark all as read
                    </button>
                )}

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
                        onClick={fetchNotifications}
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

            {/* Summary */}
            <div className="teacher-notification-summary">

                <div className="teacher-notification-summary-card">
                    <span>Total Notifications</span>
                    <strong>{notifications.length}</strong>
                </div>

                <div className="teacher-notification-summary-card">
                    <span>Unread</span>
                    <strong>{unreadCount}</strong>
                </div>

                <div className="teacher-notification-summary-card">
                    <span>Read</span>
                    <strong>
                        {notifications.length - unreadCount}
                    </strong>
                </div>

            </div>

            {/* Filters */}
            <div className="teacher-notification-filters">

                <button
                    type="button"
                    className={
                        filter === 'All'
                            ? 'active'
                            : ''
                    }
                    onClick={() => setFilter('All')}
                >
                    All
                    <span>{notifications.length}</span>
                </button>

                <button
                    type="button"
                    className={
                        filter === 'Unread'
                            ? 'active'
                            : ''
                    }
                    onClick={() => setFilter('Unread')}
                >
                    Unread
                    <span>{unreadCount}</span>
                </button>

                <button
                    type="button"
                    className={
                        filter === 'Read'
                            ? 'active'
                            : ''
                    }
                    onClick={() => setFilter('Read')}
                >
                    Read
                    <span>
                        {notifications.length - unreadCount}
                    </span>
                </button>

            </div>

            {/* Notifications */}
            <div className="teacher-notifications-list">

                {filteredNotifications.length === 0 ? (

                    <div className="teacher-empty-state">
                        <div>✓</div>
                        <h3>No notifications</h3>
                        <p>
                            There are no notifications in this category.
                        </p>
                    </div>

                ) : (

                    filteredNotifications.map((notification) => (

                        <div
                            key={notification.id}
                            className={`teacher-notification-item ${notification.is_read ? 'read' : 'unread'}`}
                        >

                            <div className="teacher-notification-icon">
                                {getIcon(notification.type)}
                            </div>

                            <div className="teacher-notification-content">

                                <div className="teacher-notification-title-row">

                                    <h3>
                                        {notification.title}
                                    </h3>

                                    {!notification.is_read && (
                                        <span className="teacher-unread-dot" />
                                    )}

                                </div>

                                <p>
                                    {notification.message}
                                </p>

                                <span className="teacher-notification-time">
                                    {notification.created_at
                                        ? new Date(
                                              notification.created_at
                                          ).toLocaleString()
                                        : notification.time || '—'}
                                </span>

                            </div>

                            <div className="teacher-notification-actions">

                                {!notification.is_read && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            markAsRead(notification.id)
                                    }
                                    >
                                        Mark as read
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="delete"
                                    onClick={() =>
                                        deleteNotification(notification.id)
                                    }
                                >
                                    Delete
                                </button>

                            </div>

                        </div>

                    ))

                )}

            </div>

        </div>
    );
}

export default Notifications;
