// Updated App.js with Data Manager Route
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import RecordHeadache from './pages/RecordHeadache';
import RecordSleep from './pages/RecordSleep';
import RecordStress from './pages/RecordStress';
import RecordNutrition from './pages/RecordNutrition';
import RecordExercise from './pages/RecordExercise';
import RecordBodyPain from './pages/RecordBodyPain';
import RecordMedication from './pages/RecordMedication';
import DataManager from './pages/DataManager'; // NEW: Data Manager page
import AdminStats from './pages/AdminStats';
import PrivateRoute from './components/PrivateRoute';
import HeadacheList from './pages/HeadacheList';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            <Route path="/data-manager" element={
              <PrivateRoute>
                <DataManager />
              </PrivateRoute>
            } />
            
            <Route path="/admin-stats" element={
              <PrivateRoute>
                <AdminStats />
              </PrivateRoute>
            } />
            
            <Route path="/record-headache" element={
              <PrivateRoute>
                <RecordHeadache />
              </PrivateRoute>
            } />
            
            <Route path="/record-sleep" element={
              <PrivateRoute>
                <RecordSleep />
              </PrivateRoute>
            } />
            
            <Route path="/record-stress" element={
              <PrivateRoute>
                <RecordStress />
              </PrivateRoute>
            } />
            
            <Route path="/record-nutrition" element={
              <PrivateRoute>
                <RecordNutrition />
              </PrivateRoute>
            } />
            
            <Route path="/record-exercise" element={
              <PrivateRoute>
                <RecordExercise />
              </PrivateRoute>
            } />
            
            <Route path="/record-body-pain" element={
              <PrivateRoute>
                <RecordBodyPain />
              </PrivateRoute>
            } />
            
            <Route path="/record-medication" element={
              <PrivateRoute>
                <RecordMedication />
              </PrivateRoute>
            } />

            <Route path="/headaches" element={<HeadacheList />} />
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
