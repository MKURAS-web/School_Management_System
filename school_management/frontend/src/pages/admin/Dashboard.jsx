import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../api/api';
import { getStoredUser, ROLES } from '../../utils/auth';

function Dashboard() {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUser = getStoredUser();

    if (currentUser?.role === ROLES.SCHOOL_ADMIN) {
        return <Navigate to="/school-dashboard" replace />;
    }

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/schools');

                setSchools(response.data);
            } catch (error) {
                console.error(
                    'Failed to load dashboard data:',
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="dashboard-page">

            {/* =========================
                WELCOME
            ========================= */}
            <div className="dashboard-header">
                <div>
                    <h1>Dashboard</h1>

                    <p>
                        Welcome back, Administrator. Here's an
                        overview of your school management system.
                    </p>
                </div>
            </div>


            {/* =========================
                STATISTICS
            ========================= */}
            <div className="dashboard-cards">

                <div className="dashboard-card">
                    <div className="dashboard-card-content">
                        <div>
                            <h3>Total Schools</h3>

                            <strong>
                                {loading ? '...' : schools.length}
                            </strong>
                        </div>

                        <div className="dashboard-card-icon">
                            🏫
                        </div>
                    </div>
                </div>


                <div className="dashboard-card">
                    <div className="dashboard-card-content">
                        <div>
                            <h3>Total Students</h3>

                            <strong>0</strong>
                        </div>

                        <div className="dashboard-card-icon">
                            👨‍🎓
                        </div>
                    </div>
                </div>


                <div className="dashboard-card">
                    <div className="dashboard-card-content">
                        <div>
                            <h3>Total Teachers</h3>

                            <strong>0</strong>
                        </div>

                        <div className="dashboard-card-icon">
                            👨‍🏫
                        </div>
                    </div>
                </div>


                <div className="dashboard-card">
                    <div className="dashboard-card-content">
                        <div>
                            <h3>Total Classes</h3>

                            <strong>0</strong>
                        </div>

                        <div className="dashboard-card-icon">
                            📚
                        </div>
                    </div>
                </div>

            </div>


            {/* =========================
                RECENT SCHOOLS
            ========================= */}
            <div className="dashboard-section">

                <div className="dashboard-section-header">
                    <div>
                        <h2>Recent Schools</h2>

                        <p>
                            Recently added schools in the system.
                        </p>
                    </div>
                </div>


                <div className="dashboard-table-wrapper">

                    {loading ? (
                        <div className="dashboard-empty">
                            Loading schools...
                        </div>
                    ) : schools.length === 0 ? (
                        <div className="dashboard-empty">
                            <h3>No schools found</h3>

                            <p>
                                Add a school to see it displayed here.
                            </p>
                        </div>
                    ) : (
                        <table className="dashboard-table">

                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>School Name</th>
                                    <th>Level</th>
                                </tr>
                            </thead>

                            <tbody>
                                {schools.slice(0, 5).map(
                                    (school, index) => (
                                        <tr key={school.id}>
                                            <td>
                                                {index + 1}
                                            </td>

                                            <td>
                                                <strong>
                                                    {school.name}
                                                </strong>
                                            </td>

                                            <td>
                                                <span className="level-badge">
                                                    {school.level}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>

                        </table>
                    )}

                </div>

            </div>

        </div>
    );
}

export default Dashboard;