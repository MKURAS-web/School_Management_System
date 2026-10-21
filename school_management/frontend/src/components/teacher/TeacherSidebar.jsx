import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../../api/api';
import { getStoredUser } from '../../utils/auth';

function TeacherSidebar() {
    const navigate = useNavigate();
    const currentUser = getStoredUser();

    const [collapsed, setCollapsed] = useState(false);

    const navigation = [
        {
            to: '/teacher-dashboard',
            label: 'Dashboard',
            icon: '▣',
        },
        {
            to: '/teacher-dashboard/classes',
            label: 'My Classes',
            icon: '▦',
        },
        {
            to: '/teacher-dashboard/subjects',
            label: 'My Subjects',
            icon: '◈',
        },
        {
            to: '/teacher-dashboard/attendance',
            label: 'Attendance',
            icon: '✓',
        },
        {
            to: '/teacher-dashboard/marks',
            label: 'Marks',
            icon: '▤',
        },
        {
            to: '/teacher-dashboard/assignments',
            label: 'Assignments',
            icon: '☷',
        },
        {
            to: '/teacher-dashboard/timetable',
            label: 'Timetable',
            icon: '▦',
        },
        {
            to: '/teacher-dashboard/lesson-plans',
            label: 'Lesson Plans',
            icon: '▤',
        },
        {
            to: '/teacher-dashboard/notifications',
            label: 'Notifications',
            icon: '🔔',
        },
        {
            to: '/teacher-dashboard/announcements',
            label: 'Announcements',
            icon: '📢',
        },
        {
            to: '/teacher-dashboard/profile',
            label: 'Profile',
            icon: '👤',
        },
    ];

    const handleLogout = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to log out?'
        );

        if (!confirmed) {
            return;
        }

        try {
            if (localStorage.getItem('school_token')) {
                await api.post('/logout');
            }
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            localStorage.removeItem('school_token');
            localStorage.removeItem('school_user');

            navigate('/login');
        }
    };

    const teacherName =
        currentUser?.name ||
        currentUser?.full_name ||
        currentUser?.first_name ||
        'Teacher';

    const initials = teacherName
        .split(' ')
        .map((name) => name[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <aside className={`teacher-sidebar ${collapsed ? 'collapsed' : ''}`}>

            <div className="teacher-sidebar-header">
                <div className="teacher-logo">
                    S
                </div>

                {!collapsed && (
                    <div className="teacher-brand">
                        <strong>SchoolMS</strong>
                        <span>Teacher Portal</span>
                    </div>
                )}

                <button
                    type="button"
                    className="teacher-sidebar-toggle"
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? '→' : '←'}
                </button>
            </div>

            <div className="teacher-sidebar-profile">
                <div className="teacher-sidebar-avatar">
                    {initials}
                </div>

                {!collapsed && (
                    <div className="teacher-sidebar-user">
                        <strong>{teacherName}</strong>
                        <span>Teacher</span>
                    </div>
                )}
            </div>

            <nav className="teacher-sidebar-nav">
                {navigation.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/teacher-dashboard'}
                        className={({ isActive }) =>
                            isActive ? 'active' : ''
                        }
                        title={collapsed ? item.label : ''}
                    >
                        <span className="teacher-nav-icon">
                            {item.icon}
                        </span>

                        {!collapsed && (
                            <span className="teacher-nav-label">
                                {item.label}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="teacher-sidebar-footer">
                <button
                    type="button"
                    onClick={handleLogout}
                    title={collapsed ? 'Logout' : ''}
                >
                    <span>↪</span>

                    {!collapsed && (
                        <span>Logout</span>
                    )}
                </button>
            </div>

        </aside>
    );
}

export default TeacherSidebar;