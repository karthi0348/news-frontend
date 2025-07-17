// src/pages/MFASetupPage.js
import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const setupSchema = yup.object().shape({
    verificationCode: yup.string().required('Verification code is required').length(6, 'Code must be 6 digits'),
    setupToken: yup.string().required('Setup token is missing'),
});

const MFASetupPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [currentStep, setCurrentStep] = useState(1); // 1: Choose method (will be simplified), 2: Setup (Email), 3: Verify
    const [selectedMethod, setSelectedMethod] = useState('email'); // Default to email as it's the only one
    const [setupToken, setSetupToken] = useState('');
    // Removed qrCodeUrl and mfaSecret as they are for TOTP
    const [backupCodes, setBackupCodes] = useState([]);
    const [mfaMethods, setMfaMethods] = useState({ available: [], enabled: [], primary: '', hasBackupCodes: false });

    const { register, handleSubmit, formState: { errors }, setValue } = useForm({
        resolver: yupResolver(setupSchema),
    });

    useEffect(() => {
        // Fetch current MFA status when component mounts
        const fetchMfaStatus = async () => {
            try {
                const response = await api.get('/auth/mfa/methods/');
                if (response.data.success) {
                    setMfaMethods(response.data.data);
                }
            } catch (error) {
                toast.error("Failed to fetch MFA status.");
            }
        };
        if (isAuthenticated) {
            fetchMfaStatus();
        }
    }, [isAuthenticated]);


    const initiateMfaSetup = async () => { // No 'method' parameter needed now, it's always 'email'
        // setSelectedMethod('email'); // Already defaulted
        try {
            const endpoint = '/auth/mfa/email/setup/';
            const payload = { emailAddress: user.email }; // User's email from AuthContext

            const response = await api.post(endpoint, payload);
            if (response.data.success) {
                const { setupToken, expiresIn } = response.data.data; // Removed qrCodeUrl, secret
                setSetupToken(setupToken);
                setValue('setupToken', setupToken); // Set value for react-hook-form
                setCurrentStep(2); // Move to setup/verify step
                toast.info(`MFA setup initiated for Email.`);
            } else {
                toast.error(response.data.message || 'Failed to initiate MFA setup.');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'An error occurred initiating MFA setup.');
            console.error('MFA setup error:', error.response?.data);
        }
    };

    const verifyMfaSetup = async (data) => {
        try {
            const endpoint = '/auth/mfa/email/verify/'; // Always email verification
            
            const response = await api.post(endpoint, data); // data contains setupToken and verificationCode

            if (response.data.success) {
                toast.success(response.data.message || 'MFA successfully enabled!');
                setBackupCodes(response.data.data.backupCodes || []); // Store backup codes
                setCurrentStep(3); // Show backup codes
                // Re-fetch MFA status to update UI
                const statusResponse = await api.get('/auth/mfa/methods/');
                if (statusResponse.data.success) {
                    setMfaMethods(statusResponse.data.data);
                }
            } else {
                toast.error(response.data.message || 'MFA verification failed. Please try again.');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'An error occurred during MFA verification.');
            console.error('MFA verification error:', error.response?.data);
        }
    };


    const disableMfa = async () => {
        const verificationCode = prompt("Enter your MFA verification code to disable MFA:");
        if (!verificationCode) {
            toast.info("MFA disable cancelled.");
            return;
        }

        try {
            // Assuming primary method for disabling will be 'email' once setup
            const response = await api.delete('/auth/mfa/disable/', { data: { verificationCode, method: 'email' } });
            if (response.data.success) {
                toast.success(response.data.message || 'MFA disabled successfully.');
                 // Re-fetch MFA status to update UI
                const statusResponse = await api.get('/auth/mfa/methods/');
                if (statusResponse.data.success) {
                    setMfaMethods(statusResponse.data.data);
                }
                setCurrentStep(1); // Back to initial state (no MFA enabled)
            } else {
                toast.error(response.data.message || 'Failed to disable MFA.');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'An error occurred disabling MFA.');
            console.error('MFA disable error:', error.response?.data);
        }
    };

    return (
        <div className="mfa-setup-container">
            <h2>Multi-Factor Authentication (MFA) Setup</h2>

            {mfaMethods.enabled.length > 0 ? (
                <>
                    <h3>MFA is Enabled!</h3>
                    <p>Primary method: {mfaMethods.primary}</p>
                    <p>Enabled methods: {mfaMethods.enabled.join(', ')}</p>
                    <p>Has backup codes: {mfaMethods.hasBackupCodes ? 'Yes' : 'No'}</p>
                    <button onClick={disableMfa} style={{backgroundColor: 'red'}}>Disable MFA</button>
                    {/* Link to backup code management page */}
                    <p><Link to="/profile">Manage Backup Codes / Regenerate</Link></p>
                </>
            ) : (
                <>
                    {/* Simplified step 1: Directly initiate email setup */}
                    {currentStep === 1 && (
                        <>
                            <h3>Enable Email OTP</h3>
                            <p>Click the button below to send a verification code to your registered email ({user?.email}).</p>
                            <button onClick={initiateMfaSetup}>Send Email OTP for Setup</button>
                            {!user?.email && <p className="error">Your email address is not available. Please update your profile.</p>}
                        </>
                    )}

                    {currentStep === 2 && ( // Now only for email
                        <>
                            <h3>Verify Email OTP</h3>
                            <p>A verification code has been sent to your email ({user?.email}).</p>
                            <p>This setup token expires in 5 minutes.</p>

                            <form onSubmit={handleSubmit(verifyMfaSetup)}>
                                <input type="hidden" {...register('setupToken')} value={setupToken} />
                                <div>
                                    <label>Enter 6-digit code from email:</label>
                                    <input type="text" {...register('verificationCode')} maxLength="6" />
                                    {errors.verificationCode && <p className="error">{errors.verificationCode.message}</p>}
                                </div>
                                <button type="submit">Verify & Enable Email MFA</button>
                            </form>
                        </>
                    )}

                    {currentStep === 3 && backupCodes.length > 0 && (
                        <>
                            <h3>MFA Enabled! Save Your Backup Codes!</h3>
                            <p>These codes can be used to log in if you lose access to your primary MFA method.</p>
                            <div className="backup-codes-list">
                                {backupCodes.map((code, index) => (
                                    <p key={index}><strong>{code}</strong></p>
                                ))}
                            </div>
                            <p>Store these codes in a safe place. They are one-time use.</p>
                            <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default MFASetupPage;