import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordHeadache() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    painLevel: 5,
    location: '',
    startTime: new Date().toISOString().slice(0, 16), // Current time in YYYY-MM-DDTHH:MM format
    duration: '',
    symptoms: [],
    triggers: [],
    notes: ''
  });

  // Predefined options
  const headacheLocations = [
    'Frontal (forehead)',
    'Temporal (temples)',
    'Occipital (back of head)',
    'Parietal (top of head)',
    'Cluster (around eye)',
    'Sinus (cheek/forehead)',
    'Tension (band around head)',
    'Migraine (one side)',
    'Cervicogenic (neck-related)',
    'Other'
  ];

  const commonSymptoms = [
    'Nausea',
    'Vomiting', 
    'Light sensitivity',
    'Sound sensitivity',
    'Visual aura',
    'Dizziness',
    'Fatigue',
    'Irritability',
    'Difficulty concentrating',
    'Neck stiffness',
    'Runny nose',
    'Tearing'
  ];

  const commonTriggers = [
    'Stress',
    'Poor sleep',
    'Skipped meal',
    'Caffeine',
    'Alcohol',
    'Weather change',
    'Bright lights',
    'Loud noise',
    'Strong smell',
    'Exercise',
    'Hormonal changes',
    'Food triggers'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e, category) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [category]: checked 
        ? [...prev[category], value]
        : prev[category].filter(item => item !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to record headaches');
      return;
    }

    if (!formData.location) {
      setError('Please select a headache location');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create headache record
      const headacheData = {
        userId: currentUser.uid,
        painLevel: parseInt(formData.painLevel),
        location: formData.location,
        startTime: Timestamp.fromDate(new Date(formData.startTime)),
        duration: formData.duration,
        symptoms: formData.symptoms,
        triggers: formData.triggers,
        notes: formData.notes,
        createdAt: Timestamp.now(),
        date: new Date(formData.startTime).toISOString().split('T')[0] // For easy querying
      };

      // Save to user's headaches subcollection
      await addDoc(collection(db, 'users', currentUser.uid, 'headaches'), headacheData);
      
      setSuccess('Headache recorded successfully!');
      
      // Reset form
      setFormData({
        painLevel: 5,
        location: '',
        startTime: new Date().toISOString().slice(0, 16),
        duration: '',
        symptoms: [],
        triggers: [],
        notes: ''
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error recording headache:', error);
      setError('Failed to record headache. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      color: '#ffffff',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: '2rem',
              background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Record Headache
            </h1>
            <Link 
              to="/dashboard" 
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                textDecoration: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(220, 53, 69, 0.2)',
            border: '1px solid #dc3545',
            borderRadius: '10px',
            padding: '15px',
            marginBottom: '20px',
            color: '#ff6b6b'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(40, 167, 69, 0.2)',
            border: '1px solid #28a745',
            borderRadius: '10px',
            padding: '15px',
            marginBottom: '20px',
            color: '#51cf66'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Pain Level */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            padding: '25px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '15px', 
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#ff6b35'
            }}>
              Pain Level: {formData.painLevel}/10
            </label>
            <input
              type="range"
              name="painLevel"
              min="0"
              max="10"
              value={formData.painLevel}
              onChange={handleInputChange}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '5px',
                background: `linear-gradient(to right, #28a745 0%, #ffc107 50%, #dc3545 100%)`,
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '10px',
              fontSize: '0.9rem',
              color: '#ccc'
            }}>
              <span>No Pain</span>
              <span>Mild</span>
              <span>Moderate</span>
              <span>Severe</span>
              <span>Worst</span>
            </div>
          </div>

          {/* Location */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            padding: '25px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '15px', 
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#2c5aa0'
            }}>
              Headache Location *
            </label>
            <select
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '1rem'
              }}
            >
              <option value="" style={{ background: '#2d2d2d', color: '#fff' }}>Select location...</option>
              {headacheLocations.map(location => (
                <option key={location} value={location} style={{ background: '#2d2d2d', color: '#fff' }}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* Time & Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '15px',
              padding: '25px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '15px', 
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#28a745'
              }}>
                Start Time
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '15px',
              padding: '25px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '15px', 
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#28a745'
              }}>
                Duration
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g., 2 hours, 30 minutes"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          {/* Symptoms */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            padding: '25px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '15px', 
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#17a2b8'
            }}>
              Symptoms
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '10px' 
            }}>
              {commonSymptoms.map(symptom => (
                <label key={symptom} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'background 0.2s'
                }}>
                  <input
                    type="checkbox"
                    value={symptom}
                    checked={formData.symptoms.includes(symptom)}
                    onChange={(e) => handleCheckboxChange(e, 'symptoms')}
                  />
                  <span>{symptom}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Triggers */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            padding: '25px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '15px', 
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#ffc107'
            }}>
              Possible Triggers
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '10px' 
            }}>
              {commonTriggers.map(trigger => (
                <label key={trigger} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'background 0.2s'
                }}>
                  <input
                    type="checkbox"
                    value={trigger}
                    checked={formData.triggers.includes(trigger)}
                    onChange={(e) => handleCheckboxChange(e, 'triggers')}
                  />
                  <span>{trigger}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            padding: '25px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '15px', 
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#6c757d'
            }}>
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any additional details about your headache..."
              rows="4"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '1rem',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading} 
            style={{
              width: '100%',
              padding: '15px',
              background: loading 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, #ff6b35 0%, #cc4a1a 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Recording Headache...' : 'Record Headache'}
          </button>
        </form>
      </div>
    </div>
  );
}
