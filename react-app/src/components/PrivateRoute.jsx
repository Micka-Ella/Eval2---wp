import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthService from '../services/AuthService';

const PrivateRoute = () => {
    // Si l'utilisateur est authentifié, on affiche les routes enfants
    // Sinon, on le redirige vers la page de login
    return AuthService.isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
