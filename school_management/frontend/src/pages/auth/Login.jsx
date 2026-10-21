import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { getDashboardPath } from '../../utils/auth';
import './login.css';
// import background from '../assets/back.jpg';

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setLoading(true);

        try {
            const response = await api.post('/login', {
                email,
                password,
            });

            const user = response.data.user;
            const token = response.data.token;

            if (!user || !user.role) {
                throw new Error('User role missing in login response.');
            }

            // Save authentication token
            localStorage.setItem('school_token', token);

            // Save logged-in user
            localStorage.setItem(
                'school_user',
                JSON.stringify(user)
            );

            // Go to the correct dashboard for the logged-in role
            navigate(getDashboardPath(user.role), { replace: true });

        } catch (error) {
            console.error('Login failed:', error);

            if (error.response?.status === 422) {
                setError(
                    error.response.data.message ||
                    'Invalid email or password.'
                );
            } else if (!error.response || error.code === 'ERR_NETWORK') {
                setError(
                    'Unable to connect to the server. Please start the Laravel API and try again.'
                );
            } else {
                setError(
                    error.response?.data?.message ||
                    'Unable to connect to the server.'
                );
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            <div className="login-card">

                <h1>
                    School Management System
                </h1>

                <p>
                    Login to your account
                </p>

                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="form-group">

                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            placeholder="Enter your email"
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter your password"
                            required
                        />

                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? 'Logging in...'
                            : 'Login'}
                    </button>

                </form>

            </div>

        </div>
    );
}

export default Login;