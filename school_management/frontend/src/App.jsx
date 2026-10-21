import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';

import Login from './pages/auth/Login';
import Dashboard from './pages/admin/Dashboard';
import SchoolDashboard from './pages/admin/SchoolDashboard';
import SchoolsPage from './pages/admin/schools/SchoolsPage';
import StudentsPage from './pages/admin/students/StudentsPage';
import ClassesPage from './pages/admin/classes/ClassesPage';
import SubjectsPage from './pages/admin/subjects/SubjectsPage';
import TeachersPage from './pages/admin/teachers/TeachersPage';
import ExaminationsPage from './pages/admin/ExaminationsPage';
import ExaminationSubmissionsPage from './pages/admin/ExaminationSubmissionPage';
import SystemSettings from './pages/admin/settings/SystemSettings';
import SchoolAdminsPage from './pages/admin/school-admins/SchoolAdminsPage';
import Announcements from './pages/admin/announcements/Announcements';


import TeacherDashboard from './pages/teacher/TeacherDashboard';
import MyClasses from './pages/teacher/MyClasses';
import MySubjects from './pages/teacher/MySubjects';
import Attendance from './pages/teacher/Attendance';
import Marks from './pages/teacher/Marks';
import Assignments from './pages/teacher/Assignments';
import Timetable from './pages/teacher/Timetable';
import LessonPlans from './pages/teacher/LessonPlans';
import Notifications from './pages/teacher/Notifications';
import TeacherAnnouncements from './pages/teacher/Announcements';
import TeacherProfile from './pages/teacher/TeacherProfile';
import ClassDetails from './pages/teacher/ClassDetails';
import StudentDetails from './pages/teacher/StudentDetails';


function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* LOGIN */}
                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* ADMIN AREA */}
                <Route element={<AdminLayout />}>

                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/school-dashboard"
                        element={<SchoolDashboard />}
                    />

                    <Route
                        path="/schools"
                        element={<SchoolsPage />}
                    />

                    <Route
                        path="/students"
                        element={<StudentsPage />}
                    />

                    <Route
                        path="/classes"
                        element={<ClassesPage />}
                    />

                    <Route
                        path="/subjects"
                        element={<SubjectsPage />}
                    />

                    <Route
    path="/examinations"
    element={<ExaminationsPage />}
/>

<Route
    path="/examination-submissions"
    element={<ExaminationSubmissionsPage />}
/>

                    <Route
                        path="/teachers"
                        element={<TeachersPage />}
                    />

                    <Route
                        path="/settings"
                        element={<SystemSettings />}
                    />

                    <Route
                        path="/school-admins"
                        element={<SchoolAdminsPage />}
                    />

                    <Route
                        path="/announcements"
                        element={<Announcements />}
                    />

                </Route>

                {/* TEACHER AREA */}
                <Route element={<TeacherLayout />}>

                    <Route
                        path="/teacher-dashboard"
                        element={<TeacherDashboard />}
                    />

                    <Route
                        path="/teacher-dashboard/profile"
                        element={<TeacherProfile />}
                    />

                    <Route
                        path="/teacher-dashboard/classes"
                        element={<MyClasses />}
                    />
                    
                    <Route
                        path="/teacher-dashboard/subjects"
                        element={<MySubjects />}
                    />
                    <Route
                        path="/teacher-dashboard/attendance"
                        element={<Attendance />}
                    />
                    <Route
                        path="/teacher-dashboard/assignments"
                        element={<Assignments />}
                    />
                    <Route
    path="/teacher-dashboard/marks"
    element={<Marks />}
/>
<Route
    path="/teacher-dashboard/timetable"
    element={<Timetable />}
/>
<Route
    path="/teacher-dashboard/lesson-plans"
    element={<LessonPlans />}
/>

<Route
    path="/teacher-dashboard/notifications"
    element={<Notifications />}
/>

<Route
    path="/teacher-dashboard/announcements"
    element={<TeacherAnnouncements />}
/>

<Route
    path="/teacher-dashboard/profile"
    element={<TeacherProfile />}
/>

<Route
    path="/teacher/classes/:classId"
    element={<ClassDetails />}
/>

<Route
    path="/teacher/students/:studentId"
    element={<StudentDetails />}
/>
                </Route>

                {/* DEFAULT PAGE */}
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />
                

            </Routes>
        </BrowserRouter>
    );
}

export default App;