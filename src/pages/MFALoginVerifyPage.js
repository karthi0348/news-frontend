import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { toast } from 'react-toastify';

const schema = yup.object().shape({
    verificationCode: yup.string().max(6, 'Max 6 digits').notRequired(),
    backupCode: yup.string().max(8, 'Max 8 characters').notRequired(),
}).test('at-least-one-field', 'Either Verification Code or Backup Code must be provided.', function(value) {
    return value.verificationCode || value.backupCode;
}).test('only-one-field', 'Cannot provide both Verification Code and Backup Code.', function(value) {
    return !(value.verificationCode && value.backupCode);
});

const MFALoginVerifyPage = () => {
    const { completeMfaLogin, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const loginToken = localStorage.getItem('loginToken');
    const [selectedMethod, setSelectedMethod] = useState('totp');
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [emailOtpSent, setEmailOtpSent] = useState(false); 

    const { register, handleSubmit, formState: { errors }, reset, setError, clearErrors } = useForm({
        resolver: yupResolver(schema),
    });

    useEffect(() => {
        if (!loginToken && !isAuthenticated) {
            navigate('/login');
        } else if (isAuthenticated) {
            navigate('/news');
        }
    }, [loginToken, isAuthenticated, navigate]);

    useEffect(() => {
        let timerInterval;
        if (resendTimer > 0) {
            timerInterval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        } else {
            clearInterval(timerInterval);
        }
        return () => clearInterval(timerInterval);
    }, [resendTimer]);

    useEffect(() => {
        if (selectedMethod === 'email' && !emailOtpSent && loginToken) {
            requestNewOtp();
        }
    }, [selectedMethod, emailOtpSent, loginToken]);

    const requestNewOtp = async () => {
        if (selectedMethod === 'totp') {
            toast.info("For Authenticator App, please generate the code from your app directly.");
            return;
        }

        if (resendTimer > 0) {
            toast.warn(`Please wait ${resendTimer} seconds before resending.`);
            return;
        }

        setIsSendingCode(true);
        clearErrors();

        try {
            console.log('Sending OTP request:', { loginToken, method: selectedMethod }); 
            
            const response = await api.post('/auth/auth/mfa/send-otp/', {
                loginToken: loginToken,
                method: selectedMethod,
            });

            console.log('OTP response:', response.data); 

            if (response.data.success) {
                toast.success(response.data.message || `New ${selectedMethod === 'email' ? 'email' : 'SMS'} OTP sent!`);
                setResendTimer(60);
                setEmailOtpSent(true); 
                reset({ verificationCode: '', backupCode: '' });
            } else {
                toast.error(response.data.message || 'Failed to send new OTP.');
                setError('root.sendError', { message: response.data.message || 'Failed to send new OTP.' });
            }
        } catch (error) {
            console.error('Error requesting new OTP:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            
            let errorMessage = 'Failed to send OTP. Please try again.';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 404) {
                errorMessage = 'OTP sending service not found. Please contact support.';
            } else if (error.response?.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            } else if (error.message.includes('Network Error')) {
                errorMessage = 'Network error. Please check your connection.';
            }
            
            toast.error(errorMessage);
            setError('root.sendError', { message: errorMessage });
        } finally {
            setIsSendingCode(false);
        }
    };

    const onSubmit = async (data) => {
        clearErrors();

        const isValid = await schema.isValid(data, { abortEarly: false });
        if (!isValid) {
            return;
        }

        try {
            const payload = {
                loginToken: loginToken,
                method: selectedMethod,
                ...(data.verificationCode && { verificationCode: data.verificationCode }),
                ...(data.backupCode && { backupCode: data.backupCode }),
            };

            console.log('Sending payload:', payload); 

            const response = await api.post('/auth/auth/mfa/verify/', payload);

            if (response.data.success) {
                // toast.success(response.data.message || 'MFA verification successful!');
                localStorage.removeItem('loginToken');
                completeMfaLogin(response.data.data.tokens, response.data.data.user);
                navigate('/news');
            } else {
                if (response.data.errors && Array.isArray(response.data.errors)) {
                    response.data.errors.forEach(err => {
                        setError(err.field, { message: err.message });
                        toast.error(err.message);
                    });
                } else {
                    toast.error( 'MFA verification failed.');
                    setError('root.serverError', { message:'MFA verification failed.' });
                }
            }
        } catch (error) {
            console.error('MFA verification error:', error.response?.data);
            const backendResponse = error.response?.data;
            if (backendResponse && backendResponse.errors && Array.isArray(backendResponse.errors)) {
                backendResponse.errors.forEach(err => {
                    setError(err.field, { message: err.message });
                    toast.error(err.message);
                });
            } else {
                const errorMessage =  'MFA verification failed';
                toast.error(errorMessage);
                setError('root.serverError', { message: errorMessage });
            }
        }
    };

    const handleMethodChange = (e) => {
        const newMethod = e.target.value;
        setSelectedMethod(newMethod);
        setEmailOtpSent(false); 
        reset({ verificationCode: '', backupCode: '' });
        clearErrors();
    };

    if (!loginToken && !isAuthenticated) {
        return null;
    }
    if (isAuthenticated) {
        return null;
    }

    return (
        <div style={styles.outerContainer}>
            <div style={styles.background}>
                <div style={styles.containerself}>
                    <h1 style={styles.heading}>MFA Verification</h1>
                    {!loginToken && <p style={styles.linkText}>Please login first to initiate MFA verification.</p>}
                    {loginToken && (
                        <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
                            {errors.root?.sendError && <p style={styles.error}>{errors.root.sendError.message}</p>}
                            {errors.root?.serverError && <p style={styles.error}>{errors.root.serverError.message}</p>}

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Verification Method:</label>
                                <select
                                    value={selectedMethod}
                                    onChange={handleMethodChange}
                                    style={{ ...styles.input, padding: '8px', color: '#333', background: 'white' }}
                                >
                                    <option value="totp">Authenticator App (TOTP)</option>
                                    <option value="email">Email OTP</option>
                                </select>
                            </div>

                            {selectedMethod === 'email' && isSendingCode && (
                                <div style={styles.infoMessage}>
                                    Sending email OTP...
                                </div>
                            )}

                            {selectedMethod !== 'backup' && (
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>
                                        Verification Code ({selectedMethod === 'totp' ? 'from app' : 'from email'}):
                                    </label>
                                    <input
                                        type="text"
                                        {...register('verificationCode')}
                                        maxLength="6"
                                        style={styles.input}
                                        placeholder={selectedMethod === 'totp' ? 'Enter 6-digit code' : 'Enter email OTP'}
                                    />
                                    {errors.verificationCode && <p style={styles.error}>{errors.verificationCode.message}</p>}
                                    
                                    {selectedMethod === 'email' && (
                                        <button
                                            type="button"
                                            onClick={requestNewOtp}
                                            disabled={isSendingCode || resendTimer > 0}
                                            style={{ ...styles.resendButton, opacity: (isSendingCode || resendTimer > 0) ? 0.6 : 1 }}
                                        >
                                            {isSendingCode ? 'Sending...' : resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                                        </button>
                                    )}
                                </div>
                            )}

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Backup Code (if you lost your device):</label>
                                <input
                                    type="text"
                                    {...register('backupCode')}
                                    maxLength="8"
                                    style={styles.input}
                                    placeholder="Enter backup code"
                                />
                                {errors.backupCode && <p style={styles.error}>{errors.backupCode.message}</p>}
                            </div>

                            {(errors.atLeastOneField || errors.onlyOneField) && (
                                <p style={styles.error}>
                                    {errors.atLeastOneField?.message || errors.onlyOneField?.message}
                                </p>
                            )}

                            <button type="submit" style={styles.loginButton}>Verify MFA</button>
                        </form>
                    )}
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