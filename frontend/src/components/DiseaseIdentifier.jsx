import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import api from '../api';
import './DiseaseIdentifier.css';

const DiseaseIdentifier = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setPrediction(null);
            setError(null);
        }
    };

    const handlePredict = async () => {
        if (!selectedImage) return;

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', selectedImage);

        try {
            const response = await api.post('predict/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log("Prediction Result:", response.data);
            setPrediction(response.data);
        } catch (err) {
            console.error("Prediction failed:", err);
            setError("Failed to analyze image. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="identifier-container">
            <div className="upload-section">
                <h2>Identify Plant Disease</h2>
                <p>Upload a clear photo of the plant leaf.</p>

                <div className="image-preview-area">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="image-preview" />
                    ) : (
                        <div className="placeholder">
                            <Upload size={48} className="upload-icon" />
                            <span>No image selected</span>
                        </div>
                    )}
                </div>

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="file-upload"
                    className="file-input"
                />
                <label htmlFor="file-upload" className="file-label">
                    Choose Image
                </label>

                <button
                    onClick={handlePredict}
                    disabled={!selectedImage || loading}
                    className="predict-btn"
                >
                    {loading ? (
                        <>
                            <Loader className="spin" size={20} /> Analyzing...
                        </>
                    ) : (
                        "Analyze Disease"
                    )}
                </button>

                {error && (
                    <div className="error-message">
                        <AlertCircle size={20} /> {error}
                    </div>
                )}
            </div>

            {prediction && (
                <div className="result-section">
                    <h3>Analysis Result</h3>
                    <div className="result-card">
                        <div className="result-header">
                            {prediction.disease_details ? (
                                <span className="disease-name status-bad">{prediction.disease_details.name}</span>
                            ) : (
                                <span className="disease-name status-unknown">Unknown / Healthy</span>
                            )}
                            <span className="confidence-badge">
                                Confidence: {(prediction.confidence * 100).toFixed(1)}%
                            </span>
                        </div>

                        {prediction.disease_details && (
                            <div className="disease-details">
                                <p><strong>Description:</strong> {prediction.disease_details.description}</p>
                                <p><strong>Symptoms:</strong> {prediction.disease_details.symptoms}</p>
                                <p><strong>Prevention:</strong> {prediction.disease_details.prevention}</p>
                                <p><strong>Treatment:</strong> {prediction.disease_details.treatment}</p>
                            </div>
                        )}

                        {!prediction.disease && (
                            <p className="note">
                                The model couldn't confidently identify a specific disease from our database.
                                It might be distinct or healthy.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiseaseIdentifier;
