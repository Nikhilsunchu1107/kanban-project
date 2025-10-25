import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// 1. Define the API base URL
const API_URL = 'http://localhost:5001/api/auth';

// 2. Create the Context
const AuthContext = createContext();

// 3. Create the Provider Component
// This component will wrap our entire app
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 4. Check for existing user in localStorage when app loads
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    // 5. Login Function 
    const login = async (email, password) => {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        if (response.data) {
            localStorage.setItem('user', JSON.stringify(response.data));
            setUser(response.data);
        }
    };

    // 6. Register Function
    const register = async (name, email, password) => {
        const response = await axios.post(`${API_URL}/register`, { name, email, password });
        if (response.data) {
            localStorage.setItem('user', JSON.stringify(response.data));
            setUser(response.data);
        }
    };

    // 7. Logout Function
    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    // 8. The value to pass to consuming components
    const value = {
        user,
        loading,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// 10. Create a custom hook to easily use the context
export const useAuth = () => {
    return useContext(AuthContext);
};