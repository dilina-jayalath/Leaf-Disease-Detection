import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Mail, Save, Trash2 } from 'lucide-react';
import api from '../api';
import AuthContext from '../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchProfile = async () => {
    try {
      const response = await api.get('profile/');
      setEmail(response.data.email);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Could not load profile data.');
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg('');

    try {
      await api.put('profile/', { email });
      setSuccessMsg('Profile updated successfully. Please sign in again if you changed your email.');
      setIsEditing(false);
      if (user.username !== email) {
        setTimeout(() => logoutUser(), 2000);
      }
    } catch (err) {
      console.error('Update failed:', err);
      setError(err.response?.data?.email?.[0] || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setSuccessMsg('');

    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await api.delete('profile/delete/');
        logoutUser();
      } catch (err) {
        console.error('Delete failed:', err);
        setError('Failed to delete account. Please try again.');
      }
    }
  };

  return (
    <div className="profile-container">
      <Paper variant="outlined" className="profile-card">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
        >
          <Avatar className="profile-avatar-large">{email ? email.charAt(0).toUpperCase() : 'U'}</Avatar>
          <div>
            <Typography variant="overline" color="primary" fontWeight={900}>
              Account
            </Typography>
            <Typography variant="h4" fontWeight={900}>
              My Profile
            </Typography>
            <Typography color="text.secondary">Manage login details and account access.</Typography>
          </div>
        </Stack>

        {(error || successMsg) && (
          <Stack spacing={1.5}>
            {error && <Alert severity="error">{error}</Alert>}
            {successMsg && <Alert severity="success">{successMsg}</Alert>}
          </Stack>
        )}

        <Divider />

        <form onSubmit={handleUpdate} className="profile-form">
          <Typography variant="h6" fontWeight={900}>
            Account Details
          </Typography>
          <TextField
            fullWidth
            type="email"
            label="Email address / username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={!isEditing}
            required
            InputProps={{
              startAdornment: <Mail size={18} className="mr-2 text-slate-400" />,
            }}
          />

          {!isEditing ? (
            <Button variant="contained" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button type="submit" variant="contained" disabled={loading} startIcon={<Save size={18} />}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  setIsEditing(false);
                  fetchProfile();
                }}
              >
                Cancel
              </Button>
            </Stack>
          )}
        </form>
      </Paper>

      <Paper variant="outlined" className="danger-zone">
        <Typography variant="h6" fontWeight={900}>
          Delete Account
        </Typography>
        <Typography color="text.secondary">
          Once this account is deleted, your access and saved assessments are removed.
        </Typography>
        <Button variant="contained" color="error" onClick={handleDelete} startIcon={<Trash2 size={18} />}>
          Delete Account
        </Button>
      </Paper>
    </div>
  );
};

export default ProfilePage;
