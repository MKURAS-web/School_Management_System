import { useEffect, useMemo, useState } from 'react';
import api from '../../api/api';
import '../styles/teacher/Marks.css';

const EXAM_TYPES = [
    { value: 'quiz', label: 'Quiz' },
    { value: 'test', label: 'Test' },
    { value: 'midterm', label: 'Midterm Examination' },
    { value: 'terminal', label: 'Terminal Examination' },
    { value: 'annual', label: 'Annual Examination' },
    { value: 'mock', label: 'Mock Examination' },
    { value: 'other', label: 'Other' },
];

const INITIAL_FORM = {
    title: '',
    class_id: '',
    subject_id: '',
    exam_type: 'test',
    exam_date: new Date().toLocaleDateString('en-CA'),
    total_marks: '100',
    description: '',
};

function Marks() {
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [examinations, setExaminations] = useState([]);

    const [selectedExamination, setSelectedExamination] = useState(null);
    const [students, setStudents] = useState([]);

    const [form, setForm] = useState(INITIAL_FORM);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load teacher's classes, subjects and examinations.
    useEffect(() => {
        loadInitialData();
    }, []);

    const getArray = (response, keys) => {
        const data = response?.data;

        if (Array.isArray(data)) {
            return data;
        }

        for (const key of keys) {
            if (Array.isArray(data?.[key])) {
                return data[key];
            }
        }

        if (Array.isArray(data?.data)) {
            return data.data;
        }

        return [];
    };

    const loadInitialData = async () => {
        setLoading(true);
        setError('');

        try {
            const results = await Promise.allSettled([
                api.get('/teacher/classes'),
                api.get('/teacher/subjects'),
                api.get('/teacher/examinations'),
            ]);

            const [classesResult, subjectsResult, examsResult] = results;

            if (classesResult.status === 'fulfilled') {
                setClasses(
                    getArray(classesResult.value, [
                        'classes',
                        'my_classes',
                    ])
                );
            } else {
                console.error(
                    'Could not load classes:',
                    classesResult.reason
                );
            }

            if (subjectsResult.status === 'fulfilled') {
                setSubjects(
                    getArray(subjectsResult.value, [
                        'subjects',
                        'my_subjects',
                    ])
                );
            } else {
                console.error(
                    'Could not load subjects:',
                    subjectsResult.reason
                );
            }

            if (examsResult.status === 'fulfilled') {
                setExaminations(
                    getArray(examsResult.value, [
                        'examinations',
                        'exams',
                    ])
                );
            } else {
                throw examsResult.reason;
            }

            if (
                classesResult.status === 'rejected' ||
                subjectsResult.status === 'rejected'
            ) {
                setError(
                    'Some class or subject information could not be loaded. Check the browser console for details.'
                );
            }
        } catch (err) {
            console.error('Error loading examination data:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load examinations. Please refresh the page.'
            );
        } finally {
            setLoading(false);
        }
    };

    const updateForm = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const updateStudentMark = (studentId, field, value) => {
        setStudents((current) =>
            current.map((student) =>
                student.id === studentId
                    ? {
                          ...student,
                          [field]: value,
                      }
                    : student
            )
        );
    };

    const openCreateForm = () => {
        setError('');
        setSuccess('');
        setForm(INITIAL_FORM);
        setShowCreateForm(true);
        setSelectedExamination(null);
        setStudents([]);
    };

    const loadStudents = async (examination) => {
        if (!examination?.id) {
            return;
        }

        setLoadingStudents(true);
        setError('');
        setSuccess('');
        setSelectedExamination(examination);
        setStudents([]);

        try {
            const response = await api.get(
                `/teacher/examinations/${examination.id}/students`
            );

            const loadedStudents = getArray(response, ['students']);

            setStudents(
                loadedStudents.map((student) => ({
                    ...student,
                    marks_obtained:
                        student.marks_obtained === null ||
                        student.marks_obtained === undefined
                            ? ''
                            : String(student.marks_obtained),
                    remarks: student.remarks || '',
                }))
            );

            setShowCreateForm(false);
        } catch (err) {
            console.error('Error loading examination students:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load students for this examination.'
            );
        } finally {
            setLoadingStudents(false);
        }
    };

    const createExamination = async (event) => {
        event.preventDefault();

        setError('');
        setSuccess('');

        if (
            !form.title.trim() ||
            !form.class_id ||
            !form.subject_id ||
            !form.exam_date ||
            !form.total_marks
        ) {
            setError('Please complete all required examination fields.');
            return;
        }

        const totalMarks = Number(form.total_marks);

        if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
            setError('Total marks must be greater than zero.');
            return;
        }

        setSaving(true);

        try {
            const response = await api.post('/teacher/examinations', {
                ...form,
                title: form.title.trim(),
                class_id: Number(form.class_id),
                subject_id: Number(form.subject_id),
                total_marks: totalMarks,
            });

            const examination = response.data?.examination;

            if (!examination?.id) {
                throw new Error(
                    'The examination was created, but its details were not returned by the server.'
                );
            }

            setExaminations((current) => [
                examination,
                ...current.filter(
                    (item) => item.id !== examination.id
                ),
            ]);

            setShowCreateForm(false);
            setForm(INITIAL_FORM);
            setSuccess('Examination created successfully.');

            await loadStudents(examination);
        } catch (err) {
            console.error('Error creating examination:', err);

            const validationErrors = err.response?.data?.errors;
            const firstValidationError = validationErrors
                ? Object.values(validationErrors).flat()[0]
                : null;

            setError(
                firstValidationError ||
                err.response?.data?.message ||
                err.message ||
                'Failed to create examination.'
            );
        } finally {
            setSaving(false);
        }
    };

    const saveMarks = async () => {
        if (!selectedExamination) {
            setError('Please select an examination first.');
            return;
        }

        if (selectedExamination.status === 'completed') {
            setError(
                'This examination is completed. Its marks cannot be changed.'
            );
            return;
        }

        if (students.length === 0) {
            setError('There are no students to save marks for.');
            return;
        }

        const maximumMarks = Number(selectedExamination.total_marks);

        for (const student of students) {
            if (student.marks_obtained === '') {
                continue;
            }

            const mark = Number(student.marks_obtained);

            if (!Number.isFinite(mark) || mark < 0) {
                setError(
                    `Enter a valid mark for ${getStudentName(student)}.`
                );
                return;
            }

            if (mark > maximumMarks) {
                setError(
                    `${getStudentName(student)} cannot score more than ${maximumMarks}.`
                );
                return;
            }
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await api.put(
                `/teacher/examinations/${selectedExamination.id}/marks`,
                {
                    students: students.map((student) => ({
                        student_id: student.id,
                        marks_obtained:
                            student.marks_obtained === ''
                                ? null
                                : Number(student.marks_obtained),
                        remarks: student.remarks || null,
                    })),
                }
            );

            setSuccess('Student marks saved successfully.');

            // Reload saved marks from the server.
            await loadStudents(selectedExamination);

            // Refresh examination list.
            const response = await api.get('/teacher/examinations');

            setExaminations(
                getArray(response, ['examinations', 'exams'])
            );
        } catch (err) {
            console.error('Error saving marks:', err);

            const validationErrors = err.response?.data?.errors;
            const firstValidationError = validationErrors
                ? Object.values(validationErrors).flat()[0]
                : null;

            setError(
                firstValidationError ||
                err.response?.data?.message ||
                'Failed to save marks. Please try again.'
            );
        } finally {
            setSaving(false);
        }
    };

    const getStudentName = (student) =>
        [
            student.first_name,
            student.middle_name,
            student.last_name,
        ]
            .filter(Boolean)
            .join(' ') || 'Unnamed Student';

    const getGrade = (value) => {
        if (value === '' || value === null || value === undefined) {
            return '-';
        }

        const mark = Number(value);

        if (mark >= 80) return 'A';
        if (mark >= 70) return 'B';
        if (mark >= 60) return 'C';
        if (mark >= 50) return 'D';

        return 'F';
    };

    const validMarks = students.filter(
        (student) =>
            student.marks_obtained !== '' &&
            student.marks_obtained !== null &&
            student.marks_obtained !== undefined
    );

    const totalMarksEntered = validMarks.reduce(
        (total, student) =>
            total + Number(student.marks_obtained),
        0
    );

    const average =
        validMarks.length > 0
            ? (
                  validMarks.reduce(
                      (total, student) =>
                          total +
                          (Number(student.marks_obtained) /
                              Number(selectedExamination.total_marks)) *
                              100,
                      0
                  ) / validMarks.length
              ).toFixed(1)
            : '0.0';

    const selectedClassSubjects = useMemo(() => {
        if (!form.class_id) {
            return subjects;
        }

        const selectedClass = classes.find(
            (item) => String(item.id) === String(form.class_id)
        );

        // If the class endpoint includes its subjects, show only those subjects.
        if (Array.isArray(selectedClass?.subjects)) {
            return subjects.filter((subject) =>
                selectedClass.subjects.some(
                    (item) => String(item.id) === String(subject.id)
                )
            );
        }

        // The backend validates the class-subject relationship on submission.
        return subjects;
    }, [form.class_id, classes, subjects]);

    if (loading) {
        return (
            <div className="teacher-page">
                <div className="teacher-page-header">
                    <div>
                        <h1>Marks & Examinations</h1>
                        <p>Loading your examination data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="teacher-page teacher-marks-page">
            <div className="teacher-page-header">
                <div>
                    <h1>Marks & Examinations</h1>
                    <p>
                        Create examinations, manage student marks and
                        review class performance.
                    </p>
                </div>

                <button
                    type="button"
                    className="teacher-save-marks-button"
                    onClick={openCreateForm}
                >
                    + Create Examination
                </button>
            </div>

            {error && (
                <div className="teacher-marks-message error">
                    {error}
                </div>
            )}

            {success && (
                <div className="teacher-marks-message success">
                    {success}
                </div>
            )}

            {showCreateForm && (
                <div className="teacher-dashboard-card teacher-marks-create-card">
                    <div className="teacher-card-header">
                        <div>
                            <h2>Create Examination</h2>
                            <p>
                                Enter the examination details below.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="teacher-marks-cancel-button"
                            onClick={() => setShowCreateForm(false)}
                        >
                            Cancel
                        </button>
                    </div>

                    <form
                        className="teacher-marks-create-form"
                        onSubmit={createExamination}
                    >
                        <div className="teacher-filter-group">
                            <label htmlFor="exam-title">
                                Examination Title *
                            </label>

                            <input
                                id="exam-title"
                                type="text"
                                value={form.title}
                                onChange={(event) =>
                                    updateForm('title', event.target.value)
                                }
                                placeholder="e.g. Mathematics Midterm Test"
                                maxLength={255}
                                required
                            />
                        </div>

                        <div className="teacher-filter-group">
                            <label htmlFor="exam-class">Class *</label>

                            <select
                                id="exam-class"
                                value={form.class_id}
                                onChange={(event) => {
                                    updateForm(
                                        'class_id',
                                        event.target.value
                                    );
                                    updateForm('subject_id', '');
                                }}
                                required
                            >
                                <option value="">Select class</option>

                                {classes.map((schoolClass) => (
                                    <option
                                        key={schoolClass.id}
                                        value={schoolClass.id}
                                    >
                                        {schoolClass.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="teacher-filter-group">
                            <label htmlFor="exam-subject">Subject *</label>

                            <select
                                id="exam-subject"
                                value={form.subject_id}
                                onChange={(event) =>
                                    updateForm(
                                        'subject_id',
                                        event.target.value
                                    )
                                }
                                required
                            >
                                <option value="">Select subject</option>

                                {selectedClassSubjects.map((subject) => (
                                    <option
                                        key={subject.id}
                                        value={subject.id}
                                    >
                                        {subject.name}
                                        {subject.code
                                            ? ` (${subject.code})`
                                            : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="teacher-filter-group">
                            <label htmlFor="exam-type">
                                Examination Type *
                            </label>

                            <select
                                id="exam-type"
                                value={form.exam_type}
                                onChange={(event) =>
                                    updateForm(
                                        'exam_type',
                                        event.target.value
                                    )
                                }
                                required
                            >
                                {EXAM_TYPES.map((type) => (
                                    <option
                                        key={type.value}
                                        value={type.value}
                                    >
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="teacher-filter-group">
                            <label htmlFor="exam-date">
                                Examination Date *
                            </label>

                            <input
                                id="exam-date"
                                type="date"
                                value={form.exam_date}
                                onChange={(event) =>
                                    updateForm(
                                        'exam_date',
                                        event.target.value
                                    )
                                }
                                required
                            />
                        </div>

                        <div className="teacher-filter-group">
                            <label htmlFor="exam-total">
                                Total Marks *
                            </label>

                            <input
                                id="exam-total"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.total_marks}
                                onChange={(event) =>
                                    updateForm(
                                        'total_marks',
                                        event.target.value
                                    )
                                }
                                required
                            />
                        </div>

                        <div className="teacher-filter-group teacher-marks-description">
                            <label htmlFor="exam-description">
                                Description (Optional)
                            </label>

                            <textarea
                                id="exam-description"
                                value={form.description}
                                onChange={(event) =>
                                    updateForm(
                                        'description',
                                        event.target.value
                                    )
                                }
                                rows="3"
                                placeholder="Additional examination details..."
                            />
                        </div>

                        <div className="teacher-marks-form-actions">
                            <button
                                type="button"
                                className="teacher-marks-cancel-button"
                                onClick={() => setShowCreateForm(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="teacher-save-marks-button"
                                disabled={saving}
                            >
                                {saving
                                    ? 'Creating...'
                                    : 'Create Examination'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="teacher-marks-summary">
                <div className="teacher-marks-summary-card">
                    <span>Total Examinations</span>
                    <strong>{examinations.length}</strong>
                </div>

                <div className="teacher-marks-summary-card">
                    <span>Students in Selected Exam</span>
                    <strong>{students.length}</strong>
                </div>

                <div className="teacher-marks-summary-card">
                    <span>Marks Entered</span>
                    <strong>
                        {validMarks.length}/{students.length}
                    </strong>
                </div>

                <div className="teacher-marks-summary-card">
                    <span>Average (%)</span>
                    <strong>{average}%</strong>
                </div>
            </div>

            <div className="teacher-dashboard-card teacher-marks-card">
                <div className="teacher-card-header">
                    <div>
                        <h2>Your Examinations</h2>
                        <p>
                            Select an examination to view students and
                            enter marks.
                        </p>
                    </div>
                </div>

                {examinations.length === 0 ? (
                    <div className="teacher-marks-empty">
                        <h3>No examinations yet</h3>
                        <p>
                            Create your first examination to start
                            recording student marks.
                        </p>
                    </div>
                ) : (
                    <div className="teacher-marks-table-wrapper">
                        <table className="teacher-marks-table">
                            <thead>
                                <tr>
                                    <th>Examination</th>
                                    <th>Class</th>
                                    <th>Subject</th>
                                    <th>Date</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {examinations.map((examination) => (
                                    <tr key={examination.id}>
                                        <td>
                                            <strong>
                                                {examination.title}
                                            </strong>
                                            <div className="teacher-marks-exam-type">
                                                {EXAM_TYPES.find(
                                                    (type) =>
                                                        type.value ===
                                                        examination.exam_type
                                                )?.label ||
                                                    examination.exam_type}
                                            </div>
                                        </td>

                                        <td>
                                            {examination.school_class?.name ||
                                                examination.schoolClass?.name ||
                                                '—'}
                                        </td>

                                        <td>
                                            {examination.subject?.name ||
                                                '—'}
                                        </td>

                                        <td>
                                            {examination.exam_date
                                                ? String(
                                                      examination.exam_date
                                                  ).slice(0, 10)
                                                : '—'}
                                        </td>

                                        <td>
                                            {examination.total_marks}
                                        </td>

                                        <td>
                                            <span
                                                className={`teacher-marks-status status-${examination.status}`}
                                            >
                                                {examination.status}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="teacher-marks-view-button"
                                                onClick={() =>
                                                    loadStudents(examination)
                                                }
                                                disabled={loadingStudents}
                                            >
                                                {selectedExamination?.id ===
                                                examination.id
                                                    ? 'Selected'
                                                    : 'View Marks'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {loadingStudents && (
                <div className="teacher-marks-loading">
                    Loading students and saved marks...
                </div>
            )}

            {selectedExamination && !loadingStudents && (
                <div className="teacher-dashboard-card teacher-marks-card teacher-marks-students-card">
                    <div className="teacher-card-header">
                        <div>
                            <h2>{selectedExamination.title}</h2>

                            <p>
                                {selectedExamination.school_class?.name ||
                                    selectedExamination.schoolClass?.name ||
                                    'Class'}{' '}
                                {' — '}
                                {selectedExamination.subject?.name ||
                                    'Subject'}
                                {' · Total marks: '}
                                {selectedExamination.total_marks}
                            </p>
                        </div>

                        {selectedExamination.status !== 'completed' && (
                            <button
                                type="button"
                                className="teacher-save-marks-button"
                                onClick={saveMarks}
                                disabled={saving || students.length === 0}
                            >
                                {saving ? 'Saving...' : 'Save Marks'}
                            </button>
                        )}
                    </div>

                    {students.length === 0 ? (
                        <div className="teacher-marks-empty">
                            <h3>No students found</h3>
                            <p>
                                No students were found in this class.
                                Check that the students are assigned to
                                the selected class in the school system.
                            </p>
                        </div>
                    ) : (
                        <div className="teacher-marks-table-wrapper">
                            <table className="teacher-marks-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student</th>
                                        <th>Admission No.</th>
                                        <th>
                                            Marks /{' '}
                                            {selectedExamination.total_marks}
                                        </th>
                                        <th>Percentage</th>
                                        <th>Grade</th>
                                        <th>Remarks</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {students.map((student, index) => {
                                        const mark =
                                            student.marks_obtained;

                                        const percentage =
                                            mark !== '' &&
                                            mark !== null &&
                                            mark !== undefined
                                                ? (
                                                      (Number(mark) /
                                                          Number(
                                                              selectedExamination.total_marks
                                                          )) *
                                                      100
                                                  ).toFixed(1)
                                                : '—';

                                        const grade =
                                            percentage === '—'
                                                ? '-'
                                                : getGrade(percentage);

                                        return (
                                            <tr key={student.id}>
                                                <td>{index + 1}</td>

                                                <td>
                                                    <strong>
                                                        {getStudentName(
                                                            student
                                                        )}
                                                    </strong>
                                                </td>

                                                <td>
                                                    {student.admission_number ||
                                                        '—'}
                                                </td>

                                                <td>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={
                                                            selectedExamination.total_marks
                                                        }
                                                        step="0.01"
                                                        value={mark}
                                                        disabled={
                                                            selectedExamination.status ===
                                                            'completed'
                                                        }
                                                        onChange={(event) =>
                                                            updateStudentMark(
                                                                student.id,
                                                                'marks_obtained',
                                                                event.target
                                                                    .value
                                                            )
                                                        }
                                                        className="teacher-marks-input"
                                                        aria-label={`Marks for ${getStudentName(
                                                            student
                                                        )}`}
                                                    />
                                                </td>

                                                <td>{percentage}%</td>

                                                <td>
                                                    <span
                                                        className={`teacher-grade grade-${grade.toLowerCase()}`}
                                                    >
                                                        {grade}
                                                    </span>
                                                </td>

                                                <td>
                                                    <input
                                                        type="text"
                                                        value={
                                                            student.remarks
                                                        }
                                                        disabled={
                                                            selectedExamination.status ===
                                                            'completed'
                                                        }
                                                        onChange={(event) =>
                                                            updateStudentMark(
                                                                student.id,
                                                                'remarks',
                                                                event.target
                                                                    .value
                                                            )
                                                        }
                                                        className="teacher-marks-remarks-input"
                                                        placeholder="Optional"
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

                    {students.length > 0 && (
                        <div className="teacher-marks-footer">
                            <span>
                                Total marks entered:{' '}
                                <strong>{totalMarksEntered}</strong>
                            </span>

                            <span>
                                Students marked:{' '}
                                <strong>
                                    {validMarks.length}/{students.length}
                                </strong>
                            </span>

                            {selectedExamination.status !==
                                'completed' && (
                                <button
                                    type="button"
                                    className="teacher-save-marks-button"
                                    onClick={saveMarks}
                                    disabled={saving}
                                >
                                    {saving
                                        ? 'Saving...'
                                        : 'Save Marks'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Marks;