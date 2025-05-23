import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordExercise() {
  const { currentUser } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));
  const [exercises, setExercises] = useState('');
  const [duration, setDuration] = useState(30);
  const [type, setType] = useState('');
  const [intensity, setIntensity] = useState('moderate');
  const [activities, setActivities] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warning, setWarning] = useState('');
  
  const exerciseTypes = [
    'Walking', 'Running', 'Cycling', 'Swimming', 'Yoga', 
    'Pilates', 'Strength training', 'HIIT', 'Cardio', 
    'Dancing', 'Hiking', 'Tennis', 'Basketball', 'Soccer',
    'Weightlifting', 'CrossFit', 'Other'
  ];
  
  const intensityLevels = [
    { value: 'light', label: 'Light (can sing while exercising)' },
    { value: 'moderate', label: 'Moderate (can talk but not sing)' },
    { value: 'vigorous', label: 'Vigorous (difficult to talk)' }
  ];
  
  // High-impact exercises that may trigger headaches
  const highImpactExercises = ['running', 'hiit', 'crossfit', 'basketball', 'soccer', 'weightlifting'];
  
  const handleExerciseTypeChange = (selectedType) => {
    setType(selectedType);
    
    // Check if it's a high-impact exercise
    if (highImpactExercises.some(exercise => 
      selectedType.toLowerCase().includes(exercise.toLowerCase()))) {
      setWarning('⚠️ This is a high-impact exercise that may trigger headaches in some people. Consider monitoring if headaches occur after this activity.');
    } else {
      setWarning('');
    }
  };
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      await addDoc(collection(db, 'users', currentUser.uid, 'exercise'), {
        date: new Date(date),
        exercises,
        duration,
        type,
        intensity,
        activities,
        createdAt: new Date()
      });
      
      let successMessage = 'Exercise data recorded successfully!';
      if (duration < 30) {
        successMessage += ' Tip: Aim for at least 30 minutes of exercise daily for optimal health benefits.';
      }
      
      setSuccess(successMessage);
      
      // Reset form
      setExercises('');
      setDuration(30);
      setType('');
      setIntensity('moderate');
      setActivities('');
      setWarning('');
      
    } catch (err) {
      setError('Failed to record exercise data: ' + err.message);
    }
    
    setLoading(false);
  }

  return (
    <div className="form-container" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Record Exercise & Activities</h1>
        <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
      </div>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="notification success">{success}</div>}
      {warning && <div className="warning">{warning}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Exercises</label>
          <textarea
            value={exercises}
            onChange={(e) => setExercises(e.target.value)}
            placeholder="Describe your exercises and activities..."
            rows="4"
            required
          />
          <small style={{ color: '#666' }}>
            Describe what exercises you did today (e.g., "30 minutes of walking in the park, 15 minutes of stretching")
          </small>
        </div>
        
        <div className="form-group">
          <label>Primary Exercise Type</label>
          <select
            value={type}
            onChange={(e) => handleExerciseTypeChange(e.target.value)}
            required
          >
            <option value="">Select Exercise Type</option>
            {exerciseTypes.map(exType => (
              <option key={exType} value={exType}>
                {exType}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Duration: {duration} minutes</label>
          <input
            type="range"
            min="5"
            max="180"
            step="5"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
            <span>5 min</span>
            <span>3 hours</span>
          </div>
          {duration < 30 && (
            <small style={{ color: '#dc3545' }}>
              Recommended: At least 30 minutes of exercise daily
            </small>
          )}
        </div>
        
        <div className="form-group">
          <label>Exercise Intensity</label>
          <div className="radio-group">
            {intensityLevels.map(level => (
              <label key={level.value} className="radio-label">
                <input
                  type="radio"
                  name="intensity"
                  value={level.value}
                  checked={intensity === level.value}
                  onChange={(e) => setIntensity(e.target.value)}
                />
                {level.label}
              </label>
            ))}
          </div>
        </div>
        
        <div className="form-group">
          <label>Other Activities</label>
          <textarea
            value={activities}
            onChange={(e) => setActivities(e.target.value)}
            placeholder="Other physical activities (driving, heavy lifting, painting, etc.)"
            rows="3"
          />
          <small style={{ color: '#666' }}>
            Include activities like driving long distances, heavy lifting, painting, gardening, etc.
          </small>
        </div>
        
        <div style={{ background: '#e3f2fd', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <h4>💡 Exercise & Headache Tips:</h4>
          <ul style={{ marginLeft: '1rem', fontSize: '0.9rem' }}>
            <li>Stay hydrated before, during, and after exercise</li>
            <li>Warm up properly to prevent sudden strain</li>
            <li>Avoid exercising in extreme heat or cold</li>
            <li>If you're prone to exercise-induced headaches, consider lower-impact activities</li>
            <li>Regular, moderate exercise can actually help prevent headaches</li>
          </ul>
        </div>
        
        <button type="submit" disabled={loading || !exercises || !type} className="btn">
          {loading ? 'Recording...' : 'Record Exercise'}
        </button>
      </form>
    </div>
  );
}