import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/api';
import '../styles/teacher/ClassDetails.css';

function ClassDetails() {
    const { classId } = useParams();
    const navigate = useNavigate();

    const [schoolClass, setSchoolClass] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchClassDetails();
    }, [classId]);

    const fetchClassDetails = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get(
                `/teacher/classes/${classId}`
            );

            setSchoolClass(response.data.class);
            setStudents(response.data.students || []);
        } catch (err) {
            console.error('Failed to fetch class details:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load class details.'
            );
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter((student) => {
        const fullName = [
            student.first_name,
            student.middle_name,
            student.last_name,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        const admissionNumber = (
            student.admission_number || ''
        ).toLowerCase();

        const searchText = search.toLowerCase();

        return (
            fullName.includes(searchText) ||
            admissionNumber.includes(searchText)
        );
    });

    if (loading) {
        return (
            <div className="class-details-page">
                <div className="class-details-loading">
                    <div className="class-details-spinner"></div>
                    <p>Loading class details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="class-details-page">
                <div className="class-details-error">
                    <h3>Unable to load class</h3>

                    <p>{error}</p>

                    <button onClick={fetchClassDetails}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="class-details-page">

            {/* Header */}
            <div className="class-details-header">

                <div className="class-details-header-left">

                    <button
                        className="back-button"
                        onClick={() => navigate('/teacher/classes')}
                    >
                        ← Back
                    </button>

                    <div>
                        <h1>
                            {schoolClass?.name || 'Class Details'}
                        </h1>

                        <p>
                            View students assigned to this class.
                        </p>
                    </div>

                </div>

                <div className="student-count-card">
                    <span>{students.length}</span>
                    <small>Students</small>
                </div>

            </div>

            {/* Class information */}
            <div className="class-info-card">

                <div className="class-info-icon">
                    🏫
                </div>

                <div className="class-info-content">

                    <h2>
                        {schoolClass?.name}
                    </h2>

                    {schoolClass?.code && (
                        <p>
                            <strong>Code:</strong>{' '}
                            {schoolClass.code}
                        </p>
                    )}

                    {schoolClass?.description && (
                        <p>
                            {schoolClass.description}
                        </p>
                    )}

                </div>

            </div>

            {/* Students section */}
            <div className="students-section">

                <div className="students-section-header">

                    <div>
                        <h2>Students</h2>

                        <p>
                            Students assigned to this class
                        </p>
                    </div>

                    <div className="student-search">

                        <input
                            type="text"
                            placeholder="Search student..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                    </div>

                </div>

                {students.length === 0 ? (

                    <div className="students-empty">

                        <div>👨‍🎓</div>

                        <h3>No Students Found</h3>

                        <p>
                            There are currently no students
                            assigned to this class.
                        </p>

                    </div>

                ) : filteredStudents.length === 0 ? (

                    <div className="students-empty">

                        <div>🔍</div>

                        <h3>No Matching Students</h3>

                        <p>
                            No student matches your search.
                        </p>

                    </div>

                ) : (

                    <div className="students-table-wrapper">

                        <table className="students-table">

                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Student</th>
                                    <th>Admission No.</th>
                                    <th>Gender</th>
                                    <th>Phone</th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredStudents.map(
                                    (student, index) => (

                                        <tr
                                            key={student.id}
                                            className="student-row-clickable"
                                            onClick={() =>
                                                navigate(
                                                    `/teacher/students/${student.id}`
                                                )
                                            }
                                        >

                                            <td>
                                                {index + 1}
                                            </td>

                                            <td>

                                                <div className="student-name">

                                                    <div className="student-avatar">

                                                        {student.first_name
                                                            ?.charAt(0)
                                                            ?.toUpperCase()}

                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {[
                                                                student.first_name,
                                                                student.middle_name,
                                                                student.last_name,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(' ')}
                                                        </strong>

                                                    </div>

                                                </div>

                                            </td>

                                            <td>
                                                {student.admission_number ||
                                                    '—'}
                                            </td>

                                            <td>
                                                {student.gender || '—'}
                                            </td>

                                            <td>
                                                {student.phone || '—'}
                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    );
}

export default ClassDetails;