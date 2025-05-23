import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordSleep() {
  const { currentUser } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));
  const [bedTime, setBedTime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [sleepQuality, setSleepQuality] = useState(7);
  const [awakeDuringNight, setAwakeDuringNight] = useState('');
  const [sleepProblems, setSleepProblems] = useState([]);
  const [screenTimeMobile, setScreenTimeMobile] = useState(0);
  const [screenTimeComputer, setScreenTimeComputer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const problems = [
    'Difficulty falling asleep', 'Waking during night', 'Early waking',
    'Snoring', 'Sleep apnea', 'Restless sleep', 'Nightmares',
    'Uncomfortable temperature', 'Noise disturbances'
  ];
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      // Calculate hours of sleep
      const bedDateTime = new Date(`${date}T${bedTime}`);
      const wakeDateTime = new Date(`${date}T${wakeTime}`);
      
      // If wake time is earlier than bed time, assume next day
      if (wakeDateTime < bedDateTime) {
        wakeDateTime.setDate(wakeDateTime.getDate() + 1);
      }
      
      const hoursSlept = Math.round(((wakeDateTime - bedDateTime) / (1000 * 60 * 60)) * 10) / 10;
      
      await addDoc(collection(db, 'users', currentUser.uid, 'sleep'), {
        date: new Date(date),
        bedTime: bedDateTime,
        wakeTime: wakeDateTime,
        hoursSlept,
        sleepQuality,
        awakeDuringNight,
        sleepProblems,
        screenTime: {
          mobile: screenTimeMobile,
          computer: screenTimeComputer
        },
        createdAt: new Date()
      });
      
      setSuccess(`Sleep data recorded successfully! You slept ${hoursSlept} hours.`);
      
      // Reset form
      setBedTime('');
      setWakeTime('');
      setSleepQuality(7);
      setAwakeDuringNight('');
      setSleepProblems([]);
      setScreenTimeMobile(0);
      setScreenTimeComputer(0);
      
    } catch (err) {
      setError('Failed to record sleep data: ' + err.message);
    }
    
    setLoading(false);
  }
  
  function toggleProblem(problem) {
    if (sleepProblems.includes(problem)) {
      setSleepProblems(sleepProblems.filter(p => p !== problem));
    } else {
      setSleepProblems([...sleepProblems, problem]);
    }
  }

  return (
    <div className="form-container" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Record Sleep</h1>
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
          <label>Went to bed at</label>
          <input
            type="time"
            value={bedTime}
            onChange={(e) => setBedTime(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Woke up at</label>
          <input
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Sleep Quality: {sleepQuality}/10</label>
          <input
            type="range"
            min="1"
            max="10"
            value={sleepQuality}
            onChange={(e) => setSleepQuality(parseInt(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>
        
        <div className="form-group">
          <label>Awake during night (times or duration)</label>
          <input
            type="text"
            value={awakeDuringNight}
            onChange={(e) => setAwakeDuringNight(e.target.value)}
            placeholder="e.g., 2 times, 30 minutes, etc."
          />
        </div>
        
        <div className="form-group">
          <label>Sleep Problems</label>
          <div className="problems-list">
            {problems.map(problem => (
              <label key={problem} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={sleepProblems.includes(problem)}
                  onChange={() => toggleProblem(problem)}
                />
                {problem}
              </label>
            ))}
          </div>
        </div>
        
        <div className="form-group">
          <label>Screen Time - Mobile Phone (hours)</label>
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={screenTimeMobile}
            onChange={(e) => setScreenTimeMobile(parseFloat(e.target.value) || 0)}
          />
        </div>
        
        <div className="form-group">
          <label>Screen Time - Computer (hours)</label>
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={screenTimeComputer}
            onChange={(e) => setScreenTimeComputer(parseFloat(e.target.value) || 0)}
          />
        </div>
        
        <button type="submit" disabled={loading || !bedTime || !wakeTime} className="btn">
          {loading ? 'Recording...' : 'Record Sleep'}
        </button>
      </form>
    </div>
  );
}