import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Components/Auth/Login';
import Signup from './Components/Auth/Signup';
import OtpVerificationPage from './Components/Auth/OtpVerificationPage.js'; 
import NewsList from './Components/NewsList.js';
import NewsDetail from './Components/NewsDetail.js';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import '../node_modules/bootstrap/dist/js/bootstrap.min.js'

// Create Authentication Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication Provider Component
const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('access_token') ? true : false;
  });

  const login = (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
  };

  // Check for token changes (useful for debugging)
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('access_token');
      setIsAuthenticated(!!token);
    };

    // Check auth status on mount
    checkAuthStatus();

    // Optional: Listen for storage changes from other tabs
    window.addEventListener('storage', checkAuthStatus);
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Private Route Component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className='container'>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/verify-otp" element={<OtpVerificationPage />} />
            
            <Route path="/signup" element={<Signup />} />
            <Route path="/news/:title" element={<NewsDetail />} /> 
            
            {/* Route for the root path */}
            <Route
              path="/"
              element={<RootRedirect />}
            />

            {/* Explicit route for /news, protected by PrivateRoute */}
            <Route
              path="/news" // CHANGED FROM /home TO /news
              element={
                <PrivateRoute>
                  <NewsList />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Root redirect component that uses the auth context
const RootRedirect = () => {
  const { isAuthenticated } = useAuth();
  // Redirect to /news if authenticated, otherwise to /login
  return isAuthenticated ? <Navigate to="/news" replace /> : <Navigate to="/login" replace />; // CHANGED FROM /home TO /news
};

export default App;