import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/api';
import SchoolModal from './SchoolModal';
import ConfirmModal from './ConfirmModal';

function SchoolsPage() {
    const navigate = useNavigate();
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState(null);

    const [deleteSchool, setDeleteSchool] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // =========================
    // PAGINATION
    // =========================

    const [currentPage, setCurrentPage] = useState(1);

    const schoolsPerPage = 10;

    // =========================
    // FETCH SCHOOLS
    // =========================

    const fetchSchools = async () => {
        try {
            const response = await api.get('/schools');

            setSchools(response.data);
        } catch (error) {
            console.error(error);

            setError('Failed to load schools.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchools();
    }, []);

    // =========================
    // OPEN ADD MODAL
    // =========================

    const handleAddSchool = () => {
        setSelectedSchool(null);
        setModalOpen(true);
    };

    // =========================
    // OPEN EDIT MODAL
    // =========================

    const handleEditSchool = (school) => {
        setSelectedSchool(school);
        setModalOpen(true);
    };

    // =========================
    // CLOSE SCHOOL MODAL
    // =========================

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedSchool(null);
    };

    // =========================
    // SCHOOL SAVED
    // =========================

    const handleSchoolSaved = (savedSchool) => {
        if (selectedSchool) {
            // UPDATE EXISTING SCHOOL

            setSchools((previousSchools) =>
                previousSchools.map((school) =>
                    school.id === savedSchool.id
                        ? savedSchool
                        : school
                )
            );
        } else {
            // ADD NEW SCHOOL

            setSchools((previousSchools) => [
                savedSchool,
                ...previousSchools,
            ]);

            // Go back to first page
            setCurrentPage(1);
        }

        handleCloseModal();
    };

    // =========================
    // OPEN DELETE MODAL
    // =========================

    const handleDelete = (school) => {
        setDeleteSchool(school);
    };

    // =========================
    // CONFIRM DELETE
    // =========================

    const confirmDelete = async () => {
        if (!deleteSchool) {
            return;
        }

        setDeleteLoading(true);

        try {
            await api.delete(
                `/schools/${deleteSchool.id}`
            );

            setSchools((previousSchools) =>
                previousSchools.filter(
                    (school) =>
                        school.id !== deleteSchool.id
                )
            );

            setDeleteSchool(null);

        } catch (error) {
            console.error(error);

            alert('Failed to delete school.');

        } finally {
            setDeleteLoading(false);
        }
    };

    // =========================
    // SCHOOL STATISTICS
    // =========================

    const totalSchools = schools.length;

    const oLevelSchools = schools.filter(
        (school) => school.level === 'O-Level'
    ).length;

    const advancedLevelSchools = schools.filter(
        (school) => school.level === 'Advanced Level'
    ).length;

    const combinedSchools = schools.filter(
        (school) =>
            school.level === 'O-Level & Advanced Level'
    ).length;

    // =========================
    // SEARCH
    // =========================

    const filteredSchools = schools.filter((school) => {
        const search = searchTerm.toLowerCase().trim();

        return (
            school.name
                ?.toLowerCase()
                .includes(search) ||

            school.code
                ?.toLowerCase()
                .includes(search) ||

            school.location
                ?.toLowerCase()
                .includes(search) ||

            school.level
                ?.toLowerCase()
                .includes(search)
        );
    });

    // =========================
    // PAGINATION
    // =========================

    const totalPages = Math.ceil(
        filteredSchools.length / schoolsPerPage
    );

    const startIndex =
        (currentPage - 1) * schoolsPerPage;

    const currentSchools = filteredSchools.slice(
        startIndex,
        startIndex + schoolsPerPage
    );

    // =========================
    // PAGE CHANGE
    // =========================

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // =========================
    // SEARCH CHANGE
    // =========================

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);

        // Return to page 1 when searching
        setCurrentPage(1);
    };

    // =========================
    // KEEP PAGE VALID
    // =========================

    useEffect(() => {
        if (
            totalPages > 0 &&
            currentPage > totalPages
        ) {
            setCurrentPage(totalPages);
        }

        if (
            totalPages === 0 &&
            currentPage !== 1
        ) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    // =========================
    // LOADING
    // =========================

    if (loading) {
        return (
            <div className="loading-state">
                <h2>Loading schools...</h2>
            </div>
        );
    }

    // =========================
    // ERROR
    // =========================

    if (error) {
        return (
            <div className="error-state">
                <h2>{error}</h2>
            </div>
        );
    }

    // =========================
    // PAGE
    // =========================

    return (
        <div className="schools-page">

            {/* =========================
                PAGE HEADER
            ========================= */}

            <div className="page-header">

                <div>
                    <h1>Schools</h1>

                    <p>
                        Manage all registered schools
                    </p>
                </div>

                <button
                    type="button"
                    className="primary-button"
                    onClick={handleAddSchool}
                >
                    + Add School
                </button>

            </div>

            {/* =========================
                SCHOOL STATISTICS
            ========================= */}

            <div className="school-statistics">

                {/* TOTAL SCHOOLS */}

                <div className="school-stat-card">

                    <div>
                        <span>
                            Total Schools
                        </span>

                        <strong>
                            {totalSchools}
                        </strong>
                    </div>

                    <div className="stat-icon">
                        S
                    </div>

                </div>

                {/* O-LEVEL */}

                <div className="school-stat-card">

                    <div>
                        <span>
                            O-Level Only
                        </span>

                        <strong>
                            {oLevelSchools}
                        </strong>
                    </div>

                    <div className="stat-icon">
                        O
                    </div>

                </div>

                {/* ADVANCED LEVEL */}

                <div className="school-stat-card">

                    <div>
                        <span>
                            Advanced Level Only
                        </span>

                        <strong>
                            {advancedLevelSchools}
                        </strong>
                    </div>

                    <div className="stat-icon">
                        A
                    </div>

                </div>

                {/* BOTH */}

                <div className="school-stat-card">

                    <div>
                        <span>
                            O-Level & Advanced
                        </span>

                        <strong>
                            {combinedSchools}
                        </strong>
                    </div>

                    <div className="stat-icon">
                        B
                    </div>

                </div>

            </div>

            {/* =========================
                SEARCH
            ========================= */}

            <div className="search-container">

                <input
                    type="text"
                    placeholder="Search schools..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />

            </div>

            {/* =========================
                SCHOOLS TABLE
            ========================= */}

            <div className="schools-table-card">

                {/* TABLE HEADER */}

                <div className="table-header">

                    <div>

                        <h2>
                            Registered Schools
                        </h2>

                        <span>
                            {filteredSchools.length}{' '}
                            {filteredSchools.length === 1
                                ? 'school'
                                : 'schools'}
                        </span>

                    </div>

                </div>

                {/* =========================
                    EMPTY STATE
                ========================= */}

                {filteredSchools.length === 0 ? (

                    <div className="empty-state">

                        <h3>
                            No schools found
                        </h3>

                        <p>
                            {searchTerm
                                ? 'Try changing your search.'
                                : 'Add a new school to get started.'}
                        </p>

                    </div>

                ) : (

                    <>

                        {/* =========================
                            TABLE
                        ========================= */}

                        <div className="table-wrapper">

                            <table className="schools-table">

                                <thead>

                                    <tr>

                                        <th>
                                            #
                                        </th>

                                        <th>
                                            School
                                        </th>

                                        <th>
                                            Code
                                        </th>

                                        <th>
                                            Location
                                        </th>

                                        <th>
                                            Level
                                        </th>

                                        <th>
                                            Actions
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {currentSchools.map(
                                        (school, index) => (

                                            <tr
                                                key={
                                                    school.id
                                                }
                                            >

                                                {/* NUMBER */}

                                                <td>
                                                    {
                                                        startIndex +
                                                        index +
                                                        1
                                                    }
                                                </td>

                                                {/* SCHOOL */}

                                                <td>
                                                    <strong>
                                                        {
                                                            school.name
                                                        }
                                                    </strong>
                                                </td>

                                                {/* CODE */}

                                                <td>
                                                    {
                                                        school.code
                                                    }
                                                </td>

                                                {/* LOCATION */}

                                                <td>
                                                    {
                                                        school.location ||
                                                        '-'
                                                    }
                                                </td>

                                                {/* LEVEL */}

                                                <td>

                                                    <span className="level-badge">
                                                        {
                                                            school.level
                                                        }
                                                    </span>

                                                </td>

                                                {/* ACTIONS */}

                                                <td>

                                                    <div className="action-buttons">

                                                        <button
                                                            type="button"
                                                            className="view-button"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/school-admins?schoolId=${school.id}`
                                                                )
                                                            }
                                                        >
                                                            View Admins
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="view-button"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/students?schoolId=${school.id}`
                                                                )
                                                            }
                                                        >
                                                            View Students
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="edit-button"
                                                            onClick={() =>
                                                                handleEditSchool(
                                                                    school
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="delete-button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    school
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                        {/* =========================
                            PAGINATION
                        ========================= */}

                        {filteredSchools.length > 0 && (
                            <div className="pagination">

                                {/* PAGINATION INFO */}

                                <div className="pagination-info">

                                    Showing{' '}

                                    <strong>
                                        {startIndex + 1}
                                    </strong>

                                    {' '}to{' '}

                                    <strong>
                                        {Math.min(
                                            startIndex +
                                                schoolsPerPage,
                                            filteredSchools.length
                                        )}
                                    </strong>

                                    {' '}of{' '}

                                    <strong>
                                        {filteredSchools.length}
                                    </strong>

                                    {' '}
                                    {filteredSchools.length === 1
                                        ? 'school'
                                        : 'schools'}

                                </div>

                                {/* PAGINATION BUTTONS */}

                                {totalPages > 1 && (

                                    <div className="pagination-buttons">

                                        {/* PREVIOUS */}

                                        <button
                                            type="button"
                                            disabled={
                                                currentPage ===
                                                1
                                            }
                                            onClick={() =>
                                                handlePageChange(
                                                    currentPage -
                                                        1
                                                )
                                            }
                                        >
                                            Previous
                                        </button>

                                        {/* PAGE NUMBERS */}

                                        {Array.from(
                                            {
                                                length:
                                                    totalPages,
                                            },
                                            (_, index) =>
                                                index + 1
                                        ).map((page) => (

                                            <button
                                                key={page}
                                                type="button"
                                                className={
                                                    currentPage ===
                                                    page
                                                        ? 'active'
                                                        : ''
                                                }
                                                onClick={() =>
                                                    handlePageChange(
                                                        page
                                                    )
                                                }
                                            >
                                                {page}
                                            </button>

                                        ))}

                                        {/* NEXT */}

                                        <button
                                            type="button"
                                            disabled={
                                                currentPage ===
                                                totalPages
                                            }
                                            onClick={() =>
                                                handlePageChange(
                                                    currentPage +
                                                        1
                                                )
                                            }
                                        >
                                            Next
                                        </button>

                                    </div>

                                )}

                            </div>
                        )}

                    </>

                )}

            </div>

            {/* =========================
                ADD / EDIT SCHOOL MODAL
            ========================= */}

            <SchoolModal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                onSchoolSaved={handleSchoolSaved}
                school={selectedSchool}
            />

            {/* =========================
                DELETE CONFIRMATION MODAL
            ========================= */}

            <ConfirmModal
                isOpen={Boolean(deleteSchool)}
                title="Delete School"
                message={
                    deleteSchool
                        ? `Are you sure you want to delete "${deleteSchool.name}"? This action cannot be undone.`
                        : ''
                }
                onConfirm={confirmDelete}
                onCancel={() =>
                    setDeleteSchool(null)
                }
                loading={deleteLoading}
            />

        </div>
    );
}

export default SchoolsPage;