import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const [error, setError] = useState('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    setError('');

    try {
      await logout();
      navigate('/login');
    } catch {
      setError('Failed to log out');
    }
  }

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Welcome to Your Headache Journal{currentUser?.email && `, ${currentUser.email}`}</h1>
        <button onClick={handleLogout} className="btn btn-secondary">
          Log Out
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="quick-track">
        <h2>Quick Headache Report</h2>
        <p>Track a headache episode quickly</p>
        <Link to="/record-headache">
          <button className="quick-track-btn">Report Headache</button>
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>This Week's Overview</h3>
          <p>Track your patterns and identify triggers</p>
          <ul>
            <li>Sleep: Monitor your sleep patterns</li>
            <li>Stress: Track stress levels daily</li>
            <li>Exercise: Log physical activity</li>
            <li>Nutrition: Record meals and drinks</li>
          </ul>
        </div>

        <div className="stat-card">
          <h3>Recent Activity</h3>
          <p>Your latest entries will appear here</p>
          <p><em>Start tracking to see your patterns!</em></p>
        </div>

        <div className="stat-card">
          <h3>AI Insights</h3>
          <p>Personalized recommendations based on your data</p>
          <p><em>Continue tracking for personalized insights</em></p>
        </div>
      </div>

      <div className="quick-links">
        <Link to="/record-headache">Record Headache</Link>
        <Link to="/record-sleep">Record Sleep</Link>
        <Link to="/record-nutrition">Record Nutrition</Link>
        <Link to="/record-exercise">Record Exercise</Link>
        <Link to="/record-stress">Record Stress</Link>
        <Link to="/record-body-pain">Record Body Pain</Link>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#e3f2fd', borderRadius: '8px' }}>
        <h3>Getting Started</h3>
        <p>Welcome! Start by tracking your daily activities and any headaches you experience. 
        The more data you provide, the better our AI can help identify your personal triggers.</p>
        <p><strong>Tip:</strong> Try to log entries daily for the most accurate insights.</p>
      </div>
    </div>
  );
}
