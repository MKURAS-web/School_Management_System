import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../../api/api';
import { getStoredUser, ROLES, getRoleLabel } from '../../utils/auth';

function Sidebar() {
    const navigate = useNavigate();
    const currentUser = getStoredUser();
    const currentRole = currentUser?.role || ROLES.SCHOOL_ADMIN;

    const navigationByRole = {
        [ROLES.SUPER_ADMIN]: [
            { to: '/dashboard', label: 'Dashboard', icon: '▣' },
            { to: '/schools', label: 'Schools', icon: '▦' },
            { to: '/school-admins', label: 'School Admins', icon: '👤' },
            { to: '/settings', label: 'Settings', icon: '⚙' },
        ],
       [ROLES.SCHOOL_ADMIN]: [
    { to: '/school-dashboard', label: 'Dashboard', icon: '▣' },
    { to: '/students', label: 'Students', icon: '♙' },
    { to: '/teachers', label: 'Teachers', icon: '👨‍🏫' },
    { to: '/classes', label: 'Classes', icon: '▦' },
    { to: '/subjects', label: 'Subjects', icon: '◈' },
    { to: '/examinations', label: 'Examinations', icon: '📝' },
    { to: '/announcements', label: 'Announcements', icon: '📢' },
    { to: '/settings', label: 'Settings', icon: '⚙' },
],
        [ROLES.TEACHER]: [
            { to: '/teacher-dashboard', label: 'My Dashboard', icon: '▣' },
            { to: '/classes', label: 'Classes', icon: '▦' },
            { to: '/subjects', label: 'Subjects', icon: '◈' },
            { to: '/students', label: 'Students', icon: '♙' },
        ],
        [ROLES.STAFF]: [
            { to: '/teacher-dashboard', label: 'My Dashboard', icon: '▣' },
            { to: '/classes', label: 'Classes', icon: '▦' },
            { to: '/subjects', label: 'Subjects', icon: '◈' },
            { to: '/teachers', label: 'Teachers', icon: '👨‍🏫' },
        ],
        [ROLES.STUDENT]: [
            { to: '/school-dashboard', label: 'Dashboard', icon: '▣' },
            { to: '/classes', label: 'My Classes', icon: '▦' },
            { to: '/subjects', label: 'My Subjects', icon: '◈' },
        ],
    };

    let navigation = navigationByRole[currentRole] || navigationByRole[ROLES.SCHOOL_ADMIN];

    // Add a Profile link for teacher/staff that points to the full profile page
    if ([ROLES.TEACHER, ROLES.STAFF].includes(currentRole)) {
        const profilePath = `/teachers/${currentUser?.id}`;
        // ensure we don't duplicate if already present
        if (!navigation.some((i) => i.to === profilePath || i.label === 'Profile')) {
            navigation = [{ to: profilePath, label: 'Profile', icon: '👤' }, ...navigation];
        }
    }

    // Use stored user for sidebar display to avoid unnecessary API calls and 403s
    const [teacherDetails] = useState(() => {
        const stored = getStoredUser();
        return { id: stored?.id, name: stored?.name || stored?.full_name || stored?.first_name, email: stored?.email, phone: stored?.phone, subjects: [] };
    });

    const handleLogout = async () => {
        const confirmed = window.confirm('Are you sure you want to log out?');

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

    return (
        <aside className="admin-sidebar">
            {/* Compact teacher profile button */}
                {(currentRole === ROLES.TEACHER || currentRole === ROLES.STAFF) && (
                    <div className="sidebar-profile" style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', color: '#fff', fontWeight: 700, fontSize: 14 }}>
                            {(teacherDetails?.name || currentUser?.name || 'T').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                    </div>
                )}
                <nav className="sidebar-nav">
                {navigation.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            isActive ? 'active' : ''
                        }
                        end={item.to === '/dashboard' || item.to === '/school-dashboard'}
                    >
                        <span>{item.icon}</span>
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button type="button" className="primary-button" onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;