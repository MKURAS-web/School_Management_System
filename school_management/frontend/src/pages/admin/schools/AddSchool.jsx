import { useState } from 'react';
import api from '../../../api/api';

function AddSchool({ onSchoolAdded }) {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        location: '',
        level: '',
        admin_name: '',
        admin_email: '',
        admin_password: '',
        admin_password_confirmation: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [adminCredentials, setAdminCredentials] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.post('/schools', formData);

            setSuccess('School added successfully.');
            setAdminCredentials(response.data.school_admin || null);

            setFormData({
                name: '',
                code: '',
                location: '',
                level: '',
                admin_name: '',
                admin_email: '',
                admin_password: '',
                admin_password_confirmation: '',
            });

            if (onSchoolAdded) {
                onSchoolAdded(response.data.school);
            }
        } catch (error) {
            console.error(error);

            if (error.response?.data?.errors) {
                const validationErrors = Object.values(
                    error.response.data.errors
                )
                    .flat()
                    .join(' ');

                setError(validationErrors);
            } else {
                setError('Failed to add school.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Add School</h2>

            {success && <p>{success}</p>}

            {adminCredentials && (
                <div>
                    <h4>School Admin Credentials</h4>
                    <p>Email: {adminCredentials.email}</p>
                    {adminCredentials.password && (
                        <p>Password: {adminCredentials.password}</p>
                    )}
                    <p>Please copy these credentials and share them securely.</p>
                </div>
            )}

            {error && <p>{error}</p>}

            <form onSubmit={handleSubmit}>
                <div>
                    <label>School Name</label>

                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <br />

                <div>
                    <label>School Code</label>

                    <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Location</label>

                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                    />
                </div>

                <br />

                <div>
                    <label>School Level</label>

                    <select
                        name="level"
                        value={formData.level}
                        onChange={handleChange}
                        required
                    >
                        <option value="">
                            -- Select School Level --
                        </option>

                        <option value="O-Level">
                            O-Level Only
                        </option>

                        <option value="Advanced Level">
                            Advanced Level Only
                        </option>

                        <option value="O-Level & Advanced Level">
                            O-Level & Advanced Level
                        </option>
                    </select>
                </div>

                <br />

                <h3>Optional School Admin Details</h3>

                <div>
                    <label>Admin Name</label>

                    <input
                        type="text"
                        name="admin_name"
                        value={formData.admin_name}
                        onChange={handleChange}
                    />
                </div>

                <br />

                <div>
                    <label>Admin Email</label>

                    <input
                        type="email"
                        name="admin_email"
                        value={formData.admin_email}
                        onChange={handleChange}
                    />
                </div>

                <br />

                <div>
                    <label>Admin Password</label>

                    <input
                        type="password"
                        name="admin_password"
                        value={formData.admin_password}
                        onChange={handleChange}
                    />
                </div>

                <br />

                <div>
                    <label>Confirm Admin Password</label>

                    <input
                        type="password"
                        name="admin_password_confirmation"
                        value={formData.admin_password_confirmation}
                        onChange={handleChange}
                    />
                </div>

                <br />

                <button type="submit" disabled={loading}>
                    {loading ? 'Adding...' : 'Add School'}
                </button>
            </form>
        </div>
    );
}

export default AddSchool;