import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2 } from 'lucide-react';
import api from '../api';
import './DiseaseList.css';

const DiseaseList = ({ showStats = true }) => {
    const [diseases, setDiseases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const endpoint = showStats ? 'predictions/' : 'diseases/';

        api.get(endpoint)
            .then(res => {
                let data = res.data;
                // If fetching predictions, map them to a standardized format
                if (showStats) {
                    data = data.map(item => ({
                        id: item.disease, // Use Disease ID for navigation
                        uniqueKey: `pred-${item.id}`, // Unique key for React list
                        name: item.disease_details ? item.disease_details.name : "Unknown",
                        description: item.disease_details ? item.disease_details.description : "No description available.",
                        image: item.image, // Use the uploaded prediction image
                        timestamp: item.timestamp,
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
                                <p>{disease.description.length > 60 ? disease.description.substring(0, 60) + "..." : disease.description}</p>

                                <div className="card-actions">
                                    <Link to={`/disease/${disease.id}`} className="btn-primary">View Report</Link>
                                    <button className="btn-icon" title="Delete">
                                        <Trash2 size={18} />
                                    </button>
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
        </div>
    );
};

export default DiseaseList;
