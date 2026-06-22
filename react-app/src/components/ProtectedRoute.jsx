import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthService from '../services/AuthService';
import { initSession } from '../config/api';

const ProtectedRoute = () => {
    const isAuthenticated = AuthService.isAuthenticated();
    const [sessionInitialized, setSessionInitialized] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            initSession()
                .then(() => setSessionInitialized(true))
                .catch(error => {
                    console.error("Failed to initialize GLPI session", error);
                    setSessionInitialized(true); // Still let them proceed, maybe session is already valid
                });
        }
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // You could add a loading state here, but for simplicity we'll just proceed
    return <Outlet />;
};

export default ProtectedRoute;