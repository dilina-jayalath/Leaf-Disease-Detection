import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Edit2 } from 'lucide-react';
import api from '../api';
import './DiseaseDetail.css';

const DiseaseDetail = () => {
    const { id } = useParams();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const predictionId = queryParams.get('predictionId');

    const [disease, setDisease] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);

    // Edit Note State
    const [showEditModal, setShowEditModal] = useState(false);
    const [noteText, setNoteText] = useState("");

    useEffect(() => {
        setLoading(true);
        // Fetch Disease Details
        const fetchDisease = api.get(`diseases/${id}/`);
        // Fetch Prediction if ID exists
        const fetchPrediction = predictionId ? api.get(`predictions/${predictionId}/`) : Promise.resolve({ data: null });

        Promise.all([fetchDisease, fetchPrediction])
            .then(([diseaseRes, predictionRes]) => {
                setDisease(diseaseRes.data);
                if (predictionRes.data) {
                    setPrediction(predictionRes.data);
                    setNoteText(predictionRes.data.notes || "");
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching details:", err);
                setLoading(false);
            });
    }, [id, predictionId]);

    const handleSaveNote = () => {
        if (!prediction) return;

        api.patch(`predictions/${prediction.id}/`, { notes: noteText })
            .then(res => {
                setPrediction({ ...prediction, notes: noteText });
                setShowEditModal(false);
            })
            .catch(err => console.error("Error updating note:", err));
    };

    if (loading) return <div className="loading">Loading details...</div>;
    if (!disease) return <div className="error">Disease not found.</div>;

    return (
        <div className="disease-detail-container">
            <Link to="/" className="back-link">← Back to List</Link>
            <div className="detail-card">
                {/* Prefer Prediction Image if available (the one user uploaded) */}
                {(prediction?.image || disease.image) && (
                    <img
                        src={(prediction?.image || disease.image).startsWith('http') ? (prediction?.image || disease.image) : `http://localhost:8000${prediction?.image || disease.image}`}
                        alt={disease.name}
                        className="detail-image"
                    />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>{disease.name}</h1>
                    {prediction && (
                        <div className="prediction-meta">
                            <span className="timestamp">{new Date(prediction.timestamp).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                {prediction && (
                    <div className="note-section" style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0, color: '#334155', fontSize: '1.1rem' }}>📝 Assessment Note</h3>
                            <button className="btn-icon" onClick={() => setShowEditModal(true)} title="Edit Note">
                                <Edit2 size={18} />
                            </button>
                        </div>
                        <p style={{ color: '#475569', margin: 0, fontStyle: prediction.notes ? 'normal' : 'italic' }}>
                            {prediction.notes || "No notes added for this assessment."}
                        </p>
                    </div>
                )}

                <section>
                    <h2>Description</h2>
                    <p>{disease.description}</p>
                </section>

                <div className="info-grid">
                    <div className="info-box symptoms">
                        <h3>⚠️ Symptoms</h3>
                        <p>{disease.symptoms}</p>
                    </div>
                    <div className="info-box causes">
                        <h3>🔍 Causes</h3>
                        <p>{disease.causes}</p>
                    </div>
                    <div className="info-box treatment">
                        <h3>💊 Treatment</h3>
                        <p>{disease.treatment}</p>
                    </div>
                    <div className="info-box prevention">
                        <h3>🛡️ Prevention</h3>
                        <p>{disease.prevention}</p>
                    </div>
                </div>
            </div>
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
                            style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
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

export default DiseaseDetail;
