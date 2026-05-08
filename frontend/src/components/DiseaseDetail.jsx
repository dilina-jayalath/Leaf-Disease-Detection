import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextareaAutosize,
  Typography,
} from '@mui/material';
import {
  ArrowLeft,
  Edit2,
  FlaskConical,
  ShieldCheck,
  Stethoscope,
  TriangleAlert,
} from 'lucide-react';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    const fetchDisease = api.get(`diseases/${id}/`);
    const fetchPrediction = predictionId
      ? api.get(`predictions/${predictionId}/`)
      : Promise.resolve({ data: null });

    Promise.all([fetchDisease, fetchPrediction])
      .then(([diseaseRes, predictionRes]) => {
        setDisease(diseaseRes.data);
        if (predictionRes.data) {
          setPrediction(predictionRes.data);
          setNoteText(predictionRes.data.notes || '');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching details:', err);
        setLoading(false);
      });
  }, [id, predictionId]);

  const handleSaveNote = () => {
    if (!prediction) return;

    api
      .patch(`predictions/${prediction.id}/`, { notes: noteText })
      .then(() => {
        setPrediction({ ...prediction, notes: noteText });
        setShowEditModal(false);
      })
      .catch((err) => console.error('Error updating note:', err));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div>
          <div className="loader" />
          <p>Loading disease report...</p>
        </div>
      </div>
    );
  }

  if (!disease) {
    return <div className="state-panel">Disease not found.</div>;
  }

  const imageSrc = prediction?.image || disease.image;
  const isHealthy = disease.name.toLowerCase().includes('healthy');

  return (
    <div className="disease-detail-container">
      <Button component={Link} to="/" variant="text" startIcon={<ArrowLeft size={18} />}>
        Back to dashboard
      </Button>

      <Paper variant="outlined" className="detail-paper">
        {imageSrc && (
          <img
            src={imageSrc.startsWith('http') ? imageSrc : `http://localhost:8000${imageSrc}`}
            alt={disease.name}
            className="detail-image"
          />
        )}

        <div className="detail-content">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
          >
            <div>
              <Typography variant="overline" color="primary" fontWeight={900}>
                Disease report
              </Typography>
              <Typography variant="h4" fontWeight={900}>
                {disease.name}
              </Typography>
            </div>
            <Stack direction="row" spacing={1}>
              <Chip color={isHealthy ? 'success' : 'warning'} label={isHealthy ? 'Healthy' : 'Detected'} />
              {prediction && (
                <Chip
                  variant="outlined"
                  label={new Date(prediction.timestamp).toLocaleDateString()}
                />
              )}
            </Stack>
          </Stack>

          {prediction && (
            <Paper variant="outlined" className="note-section">
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <div>
                  <Typography fontWeight={900}>Assessment Note</Typography>
                  <Typography color="text.secondary" fontSize={14}>
                    {prediction.notes || 'No notes added for this assessment.'}
                  </Typography>
                </div>
                <IconButton onClick={() => setShowEditModal(true)} aria-label="Edit note">
                  <Edit2 size={18} />
                </IconButton>
              </Stack>
            </Paper>
          )}

          <section className="detail-description">
            <Typography variant="h6" fontWeight={900}>
              Description
            </Typography>
            <Typography color="text.secondary">{disease.description}</Typography>
          </section>

          <Divider />

          <div className="info-grid">
            <InfoBox icon={<TriangleAlert size={20} />} title="Symptoms" value={disease.symptoms} />
            <InfoBox icon={<FlaskConical size={20} />} title="Causes" value={disease.causes} />
            <InfoBox icon={<Stethoscope size={20} />} title="Treatment" value={disease.treatment} />
            <InfoBox icon={<ShieldCheck size={20} />} title="Prevention" value={disease.prevention} />
          </div>
        </div>
      </Paper>

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <Typography variant="h6" fontWeight={900}>
              Edit Assessment Note
            </Typography>
            <TextareaAutosize
              className="form-textarea mt-4"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note about this assessment"
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

const InfoBox = ({ icon, title, value }) => (
  <Paper variant="outlined" className="info-box">
    <div className="info-icon">{icon}</div>
    <div>
      <Typography fontWeight={900}>{title}</Typography>
      <Typography color="text.secondary" fontSize={14}>
        {value}
      </Typography>
    </div>
  </Paper>
);

export default DiseaseDetail;
