import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Chip, Paper, TextareaAutosize, Typography } from '@mui/material';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  FileText,
  ImageIcon,
  Trash2,
} from 'lucide-react';
import api from '../api';
import './DiseaseList.css';

const truncateText = (value, limit = 96) => {
  if (!value) return 'No description available.';
  return value.length > limit ? `${value.substring(0, limit)}...` : value;
};

const DiseaseList = ({ showStats = true }) => {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [editingId, setEditingId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const endpoint = showStats ? 'predictions/' : 'diseases/';

    api
      .get(endpoint)
      .then((res) => {
        let data = res.data;

        if (showStats) {
          data = data.map((item) => ({
            id: item.id,
            diseaseId: item.disease,
            uniqueKey: `pred-${item.id}`,
            name: item.disease_details ? item.disease_details.name : 'Unknown',
            description: item.disease_details
              ? item.disease_details.description
              : 'No description available.',
            image: item.image,
            timestamp: item.timestamp,
            notes: item.notes || '',
            isPrediction: true,
          }));
        }

        setDiseases(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, [showStats]);

  const searchQuery = searchParams.get('search')?.trim().toLowerCase() || '';
  const filteredDiseases = diseases.filter((disease) => {
    if (!searchQuery) return true;

    const searchableText = [
      disease.name,
      disease.description,
      disease.notes,
      disease.timestamp,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(searchQuery);
  });

  const stats = {
    total: filteredDiseases.length,
    healthy: filteredDiseases.filter((d) => d.name.toLowerCase().includes('healthy')).length,
    attention: filteredDiseases.filter((d) => !d.name.toLowerCase().includes('healthy')).length,
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this assessment?')) {
      api
        .delete(`predictions/${id}/`)
        .then(() => {
          setDiseases(diseases.filter((d) => d.id !== id));
        })
        .catch((err) => console.error('Error deleting:', err));
    }
  };

  const handleEditClick = (disease) => {
    setEditingId(disease.id);
    setNoteText(disease.notes || '');
    setShowEditModal(true);
  };

  const handleSaveNote = () => {
    api
      .patch(`predictions/${editingId}/`, { notes: noteText })
      .then(() => {
        setDiseases(diseases.map((d) => (d.id === editingId ? { ...d, notes: noteText } : d)));
        setShowEditModal(false);
      })
      .catch((err) => console.error('Error updating note:', err));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div>
          <div className="loader" />
          <p>Loading plant records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {showStats && (
        <div className="stats-row">
          <Paper variant="outlined" className="stat-card">
            <div className="stat-icon stat-total">
              <Activity size={24} />
            </div>
            <div className="stat-info">
              <h3>Total assessments</h3>
              <p>{stats.total}</p>
            </div>
          </Paper>
          <Paper variant="outlined" className="stat-card">
            <div className="stat-icon stat-healthy">
              <CheckCircle2 size={24} />
            </div>
            <div className="stat-info">
              <h3>Healthy plants</h3>
              <p>{stats.healthy}</p>
            </div>
          </Paper>
          <Paper variant="outlined" className="stat-card">
            <div className="stat-icon stat-attention">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-info">
              <h3>Needs attention</h3>
              <p>{stats.attention}</p>
            </div>
          </Paper>
        </div>
      )}

      <div className="section-header">
        <div>
          <span className="section-kicker">{showStats ? 'Field activity' : 'Reference records'}</span>
          <h2 className="section-title">{showStats ? 'Recent Assessments' : 'Disease Library'}</h2>
        </div>
        {searchQuery && (
          <p className="search-summary">
            Showing {filteredDiseases.length} of {diseases.length} result
            {filteredDiseases.length === 1 ? '' : 's'} for "{searchParams.get('search')}"
          </p>
        )}
      </div>

      <div className="disease-grid">
        {filteredDiseases.map((disease) => {
          const isHealthy = disease.name.toLowerCase().includes('healthy');
          const detailUrl = `/disease/${disease.diseaseId || disease.id}${
            showStats ? `?predictionId=${disease.id}` : ''
          }`;

          return (
            <Paper
              component="article"
              variant="outlined"
              key={disease.uniqueKey || disease.id}
              className={`disease-card ${isHealthy ? 'card-healthy' : 'card-alert'}`}
            >
              <div className="image-container">
                {disease.image ? (
                  <img
                    src={
                      disease.image.startsWith('http')
                        ? disease.image
                        : `http://localhost:8000${disease.image}`
                    }
                    alt={disease.name}
                    className="disease-image"
                  />
                ) : (
                  <div className="no-image">
                    <ImageIcon size={32} />
                    <span>No image</span>
                  </div>
                )}
                <Chip
                  className="status-badge"
                  color={isHealthy ? 'success' : 'warning'}
                  label={isHealthy ? 'Healthy' : 'Detected'}
                  size="small"
                />
              </div>

              <div className="disease-info">
                <div className="disease-card-heading">
                  <h3>{disease.name}</h3>
                  {disease.timestamp && (
                    <span>{new Date(disease.timestamp).toLocaleDateString()}</span>
                  )}
                </div>
                <p>
                  {disease.notes ? (
                    <>
                      <FileText size={15} />
                      <strong>{truncateText(disease.notes, 88)}</strong>
                    </>
                  ) : (
                    truncateText(disease.description)
                  )}
                </p>

                <div className="card-actions">
                  <Button component={Link} to={detailUrl} variant="contained" className="view-report-btn">
                    View Report
                  </Button>
                  {showStats && (
                    <>
                      <button
                        className="btn-icon"
                        title="Edit note"
                        aria-label="Edit note"
                        onClick={() => handleEditClick(disease)}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className="btn-icon danger-icon"
                        title="Delete assessment"
                        aria-label="Delete assessment"
                        onClick={() => handleDelete(disease.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Paper>
          );
        })}
      </div>

      {filteredDiseases.length === 0 && (
        <div className="empty-state">
          <FileText size={36} />
          <p>
            {searchQuery
              ? `No results found for "${searchParams.get('search')}".`
              : 'No plant records yet. Start with a leaf assessment.'}
          </p>
          {!searchQuery && (
            <Button component={Link} to="/identify" variant="contained">
              Identify Now
            </Button>
          )}
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <Typography variant="h6" fontWeight={900}>
              Edit Assessment Note
            </Typography>
            <TextareaAutosize
              className="form-textarea"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a short note about this assessment"
              minRows={5}
            />
            <div className="modal-actions">
              <Button variant="outlined" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSaveNote}>
                Save Note
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiseaseList;
