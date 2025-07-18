import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from './../api/axiosConfig';
import { toast } from 'react-toastify';

const schema = yup.object().shape({
    verificationCode: yup
        .string()
        .required('Verification Code is required')
        .max(6, 'Verification Code must be 6 digits'),
});

const MFALoginVerifyPage = () => {
    const { completeMfaLogin, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const loginToken = localStorage.getItem('loginToken');

    const [isSendingCode, setIsSendingCode] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const [isVerifying, setIsVerifying] = useState(false); 
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setError,
        clearErrors,
    } = useForm({
        resolver: yupResolver(schema),
    });

    useEffect(() => {
        if (!loginToken && !isAuthenticated) {
            navigate('/login', { replace: true });
        } else if (isAuthenticated) {
            navigate('/news', { replace: true });
        }
    }, [loginToken, isAuthenticated, navigate]);

    useEffect(() => {
        if (loginToken && !isAuthenticated) {
            setResendTimer(60);
        }
    }, [loginToken, isAuthenticated]);

    useEffect(() => {
        let timerInterval;

        if (resendTimer > 0) {
            timerInterval = setInterval(() => {
                setResendTimer((prev) => {
                    if (prev <= 1) return 0;
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        };
    }, [resendTimer]);

    const requestNewOtp = async () => {
        if (resendTimer > 0) {
            toast.warn(`Please wait ${resendTimer} seconds before resending.`);
            return;
        }

        setIsSendingCode(true);
        clearErrors();

        try {
            const response = await api.post('/auth/auth/mfa/send-otp/', {
                loginToken: loginToken,
                method: 'email',
            });

            if (response.data.success) {
                toast.success(response.data.message || 'New email OTP sent!');
                setResendTimer(60);
                reset({ verificationCode: '' });
            } else {
                toast.error(response.data.message || 'Failed to send new OTP.');
                setError('root.sendError', {
                    message: response.data.message || 'Failed to send new OTP.',
                });
            }
        } catch (error) {
            const backendResponse = error.response?.data;
            if (backendResponse?.errors?.length) {
                backendResponse.errors.forEach((err) => {
                    setError(err.field, { message: err.message });
                    toast.error(err.message);
                });
            } else {
                const msg = 'Failed to send OTP. Please try again.';
                toast.error(msg);
                setError('root.sendError', { message: msg });
            }
        } finally {
            setIsSendingCode(false);
        }
    };

    const onSubmit = async (data) => {
        if (isVerifying) return; 

        setIsVerifying(true);
        clearErrors();

        try {
            const payload = {
                loginToken: loginToken,
                method: 'email',
                verificationCode: data.verificationCode,
            };

            const response = await api.post('/auth/auth/mfa/verify/', payload);

            if (response.data.success) {
                localStorage.removeItem('loginToken');
                completeMfaLogin(response.data.data.tokens, response.data.data.user);
                navigate('/news', { replace: true });
            } else {
                if (response.data.errors?.length) {
                    response.data.errors.forEach((err) => {
                        setError(err.field, { message: err.message });
                        toast.error(err.message);
                    });
                } else {
                    toast.error('MFA verification failed.');
                    setError('root.serverError', { message: 'MFA verification failed.' });
                }
            }
        } catch (error) {
            const backendResponse = error.response?.data;
            if (backendResponse?.errors?.length) {
                backendResponse.errors.forEach((err) => {
                    setError(err.field, { message: err.message });
                    toast.error(err.message);
                });
            } else {
                const errorMessage = 'MFA verification failed';
                toast.error(errorMessage);
                setError('root.serverError', { message: errorMessage });
            }
        } finally {
            setIsVerifying(false);
        }
    };

    if (!loginToken || isAuthenticated) return null;

    return (
        <div style={styles.outerContainer}>
            <div style={styles.background}>
                <div style={styles.containerself}>
                    <h1 style={styles.heading}>MFA Verification</h1>

                    <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
                        {errors.root?.sendError && <p style={styles.error}>{errors.root.sendError.message}</p>}
                        {errors.root?.serverError && <p style={styles.error}>{errors.root.serverError.message}</p>}

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>
                                Please enter OTP sent to your registered email address:
                            </label>
                            <input
                                type="text"
                                {...register('verificationCode')}
                                maxLength="6"
                                style={styles.input}
                                placeholder="Enter 6-digit OTP"
                            />
                            {errors.verificationCode && (
                                <p style={styles.error}>{errors.verificationCode.message}</p>
                            )}

                            <button
                                type="button"
                                onClick={requestNewOtp}
                                disabled={isSendingCode || resendTimer > 0}
                                style={{
                                    ...styles.resendButton,
                                    opacity: (isSendingCode || resendTimer > 0) ? 0.6 : 1,
                                    cursor: (isSendingCode || resendTimer > 0) ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {isSendingCode
                                    ? 'Sending...'
                                    : resendTimer > 0
                                    ? `Resend in ${resendTimer}s`
                                    : 'Resend Code'}
                            </button>
                        </div>

                        <button
                            type="submit"
                            style={{
                                ...styles.loginButton,
                                opacity: isVerifying ? 0.6 : 1,
                                cursor: isVerifying ? 'not-allowed' : 'pointer',
                            }}
                            disabled={isVerifying}
                        >
                            {isVerifying ? 'Verifying...' : 'Verify OTP'}
                        </button>
                    </form>
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
        position: 'relative',
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
    resendButton: {
        background: "rgba(255, 255, 255, 0.2)",
        color: "white",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        padding: "8px 15px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "400",
        cursor: "pointer",
        transition: "all 0.3s ease",
        marginTop: "10px",
        display: 'block',
        width: 'fit-content',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    timerText: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: "12px",
        fontWeight: "300",
        marginTop: "8px",
        textAlign: "center",
        fontStyle: "italic",
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
    infoMessage: {
        color: "#87CEEB",
        background: "rgba(135, 206, 235, 0.1)",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "13px",
        textAlign: "center",
        marginTop: "5px",
        marginBottom: "18px",
        border: "1px solid rgba(135, 206, 235, 0.3)",
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

export default MFALoginVerifyPage;