import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordBodyPain() {
  const { currentUser } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));
  const [neckPain, setNeckPain] = useState(0);
  const [upperBackPain, setUpperBackPain] = useState(0);
  const [lowerBackPain, setLowerBackPain] = useState(0);
  const [jawPain, setJawPain] = useState(0);
  const [otherPainLocations, setOtherPainLocations] = useState([]);
  const [activities, setActivities] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const otherBodyLocations = [
    'Shoulders', 'Arms', 'Hands/Wrists', 'Chest', 'Abdomen',
    'Hips', 'Thighs', 'Knees', 'Calves', 'Feet/Ankles',
    'Temples', 'Forehead', 'Eyes', 'Sinuses', 'Teeth'
  ];
  
  const headacheRelatedAreas = ['Shoulders', 'Temples', 'Forehead', 'Eyes', 'Sinuses'];
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      const painData = {
        neck: neckPain,
        upperBack: upperBackPain,
        lowerBack: lowerBackPain,
        jaw: jawPain,
        other: otherPainLocations
      };
      
      await addDoc(collection(db, 'users', currentUser.uid, 'bodyPain'), {
        date: new Date(date),
        painLevels: painData,
        activities,
        notes,
        createdAt: new Date()
      });
      
      let successMessage = 'Body pain data recorded successfully!';
      
      // Check for headache-related pain patterns
      const headacheRelatedPain = neckPain >= 5 || upperBackPain >= 5 || jawPain >= 5;
      if (headacheRelatedPain) {
        successMessage += ' Note: Neck, upper back, and jaw tension can be related to headaches.';
      }
      
      setSuccess(successMessage);
      
      // Reset form
      setNeckPain(0);
      setUpperBackPain(0);
      setLowerBackPain(0);
      setJawPain(0);
      setOtherPainLocations([]);
      setActivities('');
      setNotes('');
      
    } catch (err) {
      setError('Failed to record body pain data: ' + err.message);
    }
    
    setLoading(false);
  }
  
  function togglePainLocation(location) {
    if (otherPainLocations.includes(location)) {
      setOtherPainLocations(otherPainLocations.filter(l => l !== location));
    } else {
      setOtherPainLocations([...otherPainLocations, location]);
    }
  }
  
  const getPainLevelColor = (level) => {
    if (level === 0) return '#28a745'; // Green
    if (level <= 3) return '#ffc107'; // Yellow
    if (level <= 6) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
  };
  
  const getPainLevelText = (level) => {
    if (level === 0) return 'No Pain';
    if (level <= 3) return 'Mild';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'Severe';
    return 'Extreme';
  };

  return (
    <div className="form-container" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Record Body Pain</h1>
        <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
      </div>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="notification success">{success}</div>}
      
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
        
        <h3 style={{ color: '#2c5aa0', marginBottom: '1rem' }}>Pain Levels (Areas Commonly Related to Headaches)</h3>
        
        <div className="form-group">
          <label style={{ color: getPainLevelColor(neckPain) }}>
            Pain in Neck: {neckPain}/10 - {getPainLevelText(neckPain)}
            {neckPain >= 5 && <span style={{ color: '#dc3545', marginLeft: '0.5rem' }}>⚠️ May contribute to headaches</span>}
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={neckPain}
            onChange={(e) => setNeckPain(parseInt(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
            <span>No Pain</span>
            <span>Extreme Pain</span>
          </div>
        </div>
        
        <div className="form-group">
          <label style={{ color: getPainLevelColor(upperBackPain) }}>
            Pain in Upper Back: {upperBackPain}/10 - {getPainLevelText(upperBackPain)}
            {upperBackPain >= 5 && <span style={{ color: '#dc3545', marginLeft: '0.5rem' }}>⚠️ May contribute to headaches</span>}
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={upperBackPain}
            onChange={(e) => setUpperBackPain(parseInt(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
            <span>No Pain</span>
            <span>Extreme Pain</span>
          </div>
        </div>
        
        <div className="form-group">
          <label style={{ color: getPainLevelColor(lowerBackPain) }}>
            Pain in Lower Back: {lowerBackPain}/10 - {getPainLevelText(lowerBackPain)}
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={lowerBackPain}
            onChange={(e) => setLowerBackPain(parseInt(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
            <span>No Pain</span>
            <span>Extreme Pain</span>
          </div>
        </div>
        
        <div className="form-group">
          <label style={{ color: getPainLevelColor(jawPain) }}>
            Pain in Jaw: {jawPain}/10 - {getPainLevelText(jawPain)}
            {jawPain >= 5 && <span style={{ color: '#dc3545', marginLeft: '0.5rem' }}>⚠️ May contribute to headaches</span>}
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={jawPain}
            onChange={(e) => setJawPain(parseInt(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
            <span>No Pain</span>
            <span>Extreme Pain</span>
          </div>
        </div>
        
        <div className="form-group">
          <label>Other Body Pain Locations</label>
          <div className="locations-list">
            {otherBodyLocations.map(location => {
              const isHeadacheRelated = headacheRelatedAreas.includes(location);
              return (
                <label 
                  key={location} 
                  className={`checkbox-label ${isHeadacheRelated ? 'headache-related' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={otherPainLocations.includes(location)}
                    onChange={() => togglePainLocation(location)}
                  />
                  {location}
                  {isHeadacheRelated && 
                    <span className="note"> (commonly related to headaches)</span>
                  }
                </label>
              );
            })}
          </div>
        </div>
        
        <div className="form-group">
          <label>Activities</label>
          <textarea
            value={activities}
            onChange={(e) => setActivities(e.target.value)}
            placeholder="Activities that may have contributed to pain (driving, heavy lifting, painting, computer work, etc.)"
            rows="4"
          />
          <small style={{ color: '#666' }}>
            Include activities like driving long distances, heavy lifting, painting, prolonged computer work, etc.
          </small>
        </div>
        
        <div className="form-group">
          <label>Additional Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about your body pain..."
            rows="3"
          />
        </div>
        
        {(neckPain >= 7 || upperBackPain >= 7 || jawPain >= 7) && (
          <div className="warning">
            <h4>⚠️ High Pain Level Detected</h4>
            <p>Consider these pain management techniques:</p>
            <ul>
              <li>Apply heat or cold therapy</li>
              <li>Gentle stretching or movement</li>
              <li>Proper posture adjustment</li>
              <li>Stress reduction techniques</li>
              <li>Consider consulting a healthcare provider</li>
            </ul>
            <p><strong>High tension in neck, upper back, and jaw areas can contribute to headaches.</strong></p>
          </div>
        )}
        
        <div style={{ background: '#f0f8ff', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <h4>💡 Body Pain & Headache Connection:</h4>
          <ul style={{ marginLeft: '1rem', fontSize: '0.9rem' }}>
            <li><strong>Neck tension:</strong> Can trigger tension-type headaches</li>
            <li><strong>Jaw clenching:</strong> Often related to stress and can cause head pain</li>
            <li><strong>Upper back pain:</strong> Can refer pain to the head and neck</li>
            <li><strong>Poor posture:</strong> Can create muscle tension leading to headaches</li>
            <li><strong>Regular movement:</strong> Helps prevent muscle stiffness and tension</li>
          </ul>
        </div>
        
        <button type="submit" disabled={loading} className="btn">
          {loading ? 'Recording...' : 'Record Body Pain'}
        </button>
      </form>
    </div>
  );
}