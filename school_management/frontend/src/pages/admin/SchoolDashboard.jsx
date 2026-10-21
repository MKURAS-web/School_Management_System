import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../api/api';
import { getStoredUser, ROLES } from '../../utils/auth';

function SchoolDashboard() {
    const currentUser = getStoredUser();
    const [dashboardData, setDashboardData] = useState({
        students: [],
        teachers: [],
        classes: [],
        subjects: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser?.role !== ROLES.SCHOOL_ADMIN) {
            return;
        }

        const fetchDashboardData = async () => {
            try {
                const [studentsRes, teachersRes, classesRes, subjectsRes] = await Promise.all([
                    api.get('/school/students'),
                    api.get('/school/teachers'),
                    api.get('/school/classes'),
                    api.get('/school/subjects'),
                ]);

                setDashboardData({
                    students: Array.isArray(studentsRes.data)
                        ? studentsRes.data
                        : studentsRes.data?.data || [],
                    teachers: Array.isArray(teachersRes.data) ? teachersRes.data : [],
                    classes: Array.isArray(classesRes.data) ? classesRes.data : [],
                    subjects: Array.isArray(subjectsRes.data) ? subjectsRes.data : [],
                });
            } catch (error) {
                console.error('Failed to load school dashboard data:', error);
                setDashboardData({
                    students: [],
                    teachers: [],
                    classes: [],
                    subjects: [],
                });
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [currentUser?.role]);

    if (currentUser?.role !== ROLES.SCHOOL_ADMIN) {
        return <Navigate to="/" replace />;
    }

    const stats = [
        { label: 'Total Students', value: loading ? '...' : dashboardData.students.length.toLocaleString(), icon: '👨‍🎓' },
        { label: 'Total Teachers/Staff', value: loading ? '...' : dashboardData.teachers.length.toLocaleString(), icon: '👨‍🏫' },
        { label: 'Total Classes', value: loading ? '...' : dashboardData.classes.length.toLocaleString(), icon: '📚' },
        { label: 'Total Subjects', value: loading ? '...' : dashboardData.subjects.length.toLocaleString(), icon: '📘' },
    ];

    const recentActivities = [
        `Registered students: ${dashboardData.students.length}`,
        `Registered teachers/staff: ${dashboardData.teachers.length}`,
        `Active classes: ${dashboardData.classes.length}`,
        `Subjects configured: ${dashboardData.subjects.length}`,
    ];

    const summaryRows = [
        { label: 'Students in school', value: dashboardData.students.length.toLocaleString() },
        { label: 'Teachers/staff in school', value: dashboardData.teachers.length.toLocaleString() },
        { label: 'Classes in school', value: dashboardData.classes.length.toLocaleString() },
        { label: 'Subjects in school', value: dashboardData.subjects.length.toLocaleString() },
    ];

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <h1>School Dashboard</h1>
                    <p>
                        Welcome back, School Administrator. Here is your live school overview.
                    </p>
                </div>
            </div>

            <div className="dashboard-cards">
                {stats.map((stat) => (
                    <div key={stat.label} className="dashboard-card">
                        <div className="dashboard-card-content">
                            <div>
                                <h3>{stat.label}</h3>
                                <strong>{stat.value}</strong>
                            </div>

                            <div className="dashboard-card-icon">{stat.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '20px', marginTop: '24px' }}>
                <div className="dashboard-section-header">
                    <h2>Live School Summary</h2>
                    <div className="dashboard-table-wrapper">
                        <table className="dashboard-table">
                            <tbody>
                                {summaryRows.map((item) => (
                                    <tr key={item.label}>
                                        <td>{item.label}</td>
                                        <td><strong>{item.value}</strong></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="dashboard-section-header">
                    <h2>Recent School Data</h2>
                    <ul style={{ margin: '16px 0 0 18px', padding: 0, lineHeight: '1.8' }}>
                        {recentActivities.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="dashboard-section" style={{ marginTop: '24px' }}>
                <div className="dashboard-section-header">
                    <h2>School Records</h2>
                    <div className="dashboard-table-wrapper">
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Record Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryRows.map((item) => (
                                    <tr key={item.label}>
                                        <td>{item.label}</td>
                                        <td><strong>{item.value}</strong></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SchoolDashboard;
