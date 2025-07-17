import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MFASetupPage from './pages/MFASetupPage';
import MFALoginVerifyPage from './pages/MFALoginVerifyPage';
import PasswordResetRequestPage from './pages/PasswordResetRequestPage';
import PasswordResetVerifyPage from './pages/PasswordResetVerifyPage';
import NewsPage from './pages/NewsPage';
import NewsDetail from './pages/NewsDetail';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated} = useAuth();

    return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppRoutes() {
    const { isAuthenticated} = useAuth(); 

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/password-reset-request" element={<PasswordResetRequestPage />} />
            <Route path="/auth/password-reset" element={<PasswordResetVerifyPage />} />
            <Route path="/mfa-login-verify" element={<MFALoginVerifyPage />} />

            <Route
                path="/"
                element={isAuthenticated ? <Navigate to="/news" /> : <Navigate to="/login" />}
            />

            <Route path="/mfa-setup" element={<PrivateRoute><MFASetupPage /></PrivateRoute>} />
            <Route path="/news" element={<PrivateRoute><NewsPage /></PrivateRoute>} />
            <Route path="/news/:newsId" element={<PrivateRoute><NewsDetail /></PrivateRoute>} />

            <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
                <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            </AuthProvider>
        </Router>
    );
}

export default App;