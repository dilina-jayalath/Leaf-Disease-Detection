import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Eye, EyeOff, KeyRound, MailCheck } from 'lucide-react';
import api from '../api';
import './Auth.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const canSubmitReset =
    otp.length === 6 && password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('password-reset/request/', { email: email.trim() });
      setMessage(response.data.detail);
      setStep('confirm');
    } catch (err) {
      console.error('Password reset request failed:', err);
      setError(err.response?.data?.email?.[0] || 'Could not send OTP. Please check the email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('password-reset/confirm/', {
        email: email.trim(),
        otp,
        password,
        confirm_password: confirmPassword,
      });
      setMessage(response.data.detail);
      setOtp('');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err) {
      console.error('Password reset confirm failed:', err);
      const data = err.response?.data;
      const firstError =
        data?.otp?.[0] ||
        data?.password?.[0] ||
        data?.confirm_password?.[0] ||
        data?.non_field_errors?.[0] ||
        'Could not update password. Check the OTP and password.';
      setError(firstError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Paper variant="outlined" className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            {step === 'request' ? <KeyRound size={26} /> : <MailCheck size={26} />}
          </div>
          <Typography variant="h4" fontWeight={900}>
            Reset Password
          </Typography>
          <Typography color="text.secondary">
            {step === 'request'
              ? 'Enter your account email to receive a one-time code.'
              : 'Enter the OTP from your email and choose a new password.'}
          </Typography>
        </div>

        <Stack spacing={1.5}>
          {message && <Alert severity="success">{message}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>

        {step === 'request' ? (
          <form onSubmit={handleRequestOtp} className="auth-form">
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="auth-form">
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <TextField
              fullWidth
              label="OTP"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputProps={{ inputMode: 'numeric', maxLength: 6 }}
              helperText="Enter the 6-digit code sent to your email."
              required
            />
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="New password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
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
            <TextField
              fullWidth
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        edge="end"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading || !canSubmitReset}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
            <Button
              type="button"
              variant="text"
              fullWidth
              disabled={loading}
              onClick={() => {
                setStep('request');
                setMessage('');
                setError('');
              }}
            >
              Send a new OTP
            </Button>
          </form>
        )}

        <Typography className="auth-link" color="text.secondary">
          Remembered your password? <Link to="/login">Login</Link>
        </Typography>
      </Paper>
    </div>
  );
};

export default ForgotPasswordPage;
