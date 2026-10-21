
import { useEffect, useState } from 'react';
import api from '../../api/api';
import '../styles/ExaminationSubmissionsPage.css';

function ExaminationSubmissionsPage() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [rejectingSubmission, setRejectingSubmission] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const loadSubmissions = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/school/examination-submissions');

            const data = response.data;
            setSubmissions(Array.isArray(data) ? data : data.data || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Imeshindikana kupakia examination submissions.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubmissions();
    }, []);

    const reviewSubmission = async (submissionId, decision, reason = '') => {
        try {
            setProcessingId(submissionId);
            setError('');
            setSuccess('');

            await api.post(
                `/school/examination-submissions/${submissionId}/review`,
                {
                    decision,
                    reason,
                }
            );

            setSuccess(
                decision === 'approved'
                    ? 'Marks zimeidhinishwa kikamilifu.'
                    : 'Marks zimekataliwa. Mwalimu anaweza kufanya marekebisho.'
            );

            setRejectingSubmission(null);
            setRejectionReason('');

            await loadSubmissions();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Imeshindikana kuhifadhi uamuzi wako.'
            );
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (date) => {
        if (!date) return '—';

        return new Date(date).toLocaleString();
    };

    if (loading) {
        return (
            <div className="exam-submissions-page">
                <div className="exam-submissions-loading">
                    Inapakia examination submissions...
                </div>
            </div>
        );
    }

    return (
        <div className="exam-submissions-page">
            <div className="exam-submissions-header">
                <div>
                    <h1>Examination Submissions</h1>
                    <p>
                        Pitia marks zilizowasilishwa na walimu,
                        kisha approve au reject.
                    </p>
                </div>

                <button
                    type="button"
                    className="exam-refresh-btn"
                    onClick={loadSubmissions}
                >
                    Refresh
                </button>
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

            <div className="exam-submissions-summary">
                <div className="exam-summary-card">
                    <span>Total Submissions</span>
                    <strong>{submissions.length}</strong>
                </div>

                <div className="exam-summary-card">
                    <span>Waiting for Review</span>
                    <strong>
                        {
                            submissions.filter(
                                item => item.status === 'submitted'
                            ).length
                        }
                    </strong>
                </div>

                <div className="exam-summary-card">
                    <span>Approved</span>
                    <strong>
                        {
                            submissions.filter(
                                item => item.status === 'approved'
                            ).length
                        }
                    </strong>
                </div>

                <div className="exam-summary-card">
                    <span>Rejected</span>
                    <strong>
                        {
                            submissions.filter(
                                item => item.status === 'rejected'
                            ).length
                        }
                    </strong>
                </div>
            </div>

            <div className="exam-submissions-table-card">
                <div className="exam-submissions-table-header">
                    <h2>Submitted Marks</h2>
                    <span>{submissions.length} records</span>
                </div>

                {submissions.length === 0 ? (
                    <div className="exam-submissions-empty">
                        <h3>No submissions found</h3>
                        <p>
                            Bado hakuna marks zilizowasilishwa na walimu,
                            au hakuna submissions zinazopatikana kwa akaunti hii.
                        </p>
                    </div>
                ) : (
                    <div className="exam-submissions-table-wrapper">
                        <table className="exam-submissions-table">
                            <thead>
                                <tr>
                                    <th>Examination</th>
                                    <th>Class</th>
                                    <th>Subject</th>
                                    <th>Teacher</th>
                                    <th>Students Marked</th>
                                    <th>Status</th>
                                    <th>Submitted At</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {submissions.map((item) => {
                                    const assignment = item.class_subject || item.classSubject || {};
                                    const examination = item.examination || assignment.examination || {};
                                    const schoolClass = assignment.school_class || assignment.schoolClass || {};
                                    const subject = assignment.subject || {};
                                    const teacher = assignment.teacher || {};
                                    const submitter = item.submitted_by || item.submittedBy || {};

                                    const submissionId = item.id;
                                    const isProcessing = processingId === submissionId;

                                    return (
                                        <tr key={submissionId}>
                                            <td>
                                                <strong>
                                                    {examination.title || 'Examination'}
                                                </strong>
                                                <small>
                                                    {examination.exam_type || ''}
                                                </small>
                                            </td>

                                            <td>
                                                {schoolClass.name || '—'}
                                            </td>

                                            <td>
                                                {subject.name || '—'}
                                            </td>

                                            <td>
                                                {teacher.name || submitter.name || '—'}
                                            </td>

                                            <td>
                                                {item.marks_count ?? item.marks?.length ?? 0}
                                            </td>

                                            <td>
                                                <span
                                                    className={`exam-status-badge status-${item.status}`}
                                                >
                                                    {item.status}
                                                </span>
                                            </td>

                                            <td>
                                                {formatDate(item.submitted_at)}
                                            </td>

                                            <td>
                                                {item.status === 'submitted' ? (
                                                    <div className="exam-action-buttons">
                                                        <button
                                                            type="button"
                                                            className="exam-approve-btn"
                                                            disabled={isProcessing}
                                                            onClick={() =>
                                                                reviewSubmission(
                                                                    submissionId,
                                                                    'approved'
                                                                )
                                                            }
                                                        >
                                                            {isProcessing
                                                                ? 'Processing...'
                                                                : 'Approve'}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="exam-reject-btn"
                                                            disabled={isProcessing}
                                                            onClick={() => {
                                                                setRejectingSubmission(item);
                                                                setRejectionReason('');
                                                            }}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="exam-reviewed-label">
                                                        {item.status === 'approved'
                                                            ? 'Approved'
                                                            : 'Reviewed'}
                                                    </span>
                                                )}

                                                {item.latest_review?.reason && (
                                                    <p className="exam-review-reason">
                                                        Reason: {item.latest_review.reason}
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {rejectingSubmission && (
                <div className="exam-modal-overlay">
                    <div className="exam-rejection-modal">
                        <h2>Reject Examination Marks</h2>

                        <p>
                            Tafadhali eleza sababu ya kukataa marks hizi.
                            Mwalimu atahitaji kufanya marekebisho.
                        </p>

                        <label htmlFor="rejection-reason">
                            Reason for rejection
                        </label>

                        <textarea
                            id="rejection-reason"
                            value={rejectionReason}
                            onChange={(event) =>
                                setRejectionReason(event.target.value)
                            }
                            placeholder="Andika sababu ya kukataa marks..."
                            rows={5}
                        />

                        <div className="exam-modal-actions">
                            <button
                                type="button"
                                className="exam-cancel-btn"
                                onClick={() => {
                                    setRejectingSubmission(null);
                                    setRejectionReason('');
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="exam-reject-btn"
                                disabled={
                                    !rejectionReason.trim() ||
                                    processingId === rejectingSubmission.id
                                }
                                onClick={() =>
                                    reviewSubmission(
                                        rejectingSubmission.id,
                                        'rejected',
                                        rejectionReason.trim()
                                    )
                                }
                            >
                                {processingId === rejectingSubmission.id
                                    ? 'Processing...'
                                    : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExaminationSubmissionsPage;
