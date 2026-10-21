import Modal from '../../../components/ui/Modal';
import ModalFooter from '../../../components/ui/ModalFooter';

function StudentViewModal({ student, onClose }) {

    if (!student) {
        return null;
    }

    const fullName = [
        student.first_name,
        student.middle_name,
        student.last_name,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <Modal open={Boolean(student)} title="Student Details" onClose={onClose}>

                {/* =========================
                    STUDENT PROFILE
                ========================= */}

                <div className="student-profile">

                    <div className="student-avatar">
                        {student.first_name?.charAt(0)}
                        {student.last_name?.charAt(0)}
                    </div>

                    <div className="student-profile-info">

                        <h3>
                            {fullName}
                        </h3>

                        <p>
                            Admission No:{" "}
                            <strong>
                                {student.admission_number}
                            </strong>
                        </p>

                    </div>

                </div>


                {/* =========================
                    INFORMATION
                ========================= */}

                <div className="student-details-grid">


                    {/* ADMISSION NUMBER */}

                    <div className="student-detail-item">

                        <span>
                            Admission Number
                        </span>

                        <strong>
                            {student.admission_number || '-'}
                        </strong>

                    </div>


                    {/* FIRST NAME */}

                    <div className="student-detail-item">

                        <span>
                            First Name
                        </span>

                        <strong>
                            {student.first_name || '-'}
                        </strong>

                    </div>


                    {/* MIDDLE NAME */}

                    <div className="student-detail-item">

                        <span>
                            Middle Name
                        </span>

                        <strong>
                            {student.middle_name || '-'}
                        </strong>

                    </div>


                    {/* LAST NAME */}

                    <div className="student-detail-item">

                        <span>
                            Last Name
                        </span>

                        <strong>
                            {student.last_name || '-'}
                        </strong>

                    </div>


                    {/* GENDER */}

                    <div className="student-detail-item">

                        <span>
                            Gender
                        </span>

                        <strong>
                            {student.gender || '-'}
                        </strong>

                    </div>


                    {/* DATE OF BIRTH */}

                    <div className="student-detail-item">

                        <span>
                            Date of Birth
                        </span>

                        <strong>
                            {student.date_of_birth || '-'}
                        </strong>

                    </div>


                    {/* PHONE */}

                    <div className="student-detail-item">

                        <span>
                            Phone
                        </span>

                        <strong>
                            {student.phone || '-'}
                        </strong>

                    </div>


                    {/* ADDRESS */}

                    <div className="student-detail-item">

                        <span>
                            Address
                        </span>

                        <strong>
                            {student.address || '-'}
                        </strong>

                    </div>

                    {/* CLASS */}

                    <div className="student-detail-item">

                        <span>
                            Class
                        </span>

                        <strong>
                            {student.class_name || '-'}
                        </strong>

                    </div>

                    {/* STREAM */}

                    <div className="student-detail-item">

                        <span>
                            Stream
                        </span>

                        <strong>
                            {student.stream || '-'}
                        </strong>

                    </div>

                    {/* ACADEMIC INFO */}

                    <div className="student-detail-item">

                        <span>
                            Academic Info
                        </span>

                        <strong>
                            {student.academic_info || 'Not recorded yet'}
                        </strong>

                    </div>

                    {/* STUDENT ATTENDANCE */}

                    <div className="student-detail-item">

                        <span>
                            Attendance
                        </span>

                        <strong>
                            {student.attendance_summary || 'No attendance record'}
                        </strong>

                    </div>

                    {/* STUDENT RESULTS */}

                    <div className="student-detail-item">

                        <span>
                            Results
                        </span>

                        <strong>
                            {student.results_summary || 'No results uploaded'}
                        </strong>

                    </div>

                    {/* FEE / PAYMENT */}

                    <div className="student-detail-item">

                        <span>
                            Fee / Payment
                        </span>

                        <strong>
                            {student.fee_summary || 'No fee record'}
                        </strong>

                    </div>


                    {/* CREATED */}

                    <div className="student-detail-item">

                        <span>
                            Registered On
                        </span>

                        <strong>
                            {student.created_at
                                ? new Date(
                                    student.created_at
                                ).toLocaleDateString()
                                : '-'
                            }
                        </strong>

                    </div>


                    {/* UPDATED */}

                    <div className="student-detail-item">

                        <span>
                            Last Updated
                        </span>

                        <strong>
                            {student.updated_at
                                ? new Date(
                                    student.updated_at
                                ).toLocaleDateString()
                                : '-'
                            }
                        </strong>

                    </div>

                </div>


                {/* =========================
                    FOOTER
                ========================= */}

                <ModalFooter>
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </ModalFooter>

        </Modal>
    );
}

export default StudentViewModal;