import { useEffect, useState } from 'react';
import api from '../../../api/api';

function SystemSettings() {
    const [settings, setSettings] = useState([]);
    const [form, setForm] = useState({ key: '', value: '', description: '' });
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [activeAction, setActiveAction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');

    const fetchSettings = async () => {
        try {
            const res = await api.get('/system-settings');

            setSettings(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError('');

        try {
            const res = await api.post('/system-settings', form);

            setSettings([res.data.setting, ...settings]);
            setForm({ key: '', value: '', description: '' });
        } catch (err) {
            console.error(err);

            if (err.response?.data?.errors) {
                setError(Object.values(err.response.data.errors).flat().join(' '));
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Failed to create setting.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        setPasswordLoading(true);
        setPasswordMessage('');
        setError('');

        try {
            const res = await api.put('/user/password', passwordForm);

            setPasswordMessage(res.data.message || 'Password updated successfully.');
            setPasswordForm({
                current_password: '',
                password: '',
                password_confirmation: '',
            });
        } catch (err) {
            console.error(err);

            if (err.response?.data?.errors) {
                setError(Object.values(err.response.data.errors).flat().join(' '));
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Failed to update password.');
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h2>System Settings</h2>
            </div>

            {passwordMessage && <p className="settings-success-message">{passwordMessage}</p>}
            {error && <p className="settings-error-message">{error}</p>}

            <div className="settings-actions">
                <button
                    type="button"
                    className={`settings-action-button ${activeAction === 'password' ? 'active' : ''}`}
                    onClick={() => setActiveAction(activeAction === 'password' ? null : 'password')}
                >
                    Change Password
                </button>

                <button
                    type="button"
                    className={`settings-action-button ${activeAction === 'add-setting' ? 'active' : ''}`}
                    onClick={() => setActiveAction(activeAction === 'add-setting' ? null : 'add-setting')}
                >
                    Add Setting
                </button>
            </div>

            {activeAction === 'password' && (
                <div className="settings-card settings-panel">
                    <form onSubmit={handlePasswordSubmit} className="settings-form">
                        <div className="settings-panel-header">
                            <h3>Change Password</h3>
                            <button type="button" className="settings-close-button" onClick={() => setActiveAction(null)}>
                                Close
                            </button>
                        </div>

                        <div className="settings-form-row">
                            <label>Current Password</label>
                            <input
                                type="password"
                                name="current_password"
                                value={passwordForm.current_password}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>

                        <div className="settings-form-row">
                            <label>New Password</label>
                            <input
                                type="password"
                                name="password"
                                value={passwordForm.password}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>

                        <div className="settings-form-row">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                name="password_confirmation"
                                value={passwordForm.password_confirmation}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>

                        <button type="submit" className="primary-button" disabled={passwordLoading}>
                            {passwordLoading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            )}

            {activeAction === 'add-setting' && (
                <div className="settings-card settings-panel">
                    <form onSubmit={handleSubmit} className="settings-form">
                        <div className="settings-panel-header">
                            <h3>Add System Setting</h3>
                            <button type="button" className="settings-close-button" onClick={() => setActiveAction(null)}>
                                Close
                            </button>
                        </div>

                        <div className="settings-form-row">
                            <label>Key</label>
                            <input name="key" value={form.key} onChange={handleChange} required />
                        </div>

                        <div className="settings-form-row">
                            <label>Value</label>
                            <input name="value" value={form.value} onChange={handleChange} />
                        </div>

                        <div className="settings-form-row">
                            <label>Description</label>
                            <input name="description" value={form.description} onChange={handleChange} />
                        </div>

                        <button type="submit" className="primary-button" disabled={loading}>{loading ? 'Saving...' : 'Save Setting'}</button>
                    </form>
                </div>
            )}

            <div className="settings-list-card">
                <h3>Existing Settings</h3>

                <ul className="settings-list">
                    {settings.map(s => (
                        <li key={s.id}><strong>{s.key}:</strong> {s.value} {s.description && `- ${s.description}`}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default SystemSettings;
