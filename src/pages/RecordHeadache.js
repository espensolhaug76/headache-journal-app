import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordHeadache() {
  const { currentUser } = useAuth();
  const [location, setLocation] = useState('');
  const [painLevel, setPainLevel] = useState(5);
  const [time, setTime] = useState(new Date().toISOString().substr(0, 16));
  const [symptoms, setSymptoms] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const headacheLocations = [
    'Frontal', 'Temporal', 'Occipital', 'Vertex', 'Whole Head',
    'Behind Eyes', 'Sinus', 'Neck', 'Jaw', 'One Side', 'Both Sides'
  ];
  
  const prodromeSymptoms = [
    'Visual aura', 'Numbness', 'Tingling', 'Difficulty speaking',
    'Nausea', 'Sensitivity to light', 'Sensitivity to sound',
    'Fatigue', 'Food cravings', 'Mood changes', 'Neck stiffness',
    'Irritability', 'Yawning', 'Difficulty sleeping', 'Hyperactivity'
  ];
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      await addDoc(collection(db, 'users', currentUser.uid, 'headaches'), {
        location,
        painLevel,
        time: new Date(time),
        symptoms,
        notes,
        createdAt: new Date()
      });
      
      setSuccess('Headache recorded successfully!');
      // Reset form
      setLocation('');
      setPainLevel(5);
      setTime(new Date().toISOString().substr(0, 16));
      setSymptoms([]);
      setNotes('');
      
    } catch (err) {
      setError('Failed to record headache: ' + err.message);
    }
    
    setLoading(false);
  }
  
  function toggleSymptom(symptom) {
    if (symptoms.includes(symptom)) {
      setSymptoms(symptoms.filter(s => s !== symptom));
    } else {
      setSymptoms([...symptoms, symptom]);
    }
  }

  return (
    <div className="form-container" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Record Headache</h1>
        <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
      </div>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="notification success">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Headache Location</label>
          <div className="headache-locations">
            {headacheLocations.map(loc => (
              <button
                type="button"
                key={loc}
                className={location === loc ? 'selected' : ''}
                onClick={() => setLocation(loc)}
              >
                {loc}
              </button>
            ))}
          </div>
          {!location && <small style={{ color: '#666' }}>Please select a headache location</small>}
        </div>
        
        <div className="form-group">
          <label>Pain Level: {painLevel}/10</label>
          <input
            type="range"
            min="0"
            max="10"
            value={painLevel}
            onChange={(e) => setPainLevel(parseInt(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
            <span>No Pain</span>
            <span>Severe Pain</span>
          </div>
        </div>
        
        <div className="form-group">
          <label>Time of Headache</label>
          <input
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Prodrome Symptoms (symptoms before headache)</label>
          <div className="symptoms-list">
            {prodromeSymptoms.map(symptom => (
              <label key={symptom} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={symptoms.includes(symptom)}
                  onChange={() => toggleSymptom(symptom)}
                />
                {symptom}
              </label>
            ))}
          </div>
        </div>
        
        <div className="form-group">
          <label>Additional Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details about your headache..."
            rows="4"
          />
        </div>
        
        <button type="submit" disabled={loading || !location} className="btn">
          {loading ? 'Recording...' : 'Record Headache'}
        </button>
      </form>
    </div>
  );
}