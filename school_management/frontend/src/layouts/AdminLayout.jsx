import { Navigate, Outlet } from 'react-router-dom';

import Sidebar from '../components/admin/Sidebar';
import Topbar from '../components/admin/Topbar';
import { getStoredUser } from '../utils/auth';

function AdminLayout() {
    const currentUser = getStoredUser();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="admin-layout">
            <Sidebar />

            <div className="admin-main">
                <Topbar />

                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;