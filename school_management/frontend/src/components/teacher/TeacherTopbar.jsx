import { getStoredUser } from '../../utils/auth';

function TeacherTopbar() {
    const currentUser = getStoredUser();

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
        <header className="teacher-topbar">

            <div className="teacher-topbar-left">
                <h2>Teacher Dashboard</h2>
                <span>Manage your teaching activities</span>
            </div>

            <div className="teacher-topbar-right">

                <button
                    type="button"
                    className="teacher-notification-button"
                    title="Notifications"
                >
                    🔔
                </button>

                <div className="teacher-topbar-profile">
                    <div className="teacher-topbar-avatar">
                        {initials}
                    </div>

                    <div className="teacher-topbar-user">
                        <strong>{teacherName}</strong>
                        <span>Teacher</span>
                    </div>
                </div>

            </div>

        </header>
    );
}

export default TeacherTopbar;