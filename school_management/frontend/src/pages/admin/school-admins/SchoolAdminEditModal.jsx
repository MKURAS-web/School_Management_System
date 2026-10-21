import { useState, useEffect } from 'react';
import api from '../../../api/api';
import Modal from '../../../components/ui/Modal';
import ModalFooter from '../../../components/ui/ModalFooter';

function SchoolAdminEditModal({ open, admin, schools, assignedSchoolIds = [], onClose, onSaved }) {
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', school_id: '' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState('');

    const occupiedSchoolIds = new Set(
        assignedSchoolIds
            .map((id) => Number(id))
            .filter((id) => !Number.isNaN(id))
            .filter((id) => Number(id) !== Number(admin?.school_id))
    );

    const availableSchools = schools.filter((school) => {
        const schoolId = Number(school.id);
        const isCurrentSchool = String(school.id) === String(form.school_id || admin?.school_id);
        return isCurrentSchool || !occupiedSchoolIds.has(schoolId);
    });

    useEffect(() => {
        if (admin) {
            setForm({
                name: admin.name || '',
                email: admin.email || '',
                password: '',
                password_confirmation: '',
                school_id: admin.school_id || '',
            });
            setErrors('');
        }
    }, [admin]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setErrors('');

        try {
            const res = await api.put(`/school-admins/${admin.id}`, form);

            onSaved(res.data.user);
            onClose();
        } catch (err) {
            console.error(err);
            if (err.response?.data?.errors) setErrors(Object.values(err.response.data.errors).flat().join(' '));
            else if (err.response?.data?.message) setErrors(err.response.data.message);
            else setErrors('Failed to update admin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} title="Edit School Admin" onClose={onClose}>
            {errors && <p className="form-error">{errors}</p>}

            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-row">
                    <label>Name</label>
                    <input name="name" value={form.name} onChange={handleChange} required />
                </div>

                <div className="form-row">
                    <label>Email</label>
                    <input name="email" value={form.email} onChange={handleChange} type="email" required />
                </div>

                <div className="form-row">
                    <label>New Password (leave blank to keep)</label>
                    <input name="password" value={form.password} onChange={handleChange} type="password" />
                </div>

                <div className="form-row">
                    <label>Confirm Password</label>
                    <input name="password_confirmation" value={form.password_confirmation} onChange={handleChange} type="password" />
                </div>

                <div className="form-row">
                    <label>School</label>
                    <select name="school_id" value={form.school_id} onChange={handleChange} required disabled={!availableSchools.length}>
                        <option value="">{availableSchools.length ? '-- Select School --' : 'No schools available'}</option>
                        {availableSchools.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                    </select>
                    {!availableSchools.length && (
                        <small style={{ display: 'block', marginTop: 6, color: '#8a4b12' }}>
                            No school is available for reassignment because all other schools already have an admin.
                        </small>
                    )}
                </div>

                <ModalFooter>
                    <button type="submit" className="primary-button" disabled={loading || !availableSchools.length}>{loading ? 'Saving...' : 'Save'}</button>
                    <button type="button" onClick={onClose} style={{ marginLeft: 8 }}>Cancel</button>
                </ModalFooter>
            </form>
        </Modal>
    );
}

export default SchoolAdminEditModal;
