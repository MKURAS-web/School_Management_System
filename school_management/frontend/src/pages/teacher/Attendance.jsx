
import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../api/api';
import '../styles/teacher/Attendance.css';


function getToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return year + '-' + month + '-' + day;
}



const ATTENDANCE_STATUSES = [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'excused', label: 'Excused' },
];

function Attendance() {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDate, setSelectedDate] = useState(getToday());
    const [students, setStudents] = useState([]);

    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    /*
    |--------------------------------------------------------------------------
    | LOAD TEACHER CLASSES
    |--------------------------------------------------------------------------
    */

    const fetchClasses = useCallback(async () => {
        try {
            setLoadingClasses(true);
            setError('');

            const response = await api.get('/teacher/classes');

            const teacherClasses = Array.isArray(response.data.classes)
                ? response.data.classes
                : [];

            setClasses(teacherClasses);

            setSelectedClass((currentClass) => {
                const stillExists = teacherClasses.some(
                    (schoolClass) =>
                        String(schoolClass.id) === String(currentClass)
                );

                if (stillExists) {
                    return currentClass;
                }

                return teacherClasses.length > 0
                    ? String(teacherClasses[0].id)
                    : '';
            });
        } catch (err) {
            console.error('Failed to load classes:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load your classes. Please try again.'
            );
        } finally {
            setLoadingClasses(false);
        }
    }, []);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    /*
    |--------------------------------------------------------------------------
    | LOAD STUDENTS AND EXISTING ATTENDANCE
    |--------------------------------------------------------------------------
    */

    const fetchAttendance = useCallback(async () => {
        if (!selectedClass || !selectedDate) {
            setStudents([]);
            return;
        }

        try {
            setLoadingStudents(true);
            setError('');
            setSuccess('');

            const response = await api.get('/teacher/attendance', {
                params: {
                    class_id: selectedClass,
                    date: selectedDate,
                },
            });

            const loadedStudents = Array.isArray(response.data.students)
                ? response.data.students.map((student) => ({
                    ...student,
                    status: student.status || 'present',
                    remarks: student.remarks || '',
                }))
                : [];

            setStudents(loadedStudents);
        } catch (err) {
            console.error('Failed to load attendance:', err);

            setStudents([]);

            setError(
                err.response?.data?.message ||
                'Failed to load students and attendance.'
            );
        } finally {
            setLoadingStudents(false);
        }
    }, [selectedClass, selectedDate]);

    useEffect(() => {
        if (selectedClass && selectedDate) {
            fetchAttendance();
        } else {
            setStudents([]);
        }
    }, [selectedClass, selectedDate, fetchAttendance]);

    /*
    |--------------------------------------------------------------------------
    | UPDATE STUDENT STATUS
    |--------------------------------------------------------------------------
    */

    const updateStatus = (studentId, status) => {
        setStudents((currentStudents) =>
            currentStudents.map((student) =>
                student.id === studentId
                    ? { ...student, status }
                    : student
            )
        );

        setSuccess('');
    };

    /*
    |--------------------------------------------------------------------------
    | UPDATE REMARKS
    |--------------------------------------------------------------------------
    */

    const updateRemarks = (studentId, remarks) => {
        setStudents((currentStudents) =>
            currentStudents.map((student) =>
                student.id === studentId
                    ? { ...student, remarks }
                    : student
            )
        );

        setSuccess('');
    };

    /*
    |--------------------------------------------------------------------------
    | ATTENDANCE SUMMARY
    |--------------------------------------------------------------------------
    */

    const summary = useMemo(() => {
        return {
            total: students.length,
            present: students.filter(
                (student) => student.status === 'present'
            ).length,
            absent: students.filter(
                (student) => student.status === 'absent'
            ).length,
            late: students.filter(
                (student) => student.status === 'late'
            ).length,
            excused: students.filter(
                (student) => student.status === 'excused'
            ).length,
        };
    }, [students]);

    const currentClass = classes.find(
        (schoolClass) => String(schoolClass.id) === selectedClass
    );

    /*
    |--------------------------------------------------------------------------
    | SAVE ATTENDANCE
    |--------------------------------------------------------------------------
    */

    const saveAttendance = async () => {
        if (!selectedClass) {
            setError('Please select a class.');
            return;
        }

        if (!selectedDate) {
            setError('Please select an attendance date.');
            return;
        }

        if (students.length === 0) {
            setError('There are no students to save attendance for.');
            return;
        }

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const payload = {
                class_id: Number(selectedClass),
                attendance_date: selectedDate,
                students: students.map((student) => ({
                    student_id: student.id,
                    status: student.status,
                    remarks: student.remarks?.trim() || null,
                })),
            };

            const response = await api.post(
                '/teacher/attendance',
                payload
            );

            setSuccess(
                response.data.message ||
                'Attendance saved successfully.'
            );

            await fetchAttendance();
        } catch (err) {
            console.error('Failed to save attendance:', err);

            const validationErrors = err.response?.data?.errors;

            const firstValidationError = validationErrors
                ? Object.values(validationErrors).flat()[0]
                : null;

            setError(
                firstValidationError ||
                err.response?.data?.message ||
                'Failed to save attendance. Please try again.'
            );
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | RENDER PAGE
    |--------------------------------------------------------------------------
    */

    return (
        <div className="teacher-page teacher-attendance-page">

            {/* PAGE HEADER */}

            <div className="teacher-page-header">
                <div>
                    <h1>Attendance</h1>
                    <p>
                        Record and manage student attendance.
                    </p>
                </div>
            </div>

            {/* ERROR MESSAGE */}

            {error && (
                <div
                    className="teacher-attendance-alert error"
                    role="alert"
                >
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => setError('')}
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* SUCCESS MESSAGE */}

            {success && (
                <div
                    className="teacher-attendance-alert success"
                    role="status"
                >
                    <span>{success}</span>

                    <button
                        type="button"
                        onClick={() => setSuccess('')}
                        aria-label="Dismiss success message"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* FILTERS */}

            <div className="teacher-attendance-filters">

                <div className="teacher-filter-group">
                    <label htmlFor="attendance-class">
                        Select Class
                    </label>

                    <select
                        id="attendance-class"
                        value={selectedClass}
                        onChange={(event) => {
                            setSelectedClass(event.target.value);
                            setSuccess('');
                        }}
                        disabled={
                            loadingClasses ||
                            classes.length === 0 ||
                            saving
                        }
                    >
                        <option value="">
                            {loadingClasses
                                ? 'Loading classes...'
                                : 'Select class'}
                        </option>

                        {classes.map((schoolClass) => (
                            <option
                                key={schoolClass.id}
                                value={String(schoolClass.id)}
                            >
                                {schoolClass.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="teacher-filter-group">
                    <label htmlFor="attendance-date">
                        Attendance Date
                    </label>

                    <input
                        id="attendance-date"
                        type="date"
                        value={selectedDate}
                        max={getToday()}
                        onChange={(event) => {
                            setSelectedDate(event.target.value);
                            setSuccess('');
                        }}
                        disabled={saving}
                    />
                </div>

                <div className="teacher-filter-group attendance-refresh">
                    <label>&nbsp;</label>

                    <button
                        type="button"
                        onClick={fetchAttendance}
                        disabled={
                            loadingStudents ||
                            loadingClasses ||
                            !selectedClass ||
                            !selectedDate
                        }
                    >
                        Refresh
                    </button>
                </div>

            </div>

            {/* SUMMARY CARDS */}

            <div className="teacher-attendance-summary">

                <div className="teacher-attendance-summary-card">
                    <span>Total Students</span>
                    <strong>{summary.total}</strong>
                </div>

                <div className="teacher-attendance-summary-card">
                    <span>Present</span>
                    <strong>{summary.present}</strong>
                </div>

                <div className="teacher-attendance-summary-card">
                    <span>Absent</span>
                    <strong>{summary.absent}</strong>
                </div>

                <div className="teacher-attendance-summary-card">
                    <span>Late</span>
                    <strong>{summary.late}</strong>
                </div>

                <div className="teacher-attendance-summary-card">
                    <span>Excused</span>
                    <strong>{summary.excused}</strong>
                </div>

            </div>

            {/* ATTENDANCE REGISTER */}

            <div className="teacher-dashboard-card teacher-attendance-card">

                <div className="teacher-card-header">
                    <div>
                        <h2>
                            {currentClass?.name || 'Attendance Register'}
                        </h2>

                        <p>
                            Attendance for {selectedDate || 'selected date'}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="teacher-save-attendance-button"
                        onClick={saveAttendance}
                        disabled={
                            saving ||
                            loadingStudents ||
                            students.length === 0
                        }
                    >
                        {saving ? 'Saving...' : 'Save Attendance'}
                    </button>
                </div>

                {/* LOADING CLASSES */}

                {loadingClasses && (
                    <div className="teacher-attendance-state">
                        Loading your classes...
                    </div>
                )}

                {/* NO CLASSES */}

                {!loadingClasses && classes.length === 0 && (
                    <div className="teacher-attendance-state">
                        <h3>No Classes Assigned</h3>

                        <p>
                            Contact your school administrator to have
                            a class assigned to you.
                        </p>

                        <button
                            type="button"
                            onClick={fetchClasses}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* LOADING STUDENTS */}

                {!loadingClasses &&
                    classes.length > 0 &&
                    loadingStudents && (
                        <div className="teacher-attendance-state">
                            Loading students and attendance...
                        </div>
                    )}

                {/* NO STUDENTS */}

                {!loadingClasses &&
                    classes.length > 0 &&
                    !loadingStudents &&
                    students.length === 0 && (
                        <div className="teacher-attendance-state">
                            <h3>No Students Found</h3>

                            <p>
                                No students were found for this class.
                                Check that students are registered in
                                the selected class.
                            </p>

                            <button
                                type="button"
                                onClick={fetchAttendance}
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                {/* STUDENT ATTENDANCE TABLE */}

                {!loadingClasses &&
                    !loadingStudents &&
                    students.length > 0 && (
                        <div className="teacher-attendance-table-wrapper">
                            <table className="teacher-attendance-table">

                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student Name</th>
                                        <th>Admission No.</th>
                                        <th>Attendance Status</th>
                                        <th>Remarks</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {students.map((student, index) => {
                                        const fullName = [
                                            student.first_name,
                                            student.middle_name,
                                            student.last_name,
                                        ]
                                            .filter(Boolean)
                                            .join(' ');

                                        return (
                                            <tr key={student.id}>
                                                <td>{index + 1}</td>

                                                <td>
                                                    <strong>
                                                        {fullName ||
                                                            'Unnamed Student'}
                                                    </strong>
                                                </td>

                                                <td>
                                                    {student.admission_number ||
                                                        '—'}
                                                </td>

                                                <td>
                                                    <div className="teacher-attendance-actions">
                                                        {ATTENDANCE_STATUSES.map(
                                                            (option) => (
                                                                <button
                                                                    key={option.value}
                                                                    type="button"
                                                                    className={
                                                                        student.status ===
                                                                        option.value
                                                                            ? `selected ${option.value}`
                                                                            : option.value
                                                                    }
                                                                    onClick={() =>
                                                                        updateStatus(
                                                                            student.id,
                                                                            option.value
                                                                        )
                                                                    }
                                                                    disabled={saving}
                                                                >
                                                                    {option.label}
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </td>

                                                <td>
                                                    <input
                                                        type="text"
                                                        className="teacher-attendance-remarks"
                                                        placeholder="Optional remarks"
                                                        value={student.remarks}
                                                        onChange={(event) =>
                                                            updateRemarks(
                                                                student.id,
                                                                event.target.value
                                                            )
                                                        }
                                                        disabled={saving}
                                                        maxLength={1000}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>

                            </table>
                        </div>
                    )}

            </div>
        </div>
    );
}

export default Attendance;

