import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RecordHeadache from './pages/RecordHeadache';
import RecordSleep from './pages/RecordSleep';
import RecordNutrition from './pages/RecordNutrition';
import RecordExercise from './pages/RecordExercise';
import RecordStress from './pages/RecordStress';
import RecordBodyPain from './pages/RecordBodyPain';
import './App.css';

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <div className="nav">
            <div className="nav-content">
              <div className="nav-brand">Headache Journal</div>
            </div>
          </div>
          <div className="container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
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
              <Route path="/record-stress" element={
                <PrivateRoute>
                  <RecordStress />
                </PrivateRoute>
              } />
              <Route path="/record-body-pain" element={
                <PrivateRoute>
                  <RecordBodyPain />
                </PrivateRoute>
              } />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;