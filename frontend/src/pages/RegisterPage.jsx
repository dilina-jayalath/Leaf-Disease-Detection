import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Button, Paper, TextField, Typography } from '@mui/material';
import { Leaf } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import './Auth.css';

const RegisterPage = () => {
  const { registerUser } = useContext(AuthContext);

  return (
    <div className="auth-container">
      <Paper variant="outlined" className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <Leaf size={26} />
          </div>
          <Typography variant="h4" fontWeight={900}>
            Create Account
          </Typography>
          <Typography color="text.secondary">Start tracking plant health assessments.</Typography>
        </div>

        <form onSubmit={registerUser} className="auth-form">
          <TextField fullWidth type="email" name="email" label="Email" required />
          <TextField fullWidth type="password" name="password" label="Password" required />
          <TextField
            fullWidth
            type="password"
            name="confirm_password"
            label="Confirm Password"
            required
          />
          <Button type="submit" variant="contained" fullWidth size="large">
            Register
          </Button>
        </form>

        <Typography className="auth-link" color="text.secondary">
          Already have an account? <Link to="/login">Login</Link>
        </Typography>
      </Paper>
    </div>
  );
};

export default RegisterPage;
