import React, { useState, useEffect } from 'react'; // Import useEffect
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

const schema = yup.object().shape({
    username: yup.string().required('Username is required'),
    password: yup.string().required('Password is required'),
});

const LoginPage = () => {
    const { login, isAuthenticated, loading } = useAuth(); // Destructure loading as well
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
    });

    // Effect to redirect if already authenticated
    useEffect(() => {
        // Only redirect if authentication status has been determined (not loading)
        // and the user is authenticated.
        if (!loading && isAuthenticated) {
            navigate('/news', { replace: true });
        }
    }, [isAuthenticated, loading, navigate]); // Add loading to dependency array

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        const result = await login(data.username, data.password);
        setIsSubmitting(false);

        if (result.success) {
            // Check if MFA is required based on the login result
            if (result.requiresMfa) {
                // OTP sending logic (which is currently inside LoginPage)
                // This part could potentially be moved to AuthContext or a separate hook
                // for cleaner separation of concerns, but for now, it's fine here.
                const loginToken = localStorage.getItem('loginToken');
                if (loginToken) {
                    try {
                        await api.post('/auth/auth/mfa/send-otp/', {
                            loginToken: loginToken,
                            method: 'email',
                        });
                        toast.success('OTP sent to your registered email address.');
                        navigate('/mfa-login-verify', { replace: true });
                    } catch (error) {
                        console.error('Error sending initial OTP:', error);
                        const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.';
                        toast.error(errorMessage);
                        // Even if OTP send fails, we still navigate to MFA verification page
                        // as the loginToken is set and MFA is required.
                        navigate('/mfa-login-verify', { replace: true });
                    }
                } else {
                     // This case ideally shouldn't happen if requiresMfa is true,
                     // but as a fallback, if loginToken is somehow missing.
                    toast.error('MFA required but login token not found. Please try logging in again.');
                    // Optionally, log out or clear any partial state if this happens
                    // logout(); // if logout is available here or through context
                }
            } else {
                toast.success('Login successful!');
                navigate('/news', { replace: true });
            }
        } else {
            if (result.errors) {
                result.errors.forEach(err => toast.error(err.message));
            } else {
                toast.error(result.message || 'Login failed.');
            }
        }
    };

    // If still loading authentication status, you might want to show a loading indicator
    if (loading) {
        return <div style={styles.outerContainer}><p>Loading...</p></div>;
    }

    // Render the login form only if not authenticated
    return (
        <div style={styles.outerContainer}>
            <div style={styles.background}>
                <div style={styles.containerself}>
                    <h1 style={styles.heading}>Login</h1>

                    <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Username</label>
                            <input
                                type="text"
                                {...register('username')}
                                style={styles.input}
                                autoComplete="username"
                            />
                            {errors.username && <p style={styles.error}>{errors.username.message}</p>}
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password</label>
                            <input
                                type="password"
                                {...register('password')}
                                style={styles.input}
                                autoComplete="current-password"
                            />
                            {errors.password && <p style={styles.error}>{errors.password.message}</p>}
                        </div>
                        <button
                            type="submit"
                            style={{
                                ...styles.loginButton,
                                ...(isSubmitting ? { opacity: 0.7, cursor: "not-allowed" } : {}),
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Logging in..." : "Log In"}
                        </button>
                    </form>

                    <p style={styles.linkText}>
                        Don't have an account?{" "}
                        <Link to="/register" style={styles.link} replace>
                            Register
                        </Link>
                    </p>
                    <p style={styles.linkText}>
                        <Link to="/password-reset-request" style={styles.link}>
                            Forgot Password?
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    outerContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#f0f2f5',
    },
    background: {
        maxWidth: "360px",
        width: '90%',
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        flexDirection: 'column',
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        borderRadius: "10px",
        color: "white",
        margin: '20px auto',
        boxSizing: 'border-box',
        maxHeight: 'calc(100vh - 40px)',
        flexShrink: 0,
        boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
    },
    containerself: {
        width: "100%",
        padding: "20px 20px",
        textAlign: "center",
        flexGrow: 1,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 0,
    },
    heading: {
        color: "white",
        fontSize: "30px",
        fontWeight: "300",
        marginBottom: "35px",
        fontFamily: "Arial, sans-serif",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "25px",
        marginBottom: "25px",
        flexGrow: 1,
        justifyContent: 'center',
    },
    inputGroup: {
        textAlign: "left",
    },
    label: {
        color: "white",
        fontSize: "16px",
        fontWeight: "300",
        marginBottom: "8px",
        display: "block",
    },
    input: {
        width: "100%",
        padding: "0 0 8px 0",
        background: "transparent",
        border: "none",
        borderBottom: "1px solid rgba(255, 255, 255, 0.7)",
        color: "white",
        fontSize: "16px",
        outline: "none",
        transition: "border-color 0.3s ease",
    },
    loginButton: {
        background: "white",
        color: "#764ba2",
        border: "none",
        padding: "14px 28px",
        borderRadius: "25px",
        fontSize: "16px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.3s ease",
        marginTop: "20px",
        boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
    },
    linkText: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: "14px",
        fontWeight: "300",
        marginTop: 'auto',
        marginBottom: '8px',
    },
    link: {
        color: "white",
        textDecoration: "none",
        fontWeight: "500",
    },
    error: {
        color: "#ff6b6b",
        background: "rgba(255, 107, 107, 0.1)",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "13px",
        textAlign: "center",
        marginTop: "5px",
        marginBottom: "18px",
        border: "1px solid rgba(255, 107, 107, 0.3)",
        whiteSpace: 'normal',
        wordBreak: 'break-word',
    },
    successMessage: {
        color: "#aaffaa",
        background: "rgba(170, 255, 170, 0.1)",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "14px",
        textAlign: "center",
        marginBottom: "20px",
        border: "1px solid rgba(170, 255, 170, 0.3)",
    },
};

export default LoginPage;