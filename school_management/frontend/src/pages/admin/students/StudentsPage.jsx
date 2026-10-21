import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../../api/api';
import { getStoredUser } from '../../../utils/auth';
import jsPDF from 'jspdf';

import StudentModal from './StudentModal';
import ConfirmModal from './ConfirmModal';
import StudentViewModal from './StudentViewModal';
import EditIcon from '../../../assets/edit.png';
import './StudentsPage.css';

const DEFAULT_PER_PAGE = 10;

function slug(text) {
    return String(text ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function StudentsPage() {
    const [searchParams] = useSearchParams();
    const currentUser = getStoredUser();
    const schoolIdFilter = searchParams.get('schoolId');
    const isSuperAdminViewingSchool =
        currentUser?.role === 'super_admin' && Boolean(schoolIdFilter);

    const baseUrl = isSuperAdminViewingSchool
        ? `/schools/${schoolIdFilter}/students`
        : '/school/students';

    const token = localStorage.getItem('school_token');

    // =========================
    // STUDENTS
    // =========================

    const [students, setStudents] = useState([]);

    // All students matching the current filters (used for statistics).
    const [allStudents, setAllStudents] = useState([]);

    const [pagination, setPagination] = useState({});

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    // =========================
    // CLASSES & STREAMS (filter buttons)
    // =========================

    const [classes, setClasses] = useState([]);

    const [streams, setStreams] = useState([]);

    // =========================
    // FILTERS
    // =========================

    const [selectedClass, setSelectedClass] = useState('');

    const [selectedStreams, setSelectedStreams] = useState([]);

    const [search, setSearch] = useState('');

    const [currentPage, setCurrentPage] = useState(1);

    const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

    // =========================
    // ADD / EDIT MODAL
    // =========================

    const [showModal, setShowModal] = useState(false);

    const [selectedStudent, setSelectedStudent] = useState(null);

    // =========================
    // VIEW MODAL
    // =========================

    const [showViewModal, setShowViewModal] = useState(false);

    // =========================
    // DELETE MODAL
    // =========================

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [studentToDelete, setStudentToDelete] = useState(null);

    const [deleteLoading, setDeleteLoading] = useState(false);

    // =========================
    // IMPORT STUDENTS
    // =========================

    const [showImportModal, setShowImportModal] = useState(false);

    const [csvText, setCsvText] = useState('');

    const [importLoading, setImportLoading] = useState(false);

    const [selectedFileName, setSelectedFileName] = useState('');

    // =========================
    // DOWNLOAD
    // =========================

    const [downloadLoading, setDownloadLoading] = useState(false);

    // School info (for PDF heading)
    const [school, setSchool] = useState(null);

    // =====================================================
    // FETCH SCHOOL INFO
    // =====================================================

    const fetchSchool = useCallback(async () => {
        if (isSuperAdminViewingSchool) {
            return;
        }

        try {
            const response = await api.get('/school/', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSchool(response.data || null);
        } catch (err) {
            console.error('Failed to load school info:', err);
        }
    }, [token, isSuperAdminViewingSchool]);

    // =====================================================
    // FETCH CLASSES & STREAMS
    // =====================================================

    const fetchClassesAndStreams = useCallback(async () => {
        if (isSuperAdminViewingSchool) {
            return;
        }

        try {
            const [classesRes, streamsRes] = await Promise.all([
                api.get('/school/classes', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                api.get('/school/streams', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            setClasses(classesRes.data || []);
            setStreams(streamsRes.data || []);
        } catch (err) {
            console.error('Failed to load classes and streams:', err);
        }
    }, [token, isSuperAdminViewingSchool]);

    // =====================================================
    // FETCH STUDENTS (paginated list for the table)
    // =====================================================

    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const params = {
                page: currentPage,
                per_page: perPage,
            };

            if (!isSuperAdminViewingSchool) {
                if (selectedClass) {
                    params.class_name = selectedClass;
                }

                if (selectedStreams.length > 0) {
                    params.streams = selectedStreams.join(',');
                }

                if (search.trim()) {
                    params.search = search.trim();
                }
            }

            const response = await api.get(baseUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params,
            });

            const payload = response.data;
            const data = Array.isArray(payload)
                ? payload
                : payload.data || [];
            const meta = Array.isArray(payload) ? {} : (payload.meta || {});

            setStudents(data);
            setPagination(meta);
        } catch (err) {
            console.error('Failed to fetch students:', err);

            if (err.response?.status === 401) {
                setError(
                    'You are not authenticated. Please login again.'
                );
            } else if (err.response?.status === 403) {
                setError(
                    'You are not authorized to access students.'
                );
            } else {
                setError('Failed to load students.');
            }
        } finally {
            setLoading(false);
        }
    }, [
        baseUrl,
        currentPage,
        perPage,
        selectedClass,
        selectedStreams,
        search,
        token,
        isSuperAdminViewingSchool,
    ]);

    // =====================================================
    // FETCH ALL STUDENTS (statistics + filter counts)
    // =====================================================

    const fetchAllStudents = useCallback(async () => {
        try {
            const params = {
                per_page: 1000,
            };

            if (selectedClass) {
                params.class_name = selectedClass;
            }

            if (selectedStreams.length > 0) {
                params.streams = selectedStreams.join(',');
            }

            if (search.trim()) {
                params.search = search.trim();
            }

            const response = await api.get(baseUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params,
            });

            const payload = response.data;
            setAllStudents(
                Array.isArray(payload) ? payload : payload.data || []
            );
        } catch (err) {
            console.error('Failed to load all students:', err);
        }
    }, [
        baseUrl,
        selectedClass,
        selectedStreams,
        search,
        token,
    ]);



    // Reset to the first page whenever the filters change.
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedClass, selectedStreams, search]);

    useEffect(() => {
        fetchSchool();
        fetchClassesAndStreams();
        fetchStudents();
        fetchAllStudents();
    }, [
        schoolIdFilter,
        currentUser?.role,
        currentPage,
        perPage,
        selectedClass,
        selectedStreams,
        search,
        fetchSchool,
        fetchClassesAndStreams,
        fetchStudents,
        fetchAllStudents,
    ]);

    // =====================================================
    // FILTER OPTIONS
    // =====================================================

    const classNameOptions = useMemo(() => {
        const fromApi = classes.map((schoolClass) => schoolClass.name).filter(Boolean);
        const fromStudents = [
            ...new Set(allStudents.map((student) => student.class_name).filter(Boolean)),
        ];

        return [...new Set([...fromApi, ...fromStudents])].sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true })
        );
    }, [classes, allStudents]);

    const streamNameOptions = useMemo(() => {
        if (!selectedClass) {
            return [];
        }

        const fromApi = streams
            .filter((stream) => {
                const schoolClass = classes.find(
                    (item) => String(item.id) === String(stream.class_id)
                );
                return (
                    schoolClass &&
                    schoolClass.name.toLowerCase() === selectedClass.toLowerCase()
                );
            })
            .map((stream) => stream.name);

        const fromStudents = [
            ...new Set(
                allStudents
                    .filter(
                        (student) =>
                            student.class_name &&
                            student.class_name.toLowerCase() ===
                                selectedClass.toLowerCase() &&
                            student.stream
                    )
                    .map((student) => student.stream)
            ),
        ];

        return [...new Set([...fromApi, ...fromStudents])].sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true })
        );
    }, [selectedClass, classes, streams, allStudents]);

    const toggleStream = (stream) => {
        setSelectedStreams((prev) =>
            prev.includes(stream)
                ? prev.filter((item) => item !== stream)
                : [...prev, stream]
        );
    };

    const handleClearFilters = () => {
        setSelectedClass('');
        setSelectedStreams([]);
        setSearch('');
        setCurrentPage(1);
    };

    // =====================================================
    // DERIVED DATA
    // =====================================================

    const filteredCount = allStudents.length;

    const lastPage = Math.max(1, pagination.last_page || 1);

    const fromRecord =
        students.length > 0
            ? (currentPage - 1) * perPage + 1
            : 0;
    const toRecord = fromRecord + students.length - 1;

    const pages = Array.from({ length: lastPage }, (_, index) => index + 1);

    const fileBaseName = [
        'students',
        selectedClass ? slug(selectedClass) : 'all',
        ...selectedStreams.map(slug),
    ].join('-');

    // =====================================================
    // CSV DOWNLOAD
    // =====================================================

    const handleDownloadCsv = async () => {
        if (isSuperAdminViewingSchool) {
            setError('Download is not available when viewing another school.');
            return;
        }

        setDownloadLoading(true);
        setError('');

        try {
            const params = {};

            if (selectedClass) {
                params.class_name = selectedClass;
            }

            if (selectedStreams.length > 0) {
                params.streams = selectedStreams.join(',');
            }

            if (search.trim()) {
                params.search = search.trim();
            }

            const response = await api.get('/school/students/download', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'text/csv',
                },
                params,
                responseType: 'blob',
            });

            const blob = new Blob([response.data], {
                type: 'text/csv;charset=utf-8;',
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;

            const contentDisposition =
                response.headers['content-disposition'] ||
                response.headers['Content-Disposition'] ||
                '';
            const headerFileName = contentDisposition.match(
                /filename(?: \*=(?:UTF-8'')?)?="?([^";]+)"?/
            );
            const downloadedFileName =
                (headerFileName && headerFileName[1]) ||
                `${fileBaseName}.csv`;

            link.setAttribute('download', downloadedFileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download students:', err);
            setError('Failed to download students.');
        } finally {
            setDownloadLoading(false);
        }
    };

    // =====================================================
    // PDF DOWNLOAD
    // =====================================================

    const handleDownloadPdf = async () => {
        setDownloadLoading(true);
        setError('');

        try {
            // Ensure we have all student data (fetch if empty)
            let dataToExport = allStudents.length > 0 ? allStudents : students;

            if (dataToExport.length === 0) {
                // Try to fetch all students first
                const params = { per_page: 1000 };
                if (selectedClass) params.class_name = selectedClass;
                if (selectedStreams.length > 0) params.streams = selectedStreams.join(',');
                if (search.trim()) params.search = search.trim();

                const response = await api.get(baseUrl, {
                    headers: { Authorization: `Bearer ${token}` },
                    params,
                });
                const payload = response.data;
                const fetched = Array.isArray(payload) ? payload : payload.data || [];
                dataToExport = fetched;
                setAllStudents(fetched);
            }

            if (dataToExport.length === 0) {
                setError('No students to export.');
                return;
            }

            const doc = new jsPDF();

            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 14;
            const usableWidth = pageWidth - margin * 2;

            // Column widths (must sum to usableWidth)
            const colWidths = [
                usableWidth * 0.14, // Admission No.
                usableWidth * 0.22, // Full Name
                usableWidth * 0.10, // Gender
                usableWidth * 0.14, // Date of Birth
                usableWidth * 0.14, // Phone
                usableWidth * 0.14, // Class
                usableWidth * 0.12, // Stream
            ];

            const headers = [
                'Admission No.', 'Full Name', 'Gender', 'Date of Birth', 'Phone', 'Class', 'Stream',
            ];

            // School header
            const schoolName = school?.name || 'School';

            doc.setFontSize(16);
            doc.setTextColor(30, 30, 30);
            doc.setFont(undefined, 'bold');
            doc.text(schoolName, margin, 15);

            // Report title
            doc.setFontSize(13);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text('Students Report', margin, 32);

            // Subtitle with filter info and date
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(100, 100, 100);
            let subtitle = `Generated: ${new Date().toLocaleDateString()}`;
            if (selectedClass) subtitle += `   |   Class: ${selectedClass}`;
            if (selectedStreams.length > 0) subtitle += `   |   Streams: ${selectedStreams.join(', ')}`;
            doc.text(subtitle, margin, 40);

            // Move table start below subtitle
            let y = 48;

            // Table settings
            const rowHeight = 7;
            const headerHeight = 10;
            const headerFillColor = [59, 130, 246];

            // Helper: draw a cell
            const drawCell = (x, y, width, text, isHeader, align = 'left') => {
                if (isHeader) {
                    doc.setFillColor(...headerFillColor);
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(8);
                    doc.setFont(undefined, 'bold');
                } else {
                    doc.setFillColor(255, 255, 255);
                    doc.setTextColor(50, 50, 50);
                    doc.setFontSize(8);
                    doc.setFont(undefined, 'normal');
                }

                doc.rect(x, y, width, rowHeight, 'F');
                doc.setDrawColor(200, 200, 200);
                doc.rect(x, y, width, rowHeight, 'S');

                const textX = align === 'center' ? x + width / 2 : x + 2;
                doc.text(String(text ?? ''), textX, y + rowHeight - 3, { align });
            };

            // Draw header row
            let x = margin;
            headers.forEach((h, i) => {
                drawCell(x, y, colWidths[i], h, true, i === 0 ? 'left' : 'left');
                x += colWidths[i];
            });
            y += headerHeight;

            // Draw data rows
            dataToExport.forEach((student, rowIndex) => {
                // Check if we need a new page
                if (y + rowHeight > doc.internal.pageSize.getHeight() - 20) {
                    doc.addPage();
                    y = 20;
                    // Redraw header on new page
                    x = margin;
                    headers.forEach((h, i) => {
                        drawCell(x, y, colWidths[i], h, true, 'left');
                        x += colWidths[i];
                    });
                    y += headerHeight;
                }

                const isAlternate = rowIndex % 2 === 1;
                if (isAlternate) {
                    doc.setFillColor(247, 249, 251);
                    doc.rect(margin, y, usableWidth, rowHeight, 'F');
                }

                const values = [
                    student.admission_number || '',
                    `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''}`.trim(),
                    student.gender || '-',
                    student.date_of_birth || '-',
                    student.phone || '-',
                    student.class_name || '-',
                    student.stream || '-',
                ];

                x = margin;
                values.forEach((val, i) => {
                    drawCell(x, y, colWidths[i], val, false, i === 0 ? 'left' : 'left');
                    x += colWidths[i];
                });
                y += rowHeight;
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let p = 1; p <= pageCount; p += 1) {
                doc.setPage(p);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(
                    `Page ${p} of ${pageCount}  |  Total Students: ${dataToExport.length}`,
                    pageWidth - margin,
                    doc.internal.pageSize.getHeight() - 8,
                    { align: 'right' }
                );
            }

            const fileName = `${fileBaseName}.pdf`;
            doc.save(fileName);
        } catch (err) {
            console.error('Failed to download PDF:', err);
            setError('Failed to download PDF: ' + (err?.message || err?.toString() || 'Unknown error'));
        } finally {
            setDownloadLoading(false);
        }
    };

    // =====================================================
    // IMPORT HELPERS
    // =====================================================

    const parseCsvLine = (line) => {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i += 1) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i += 1;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }

            if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
                continue;
            }

            if ((char === '\n' || char === '\r') && !inQuotes) {
                break;
            }

            current += char;
        }

        values.push(current.trim());

        return values;
    };

    const parseCsvRows = (csvContent) => {
        const rows = (csvContent || '')
            .trim()
            .split(/\r?\n/)
            .filter((line) => line.trim().length > 0);

        if (rows.length < 2) {
            return [];
        }

        const headers = parseCsvLine(rows[0]).map((header) =>
            header.toLowerCase().trim()
        );
        const dataRows = rows.slice(1);

        return dataRows
            .map((row) => parseCsvLine(row))
            .filter((row) => row.some((cell) => (cell || '').trim().length > 0))
            .map((row) => {
                const normalizedRow = Array.from(
                    { length: headers.length },
                    (_, index) => row[index] || ''
                );
                const student = {};

                headers.forEach((header, index) => {
                    student[header] = normalizedRow[index]
                        .replace(/^"|"$/g, '')
                        .trim();
                });

                return {
                    admission_number: student.admission_number || '',
                    first_name: student.first_name || '',
                    middle_name: student.middle_name || '',
                    last_name: student.last_name || '',
                    gender: student.gender || '',
                    date_of_birth: student.date_of_birth || '',
                    phone: student.phone || '',
                    address: student.address || '',
                    class_name: student.class_name || '',
                    stream: student.stream || '',
                };
            });
    };

    const handleDownloadTemplate = () => {
        const template = [
            'admission_number,first_name,middle_name,last_name,gender,date_of_birth,phone,address,class_name,stream',
            'S-101,Alice,,Njeri,Female,2014-05-14,0712345678,Nairobi,Form One,North',
            'S-102,Brian,,Kiptoo,Male,2013-08-12,0712345679,Kisumu,Form One,North',
        ].join('\n');

        const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.setAttribute('download', 'student-import-template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const handleImportStudents = async () => {
        const studentsToImport = parseCsvRows(csvText);

        if (studentsToImport.length === 0) {
            setError('Please provide valid CSV data with student records.');
            return;
        }

        try {
            setImportLoading(true);
            setError('');

            const token = localStorage.getItem('school_token');
            const response = await api.post(
                '/school/students/import',
                { students: studentsToImport },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data?.count) {
                setShowImportModal(false);
                setCsvText('');
                await fetchStudents();
                await fetchAllStudents();
            }
        } catch (error) {
            console.error('Failed to import students:', error);

            const serverMessage =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message;
            const validationErrors = error.response?.data?.errors;

            if (Array.isArray(validationErrors) && validationErrors.length > 0) {
                setError(validationErrors.join(' '));
            } else {
                setError(serverMessage || 'Failed to import students.');
            }
        } finally {
            setImportLoading(false);
        }
    };

    // =====================================================
    // ADD STUDENT
    // =====================================================

    const handleStudentAdded = (student) => {
        setStudents((prev) => [student, ...prev]);
        setAllStudents((prev) => [student, ...prev]);
    };

    // =====================================================
    // OPEN ADD STUDENT
    // =====================================================

    const handleAddStudent = () => {
        setSelectedStudent(null);
        setShowViewModal(false);
        setShowDeleteModal(false);
        setStudentToDelete(null);
        setShowModal(true);
    };

    const handleOpenImportModal = () => {
        setError('');
        setCsvText('');
        setShowImportModal(true);
    };

    const resetStudentModals = () => {
        setShowModal(false);
        setShowViewModal(false);
        setShowDeleteModal(false);
        setSelectedStudent(null);
        setStudentToDelete(null);
    };

    // =====================================================
    // EDIT STUDENT
    // =====================================================

    const handleEditStudent = (student) => {
        setSelectedStudent(student);
        setShowViewModal(false);
        setShowDeleteModal(false);
        setStudentToDelete(null);
        setShowModal(true);
    };

    // =====================================================
    // STUDENT UPDATED
    // =====================================================

    const handleStudentUpdated = (updatedStudent) => {
        setStudents((prev) =>
            prev.map((student) =>
                student.id === updatedStudent.id ? updatedStudent : student
            )
        );

        setAllStudents((prev) =>
            prev.map((student) =>
                student.id === updatedStudent.id ? updatedStudent : student
            )
        );
    };

    // =====================================================
    // CLOSE ADD / EDIT MODAL
    // =====================================================

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedStudent(null);
    };

    // =====================================================
    // VIEW STUDENT
    // =====================================================

    const handleViewStudent = (student) => {
        resetStudentModals();
        setSelectedStudent(student);
        setShowViewModal(true);
    };

    // =====================================================
    // CLOSE VIEW MODAL
    // =====================================================

    const handleCloseViewModal = () => {
        setShowViewModal(false);
        setSelectedStudent(null);
    };

    // =====================================================
    // OPEN DELETE MODAL
    // =====================================================

    const handleDeleteClick = (student) => {
        setStudentToDelete(student);
        setShowDeleteModal(true);
        setError('');
    };

    // =====================================================
    // CLOSE DELETE MODAL
    // =====================================================

    const handleCloseDeleteModal = () => {
        if (deleteLoading) {
            return;
        }

        setShowDeleteModal(false);
        setStudentToDelete(null);
    };

    // =====================================================
    // DELETE STUDENT
    // =====================================================

    const handleDeleteStudent = async () => {
        if (!studentToDelete) {
            return;
        }

        try {
            setDeleteLoading(true);
            setError('');

            const token = localStorage.getItem('school_token');

            await api.delete(
                `/school/students/${studentToDelete.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Remove student from state
            setStudents((prev) =>
                prev.filter((student) => student.id !== studentToDelete.id)
            );

            setAllStudents((prev) =>
                prev.filter((student) => student.id !== studentToDelete.id)
            );

            // Close modal
            setShowDeleteModal(false);
            setStudentToDelete(null);
        } catch (error) {
            console.error('Failed to delete student:', error);

            if (error.response?.status === 401) {
                setError(
                    'Your session has expired. Please login again.'
                );
            } else if (error.response?.status === 403) {
                setError(
                    'You are not authorized to delete this student.'
                );
            } else if (error.response?.status === 404) {
                setError('Student was not found.');
            } else {
                setError('Failed to delete student.');
            }
        } finally {
            setDeleteLoading(false);
        }
    };

    // =====================================================
    // RENDER
    // =====================================================

    const filterIsActive =
        Boolean(selectedClass) ||
        selectedStreams.length > 0 ||
        Boolean(search.trim());

    return (
        <div className="students-page">
            {/* =================================================
                PAGE HEADER
            ================================================= */}
            <div className="page-header">
                <div>
                    <h1>Students</h1>
                    <p>
                        Manage students belonging to your school. Filter by
                        class and stream, then download the list as CSV.
                    </p>
                </div>

                <div className="page-actions">
                    <button
                        className="primary-button download-button"
                        type="button"
                        onClick={handleDownloadCsv}
                        disabled={downloadLoading || isSuperAdminViewingSchool}
                    >
                        {downloadLoading
                            ? 'Downloading...'
                            : '⬇ Download CSV'}
                    </button>

                    <button
                        className="primary-button download-button pdf-button"
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={downloadLoading || isSuperAdminViewingSchool}
                    >
                        {downloadLoading
                            ? 'Downloading...'
                            : '📄 Download PDF'}
                    </button>

                    <button
                        className="secondary-button import-button"
                        type="button"
                        onClick={handleOpenImportModal}
                    >
                        Import Students
                    </button>

                    <button
                        className="primary-button"
                        type="button"
                        onClick={handleAddStudent}
                    >
                        + Add Student
                    </button>
                </div>
            </div>

            {/* =================================================
                STATISTICS
            ================================================= */}
            {!loading && (
                <div className="student-statistics">
                    {/* TOTAL */}
                    <div className="student-stat-card">
                        <div>
                            <span>Total Students</span>
                            <strong>{filteredCount}</strong>
                        </div>
                        <div className="stat-icon">ST</div>
                    </div>

                    {/* MALE */}
                    <div className="student-stat-card">
                        <div>
                            <span>Male</span>
                            <strong>
                                {allStudents.filter(
                                    (student) => student.gender === 'Male'
                                ).length}
                            </strong>
                        </div>
                        <div className="stat-icon">M</div>
                    </div>

                    {/* FEMALE */}
                    <div className="student-stat-card">
                        <div>
                            <span>Female</span>
                            <strong>
                                {allStudents.filter(
                                    (student) => student.gender === 'Female'
                                ).length}
                            </strong>
                        </div>
                        <div className="stat-icon">F</div>
                    </div>
                </div>
            )}

            {/* =================================================
                FILTERS
            ================================================= */}
            {!loading && (
                <div className="filter-bar">
                    <div className="filter-summary">
                        {filterIsActive ? (
                            <>
                                <strong>Filtering:</strong>{' '}
                                {selectedClass || 'All classes'}
                                {selectedStreams.length > 0 ? (
                                    <>
                                        ·
                                        Streams: {selectedStreams.join(', ')}
                                    </>
                                ) : null}
                                {search.trim() ? (
                                    <>
                                        · Search: "{search}"
                                    </>
                                ) : null}
                                <button
                                    type="button"
                                    className="clear-filter"
                                    onClick={handleClearFilters}
                                >
                                    Clear
                                </button>
                            </>
                        ) : (
                            <span>All students</span>
                        )}
                        <span className="count">
                            {filteredCount} student(s) found
                        </span>
                    </div>

                    <div className="class-filter">
                        <span className="filter-label">Class:</span>
                        <button
                            type="button"
                            className={`chip ${!selectedClass ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedClass('');
                                setSelectedStreams([]);
                            }}
                        >
                            All Classes
                        </button>
                        {classNameOptions.map((name) => (
                            <button
                                key={name}
                                type="button"
                                className={`chip ${
                                    selectedClass === name ? 'active' : ''
                                }`}
                                onClick={() => {
                                    setSelectedClass(name);
                                    setSelectedStreams([]);
                                }}
                            >
                                {name}
                            </button>
                        ))}
                    </div>

                    {selectedClass && (
                        <div className="stream-filter">
                            <span className="filter-label">
                                Streams in {selectedClass}:
                            </span>
                            <button
                                type="button"
                                className={`chip ${
                                    selectedStreams.length === 0
                                        ? 'active'
                                        : ''
                                }`}
                                onClick={() => setSelectedStreams([])}
                            >
                                All {selectedClass}
                            </button>
                            {streamNameOptions.map((stream) => (
                                <button
                                    key={stream}
                                    type="button"
                                    className={`chip ${
                                        selectedStreams.includes(stream)
                                            ? 'active'
                                            : ''
                                    }`}
                                    onClick={() => toggleStream(stream)}
                                >
                                    {stream}
                                </button>
                            ))}
                            {selectedStreams.length > 0 && (
                                <div className="selected-streams">
                                    <span className="selected-label">
                                        Selected:
                                    </span>
                                    {selectedStreams.map((stream) => (
                                        <span
                                            key={stream}
                                            className="selected-chip"
                                        >
                                            {stream}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleStream(stream)
                                                }
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="search-container">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by admission number, name, gender or phone..."
                        />
                    </div>
                </div>
            )}

            {/* =================================================
                ERROR
            ================================================= */}
            {error && (
                <div className="modal-error">{error}</div>
            )}

            {/* =================================================
                STUDENTS LIST (paginated)
            ================================================= */}
            {!loading && (
                <div className="students-by-class-card">
                    {students.length === 0 ? (
                        <div className="empty-state">
                            <h3>
                                {filterIsActive
                                    ? 'No students match your filters.'
                                    : 'There are no students registered in your school.'}
                            </h3>
                            <p>
                                {filterIsActive
                                    ? 'Try selecting a different class, stream, or clear the filters.'
                                    : 'Add your first student to get started.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="class-table-wrapper">
                                <table className="class-students-table">
                                    <thead>
                                        <tr>
                                            <th>Admission No.</th>
                                            <th>Full Name</th>
                                            <th>Gender</th>
                                            <th>Date of Birth</th>
                                            <th>Phone</th>
                                            <th>Class</th>
                                            <th>Stream</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student) => (
                                            <tr key={student.id}>
                                                <td>
                                                    <strong>
                                                        {student.admission_number}
                                                    </strong>
                                                </td>
                                                <td>
                                                    {student.first_name}{' '}
                                                    {student.middle_name || ''}{' '}
                                                    {student.last_name}
                                                </td>
                                                <td>{student.gender}</td>
                                                <td>
                                                    {student.date_of_birth || '-'}
                                                </td>
                                                <td>{student.phone || '-'}</td>
                                                <td>{student.class_name || '-'}</td>
                                                <td>{student.stream || '-'}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="view-button"
                                                            type="button"
                                                            onClick={() =>
                                                                handleViewStudent(student)
                                                            }
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            className="edit-button"
                                                            type="button"
                                                            onClick={() =>
                                                                handleEditStudent(student)
                                                            }
                                                        >
                                                            <img
                                                                src={EditIcon}
                                                                alt="Edit"
                                                                width="16"
                                                                height="16"
                                                                style={{ display: 'block', margin: '0 auto' }}
                                                            />
                                                        </button>
                                                        <button
                                                            className="delete-button"
                                                            type="button"
                                                            onClick={() =>
                                                                handleDeleteClick(student)
                                                            }
                                                        >
                                                            <svg
                                                                width="14"
                                                                height="14"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                style={{ display: 'block', margin: '0 auto' }}
                                                                aria-hidden="true"
                                                            >
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                <line x1="10" y1="11" x2="10" y2="17" />
                                                                <line x1="14" y1="11" x2="14" y2="17" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pagination">
                                <div className="pagination-info">
                                    Showing{' '}
                                    <strong>{fromRecord}–{toRecord}</strong>{' '}
                                    of <strong>{filteredCount}</strong>{' '}
                                    students · Page{' '}
                                    <strong>{currentPage}</strong> of{' '}
                                    <strong>{lastPage}</strong>
                                </div>

                                <div className="pagination-controls">
                                    <button
                                        type="button"
                                        disabled={currentPage <= 1}
                                        onClick={() =>
                                            setCurrentPage(currentPage - 1)
                                        }
                                    >
                                        Prev
                                    </button>
                                    {pages.map((page) => (
                                        <button
                                            key={page}
                                            type="button"
                                            className={
                                                page === currentPage
                                                    ? 'active'
                                                    : ''
                                            }
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        disabled={currentPage >= lastPage}
                                        onClick={() =>
                                            setCurrentPage(currentPage + 1)
                                        }
                                    >
                                        Next
                                    </button>
                                </div>

                                <div className="per-page">
                                    <span>Rows per page:</span>
                                    <select
                                        value={perPage}
                                        onChange={(e) => {
                                            const value = Number(e.target.value);
                                            setPerPage(value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        {[10, 25, 50, 100].map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {loading ? (
                <div className="empty-state">
                    <h3>Loading students...</h3>
                    <p>Please wait.</p>
                </div>
            ) : null}

            {/* =================================================
                ADD / EDIT STUDENT MODAL
            ================================================= */}
            {showModal && (
                <StudentModal
                    student={selectedStudent}
                    onClose={handleCloseModal}
                    onStudentAdded={handleStudentAdded}
                    onStudentUpdated={handleStudentUpdated}
                />
            )}

            {/* =================================================
                DELETE CONFIRMATION MODAL
            ================================================= */}
            {showImportModal && (
                <div className="modal-backdrop" onMouseDown={() => setShowImportModal(false)}>
                    <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="modal-header">
                            <h3>Import Students</h3>
                            <button className="modal-close" onClick={() => setShowImportModal(false)} aria-label="Close">×</button>
                        </div>

                        <div className="modal-body">
                            <p style={{ marginTop: 0, color: '#6b7280' }}>
                                Download the template, then paste CSV data or upload a supported file. PDF/DOC files are accepted for upload, but automatic import works best with CSV or plain text data.
                            </p>

                            {error && (
                                <div className="modal-error">{error}</div>
                            )}

                            <div className="modal-actions" style={{ justifyContent: 'flex-start', marginBottom: '16px' }}>
                                <button className="secondary-button" type="button" onClick={handleDownloadTemplate}>
                                    Download Template
                                </button>
                            </div>

                            <div className="form-group import-form">
                                <label htmlFor="student-csv-upload">Upload student file</label>
                                <label className="file-upload">
                                    <input
                                        id="student-csv-upload"
                                        type="file"
                                        accept=".csv,.txt,.xls,.xlsx,.doc,.docx,.pdf"
                                        onChange={(event) => {
                                            const file = event.target.files?.[0];
                                            if (!file) return;

                                            setSelectedFileName(file.name || '');

                                            const fileName = file.name.toLowerCase();
                                            const readableFormats = ['.csv', '.txt', '.xls', '.xlsx'];
                                            const canReadDirectly = readableFormats.some((format) => fileName.endsWith(format));

                                            if (canReadDirectly) {
                                                const reader = new FileReader();
                                                reader.onload = (loadEvent) => {
                                                    setCsvText(String(loadEvent.target?.result || ''));
                                                    setError('');
                                                };
                                                reader.readAsText(file);
                                                return;
                                            }

                                            setCsvText('');
                                            setError('The file was accepted, but automatic import needs CSV or plain text data. Please download the template and paste the rows into the box, or convert the document to CSV first.');
                                        }}
                                    />

                                    <div className="file-upload-inner">
                                        <span className="file-upload-button">Choose file</span>
                                        <span className="file-upload-text">{selectedFileName || 'No file chosen — or paste CSV below'}</span>
                                    </div>
                                </label>
                            </div>

                            <div className="form-group">
                                <label htmlFor="student-csv-text">CSV content</label>
                                <textarea
                                    id="student-csv-text"
                                    rows="10"
                                    value={csvText}
                                    onChange={(e) => setCsvText(e.target.value)}
                                    placeholder="admission_number,first_name,middle_name,last_name,gender,date_of_birth,phone,address,class_name,stream
S-101,Alice,,Njeri,Female,2014-05-14,0712345678,Nairobi,Form One,North"
                                />
                            </div>

                            <div className="modal-actions">
                                <button className="cancel-button" type="button" onClick={() => setShowImportModal(false)}>
                                    Cancel
                                </button>
                                <button className="primary-button" type="button" onClick={handleImportStudents} disabled={importLoading}>
                                    {importLoading ? 'Importing...' : 'Import Students'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <ConfirmModal
                    student={studentToDelete}
                    onClose={handleCloseDeleteModal}
                    onConfirm={handleDeleteStudent}
                    loading={deleteLoading}
                />
            )}

            {/* =================================================
                VIEW STUDENT MODAL
            ================================================= */}
            {showViewModal && (
                <StudentViewModal
                    student={selectedStudent}
                    onClose={handleCloseViewModal}
                />
            )}
        </div>
    );
}

export default StudentsPage;
