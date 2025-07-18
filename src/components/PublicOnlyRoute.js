import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicOnlyRoute = () => {
    const { isAuthenticated} = useAuth();

 
    if (isAuthenticated) {
        return <Navigate to="/news" replace />;
    }

    return <Outlet />;
};

export default PublicOnlyRoute;