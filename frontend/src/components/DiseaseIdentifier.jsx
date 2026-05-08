import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { AlertCircle, CheckCircle, Loader, Upload } from 'lucide-react';
import api from '../api';
import './DiseaseIdentifier.css';

const DiseaseIdentifier = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
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
      setPrediction(response.data);
    } catch (err) {
      console.error('Prediction failed:', err);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confidence = prediction ? Math.round((prediction.confidence || 0) * 100) : 0;
  const diseaseName = prediction?.disease_details?.name || 'Unknown / Healthy';
  const isHealthy = diseaseName.toLowerCase().includes('healthy');

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
      <Paper variant="outlined" className="overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-5">
          <Typography variant="overline" color="primary" fontWeight={900}>
            Leaf scan
          </Typography>
          <Typography variant="h5" fontWeight={800}>
            Identify corn disease
          </Typography>
          <Typography color="text.secondary" className="mt-1">
            Upload a clear leaf image and run the trained ResNet model.
          </Typography>
        </div>

        {loading && <LinearProgress />}

        <div className="p-6">
          <div className="image-preview-area">
            {previewUrl ? (
              <img src={previewUrl} alt="Selected leaf preview" className="image-preview" />
            ) : (
              <div className="placeholder">
                <Upload size={44} />
                <span>Select a leaf image</span>
              </div>
            )}
          </div>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} className="mt-5">
            <Button component="label" variant="outlined" startIcon={<Upload size={18} />}>
              Choose Image
              <input hidden type="file" accept="image/*" onChange={handleImageChange} />
            </Button>
            <Button
              onClick={handlePredict}
              disabled={!selectedImage || loading}
              variant="contained"
              startIcon={loading ? <Loader className="spin" size={18} /> : <CheckCircle size={18} />}
            >
              {loading ? 'Analyzing...' : 'Analyze Disease'}
            </Button>
          </Stack>

          {selectedImage && (
            <Typography className="mt-4" color="text.secondary" fontSize={14}>
              Selected file: {selectedImage.name}
            </Typography>
          )}

          {error && (
            <Alert severity="error" icon={<AlertCircle size={20} />} className="mt-4">
              {error}
            </Alert>
          )}
        </div>
      </Paper>

      <Paper variant="outlined" className="overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-5">
          <Typography variant="overline" color="primary" fontWeight={900}>
            Analysis
          </Typography>
          <Typography variant="h6" fontWeight={800}>
            Result summary
          </Typography>
        </div>

        <div className="p-6">
          {!prediction ? (
            <Box className="grid min-h-72 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <div>
                <Typography fontWeight={800}>No result yet</Typography>
                <Typography color="text.secondary" fontSize={14} className="mt-1">
                  Upload an image and start the analysis.
                </Typography>
              </div>
            </Box>
          ) : (
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography variant="h6" fontWeight={800}>
                  {diseaseName}
                </Typography>
                <Chip
                  color={isHealthy ? 'success' : 'warning'}
                  label={isHealthy ? 'Healthy' : 'Detected'}
                  size="small"
                />
              </Stack>

              <Box>
                <Stack direction="row" justifyContent="space-between" className="mb-2">
                  <Typography fontSize={14} fontWeight={800}>
                    Confidence
                  </Typography>
                  <Typography fontSize={14} color="text.secondary">
                    {confidence}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={confidence}
                  color={isHealthy ? 'success' : 'warning'}
                  sx={{ height: 8, borderRadius: 999 }}
                />
              </Box>

              {prediction.disease_details ? (
                <Stack spacing={1.5}>
                  <Divider />
                  <DetailRow title="Description" value={prediction.disease_details.description} />
                  <DetailRow title="Symptoms" value={prediction.disease_details.symptoms} />
                  <DetailRow title="Prevention" value={prediction.disease_details.prevention} />
                  <DetailRow title="Treatment" value={prediction.disease_details.treatment} />
                </Stack>
              ) : (
                <Alert severity="info">
                  The model could not confidently match this image to a known disease record.
                </Alert>
              )}
            </Stack>
          )}
        </div>
      </Paper>
    </div>
  );
};

const DetailRow = ({ title, value }) => (
  <div>
    <Typography fontSize={13} fontWeight={900} color="text.primary">
      {title}
    </Typography>
    <Typography fontSize={14} color="text.secondary">
      {value}
    </Typography>
  </div>
);

export default DiseaseIdentifier;
