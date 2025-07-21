import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api/axiosConfig';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const EyeIcon = ({ onClick, isPasswordVisible }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        width="20px"
        height="20px"
        onClick={onClick}
        style={{
            cursor: 'pointer',
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(210, 16, 178, 0.7)', 
        }}
    >
        {isPasswordVisible ? (
            <path d="M12 4.5c-6.16 0-11.23 4.14-14 9.5 2.77 5.36 7.84 9.5 14 9.5s11.23-4.14 14-9.5c-2.77-5.36-7.84-9.5-14-9.5zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm0-10c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
        ) : (
            <path d="M12 7c-2.48 0-4.5 2.02-4.5 4.5s2.02 4.5 4.5 4.5 4.5-2.02 4.5-4.5-2.02-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm0-10c-6.16 0-11.23 4.14-14 9.5 2.77 5.36 7.84 9.5 14 9.5s11.23-4.14 14-9.5c-2.77-5.36-7.84-9.5-14-9.5zM3 12c.79-1.99 2.11-3.69 3.63-5.02L20.89 20.89C19.37 21.39 17.71 21.75 16 22c-2.6-.45-5.03-1.63-7.07-3.41L12 15c-.93.59-2.07.95-3.23 1.05L7 17.5c-.75-.02-1.48-.12-2.2-.29L3 12zM21.05 3.18L18.87 5.36C17.3 4.41 15.42 3.73 13.5 3.39L12 1c-1.92.35-3.79 1.03-5.32 1.98L3.18 0 0 3.18l3.18 3.18L.71 8.29 2 9.58l.71-.71 2.51 2.51c-.69 1.18-.84 2.51-.43 3.8L1.71 19.29 3 20.58l1.71-1.71 2.45 2.45 1.29-1.29-2.45-2.45L12 17.5l.71-.71L12.42 16c1.19-.38 2.23-.97 3.1-1.74l3.18 3.18 1.29-1.29-3.18-3.18c.86-.87 1.6-1.9 2.18-3.03l1.82-1.82L24 7.58 20.82 4.41 21.05 3.18z" />
        )}
    </svg>
);


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

    const [showPassword, setShowPassword] = useState(false);

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
            const response = await api.post('/auth/password-reset-verify/', payload);
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
                                <div style={{ position: 'relative' }}> 
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        {...register('newPassword')}
                                        style={styles.input}
                                        autoComplete="new-password"
                                    />
                                    <EyeIcon
                                        onClick={() => setShowPassword(!showPassword)}
                                        isPasswordVisible={showPassword}
                                    />
                                </div>
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
        paddingRight: '30px', 
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