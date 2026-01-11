import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Auth.css';

const LoginPage = () => {
    let { loginUser } = useContext(AuthContext);

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Login to VerdantEye</h2>
                <form onSubmit={loginUser}>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" placeholder="Enter Email" required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" name="password" placeholder="Enter Password" required />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>Login</button>
                    <p className="auth-link">
                        Don't have an account? <Link to="/register">Register</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
