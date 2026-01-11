import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Auth.css';

const RegisterPage = () => {
    let { registerUser } = useContext(AuthContext);

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Create Account</h2>
                <form onSubmit={registerUser}>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" placeholder="Enter Email" required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" name="password" placeholder="Create Password" required />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input type="password" name="confirm_password" placeholder="Confirm Password" required />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>Register</button>
                    <p className="auth-link">
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
