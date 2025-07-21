import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api/axiosConfig';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const schema = yup.object().shape({
    email: yup.string().email('Invalid email address').required('Email address is required'),
});

const PasswordResetRequestPage = () => {
    const { register, handleSubmit, setError, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isHoveredButton, setIsHoveredButton] = useState(false);
    const [isHoveredLink, setIsHoveredLink] = useState(false);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            await api.post('/auth/password-reset-request/', data);
            toast.success('If an account with that email exists, a password reset link has been sent to it.');
        } catch (error) {
            console.error('Password reset request error:', error); 

            if (error.response && error.response.status === 400 && error.response.data.errors) {
                Object.entries(error.response.data.errors).forEach(([field, messages]) => {
                    setError(field, { type: 'manual', message: messages[0] });
                });
                toast.error('Please correct the highlighted errors.');
            } else if (error.response) {
                toast.error(`An error occurred: ${error.response.data.message || 'Please try again later.'}`);
            } else if (error.request) {
                toast.error('Network error. Please check your internet connection and try again.');
            } else {
                toast.error('An unexpected error occurred. Please try again later.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.outerContainer}>
            <div style={styles.background}>
                <div style={styles.container}>
                    <h2 style={styles.heading}>Request Password Reset</h2>
                    <p style={styles.description}>Enter your email address and we'll send you a link to reset your password.</p>
                    <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label htmlFor="email" style={styles.label}>Email:</label>
                            <input
                                id="email" 
                                type="email"
                                {...register('email')}
                                style={styles.input}
                                autoComplete="email"
                                placeholder="your@example.com" 
                            />
                            {errors.email && <p style={styles.error}>{errors.email.message}</p>}
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
                            {isSubmitting ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>
                    <p style={styles.linkText}>
                        <Link
                            to="/login"
                            style={{
                                ...styles.link,
                                ...(isHoveredLink ? styles.linkHover : {}),
                            }}
                            onMouseEnter={() => setIsHoveredLink(true)}
                            onMouseLeave={() => setIsHoveredLink(false)}
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
};

export default PasswordResetRequestPage;