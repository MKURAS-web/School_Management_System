import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import ModalFooter from '../../../components/ui/ModalFooter';
import api from '../../../api/api';

function SchoolAdminCreateModal({ open, onClose, onSaved, schools, assignedSchoolIds = [] }) {
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', school_id: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const occupiedSchoolIds = new Set(
        assignedSchoolIds
            .map((id) => Number(id))
            .filter((id) => !Number.isNaN(id))
    );

    const availableSchools = schools.filter((school) => !occupiedSchoolIds.has(Number(school.id)));

    useEffect(() => {
        if (!open) setForm({ name: '', email: '', password: '', password_confirmation: '', school_id: '' });
    }, [open]);

    if (!open) return null;

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError('');

        try {
            const res = await api.post('/school-admins', form);

            onSaved(res.data.user);
            onClose();
        } catch (err) {
            console.error(err);
            if (err.response?.data?.errors) setError(Object.values(err.response.data.errors).flat().join(' '));
            else setError(err.response?.data?.message || 'Failed to create admin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} title="Add School Admin" onClose={onClose}>
            {error && <p className="form-error">{error}</p>}

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
                    <label>Password</label>
                    <input name="password" value={form.password} onChange={handleChange} type="password" required />
                </div>

                <div className="form-row">
                    <label>Confirm Password</label>
                    <input name="password_confirmation" value={form.password_confirmation} onChange={handleChange} type="password" required />
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
                            All schools already have a school admin assigned.
                        </small>
                    )}
                </div>

                <ModalFooter>
                    <button type="button" className="cancel-button" onClick={onClose} disabled={loading}>Cancel</button>
                    <button type="submit" className="primary-button" disabled={loading}>{loading ? 'Creating...' : 'Create Admin'}</button>
                </ModalFooter>
            </form>
        </Modal>
    );
}

export default SchoolAdminCreateModal;
