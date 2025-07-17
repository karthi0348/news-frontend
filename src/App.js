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

import PrivateRoute from './components/PrivateRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';


const HomeRedirect = () => {
    const { isAuthenticated, loading } = useAuth(); 

    if (loading) {
        return <div>Loading...</div>; 
    }

    return isAuthenticated ? <Navigate to="/news" replace /> : <Navigate to="/login" replace />;
};


function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public-only routes: Accessible ONLY when NOT authenticated */}
                    <Route element={<PublicOnlyRoute />}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/password-reset-request" element={<PasswordResetRequestPage />} />
                        <Route path="/auth/password-reset" element={<PasswordResetVerifyPage />} />
                        <Route path="/mfa-login-verify" element={<MFALoginVerifyPage />} />
                    </Route>

                    {/* Private routes: Accessible ONLY when AUTHENTICATED */}
                    <Route element={<PrivateRoute />}>
                        <Route path="/news" element={<NewsPage />} />
                        <Route path="/news/:newsId" element={<NewsDetail />} />
                        <Route path="/mfa-setup" element={<MFASetupPage />} />
                    </Route>

                    <Route
                        path="/"
                        element={<HomeRedirect />}
                    />

                    <Route path="*" element={<div>404 Not Found</div>} />
                </Routes>
                <ToastContainer
                    position="bottom-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </AuthProvider>
        </Router>
    );
}

export default App;