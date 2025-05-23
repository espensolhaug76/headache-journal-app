import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordStress() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    stressLevel: 5,
    anxietyLevel: 5,
    otherMentalState: '',
    stressTriggers: [],
    mentalIssues: [],
    copingStrategies: [],
    notes: ''
  });

  const commonStressTriggers = [
    'Work pressure',
    'Family issues', 
    'Financial concerns',
    'Health worries',
    'Relationship problems',
    'Social situations',
    'Traffic/Commuting',
    'Time pressure',
    'Technology issues',
    'Sleep problems',
    'Weather changes',
    'Noise',
    'Crowds',
    'Decision making',
    'Deadlines',
    'Conflict',
    'Uncertainty',
    'Perfectionism'
  ];

  const mentalHealthSymptoms = [
    'Depression',
    'Anxiety',
    'Panic attacks',
    'Mood swings',
    'Irritability',
    'Concentration problems',
    'Memory issues',
    'Brain fog',
    'Excessive worry',
    'Social anxiety',
    'Insomnia',
    'Fatigue',
    'Emotional numbness',
    'Overwhelm',
    'Racing thoughts',
    'Low motivation',
    'Restlessness'
  ];

  const copingStrategiesList = [
    'Deep breathing',
    'Meditation',
    'Exercise',
    'Talking to someone',
    'Journaling',
    'Music',
    'Walking',
    'Reading',
    'Hot bath/shower',
    'Progressive muscle relaxation',
    'Mindfulness',
    'Prayer/Spirituality',
    'Creative activities',
    'Time in nature',
    'Yoga',
    'Listening to podcasts'
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

  const getStressLevelColor = (level) => {
    if (level <= 2) return '#28a745'; // Green
    if (level <= 4) return '#20c997'; // Teal
    if (level <= 6) return '#ffc107'; // Yellow
    if (level <= 8) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
  };

  const getStressLevelText = (level) => {
    if (level <= 2) return 'Very Low';
    if (level <= 4) return 'Low';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'High';
    return 'Very High';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to record stress data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create stress record
      const stressData = {
        userId: currentUser.uid,
        date: formData.date,
        stressLevel: parseInt(formData.stressLevel),
        anxietyLevel: parseInt(formData.anxietyLevel),
        otherMentalState: formData.otherMentalState,
        stressTriggers: formData.stressTriggers,
        mentalIssues: formData.mentalIssues,
        copingStrategies: formData.copingStrategies,
        notes: formData.notes,
        createdAt: Timestamp.now()
      };

      // Save to user's stress subcollection
      await addDoc(collection(db, 'users', currentUser.uid, 'stress'), stressData);
      
      let successMessage = 'Stress and mental health data recorded successfully!';
      
      if (formData.stressLevel >= 8 || formData.anxietyLevel >= 8) {
        successMessage += ' Consider stress management techniques or speaking with a healthcare provider if these levels persist.';
      }
      
      setSuccess(successMessage);
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        stressLevel: 5,
        anxietyLevel: 5,
        otherMentalState: '',
        stressTriggers: [],
        mentalIssues: [],
        copingStrategies: [],
        notes: ''
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error recording stress:', error);
      setError('Failed to record stress data. Please try again.');
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
              background: 'linear-gradient(135deg, #17a2b8, #20c997)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🧘 Record Stress & Mental State
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
          {/* Date */}
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
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
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
            />
          </div>

          {/* Stress and Anxiety Levels */}
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
                color: getStressLevelColor(formData.stressLevel)
              }}>
                😰 Stress Level: {formData.stressLevel}/10
              </label>
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '10px',
                fontSize: '0.9rem',
                color: getStressLevelColor(formData.stressLevel),
                fontWeight: '500'
              }}>
                {getStressLevelText(formData.stressLevel)}
              </div>
              <input
                type="range"
                name="stressLevel"
                min="1"
                max="10"
                value={formData.stressLevel}
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
                fontSize: '0.8rem',
                color: '#ccc'
              }}>
                <span>No Stress</span>
                <span>Extreme</span>
              </div>
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
                color: getStressLevelColor(formData.anxietyLevel)
              }}>
                😨 Anxiety Level: {formData.anxietyLevel}/10
              </label>
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '10px',
                fontSize: '0.9rem',
                color: getStressLevelColor(formData.anxietyLevel),
                fontWeight: '500'
              }}>
                {getStressLevelText(formData.anxietyLevel)}
              </div>
              <input
                type="range"
                name="anxietyLevel"
                min="1"
                max="10"
                value={formData.anxietyLevel}
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
                fontSize: '0.8rem',
                color: '#ccc'
              }}>
                <span>No Anxiety</span>
                <span>Severe</span>
              </div>
            </div>
          </div>

          {/* Other Mental State */}
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
              color: '#6f42c1'
            }}>
              Other Mental State
            </label>
            <input
              type="text"
              name="otherMentalState"
              value={formData.otherMentalState}
              onChange={handleInputChange}
              placeholder="e.g., Excited, Confused, Overwhelmed, Hopeful..."
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
            <small style={{ color: '#ccc', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
              Describe any other emotions or mental states you're experiencing
            </small>
          </div>

          {/* Stress Triggers */}
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
              color: '#fd7e14'
            }}>
              Stress Triggers
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '10px' 
            }}>
              {commonStressTriggers.map(trigger => (
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
                    checked={formData.stressTriggers.includes(trigger)}
                    onChange={(e) => handleCheckboxChange(e, 'stressTriggers')}
                  />
                  <span>{trigger}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Mental Health Symptoms */}
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
              color: '#e83e8c'
            }}>
              Mental Health Symptoms
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '10px' 
            }}>
              {mentalHealthSymptoms.map(symptom => (
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
                    checked={formData.mentalIssues.includes(symptom)}
                    onChange={(e) => handleCheckboxChange(e, 'mentalIssues')}
                  />
                  <span>{symptom}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Coping Strategies */}
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
              color: '#28a745'
            }}>
              Coping Strategies Used
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '10px' 
            }}>
              {copingStrategiesList.map(strategy => (
                <label key={strategy} style={{ 
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
                    value={strategy}
                    checked={formData.copingStrategies.includes(strategy)}
                    onChange={(e) => handleCheckboxChange(e, 'copingStrategies')}
                  />
                  <span>{strategy}</span>
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
              placeholder="Any additional notes about your stress levels, mental state, or what helped/didn't help..."
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

          {/* High Stress Warning */}
          {(formData.stressLevel >= 8 || formData.anxietyLevel >= 8) && (
            <div style={{
              background: 'rgba(220, 53, 69, 0.1)',
              border: '1px solid rgba(220, 53, 69, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h4 style={{ color: '#dc3545', margin: '0 0 10px 0', fontSize: '1.1rem' }}>
                ⚠️ High Stress/Anxiety Level Detected
              </h4>
              <p style={{ margin: '0 0 10px 0', color: '#ccc' }}>Consider these immediate stress management techniques:</p>
              <ul style={{ margin: '0 0 15px 0', paddingLeft: '20px', color: '#ccc', fontSize: '0.9rem' }}>
                <li>Deep breathing exercises (4-7-8 technique)</li>
                <li>Progressive muscle relaxation</li>
                <li>Short meditation or mindfulness session</li>
                <li>Light physical activity or stretching</li>
                <li>Speaking with a friend, family member, or professional</li>
                <li>Step away from stressful situations if possible</li>
              </ul>
              <p style={{ margin: 0, color: '#fd7e14', fontSize: '0.9rem', fontWeight: '500' }}>
                <strong>If high stress or anxiety persists, consider speaking with a healthcare provider.</strong>
              </p>
            </div>
          )}

          {/* Stress Management Tips */}
          <div style={{
            background: 'rgba(23, 162, 184, 0.1)',
            border: '1px solid rgba(23, 162, 184, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: '#17a2b8', margin: '0 0 10px 0', fontSize: '1.1rem' }}>
              💡 Daily Stress Management Tips:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
              <div>
                <h5 style={{ color: '#20c997', margin: '0 0 8px 0', fontSize: '1rem' }}>🧘 Mindfulness:</h5>
                <ul style={{ margin: 0, paddingLeft: '15px', color: '#ccc', fontSize: '0.85rem' }}>
                  <li>5-minute daily meditation</li>
                  <li>Deep breathing exercises</li>
                  <li>Body scan techniques</li>
                  <li>Mindful walking</li>
                </ul>
              </div>
              <div>
                <h5 style={{ color: '#28a745', margin: '0 0 8px 0', fontSize: '1rem' }}>💪 Physical:</h5>
                <ul style={{ margin: 0, paddingLeft: '15px', color: '#ccc', fontSize: '0.85rem' }}>
                  <li>Regular exercise routine</li>
                  <li>Adequate sleep (7-9 hours)</li>
                  <li>Limit caffeine intake</li>
                  <li>Stay hydrated</li>
                </ul>
              </div>
              <div>
                <h5 style={{ color: '#ffc107', margin: '0 0 8px 0', fontSize: '1rem' }}>🤝 Social:</h5>
                <ul style={{ margin: 0, paddingLeft: '15px', color: '#ccc', fontSize: '0.85rem' }}>
                  <li>Connect with supportive people</li>
                  <li>Express feelings appropriately</li>
                  <li>Set healthy boundaries</li>
                  <li>Ask for help when needed</li>
                </ul>
              </div>
            </div>
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
                : 'linear-gradient(135deg, #17a2b8 0%, #117a8b 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Recording Stress Data...' : 'Record Stress Data'}
          </button>
        </form>
      </div>
    </div>
  );
}
