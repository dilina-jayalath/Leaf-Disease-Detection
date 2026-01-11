import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import AuthContext from '../context/AuthContext';
import { User, Mail, Trash2, Save, AlertTriangle } from 'lucide-react';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user, logoutUser } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('profile/');
            setEmail(response.data.email);
        } catch (err) {
            console.error("Failed to fetch profile:", err);
            setError("Could not load profile data.");
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg('');

        try {
            await api.put('profile/', { email });
            setSuccessMsg("Profile updated successfully! NOTE: If you changed your email, please re-login.");
            setIsEditing(false);
            // Optionally force logout if email changed, as username is email
            if (user.username !== email) {
                setTimeout(() => logoutUser(), 2000);
            }
        } catch (err) {
            console.error("Update failed:", err);
            setError(err.response?.data?.email?.[0] || "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Are you SURE you want to delete your account? This action cannot be undone.")) {
            try {
                await api.delete('profile/delete/');
                logoutUser();
            } catch (err) {
                console.error("Delete failed:", err);
                alert("Failed to delete account. Please try again.");
            }
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div className="profile-avatar-large">
                    {email ? email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="profile-info">
                    <h1>My Profile</h1>
                    <p>Manage your account settings and preferences.</p>
                </div>
            </div>

            {error && <div className="alert-error" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
            {successMsg && <div className="alert-success" style={{ color: 'green', marginBottom: '1rem' }}>{successMsg}</div>}

            <div className="profile-section">
                <h2>Account Details</h2>
                <form onSubmit={handleUpdate}>
                    <div className="form-group">
                        <label>Email Address / Username</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="email"
                                className="form-input"
                                style={{ paddingLeft: '2.5rem' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={!isEditing}
                                required
                            />
                        </div>
                    </div>

                    {!isEditing ? (
                        <button type="button" className="btn-primary" onClick={() => setIsEditing(true)}>
                            Edit Profile
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                <Save size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => { setIsEditing(false); fetchProfile(); }} style={{ padding: '0.75rem 1.5rem', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    )}
                </form>
            </div>

            <div className="profile-section">
                <div className="danger-zone">
                    <h3>Delete Account</h3>
                    <p>Once you delete your account, there is no going back. Please be certain.</p>
                    <button className="btn-danger" onClick={handleDelete}>
                        <Trash2 size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
