import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axiosConfig'; 
import { jwtDecode } from 'jwt-decode'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessToken, setAccessToken] = useState(null); 
    const [refreshToken, setRefreshToken] = useState(null); 
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        const loadUserFromStorage = () => {
            try {
                const storedAccessToken = localStorage.getItem('accessToken');
                const storedRefreshToken = localStorage.getItem('refreshToken');

                if (storedAccessToken) {
                    const decodedToken = jwtDecode(storedAccessToken);
                    if (decodedToken.exp * 1000 < Date.now()) {
                        console.log("Access token expired. Attempting refresh or logging out.");
                     
                        logout(); 
                    } else {
                        setUser({
                            email: decodedToken.email, 
                            userId: decodedToken.user_id,
                            userName: decodedToken.username
                        });
                        setAccessToken(storedAccessToken);
                        setRefreshToken(storedRefreshToken); 
                        setIsAuthenticated(true);
                    }
                } else {
                    setIsAuthenticated(false);
                    setUser(null);
                    setAccessToken(null);
                    setRefreshToken(null);
                }
            } catch (error) {
                console.error("Failed to decode token or load user:", error);
                logout(); 
            } finally {
                setLoading(false); 
            }
        };
        loadUserFromStorage();
    }, []); 

    const login = async (username, password) => {
        setLoading(true); 
        try {
            const response = await api.post('/auth/login/', { username, password });
            const { success, data, message } = response.data;

            if (success) {
                const { user: userData, tokens, requiresMfa, loginToken } = data;

                if (requiresMfa) {
                    localStorage.setItem('loginToken', loginToken);
                    setLoading(false);
                    return { success: true, requiresMfa: true, message: message };
                } else {
                    localStorage.setItem('accessToken', tokens.access);
                    if (tokens.refresh) {
                        localStorage.setItem('refreshToken', tokens.refresh);
                    }
                    setUser(userData);
                    setAccessToken(tokens.access); 
                    setRefreshToken(tokens.refresh); 
                    setIsAuthenticated(true);
                    setLoading(false);
                    return { success: true, message: message };
                }
            } else {
                setLoading(false);
                return { success: false, message: message || "Login failed." };
            }
        } catch (error) {
            setLoading(false);
            const errorMessage = error.response?.data?.message || "An unexpected error occurred during login.";
            const errorDetails = error.response?.data?.errors;
            return { success: false, message: errorMessage, errors: errorDetails };
        }
    };

    const completeMfaLogin = async (tokens, userData) => {
        localStorage.setItem('accessToken', tokens.accessToken); 
        if (tokens.refreshToken) { 
            localStorage.setItem('refreshToken', tokens.refreshToken);
        }
        localStorage.removeItem('loginToken'); 

        setUser(userData);
        setAccessToken(tokens.accessToken); 
        setRefreshToken(tokens.refreshToken); 
        setIsAuthenticated(true);
        setLoading(false); 
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('loginToken'); 
        setAccessToken(null); 
        setRefreshToken(null); 
        setIsAuthenticated(false);
        setLoading(false); 
    };

    const value = {
        user,
        isAuthenticated,
        accessToken, 
        refreshToken, 
        loading,
        login,
        logout,
        completeMfaLogin,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);