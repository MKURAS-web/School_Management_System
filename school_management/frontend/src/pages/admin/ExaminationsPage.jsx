import '../styles/ExaminationsPage.css';
import { useEffect, useState } from 'react';
import api from '../../api/api';

const emptyAssignment = {
    class_id: '',
    subject_id: '',
    maximum_marks: 100,
};

function getList(response) {
    const result = response?.data?.data ?? response?.data;

    if (Array.isArray(result)) {
        return result;
    }

    if (Array.isArray(result?.data)) {
        return result.data;
    }

    return [];
}

function ExaminationsPage() {
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [examinations, setExaminations] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [selectedClassIds, setSelectedClassIds] = useState([]);
    const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);

    const [form, setForm] = useState({
        title: '',
        exam_type: 'midterm',
        exam_date: '',
        academic_year: '',
        submission_deadline: '',
        description: '',
        assignments: [],
    });

    const updateField = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    /*
     * Generate combinations from selected classes and subjects.
     * Keep the maximum marks already entered for combinations
     * that remain selected.
     */
    const generateAssignments = (
        classIds,
        subjectIds,
        previousAssignments = form.assignments
    ) => {
        const assignments = [];

        classIds.forEach((classId) => {
            subjectIds.forEach((subjectId) => {
                const existing = previousAssignments.find(
                    (assignment) =>
                        String(assignment.class_id) === String(classId) &&
                        String(assignment.subject_id) === String(subjectId)
                );

                assignments.push({
                    class_id: String(classId),
                    subject_id: String(subjectId),
                    maximum_marks: existing
                        ? existing.maximum_marks
                        : 100,
                });
            });
        });

        setForm((previous) => ({
            ...previous,
            assignments,
        }));
    };

    const toggleClass = (classId) => {
        const id = String(classId);

        const nextClassIds = selectedClassIds.includes(id)
            ? selectedClassIds.filter((item) => item !== id)
            : [...selectedClassIds, id];

        setSelectedClassIds(nextClassIds);

        generateAssignments(
            nextClassIds,
            selectedSubjectIds
        );
    };

    const toggleSubject = (subjectId) => {
        const id = String(subjectId);

        const nextSubjectIds = selectedSubjectIds.includes(id)
            ? selectedSubjectIds.filter((item) => item !== id)
            : [...selectedSubjectIds, id];

        setSelectedSubjectIds(nextSubjectIds);

        generateAssignments(
            selectedClassIds,
            nextSubjectIds
        );
    };

    const updateAssignment = (index, field, value) => {
        setForm((previous) => ({
            ...previous,
            assignments: previous.assignments.map((assignment, i) =>
                i === index
                    ? { ...assignment, [field]: value }
                    : assignment
            ),
        }));
    };

    const loadData = async () => {
        setLoading(true);
        setError('');

        try {
            const [
                classesResponse,
                subjectsResponse,
                examsResponse,
            ] = await Promise.all([
                api.get('/school/classes'),
                api.get('/school/subjects'),
                api.get('/school/examinations'),
            ]);

            setClasses(getList(classesResponse));
            setSubjects(getList(subjectsResponse));
            setExaminations(getList(examsResponse));
        } catch (err) {
            console.error('Failed to load examination data:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load examination data. Please check your login and try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setForm({
            title: '',
            exam_type: 'midterm',
            exam_date: '',
            academic_year: '',
            submission_deadline: '',
            description: '',
            assignments: [],
        });

        setSelectedClassIds([]);
        setSelectedSubjectIds([]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');
        setSuccess('');

        if (!form.title.trim()) {
            setError('Please enter the examination title.');
            return;
        }

        if (!form.exam_date) {
            setError('Please select the examination date.');
            return;
        }

        if (selectedClassIds.length === 0) {
            setError('Please select at least one class.');
            return;
        }

        if (selectedSubjectIds.length === 0) {
            setError('Please select at least one subject.');
            return;
        }

        if (form.assignments.length === 0) {
            setError('Please select classes and subjects.');
            return;
        }

        for (let i = 0; i < form.assignments.length; i++) {
            const assignment = form.assignments[i];

            if (
                !assignment.class_id ||
                !assignment.subject_id ||
                assignment.maximum_marks === '' ||
                !Number.isFinite(Number(assignment.maximum_marks)) ||
                Number(assignment.maximum_marks) <= 0
            ) {
                setError(
                    `Please enter valid maximum marks for assignment ${i + 1}.`
                );
                return;
            }
        }

        const payload = {
            title: form.title.trim(),
            exam_type: form.exam_type,
            exam_date: form.exam_date,
            academic_year: form.academic_year || null,
            submission_deadline: form.submission_deadline || null,
            description: form.description.trim() || null,

            assignments: form.assignments.map((assignment) => ({
                class_id: Number(assignment.class_id),
                subject_id: Number(assignment.subject_id),
                maximum_marks: Number(assignment.maximum_marks),
            })),
        };

        setSaving(true);

        try {
            const response = await api.post(
                '/school/examinations',
                payload
            );

            setSuccess(
                response.data?.message ||
                'Examination created successfully.'
            );

            resetForm();

            await loadData();
        } catch (err) {
            console.error('Failed to create examination:', err);

            const validationErrors = err.response?.data?.errors;

            if (validationErrors) {
                const firstError = Object.values(validationErrors).flat()[0];

                setError(
                    firstError ||
                    'Please check the information entered.'
                );
            } else {
                setError(
                    err.response?.data?.message ||
                    'Failed to create examination. Please try again.'
                );
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="examinations-page">
                <div className="exam-loading">
                    Loading examination data...
                </div>
            </div>
        );
    }

    return (
        <div className="examinations-page">
            <div className="exam-page-header">
                <div>
                    <span className="exam-eyebrow">
                        ACADEMIC MANAGEMENT
                    </span>

                    <h1>Examinations</h1>

                    <p>
                        Create examinations and assign classes and subjects.
                    </p>
                </div>

                <div className="exam-count">
                    <span>Total examinations</span>
                    <strong>{examinations.length}</strong>
                </div>
            </div>

            {error && (
                <div className="exam-alert exam-alert-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="exam-alert exam-alert-success">
                    {success}
                </div>
            )}

            <form className="exam-form" onSubmit={handleSubmit}>
                <div className="exam-section-heading">
                    <div>
                        <h2>Create Examination</h2>
                        <p>Enter examination details below.</p>
                    </div>
                </div>

                <div className="exam-form-grid">
                    <div className="exam-field exam-field-full">
                        <label htmlFor="title">
                            Examination title *
                        </label>

                        <input
                            id="title"
                            name="title"
                            value={form.title}
                            onChange={updateField}
                            placeholder="e.g. Midterm Examination"
                            maxLength={255}
                            required
                        />
                    </div>

                    <div className="exam-field">
                        <label htmlFor="exam_type">
                            Examination type *
                        </label>

                        <select
                            id="exam_type"
                            name="exam_type"
                            value={form.exam_type}
                            onChange={updateField}
                            required
                        >
                            <option value="midterm">Midterm</option>
                            <option value="annual">Annual</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="exam-field">
                        <label htmlFor="exam_date">
                            Examination date *
                        </label>

                        <input
                            id="exam_date"
                            type="date"
                            name="exam_date"
                            value={form.exam_date}
                            onChange={updateField}
                            required
                        />
                    </div>

                    <div className="exam-field">
                        <label htmlFor="academic_year">
                            Academic year
                        </label>

                        <input
                            id="academic_year"
                            name="academic_year"
                            value={form.academic_year}
                            onChange={updateField}
                            placeholder="e.g. 2026"
                            maxLength={20}
                        />
                    </div>

                    <div className="exam-field">
                        <label htmlFor="submission_deadline">
                            Marks submission deadline
                        </label>

                        <input
                            id="submission_deadline"
                            type="datetime-local"
                            name="submission_deadline"
                            value={form.submission_deadline}
                            onChange={updateField}
                        />

                        <small>Optional</small>
                    </div>

                    <div className="exam-field exam-field-full">
                        <label htmlFor="description">
                            Description
                        </label>

                        <textarea
                            id="description"
                            name="description"
                            value={form.description}
                            onChange={updateField}
                            placeholder="Additional examination information..."
                            rows={3}
                        />
                    </div>
                </div>

                <div className="exam-section-heading exam-assignment-heading">
                    <div>
                        <h2>Class and Subject Assignments</h2>

                        <p>
                            Select one or more classes and subjects.
                            The system will generate their combinations
                            so you can set maximum marks for each one.
                            Teachers will be assigned automatically.
                        </p>
                    </div>
                </div>

                <div className="exam-form-grid">
                    <div className="exam-field">
                        <label>Select classes *</label>

                        <div className="exam-multiselect">
                            {classes.length === 0 ? (
                                <p>No classes available.</p>
                            ) : (
                                classes.map((schoolClass) => (
                                    <label
                                        className="exam-checkbox-option"
                                        key={schoolClass.id}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedClassIds.includes(
                                                String(schoolClass.id)
                                            )}
                                            onChange={() =>
                                                toggleClass(schoolClass.id)
                                            }
                                        />

                                        <span>{schoolClass.name}</span>
                                    </label>
                                ))
                            )}
                        </div>

                        <small>
                            {selectedClassIds.length} class(es) selected
                        </small>
                    </div>

                    <div className="exam-field">
                        <label>Select subjects *</label>

                        <div className="exam-multiselect">
                            {subjects.length === 0 ? (
                                <p>No subjects available.</p>
                            ) : (
                                subjects.map((subject) => (
                                    <label
                                        className="exam-checkbox-option"
                                        key={subject.id}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedSubjectIds.includes(
                                                String(subject.id)
                                            )}
                                            onChange={() =>
                                                toggleSubject(subject.id)
                                            }
                                        />

                                        <span>
                                            {subject.name}
                                            {subject.code
                                                ? ` (${subject.code})`
                                                : ''}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>

                        <small>
                            {selectedSubjectIds.length} subject(s) selected
                        </small>
                    </div>
                </div>

                <div className="exam-assignment-list">
                    <div className="exam-section-heading">
                        <div>
                            <h2>Generated Assignments</h2>
                            <p>
                                Set the maximum marks for each class and
                                subject combination.
                            </p>
                        </div>
                    </div>

                    {form.assignments.length === 0 ? (
                        <div className="exam-empty">
                            Select at least one class and one subject
                            to generate assignments.
                        </div>
                    ) : (
                        form.assignments.map((assignment, index) => {
                            const schoolClass = classes.find(
                                (item) =>
                                    String(item.id) ===
                                    String(assignment.class_id)
                            );

                            const subject = subjects.find(
                                (item) =>
                                    String(item.id) ===
                                    String(assignment.subject_id)
                            );

                            return (
                                <div
                                    className="exam-assignment-card"
                                    key={`${assignment.class_id}-${assignment.subject_id}`}
                                >
                                    <div className="exam-assignment-title">
                                        <strong>
                                            Assignment {index + 1}
                                        </strong>
                                    </div>

                                    <div className="exam-form-grid">
                                        <div className="exam-field">
                                            <label>Class</label>

                                            <input
                                                value={
                                                    schoolClass?.name ||
                                                    'Unknown class'
                                                }
                                                readOnly
                                            />
                                        </div>

                                        <div className="exam-field">
                                            <label>Subject</label>

                                            <input
                                                value={
                                                    subject
                                                        ? `${subject.name}${
                                                            subject.code
                                                                ? ` (${subject.code})`
                                                                : ''
                                                        }`
                                                        : 'Unknown subject'
                                                }
                                                readOnly
                                            />
                                        </div>

                                        <div className="exam-field">
                                            <label>
                                                Maximum marks *
                                            </label>

                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                max="999999.99"
                                                value={assignment.maximum_marks}
                                                onChange={(event) =>
                                                    updateAssignment(
                                                        index,
                                                        'maximum_marks',
                                                        event.target.value
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="exam-form-footer">
                    <span>
                        {form.assignments.length} subject assignment(s)
                    </span>

                    <button
                        type="submit"
                        className="exam-button exam-button-primary"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Examination'}
                    </button>
                </div>
            </form>

            <section className="exam-list-section">
                <div className="exam-section-heading">
                    <div>
                        <h2>Existing Examinations</h2>

                        <p>
                            Examinations created for your school.
                        </p>
                    </div>
                </div>

                {examinations.length === 0 ? (
                    <div className="exam-empty">
                        No examinations found yet.
                    </div>
                ) : (
                    <div className="exam-table-wrapper">
                        <table className="exam-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Date</th>
                                    <th>Assignments</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {examinations.map((exam) => (
                                    <tr key={exam.id}>
                                        <td>
                                            <strong>{exam.title}</strong>

                                            {exam.academic_year && (
                                                <small className="exam-subtext">
                                                    {exam.academic_year}
                                                </small>
                                            )}
                                        </td>

                                        <td>
                                            {exam.exam_type
                                                ? exam.exam_type.charAt(0).toUpperCase() +
                                                  exam.exam_type.slice(1)
                                                : '—'}
                                        </td>

                                        <td>
                                            {exam.exam_date
                                                ? String(exam.exam_date).slice(0, 10)
                                                : '—'}
                                        </td>

                                        <td>
                                            {exam.class_subjects?.length ??
                                                exam.classSubjects?.length ??
                                                0}
                                        </td>

                                        <td>
                                            <span className="exam-status">
                                                {exam.status || 'draft'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default ExaminationsPage;
