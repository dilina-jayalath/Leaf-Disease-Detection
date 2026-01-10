import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2 } from 'lucide-react';
import api from '../api';
import './DiseaseList.css';

const DiseaseList = () => {
    const [diseases, setDiseases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('diseases/')
            .then(res => {
                setDiseases(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching diseases:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="loading">Loading diseases...</div>;

    return (
        <div className="disease-list-container">
            <div className="disease-grid">
                {diseases.map(disease => (
                    <div key={disease.id} className="disease-card">
                        {disease.image ? (
                            <img
                                src={disease.image.startsWith('http') ? disease.image : `http://localhost:8000${disease.image}`}
                                alt={disease.name}
                                className="disease-image"
                            />
                        ) : (
                            <div className="no-image">No Image</div>
                        )}
                        <div className="disease-info">
                            <h3>{disease.name}</h3>
                            <p>{disease.description.substring(0, 80)}...</p>

                            <div className="card-actions">
                                <Link to={`/disease/${disease.id}`} className="btn-primary">View Details</Link>
                                <button className="btn-outline" title="Edit">
                                    <Edit2 size={16} />
                                </button>
                                <button className="btn-outline" title="Delete">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DiseaseList;
