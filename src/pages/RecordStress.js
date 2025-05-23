import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordStress() {
  const { currentUser } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));
  const [stressLevel, setStressLevel] = useState(5);
  const [anxietyLevel, setAnxietyLevel] = useState(5);
  const [otherMentalState, setOtherMentalState] = useState('');
  const [stressTriggers, setStressTriggers] = useState([]);
  const [mentalIssues, setMentalIssues] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const commonStressTriggers = [
    'Work pressure', 'Family issues', 'Financial concerns', 'Health worries',
    'Relationship problems', 'Social situations', 'Traffic/Commuting', 
    'Time pressure', 'Technology issues', 'Sleep problems', 'Weather changes',
    'Noise', 'Crowds', 'Decision making', 'Deadlines'
  ];
  
  const mentalHealthIssues = [
    'Depression', 'Anxiety', 'Panic attacks', 'Mood swings',
    'Irritability', 'Concentration problems', 'Memory issues', 'Brain fog',
    'Excessive worry', 'Social anxiety', 'Insomnia', 'Fatigue',
    'Emotional numbness', 'Overwhelm', 'Racing thoughts'
  ];
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      await addDoc(collection(db, 'users', currentUser.uid, 'stress'), {
        date: new Date(date),
        stressLevel,
        anxietyLevel,
        otherMentalState,
        stressTriggers,
        mentalIssues,
        notes,
        createdAt: new Date()
      });
      
      let successMessage = 'Stress and mental health data recorded successfully!';
      
      if (stressLevel >= 8 || anxietyLevel >= 8) {
        successMessage += ' Consider stress management techniques like deep breathing, meditation, or speaking with a healthcare provider.';
      }
      
      setSuccess(successMessage);
      
      // Reset form
      setStressLevel(5);
      setAnxietyLevel(5);
      setOtherMentalState('');
      setStressTriggers([]);
      setMentalIssues([]);
      setNotes('');
      
    } catch (err) {
      setError('Failed to record stress data: ' + err.message);
    }
    
    setLoading(false);
  }
  
  function toggleStressTrigger(trigger) {
    if (stressTriggers.includes(trigger)) {
      setStressTriggers(stressTriggers.filter(t => t !== trigger));
    } else {
      setStressTriggers([...stressTriggers, trigger]);
    }
  }
  
  function toggleMentalIssue(issue) {
    if (mentalIssues.includes(issue)) {
      setMentalIssues(mentalIssues.filter(i => i !== issue));
    } else {
      setMentalIssues([...mentalIssues, issue]);
    }
  }
  
  const getStressLevelColor = (level) => {
    if (level <= 3) return '#28a745'; // Green
    if (level <= 6) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  };
  
  const getStressLevelText = (level) => {
    if (level <= 2) return 'Very Low';
    if (level <= 4) return 'Low';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'High';
    return 'Very High';
  };

  return (
    <div className="form-container" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Record Stress & Mental State</h1>
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
        
        <div className="form-group">
          <label style={{ color: getStressLevelColor(stressLevel) }}>
            Stress Level: {stressLevel}/10 - {getStressLevelText(stressLevel)}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={stressLevel}
            onChange={(e) => setStressLevel(parseInt(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
            <span>No Stress</span>
            <span>Extreme Stress</span>
          </div>
        </div>
        
        <div className="form-group">
          <label style={{ color: getStressLevelColor(anxietyLevel) }}>
            Anxiety Level: {anxietyLevel}/10 - {getStressLevelText(anxietyLevel)}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={anxietyLevel}
            onChange={(e) => setAnxietyLevel(parseInt(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
            <span>No Anxiety</span>
            <span>Severe Anxiety</span>
          </div>
        </div>
        
        <div className="form-group">
          <label>Other Mental State</label>
          <input
            type="text"
            value={otherMentalState}
            onChange={(e) => setOtherMentalState(e.target.value)}
            placeholder="e.g., Depressed, Excited, Confused, etc."
          />
          <small style={{ color: '#666' }}>
            Describe any other emotions or mental states you're experiencing
          </small>
        </div>
        
        <div className="form-group">
          <label>Stress Triggers</label>
          <div className="triggers-list">
            {commonStressTriggers.map(trigger => (
              <label key={trigger} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={stressTriggers.includes(trigger)}
                  onChange={() => toggleStressTrigger(trigger)}
                />
                {trigger}
              </label>
            ))}
          </div>
        </div>
        
        <div className="form-group">
          <label>Mental Health Symptoms</label>
          <div className="mental-issues-list">
            {mentalHealthIssues.map(issue => (
              <label key={issue} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={mentalIssues.includes(issue)}
                  onChange={() => toggleMentalIssue(issue)}
                />
                {issue}
              </label>
            ))}
          </div>
        </div>
        
        <div className="form-group">
          <label>Additional Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about your stress levels or mental state..."
            rows="4"
          />
        </div>
        
        {(stressLevel >= 8 || anxietyLevel >= 8) && (
          <div className="warning">
            <h4>⚠️ High Stress/Anxiety Level Detected</h4>
            <p>Consider these stress management techniques:</p>
            <ul>
              <li>Deep breathing exercises (4-7-8 technique)</li>
              <li>Progressive muscle relaxation</li>
              <li>Short meditation or mindfulness session</li>
              <li>Light physical activity or stretching</li>
              <li>Speaking with a friend, family member, or professional</li>
            </ul>
            <p><strong>If you're experiencing persistent high stress or anxiety, consider speaking with a healthcare provider.</strong></p>
          </div>
        )}
        
        <div style={{ background: '#e8f5e8', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <h4>💡 Stress Management Tips:</h4>
          <ul style={{ marginLeft: '1rem', fontSize: '0.9rem' }}>
            <li>Practice regular deep breathing exercises</li>
            <li>Maintain a consistent sleep schedule</li>
            <li>Exercise regularly, even light walking helps</li>
            <li>Limit caffeine intake, especially when stressed</li>
            <li>Stay connected with supportive people</li>
            <li>Consider mindfulness or meditation apps</li>
          </ul>
        </div>
        
        <button type="submit" disabled={loading} className="btn">
          {loading ? 'Recording...' : 'Record Stress Data'}
        </button>
      </form>
    </div>
  );
}