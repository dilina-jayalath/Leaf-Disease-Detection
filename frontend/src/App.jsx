import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthContext from './context/AuthContext';
import Layout from './components/Layout';
import DiseaseList from './components/DiseaseList';
import DiseaseDetail from './components/DiseaseDetail';
import DiseaseIdentifier from './components/DiseaseIdentifier';
import Chatbot from './components/Chatbot';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';
import './App.css';

const PrivateRoute = ({ children, title }) => {
  let { user } = useContext(AuthContext);
  if (!user) {
    return <Navigate to="/login" />;
  }
  return <Layout title={title}>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route path="/" element={
              <PrivateRoute title="Recent Assessments">
                <DiseaseList showStats={true} />
              </PrivateRoute>
            } />
            <Route path="/diseases" element={
              <PrivateRoute title="Manage Diseases">
                <DiseaseList showStats={false} />
              </PrivateRoute>
            } />
            <Route path="/disease/:id" element={
              <PrivateRoute title="Disease Details">
                <DiseaseDetail />
              </PrivateRoute>
            } />
            <Route path="/chat" element={
              <PrivateRoute title="AI Assistant">
                <Chatbot />
              </PrivateRoute>
            } />
            <Route path="/identify" element={
              <PrivateRoute title="Identify Disease">
                <DiseaseIdentifier />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute title="User Profile">
                <ProfilePage />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
