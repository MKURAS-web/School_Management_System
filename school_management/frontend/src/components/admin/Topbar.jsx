import { getRoleLabel, getStoredUser, ROLES } from '../../utils/auth';

function Topbar() {
    const currentUser = getStoredUser();
    const isSchoolAdmin = currentUser?.role === ROLES.SCHOOL_ADMIN;
    const initials = (currentUser?.name || 'A')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <header className="admin-topbar">
            <div className="topbar-left">
                <button
                    type="button"
                    className="sidebar-toggle"
                >
                    ☰
                </button>

                <div>
                    <h1>{isSchoolAdmin ? 'School Dashboard' : 'Admin Dashboard'}</h1>
                    <p>School Management System</p>
                </div>
            </div>

            <div className="topbar-right">
                <div className="admin-profile">
                    <div className="admin-avatar">
                        {initials}
                    </div>

                    <div>
                        <strong>{currentUser?.name || 'Administrator'}</strong>
                        <span>{getRoleLabel(currentUser?.role)}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Topbar;