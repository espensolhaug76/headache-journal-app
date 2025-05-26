import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordHeadache() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    painLevel: 5,
    location: 'Tension Headache'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const headacheTypes = [
    'Tension Headache',
    'Migraine Headache', 
    'Cluster Headache',
    'Sinus Headache'
  ];

  const getPainLevelColor = (level) => {
    if (level <= 3) return '#28a745';
    if (level <= 6) return '#ffc107';
    if (level <= 8) return '#fd7e14';
    return '#dc3545';
  };

  const getPainLevelText = (level) => {
    if (level <= 2) return 'Mild';
    if (level <= 4) return 'Moderate';
    if (level <= 6) return 'Strong';
    if (level <= 8) return 'Severe';
    return 'Extreme';
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setError('You must be logged in to record headaches');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const now = new Date();
      const headacheData = {
        userId: currentUser.uid,
        painLevel: parseInt(formData.painLevel),
        location: formData.location,
        startTime: Timestamp.fromDate(now),
        endTime: Timestamp.fromDate(now),
        duration: 0,
        createdAt: Timestamp.now(),
        date: now.toISOString().split('T')[0]
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'headaches'), headacheData);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording headache:', error);
      setError('Failed to record headache. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      color: '#000000',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
        integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
        crossOrigin="anonymous" 
        referrerPolicy="no-referrer" 
      />

      <div style={{ maxWidth: '500px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            margin: '0 0 1rem 0',
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1E3A8A'
          }}>
            <i className="fas fa-head-side-virus" style={{ marginRight: '0.5rem' }}></i>
            Record Headache
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '1.1rem', margin: 0 }}>
            Quick headache logging
          </p>
        </div>

        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h3 style={{ color: '#4682B4', marginBottom: '1rem' }}>Pain Level</h3>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            color: getPainLevelColor(formData.painLevel)
          }}>
            {formData.painLevel}/10
          </div>
          <div style={{
            fontSize: '1.2rem',
            marginBottom: '1.5rem',
            color: getPainLevelColor(formData.painLevel),
            fontWeight: '600'
          }}>
            {getPainLevelText(formData.painLevel)}
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.painLevel}
            onChange={(e) => setFormData(prev => ({ ...prev, painLevel: e.target.value }))}
            style={{
              width: '100%',
              height: '12px',
              borderRadius: '6px',
              background: 'linear-gradient(to right, #28a745 0%, #ffc107 50%, #dc3545 100%)',
              outline: 'none',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#4682B4', marginBottom: '1rem', textAlign: 'center' }}>Headache Type</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {headacheTypes.map(type => (
              <button
                key={type}
                onClick={() => setFormData(prev => ({ ...prev, location: type }))}
                style={{
                  padding: '1rem',
                  background: formData.location === type 
                    ? 'linear-gradient(135deg, #4682B4, #2c5aa0)'
                    : '#FFFFFF',
                  border: formData.location === type 
                    ? 'none'
                    : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '1rem',
                  fontWeight: formData.location === type ? '600' : '400',
                  color: formData.location === type ? 'white' : '#000000',
                  textAlign: 'center'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            background: '#f8d7da',
            border: '1px solid #dc3545',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '2rem',
            color: '#721c24',
            textAlign: 'center'
          }}>
            <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            to="/dashboard"
            style={{
              background: 'transparent',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              color: '#4B5563',
              padding: '12px 20px',
              textDecoration: 'none',
              fontSize: '1rem'
            }}
          >
            <i className="fas fa-times" style={{ marginRight: '0.5rem' }}></i>
            Cancel
          </Link>
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: loading ? '#E5E7EB' : '#dc3545',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              padding: '12px 24px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Saving...</>
            ) : (
              <><i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>Record Headache</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
