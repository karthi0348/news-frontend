import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api/axiosConfig';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const schema = yup.object().shape({
    newPassword: yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('New Password is required'),
});

const PasswordResetVerifyPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [resetToken, setResetToken] = useState(null);
    const [isValidToken, setIsValidToken] = useState(true); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isHoveredButton, setIsHoveredButton] = useState(false);
    const [isHoveredLink, setIsHoveredLink] = useState(false); 
    const [isHoveredBackToLoginLink, setIsHoveredBackToLoginLink] = useState(false); 

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            setResetToken(token);
        } else {
            setIsValidToken(false);
            toast.error("No password reset token found in URL.");
        }
    }, [searchParams]);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
    });

    const onSubmit = async (data) => {
        if (!resetToken) {
            toast.error("Cannot reset password: No token available.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                resetToken: resetToken,
                newPassword: data.newPassword,
            };
            const response = await api.post('/auth/password-reset/', payload);
            if (response.data.success) {
                toast.success(response.data.message || 'Password reset successful! You can now log in with your new password.');
                navigate('/login');
            } else {
                toast.error(response.data.message || 'Password reset failed.');
            }
        } catch (error) {
            console.error('Password reset verification error:', error.response?.data);
            const errorMessage = error.response?.data?.message || 'An error occurred during password reset.';
            const fieldErrors = error.response?.data?.errors;

            if (fieldErrors && Array.isArray(fieldErrors)) {
                fieldErrors.forEach(err => {
                    if (err.code === "TOKEN_EXPIRED") {
                        setIsValidToken(false);
                        toast.error("Password reset token has expired. Please request a new one.");
                    } else if (err.code === "INVALID_TOKEN") {
                        setIsValidToken(false);
                        toast.error("Invalid password reset token.");
                    } else {
                        toast.error(err.message || "An error occurred with a field.");
                    }
                });
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const commonContainerStyle = {
        ...styles.outerContainer,
        minHeight: '100vh',
        alignItems: 'center',
        padding: '20px 0',
    };

    if (!isValidToken) {
        return (
            <div style={commonContainerStyle}>
                <div style={styles.background}>
                    <div style={styles.container}>
                        <h2 style={styles.heading}>Invalid or Expired Link</h2>
                        <p style={styles.description}>The password reset link is invalid or has expired. Please request a new one.</p>
                        <Link
                            to="/password-reset-request"
                            style={{
                                ...styles.link,
                                ...(isHoveredLink ? styles.linkHover : {}),
                                marginTop: '20px', 
                            }}
                            onMouseEnter={() => setIsHoveredLink(true)}
                            onMouseLeave={() => setIsHoveredLink(false)}
                        >
                            Request New Password Reset Link
                        </Link>
                        <p style={styles.linkText}>
                            <Link
                                to="/login"
                                style={{
                                    ...styles.link,
                                    ...(isHoveredBackToLoginLink ? styles.linkHover : {}),
                                }}
                                onMouseEnter={() => setIsHoveredBackToLoginLink(true)}
                                onMouseLeave={() => setIsHoveredBackToLoginLink(false)}
                            >
                                Back to Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={commonContainerStyle}>
            <div style={styles.background}>
                <div style={styles.container}>
                    <h2 style={styles.heading}>Reset Your Password</h2>
                    {resetToken ? (
                        <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>New Password:</label>
                                <input
                                    type="password"
                                    {...register('newPassword')}
                                    style={styles.input}
                                    autoComplete="new-password"
                                />
                                {errors.newPassword && <p style={styles.error}>{errors.newPassword.message}</p>}
                            </div>
                            <button
                                type="submit"
                                style={{
                                    ...styles.button,
                                    ...(isSubmitting ? { opacity: 0.7, cursor: "not-allowed" } : {}),
                                    ...(isHoveredButton && !isSubmitting ? styles.buttonHover : {}),
                                }}
                                disabled={isSubmitting}
                                onMouseEnter={() => setIsHoveredButton(true)}
                                onMouseLeave={() => setIsHoveredButton(false)}
                            >
                                {isSubmitting ? "Resetting..." : "Reset Password"}
                            </button>
                        </form>
                    ) : (
                        <p style={styles.loadingMessage}>Loading password reset form...</p>
                    )}
                    <p style={styles.linkText}>
                        <Link
                            to="/login"
                            style={{
                                ...styles.link,
                                ...(isHoveredBackToLoginLink ? styles.linkHover : {}),
                            }}
                            onMouseEnter={() => setIsHoveredBackToLoginLink(true)}
                            onMouseLeave={() => setIsHoveredBackToLoginLink(false)}
                        >
                            Back to Login
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
        maxWidth: "380px", 
        width: '90%',
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        flexDirection: 'column',
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
        borderRadius: "10px",
        color: "white",
        margin: '20px auto',
        boxSizing: 'border-box',
        maxHeight: 'calc(100vh - 40px)',
        flexShrink: 0,
        boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
    },
    container: {
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
        marginBottom: "20px",
        fontFamily: "Arial, sans-serif",
    },
    description: {
        color: "rgba(255, 255, 255, 0.85)",
        fontSize: "15px",
        marginBottom: "30px",
        lineHeight: "1.5",
        fontWeight: "300",
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
        '::placeholder': {
            color: 'rgba(255, 255, 255, 0.7)',
        },
    },
    button: {
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
    buttonHover: {
        backgroundColor: "#e0e0e0",
        transform: "translateY(-2px)",
        boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
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
        transition: "color 0.3s ease",
    },
    linkHover: {
        color: "#d0d0d0",
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
    loadingMessage: {
        color: "rgba(255, 255, 255, 0.85)",
        fontSize: "15px",
        textAlign: "center",
        padding: "20px",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
        marginTop: "20px",
    }
};

export default PasswordResetVerifyPage;
