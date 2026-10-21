import { useEffect, useState } from 'react';
import api from '../../api/api';

function TeacherDashboard() {
    const [teacher, setTeacher] = useState(null);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [studentsByClass, setStudentsByClass] = useState({});
    const [announcements, setAnnouncements] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const getGreeting = () => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            return { text: 'Good morning', emoji: '🌅' };
        }

        if (hour >= 12 && hour < 17) {
            return { text: 'Good afternoon', emoji: '☀️' };
        }

        if (hour >= 17 && hour < 21) {
            return { text: 'Good evening', emoji: '🌇' };
        }

        return { text: 'Good night', emoji: '🌙' };
    };

    const greeting = getGreeting();

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError('');

            const [dashboardRes, announcementsRes] = await Promise.allSettled([
                api.get('/school/teacher/dashboard'),
                api.get('/teacher/announcements'),
            ]);

            if (dashboardRes.status === 'fulfilled') {
                const data = dashboardRes.value.data;
                setTeacher(data.teacher || null);
                setClasses(data.classes || []);
                setSubjects(data.subjects || []);
                setStudentsByClass(data.studentsByClass || {});
            } else {
                console.error('Failed to load dashboard:', dashboardRes.reason);
            }

            if (announcementsRes.status === 'fulfilled') {
                const data = announcementsRes.value.data;
                const allAnnouncements = Array.isArray(data.data) ? data.data : [];
                // Only show unread announcements in the dashboard alert
                setAnnouncements(allAnnouncements.filter((a) => !a.is_read));
            } else {
                console.error(
                    'Failed to load announcements:',
                    announcementsRes.reason
                );
            }
        } catch (err) {
            console.error('Failed to load dashboard:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load your dashboard. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const totalStudents = Object.values(studentsByClass).reduce(
        (sum, students) => sum + students.length,
        0
    );

    const todayClasses = classes.slice(0, 3).map((schoolClass, index) => {
        const subject = subjects.find(
            (s) => String(s.id) === String(schoolClass.id)
        );

        return {
            time: index === 0 ? '08:00 AM' : index === 1 ? '10:00 AM' : '02:00 PM',
            subject: subject?.name || schoolClass.name,
            className: schoolClass.name,
            room: 'TBA',
        };
    });

    const activities = [
        {
            title: 'Classes assigned',
            description: `${classes.length} class(es)`,
            time: 'Just now',
        },
        {
            title: 'Subjects assigned',
            description: `${subjects.length} subject(s)`,
            time: 'Just now',
        },
        {
            title: 'Total students',
            description: `${totalStudents} student(s) across your classes`,
            time: 'Just now',
        },
    ];

    const teacherName =
        teacher?.name ||
        teacher?.full_name ||
        teacher?.first_name ||
        'Teacher';

    const stats = [
        {
            title: 'My Classes',
            value: classes.length.toString(),
            icon: '▦',
        },
        {
            title: 'My Subjects',
            value: subjects.length.toString(),
            icon: '◈',
        },
        {
            title: 'Students',
            value: totalStudents.toString(),
            icon: '♙',
        },
        {
            title: "Today's Classes",
            value: todayClasses.length.toString(),
            icon: '◷',
        },
    ];

    if (loading) {
        return (
            <div className="teacher-dashboard">
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div className="teacher-stat-icon">⏳</div>
                    <p>Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="teacher-dashboard">
                <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
                    <h3>Unable to load dashboard</h3>
                    <p>{error}</p>
                    <button onClick={fetchDashboard} style={{ marginTop: '12px' }}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="teacher-dashboard">

            {/* Announcements Alert */}
            {announcements.length > 0 && (
                <div className="teacher-announcement-alert">
                    <div className="teacher-alert-icon">📢</div>
                    <div className="teacher-alert-content">
                        <strong>New Announcement(s)</strong>
                        <span>
                            You have {announcements.length} new announcement{' '}
                            {announcements.length > 1 ? 's' : ''} from your
                            school admin.
                        </span>
                    </div>
                    <div className="teacher-alert-action">
                        <button
                            type="button"
                            onClick={() => {
                                // Navigate to announcements page
                                window.location.href =
                                    '/teacher-dashboard/announcements';
                            }}
                        >
                            View
                        </button>
                    </div>
                </div>
            )}

            {/* Welcome Section */}
            <section className="teacher-welcome">
                <div>
                    <h1>
                        {greeting.text}, {teacherName} {greeting.emoji}
                    </h1>

                    <p>
                        Here's what's happening with your teaching today.
                    </p>
                </div>
            </section>

            {/* Statistics */}
            <section className="teacher-stats">

                {stats.map((stat) => (
                    <div
                        className="teacher-stat-card"
                        key={stat.title}
                    >
                        <div className="teacher-stat-icon">
                            {stat.icon}
                        </div>

                        <div>
                            <span>{stat.title}</span>
                            <strong>{stat.value}</strong>
                        </div>
                    </div>
                ))}

            </section>

            {/* Dashboard Grid */}
            <section className="teacher-dashboard-grid">

                {/* Today's Classes */}
                <div className="teacher-dashboard-card">

                    <div className="teacher-card-header">
                        <div>
                            <h2>Today's Classes</h2>
                            <p>Your scheduled classes for today</p>
                        </div>
                    </div>

                    <div className="teacher-class-list">

                        {todayClasses.length > 0 ? (
                            todayClasses.map((item, index) => (
                                <div
                                    className="teacher-class-item"
                                    key={index}
                                >
                                    <div className="teacher-class-time">
                                        {item.time}
                                    </div>

                                    <div className="teacher-class-info">
                                        <strong>
                                            {item.subject}
                                        </strong>

                                        <span>
                                            {item.className}
                                        </span>
                                    </div>

                                    <div className="teacher-class-room">
                                        {item.room}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="teacher-class-item">
                                <div className="teacher-class-info">
                                    <strong>No classes scheduled</strong>
                                    <span>No classes assigned to you yet.</span>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Recent Activities */}
                <div className="teacher-dashboard-card">

                    <div className="teacher-card-header">
                        <div>
                            <h2>Recent Activities</h2>
                            <p>Your latest teaching activities</p>
                        </div>
                    </div>

                    <div className="teacher-activity-list">

                        {activities.map((activity, index) => (
                            <div
                                className="teacher-activity-item"
                                key={index}
                            >
                                <div className="teacher-activity-icon">
                                    ✓
                                </div>

                                <div className="teacher-activity-content">
                                    <strong>
                                        {activity.title}
                                    </strong>

                                    <span>
                                        {activity.description}
                                    </span>

                                    <small>
                                        {activity.time}
                                    </small>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>

            </section>

        </div>
    );
}

export default TeacherDashboard;
