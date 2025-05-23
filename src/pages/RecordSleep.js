import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordSleep() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    bedTime: '',
    wakeTime: '',
    sleepQuality: 7,
    awakeDuringNight: '',
    sleepProblems: [],
    screenTimeMobile: 0,
    screenTimeComputer: 0,
    notes: ''
  });

  const sleepProblems = [
    'Difficulty falling asleep',
    'Waking during night',
    'Early morning awakening',
    'Snoring',
    'Sleep apnea symptoms',
    'Restless sleep',
    'Nightmares/Bad dreams',
    'Too hot/cold',
    'Noise disturbances',
    'Uncomfortable bed',
    'Racing thoughts',
    'Physical discomfort'
  ];

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      sleepProblems: checked 
        ? [...prev.sleepProblems, value]
        : prev.sleepProblems.filter(item => item !== value)
    }));
  };

  const calculateSleepHours = () => {
    if (!formData.bedTime || !formData.wakeTime) return 0;
    
    const bedDateTime = new Date(`${formData.date}T${formData.bedTime}`);
    let wakeDateTime = new Date(`${formData.date}T${formData.wakeTime}`);
    
    // If wake time is earlier than bed time, assume next day
    if (wakeDateTime <= bedDateTime) {
      wakeDateTime.setDate(wakeDateTime.getDate() + 1);
    }
    
    const hoursSlept = (wakeDateTime - bedDateTime) / (1000 * 60 * 60);
    return Math.round(hoursSlept * 10) / 10;
  };

  const getSleepQualityText = (quality) => {
    if (quality <= 3) return 'Poor';
    if (quality <= 5) return 'Fair';
    if (quality <= 7) return 'Good';
    if (quality <= 9) return 'Very Good';
    return 'Excellent';
  };

  const getSleepQualityColor = (quality) => {
    if (quality <= 3) return '#dc3545';
    if (quality <= 5) return '#fd7e14';
    if (quality <= 7) return '#ffc107';
    if (quality <= 9) return '#28a745';
    return '#20c997';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to record sleep data');
      return;
    }

    if (!formData.bedTime || !formData.wakeTime) {
      setError('Please enter both bed time and wake time');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const hoursSlept = calculateSleepHours();
      
      // Create sleep record
      const sleepData = {
        userId: currentUser.uid,
        date: formData.date,
        bedTime: formData.bedTime,
        wakeTime: formData.wakeTime,
        hoursSlept: hoursSlept,
        sleepQuality: parseInt(formData.sleepQuality),
        awakeDuringNight: formData.awakeDuringNight,
        sleepProblems: formData.sleepProblems,
        screenTime: {
          mobile: formData.screenTimeMobile,
          computer: formData.screenTimeComputer
        },
        notes: formData.notes,
        createdAt: Timestamp.now()
      };

      // Save to user's sleep subcollection
      await addDoc(collection(db, 'users', currentUser.uid, 'sleep'), sleepData);
      
      setSuccess(`Sleep data recorded successfully! You slept ${hoursSlept} hours with quality ${formData.sleepQuality}/10.`);
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        bedTime: '',
        wakeTime: '',
        sleepQuality: 7,
        awakeDuringNight: '',
        sleepProblems: [],
        screenTimeMobile: 0,
        screenTimeComputer: 0,
        notes: ''
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error recording sleep:', error);
      setError('Failed to record sleep data. Please try again.');
    }

    setLoading(false);
  };

  const sleepHours = calculateSleepHours();

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
              background: 'linear-gradient(135deg, #2c5aa0, #4a90e2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              💤 Record Sleep
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
              color: '#4a90e2'
            }}>
              Sleep Date
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

          {/* Sleep Times */}
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
                🌙 Went to Bed
              </label>
              <input
                type="time"
                name="bedTime"
                value={formData.bedTime}
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
                color: '#ffc107'
              }}>
                ☀️ Woke Up
              </label>
              <input
                type="time"
                name="wakeTime"
                value={formData.wakeTime}
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
          </div>

          {/* Sleep Hours Display */}
          {sleepHours > 0 && (
            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '12px',
              padding: '15px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#4a90e2', margin: '0 0 5px 0' }}>
                Total Sleep: {sleepHours} hours
              </h3>
              <p style={{ margin: 0, color: '#ccc', fontSize: '0.9rem' }}>
                {sleepHours < 7 ? '⚠️ Consider getting more sleep for optimal health' : 
                 sleepHours > 9 ? '💤 That\'s plenty of sleep!' : 
                 '✅ Good amount of sleep!'}
              </p>
            </div>
          )}

          {/* Sleep Quality */}
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
              color: getSleepQualityColor(formData.sleepQuality)
            }}>
              Sleep Quality: {formData.sleepQuality}/10 - {getSleepQualityText(formData.sleepQuality)}
            </label>
            <input
              type="range"
              name="sleepQuality"
              min="1"
              max="10"
              value={formData.sleepQuality}
              onChange={handleInputChange}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '5px',
                background: `linear-gradient(to right, #dc3545 0%, #ffc107 50%, #28a745 100%)`,
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
              <span>Poor</span>
              <span>Fair</span>
              <span>Good</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Sleep Disruptions */}
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
              Awake During Night
            </label>
            <input
              type="text"
              name="awakeDuringNight"
              value={formData.awakeDuringNight}
              onChange={handleInputChange}
              placeholder="e.g., 2 times, 30 minutes, bathroom visit"
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

          {/* Sleep Problems */}
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
              Sleep Problems
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '10px' 
            }}>
              {sleepProblems.map(problem => (
                <label key={problem} style={{ 
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
                    value={problem}
                    checked={formData.sleepProblems.includes(problem)}
                    onChange={handleCheckboxChange}
                  />
                  <span>{problem}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Screen Time */}
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
                color: '#6f42c1'
              }}>
                📱 Mobile Screen Time (hours)
              </label>
              <input
                type="number"
                name="screenTimeMobile"
                min="0"
                max="24"
                step="0.5"
                value={formData.screenTimeMobile}
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
              {formData.screenTimeMobile > 3 && (
                <small style={{ color: '#ffc107', marginTop: '5px', display: 'block' }}>
                  ⚠️ High screen time may affect sleep quality
                </small>
              )}
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
                color: '#6f42c1'
              }}>
                💻 Computer Screen Time (hours)
              </label>
              <input
                type="number"
                name="screenTimeComputer"
                min="0"
                max="24"
                step="0.5"
                value={formData.screenTimeComputer}
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
              {formData.screenTimeComputer > 8 && (
                <small style={{ color: '#ffc107', marginTop: '5px', display: 'block' }}>
                  ⚠️ Consider blue light filters before bed
                </small>
              )}
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
              placeholder="Any additional details about your sleep (environment, dreams, how you felt, etc.)..."
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

          {/* Sleep Tips */}
          <div style={{
            background: 'rgba(40, 167, 69, 0.1)',
            border: '1px solid rgba(40, 167, 69, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: '#28a745', margin: '0 0 10px 0', fontSize: '1.1rem' }}>
              💡 Sleep Quality Tips:
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#ccc', fontSize: '0.9rem' }}>
              <li>Maintain consistent sleep and wake times</li>
              <li>Limit screen time 1-2 hours before bed</li>
              <li>Keep bedroom cool, dark, and quiet</li>
              <li>Avoid caffeine 6+ hours before bedtime</li>
              <li>Create a relaxing bedtime routine</li>
              <li>Exercise regularly, but not close to bedtime</li>
            </ul>
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
                : 'linear-gradient(135deg, #2c5aa0 0%, #1e3f73 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Recording Sleep Data...' : 'Record Sleep Data'}
          </button>
        </form>
      </div>
    </div>
  );
}
