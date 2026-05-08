import React, { createContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    let [loading] = useState(false);

    const navigate = useNavigate();

    let loginUser = async (e) => {
        e.preventDefault();
        try {
            let response = await fetch('http://localhost:8000/api/token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 'username': e.target.email.value.trim(), 'password': e.target.password.value })
            });
            let data = await response.json();

            if (response.status === 200) {
                setAuthTokens(data);
                const decodedUser = jwtDecode(data.access);
                setUser(decodedUser);
                localStorage.setItem('authTokens', JSON.stringify(data));
                console.log("Login successful, navigating to /");
                navigate('/');
                return null;
            } else {
                return data?.detail || 'Invalid email or password.';
            }
        } catch (error) {
            console.error("Login failed:", error);
            return 'Login failed. Please try again.';
        }
    };

    let registerUser = async (e) => {
        e.preventDefault();
        try {
            let response = await fetch('http://localhost:8000/api/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'email': e.target.email.value.trim(),
                    'password': e.target.password.value,
                    'confirm_password': e.target.confirm_password.value
                })
            });
            let data = await response.json();

            if (response.status === 201) {
                await loginUser(e); // Auto login
                return null;
            }

            return (
                data?.email?.[0] ||
                data?.password?.[0] ||
                data?.non_field_errors?.[0] ||
                'Registration failed!'
            );
        } catch (error) {
            console.error("Registration failed:", error);
            return 'Registration failed!';
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

    return (
        <AuthContext.Provider value={contextData}>
            {loading ? null : children}
        </AuthContext.Provider>
    );
};
