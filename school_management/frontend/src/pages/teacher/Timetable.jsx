import { useEffect, useState } from 'react';
import api from '../../api/api';
import '../styles/teacher/Timetable.css';

function Timetable() {
    const [selectedClass, setSelectedClass] = useState('All Classes');

    const days = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
    ];

    const periods = [
        '08:00 - 09:00',
        '09:00 - 10:00',
        '10:30 - 11:30',
        '11:30 - 12:30',
        '14:00 - 15:00',
        '15:00 - 16:00',
    ];

    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadTimetableData();
    }, []);

    const loadTimetableData = async () => {
        try {
            setLoading(true);
            setError('');

            const results = await Promise.allSettled([
                api.get('/teacher/classes'),
                api.get('/teacher/subjects'),
            ]);

            const [classesResult, subjectsResult] = results;

            if (classesResult.status === 'fulfilled') {
                const data = classesResult.value.data;
                const classList = Array.isArray(data.classes)
                    ? data.classes
                    : Array.isArray(data.data)
                    ? data.data
                    : [];
                setClasses(classList);
            } else {
                console.error('Could not load classes:', classesResult.reason);
                const err = classesResult.reason;
                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    'Failed to load classes. Check browser console for details.'
                );
            }

            if (subjectsResult.status === 'fulfilled') {
                const data = subjectsResult.value.data;
                const subjectList = Array.isArray(data.subjects)
                    ? data.subjects
                    : Array.isArray(data.data)
                    ? data.data
                    : [];
                setSubjects(subjectList);
            } else {
                console.error('Could not load subjects:', subjectsResult.reason);
                const err = subjectsResult.reason;
                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    'Failed to load subjects. Check browser console for details.'
                );
            }

            // Build a weekly timetable from the teacher's classes and subjects.
            // Each class is assigned to a day/period slot based on its ID for
            // demonstration. Replace this with real timetable data when a
            // timetable backend is available.
            const builtLessons = classList.map((schoolClass, index) => {
                const dayIndex = index % days.length;
                const periodIndex = index % periods.length;
                const subject =
                    subjects[index % subjects.length] || {};

                return {
                    id: schoolClass.id,
                    day: days[dayIndex],
                    time: periods[periodIndex],
                    subject: subject.name || 'Class Session',
                    className: schoolClass.name,
                    room: `Room ${100 + index}`,
                };
            });

            setLessons(builtLessons);
        } catch (err) {
            console.error('Failed to load timetable:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load your timetable. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const classNames = [
        'All Classes',
        ...new Set(classes.map((c) => c.name).filter(Boolean)),
    ];

    const hasClasses = classes.length > 0;

    const getLesson = (day, time) => {
        return lessons.find(
            (lesson) =>
                lesson.day === day &&
                lesson.time === time &&
                (
                    selectedClass === 'All Classes' ||
                    lesson.className === selectedClass
                )
        );
    };

    const todayLessons = lessons.filter(
        (lesson) => lesson.day === new Date().toLocaleDateString('en-US', { weekday: 'long' })
    ).length;

    const uniqueClasses = new Set(lessons.map((l) => l.className)).size;
    const uniqueSubjects = new Set(lessons.map((l) => l.subject)).size;
    const teachingHours = lessons.length;

    if (loading) {
        return (
            <div className="teacher-page">
                <div className="teacher-page-header">
                    <div>
                        <h1>Timetable</h1>
                        <p>Loading your timetable...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="teacher-page">

            {/* Header */}
            <div className="teacher-page-header">

                <div>
                    <h1>Timetable</h1>

                    <p>
                        View your teaching schedule and lessons.
                    </p>
                </div>

                <div className="teacher-timetable-filter">
                    <select
                        value={selectedClass}
                        onChange={(e) =>
                            setSelectedClass(e.target.value)
                        }
                    >
                        {classNames.map((className) => (
                            <option key={className}>
                                {className}
                            </option>
                        ))}
                    </select>
                </div>

            </div>

            {/* Error banner (only show if there's an actual API error) */}
            {error && !hasClasses && (
                <div style={{
                    marginBottom: '20px',
                    padding: '12px 15px',
                    borderRadius: '8px',
                    background: '#fee2e2',
                    color: '#b91c1c',
                    fontSize: '13px'
                }}>
                    {error}

                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#9ca3ab' }}>
                        Check browser console (F12) for full error details.
                    </div>

                    <button
                        onClick={loadTimetableData}
                        style={{ marginLeft: '10px', cursor: 'pointer' }}
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Empty state when no classes are assigned */}
            {!hasClasses && !error && (
                <div className="teacher-empty-state">
                    <div>🏫</div>
                    <h3>No classes assigned</h3>
                    <p>
                        You currently don't have any classes assigned.
                        Contact your school administrator to have a class
                        assigned to you.
                    </p>
                </div>
            )}

            {/* Today's Summary */}
            <div className="teacher-timetable-summary">

                <div className="teacher-timetable-summary-card">
                    <span>Today's Lessons</span>
                    <strong>{todayLessons}</strong>
                </div>

                <div className="teacher-timetable-summary-card">
                    <span>Classes</span>
                    <strong>{uniqueClasses}</strong>
                </div>

                <div className="teacher-timetable-summary-card">
                    <span>Subjects</span>
                    <strong>{uniqueSubjects}</strong>
                </div>

                <div className="teacher-timetable-summary-card">
                    <span>Teaching Hours</span>
                    <strong>{teachingHours} hrs</strong>
                </div>

            </div>

            {/* Timetable */}
            <div className="teacher-dashboard-card teacher-timetable-card">

                <div className="teacher-card-header">

                    <div>
                        <h2>Weekly Timetable</h2>

                        <p>
                            Your scheduled lessons for this week.
                        </p>
                    </div>

                </div>

                <div className="teacher-timetable-wrapper">

                    <table className="teacher-timetable">

                        <thead>
                            <tr>
                                <th className="teacher-time-column">
                                    Time
                                </th>

                                {days.map((day) => (
                                    <th key={day}>
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>

                            {periods.map((time) => (

                                <tr key={time}>

                                    <td className="teacher-time-cell">
                                        {time}
                                    </td>

                                    {days.map((day) => {

                                        const lesson =
                                            getLesson(day, time);

                                        return (
                                            <td
                                                key={`${day}-${time}`}
                                                className="teacher-timetable-cell"
                                            >

                                                {lesson ? (
                                                    <div className="teacher-lesson">

                                                        <strong>
                                                            {lesson.subject}
                                                        </strong>

                                                        <span>
                                                            {lesson.className}
                                                        </span>

                                                        <small>
                                                            {lesson.room}
                                                        </small>

                                                    </div>
                                                ) : (
                                                    <span className="teacher-free-period">
                                                        —
                                                    </span>
                                                )}

                                            </td>
                                        );
                                    })}

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}

export default Timetable;
