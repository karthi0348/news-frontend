import React, { useState } from 'react'; 
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
    const { login} = useAuth(); 
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
    });

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
        const result = await login(data.username, data.password);

        if (result.success) {
            if (result.requiresMfa) {
                const loginToken = localStorage.getItem('loginToken');
                if (loginToken) {
                    try {
                        await api.post('/auth/auth/mfa/send-otp/', {
                            loginToken,
                            method: 'email',
                        });
                        toast.success('OTP sent to your registered email address.');
                        navigate('/mfa-login-verify', { replace: true });
                    } catch (error) {
                        console.error('Error sending initial OTP:', error);
                        const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.';
                        toast.error(errorMessage);
                        navigate('/mfa-login-verify', { replace: true });
                    }
                } else {
                    toast.error('MFA required but login token not found. Please try logging in again.');
                    setIsSubmitting(false);
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
            setIsSubmitting(false);
        }
    } catch (error) {
        toast.error('Unexpected error. Please try again.');
        console.error(error);
        setIsSubmitting(false);
    }
};

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
                            <div style={styles.passwordContainer}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    {...register('password')}
                                    style={styles.passwordInput}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    style={styles.eyeButton}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="purple" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                            <line x1="1" y1="1" x2="23" y2="23"/>
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="purple" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
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
    passwordContainer: {
        position: "relative",
        display: "flex",
        alignItems: "flex-end",
    },
    passwordInput: {
        width: "100%",
        padding: "0 40px 8px 0",
        background: "transparent",
        border: "none",
        borderBottom: "1px solid rgba(255, 255, 255, 0.7)",
        color: "white",
        fontSize: "16px",
        outline: "none",
        transition: "border-color 0.3s ease",
    },
    eyeButton: {
        position: "absolute",
        right: "0",
        bottom: "8px",
        background: "none",
        border: "none",
        color: "rgba(255, 255, 255, 0.7)",
        cursor: "pointer",
        padding: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "24px",
        height: "24px",
        transition: "color 0.3s ease",
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