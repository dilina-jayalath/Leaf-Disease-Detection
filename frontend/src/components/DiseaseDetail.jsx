import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import './DiseaseDetail.css';

const DiseaseDetail = () => {
    const { id } = useParams();
    const [disease, setDisease] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`diseases/${id}/`)
            .then(res => {
                setDisease(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching disease details:", err);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div className="loading">Loading details...</div>;
    if (!disease) return <div className="error">Disease not found.</div>;

    return (
        <div className="disease-detail-container">
            <Link to="/" className="back-link">← Back to List</Link>
            <div className="detail-card">
                {disease.image && (
                    <img src={disease.image} alt={disease.name} className="detail-image" />
                )}
                <h1>{disease.name}</h1>

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
        </div>
    );
};

export default DiseaseDetail;
