import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
const PrivateRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div>Loading authentication...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;