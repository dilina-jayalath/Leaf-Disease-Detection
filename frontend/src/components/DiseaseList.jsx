import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2 } from 'lucide-react';
import api from '../api';
import './DiseaseList.css';

const DiseaseList = ({ showStats = true }) => {
    const [diseases, setDiseases] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState(null);
    const [noteText, setNoteText] = useState("");
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        const endpoint = showStats ? 'predictions/' : 'diseases/';

        api.get(endpoint)
            .then(res => {
                let data = res.data;
                // If fetching predictions, map them to a standardized format
                if (showStats) {
                    data = data.map(item => ({
                        id: item.id, // Prediction ID
                        diseaseId: item.disease,
                        uniqueKey: `pred-${item.id}`,
                        name: item.disease_details ? item.disease_details.name : "Unknown",
                        description: item.disease_details ? item.disease_details.description : "No description available.",
                        image: item.image,
                        timestamp: item.timestamp,
                        notes: item.notes || "",
                        isPrediction: true
                    }));
                }
                setDiseases(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching data:", err);
                setLoading(false);
            });
    }, [showStats]);

    // Stats calculation (works for both, but more relevant for predictions)
    const stats = {
        total: diseases.length,
        healthy: diseases.filter(d => d.name.toLowerCase().includes('healthy')).length,
        attention: diseases.filter(d => !d.name.toLowerCase().includes('healthy')).length
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this assessment?")) {
            api.delete(`predictions/${id}/`)
                .then(() => {
                    setDiseases(diseases.filter(d => d.id !== id));
                })
                .catch(err => console.error("Error deleting:", err));
        }
    };

    const handleEditClick = (disease) => {
        setEditingId(disease.id);
        setNoteText(disease.notes || "");
        setShowEditModal(true);
    };

    const handleSaveNote = () => {
        api.patch(`predictions/${editingId}/`, { notes: noteText })
            .then(res => {
                setDiseases(diseases.map(d =>
                    d.id === editingId ? { ...d, notes: noteText } : d
                ));
                setShowEditModal(false);
            })
            .catch(err => console.error("Error updating note:", err));
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loader"></div>
            <p>Loading your dashboard...</p>
        </div>
    );

    return (
        <div className="dashboard-container">
            {/* Statistics Row - Only show if props say so */}
            {showStats && (
                <div className="stats-row">
                    <div className="stat-card total">
                        <div className="stat-icon">🌿</div>
                        <div className="stat-info">
                            <h3>Total Plants</h3>
                            <p>{stats.total}</p>
                        </div>
                    </div>
                    <div className="stat-card healthy">
                        <div className="stat-icon">✨</div>
                        <div className="stat-info">
                            <h3>Healthy</h3>
                            <p>{stats.healthy}</p>
                        </div>
                    </div>
                    <div className="stat-card attention">
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-info">
                            <h3>Attention Needed</h3>
                            <p>{stats.attention}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Disease Grid */}
            <div className="section-header" style={{ marginBottom: '24px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>
                    {showStats ? "Recent Assessments" : "All Records"}
                </h2>
            </div>
            <div className="disease-grid">
                {diseases.map(disease => {
                    const isHealthy = disease.name.toLowerCase().includes('healthy');
                    return (
                        <div key={disease.uniqueKey || disease.id} className={`disease-card ${isHealthy ? 'card-healthy' : 'card-alert'}`}>
                            <div className="image-container">
                                {disease.image ? (
                                    <img
                                        src={disease.image.startsWith('http') ? disease.image : `http://localhost:8000${disease.image}`}
                                        alt={disease.name}
                                        className="disease-image"
                                    />
                                ) : (
                                    <div className="no-image"><span>📷 No Image</span></div>
                                )}
                                <span className={`status-badge ${isHealthy ? 'badge-healthy' : 'badge-alert'}`}>
                                    {isHealthy ? 'Healthy' : 'Detected'}
                                </span>
                            </div>

                            <div className="disease-info">
                                <h3>{disease.name}</h3>
                                <p>{disease.notes ? (<strong>Note: {disease.notes}</strong>) : (disease.description.length > 60 ? disease.description.substring(0, 60) + "..." : disease.description)}</p>

                                <div className="card-actions">
                                    <Link to={`/disease/${disease.diseaseId || disease.id}${showStats ? `?predictionId=${disease.id}` : ''}`} className="btn-primary">View Report</Link>

                                    {showStats && (
                                        <>
                                            <button className="btn-icon" title="Edit Note" onClick={() => handleEditClick(disease)}>
                                                <Edit2 size={18} />
                                            </button>
                                            <button className="btn-icon" title="Delete" onClick={() => handleDelete(disease.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {diseases.length === 0 && (
                <div className="empty-state">
                    <p>No records found. Start by identifying a plant sickness.</p>
                    <Link to="/identify" className="btn-primary">Identify Now</Link>
                </div>
            )}

            {/* Edit Note Modal */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Edit Assessment Note</h3>
                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add a note about this assessment..."
                            rows={4}
                            style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
                        />
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleSaveNote}>Save Note</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiseaseList;
