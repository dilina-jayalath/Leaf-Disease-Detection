import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export default AuthContext;

export const AuthProvider = ({ children }) => {
    let [authTokens, setAuthTokens] = useState(() => localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null);
    let [user, setUser] = useState(() => {
        if (localStorage.getItem('authTokens')) {
            try {
                return jwtDecode(JSON.parse(localStorage.getItem('authTokens')).access);
            } catch (error) {
                console.error("Invalid token:", error);
                localStorage.removeItem('authTokens');
                return null;
            }
        }
        return null;
    });
    let [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    let loginUser = async (e) => {
        e.preventDefault();
        try {
            let response = await fetch('http://localhost:8000/api/token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 'username': e.target.email.value, 'password': e.target.password.value })
            });
            let data = await response.json();

            if (response.status === 200) {
                setAuthTokens(data);
                const decodedUser = jwtDecode(data.access);
                setUser(decodedUser);
                localStorage.setItem('authTokens', JSON.stringify(data));
                console.log("Login successful, navigating to /");
                navigate('/');
            } else {
                alert('Something went wrong!');
            }
        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed!");
        }
    };

    let registerUser = async (e) => {
        e.preventDefault();
        let response = await fetch('http://localhost:8000/api/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'email': e.target.email.value,
                'password': e.target.password.value,
                'confirm_password': e.target.confirm_password.value
            })
        });

        if (response.status === 201) {
            loginUser(e); // Auto login
        } else {
            alert('Registration failed!');
        }
    }

    let logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        localStorage.removeItem('chatHistory');
        navigate('/login');
    };

    // Optional: Add logic to refresh token automatically

    let contextData = {
        user: user,
        authTokens: authTokens,
        loginUser: loginUser,
        registerUser: registerUser,
        logoutUser: logoutUser,
    };

    useEffect(() => {
        if (loading) {
            setLoading(false);
        }
    }, [authTokens, loading]);

    return (
        <AuthContext.Provider value={contextData}>
            {loading ? null : children}
        </AuthContext.Provider>
    );
};
