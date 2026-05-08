import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, IconButton, InputAdornment, Paper, TextField, Typography } from '@mui/material';
import { Eye, EyeOff, Leaf } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import './Auth.css';

const LoginPage = () => {
  const { loginUser } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    setErrorMessage('');
    const error = await loginUser(event);

    if (error) {
      setErrorMessage(error);
    }
  };

  return (
    <div className="auth-container">
      <Paper variant="outlined" className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <Leaf size={26} />
          </div>
          <Typography variant="h4" fontWeight={900}>
            VerdantEye
          </Typography>
          <Typography color="text.secondary">Sign in to your crop diagnostics workspace.</Typography>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {errorMessage && (
            <Alert severity="error" variant="outlined">
              {errorMessage}
            </Alert>
          )}
          <TextField
            fullWidth
            type="email"
            name="email"
            label="Email"
            required
            error={Boolean(errorMessage)}
          />
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            name="password"
            label="Password"
            required
            error={Boolean(errorMessage)}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="button"
                      edge="end"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <div className="auth-forgot-row">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <Button type="submit" variant="contained" fullWidth size="large">
            Login
          </Button>
        </form>

        <Typography className="auth-link" color="text.secondary">
          Do not have an account? <Link to="/register">Create one</Link>
        </Typography>
      </Paper>
    </div>
  );
};

export default LoginPage;
