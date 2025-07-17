import React from 'react';
import { useForm } from 'react-hook-form'; 
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const schema = yup.object().shape({
    userName: yup.string().required('Username is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    firstName: yup.string().required('First Name is required'),
    lastName: yup.string().required('Last Name is required'),
    phoneNumber: yup.string().required('Phone Number is required'),
});

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors }, setError } = useForm({
        resolver: yupResolver(schema),
    });

    const onSubmit = async (data) => {
        try {
            const response = await api.post('/auth/register/', data);
            if (response.data.success) {
                toast.success(response.data.message || 'Registration successful! You can now log in.');
                setTimeout(() => navigate('/login'), 2000);
            } else {

                toast.error(response.data.message || 'Registration failed.');
            }
        } catch (error) {
            console.error('Registration error:', error.response?.data);
            const backendResponse = error.response?.data;

            if (backendResponse && backendResponse.errors && Array.isArray(backendResponse.errors)) {
                backendResponse.errors.forEach(err => {
                    const fieldMap = {
                        userName: 'userName', 
                        email: 'email',
                        phoneNumber: 'phoneNumber', 
                    };
                    const frontendField = fieldMap[err.field] || err.field; 

                    setError(frontendField, {
                        type: 'server', 
                        message: err.message,
                    });
                    toast.error(`${err.field}: ${err.message}`); 
                });
            } else if (backendResponse && backendResponse.message) {
                toast.error(backendResponse.message);
                setError('root.serverError', {
                    type: 'server',
                    message: backendResponse.message,
                });
            } else {
                toast.error('An unexpected error occurred during registration. Please try again.');
            }
        }
    };

    return (
        <div style={styles.outerContainer}>
            <div style={styles.background}>
                <div style={styles.containerself}>
                    <h1 style={styles.heading}>Register</h1>
                    {errors.root?.serverError && <p style={styles.error}>{errors.root.serverError.message}</p>}

                    <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Username</label>
                            <input
                                type="text"
                                {...register('userName')}
                                style={styles.input}
                            />
                            {errors.userName && <p style={styles.error}>{errors.userName.message}</p>}
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email</label>
                            <input
                                type="email"
                                {...register('email')}
                                style={styles.input}
                            />
                            {errors.email && <p style={styles.error}>{errors.email.message}</p>}
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password</label>
                            <input
                                type="password"
                                {...register('password')}
                                style={styles.input}
                            />
                            {errors.password && <p style={styles.error}>{errors.password.message}</p>}
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>First Name</label>
                            <input
                                type="text"
                                {...register('firstName')}
                                style={styles.input}
                            />
                            {errors.firstName && <p style={styles.error}>{errors.firstName.message}</p>}
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Last Name</label>
                            <input
                                type="text"
                                {...register('lastName')}
                                style={styles.input}
                            />
                            {errors.lastName && <p style={styles.error}>{errors.lastName.message}</p>}
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Phone Number</label>
                            <input
                                type="text"
                                {...register('phoneNumber')}
                                style={styles.input}
                            />
                            {errors.phoneNumber && <p style={styles.error}>{errors.phoneNumber.message}</p>}
                        </div>
                        <button type="submit" style={styles.registerButton}>Register</button>
                    </form>
                    <p style={styles.linkText}>
                        Already have an account? <Link to="/login" style={styles.link}>Log In</Link>
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
        maxWidth: "320px",
        width: '90%',
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        flexDirection: 'column',
        alignItems: "center",
        justifyContent: "center",
        padding: "10px",
        borderRadius: "10px",
        color: "white",
        margin: '10px auto',
        boxSizing: 'border-box',
        flexShrink: 0,
    },
    containerself: {
        width: "100%",
        padding: "10px",
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
        fontSize: "24px",
        fontWeight: "300",
        marginBottom: "20px",
        fontFamily: "Arial, sans-serif",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        marginBottom: "15px",
        flexGrow: 1,
        justifyContent: 'center',
    },
    inputGroup: {
        textAlign: "left",
    },
    label: {
        color: "white",
        fontSize: "14px",
        fontWeight: "300",
        marginBottom: "5px",
        display: "block",
    },
    input: {
        width: "100%",
        padding: "0 0 5px 0",
        background: "transparent",
        border: "none",
        borderBottom: "1px solid rgba(255, 255, 255, 0.7)",
        color: "white",
        fontSize: "14px",
        outline: "none",
        transition: "border-color 0.3s ease",
    },
    registerButton: {
        background: "white",
        color: "#764ba2",
        border: "none",
        padding: "10px 20px",
        borderRadius: "25px",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.3s ease",
        marginTop: "10px",
    },
    linkText: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: "12px",
        fontWeight: "300",
        marginTop: 'auto',
    },
    link: {
        color: "white",
        textDecoration: "none",
        fontWeight: "500",
    },
    error: {
        color: "#ff6b6b",
        background: "rgba(246, 242, 242)",
        padding: "5px",
        borderRadius: "5px",
        fontSize: "11px",
        textAlign: "center",
        marginTop: "3px",
        marginBottom: "10px",
        border: "1px solid rgba(255, 107, 107, 0.3)",
        whiteSpace: 'normal',
        wordBreak: 'break-word',
    },
    success: { 
        color: "#6bff6b",
        background: "rgba(107, 255, 107, 0.1)",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "14px",
        textAlign: "center",
        marginBottom: "20px",
        border: "1px solid rgba(107, 255, 107, 0.3)",
    }
};

export default RegisterPage;