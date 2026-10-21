import { useEffect, useState } from 'react';
import api from '../../../api/api';

function EditSchool({ school, onSchoolUpdated, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        location: '',
        level: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (school) {
            setFormData({
                name: school.name || '',
                code: school.code || '',
                location: school.location || '',
                level: school.level || '',
            });
        }
    }, [school]);

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
            const response = await api.put(
                `/schools/${school.id}`,
                formData
            );

            setSuccess('School updated successfully.');

            if (onSchoolUpdated) {
                onSchoolUpdated(response.data.school);
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
                setError('Failed to update school.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!school) {
        return null;
    }

    return (
        <div>
            <h2>Edit School</h2>

            {success && <p>{success}</p>}

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

                <button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update School'}
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancel
                </button>
            </form>
        </div>
    );
}

export default EditSchool;