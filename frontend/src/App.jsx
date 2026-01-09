import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DiseaseList from './components/DiseaseList';
import DiseaseDetail from './components/DiseaseDetail';
import Chatbot from './components/Chatbot';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={
            <Layout title="Disease Overview">
              <DiseaseList />
            </Layout>
          } />
          <Route path="/diseases" element={
            <Layout title="Manage Diseases">
              <DiseaseList />
            </Layout>
          } />
          <Route path="/disease/:id" element={
            <Layout title="Disease Details">
              <DiseaseDetail />
            </Layout>
          } />
          <Route path="/chat" element={
            <Layout title="AI Assistant">
              <Chatbot />
            </Layout>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
