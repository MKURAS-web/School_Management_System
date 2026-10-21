
import { Navigate, Outlet } from 'react-router-dom';

import TeacherSidebar from '../components/teacher/TeacherSidebar';
import TeacherTopbar from '../components/teacher/TeacherTopbar';
import { getStoredUser, ROLES } from '../utils/auth';
import '../pages/styles/teacher/teacher.css';
function TeacherLayout() {
    const currentUser = getStoredUser();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (currentUser.role !== ROLES.TEACHER) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="teacher-layout">
            <TeacherSidebar />

            <div className="teacher-main">
                <TeacherTopbar />

                <main className="teacher-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default TeacherLayout;