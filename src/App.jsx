import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TopBar from './components/TopBar';

import FleetPage from './pages/Fleet/FleetPage';
import FloatPage from './pages/Float/FloatPage';
import ProfilesPage from './pages/Profiles/ProfilesPage';
import ExportPage from './pages/Export/ExportPage';
import NetworkPage from './pages/Network/NetworkPage';
import ApiPage from './pages/Api/ApiPage';

export default function App() {
  return (
    <div className="app-container">
      <TopBar />
      <Routes>
        <Route path="/" element={<Navigate to="/fleet" replace />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/float/:id" element={<FloatPage />} />
        <Route path="/profiles" element={<ProfilesPage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/api" element={<ApiPage />} />
        <Route path="*" element={<Navigate to="/fleet" replace />} />
      </Routes>
    </div>
  );
}
