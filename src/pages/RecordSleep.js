import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp, doc, updateDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordSleep() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Check if there's a pending sleep session (going to bed was logged)
  const [pendingSleepSession, setPendingSleepSession] = useState(null);
  const [sleepMode, setSleepMode] = useState(''); // 'going-to-bed', 'woke-up', 'manual-entry'
  const [showQualityRating, setShowQualityRating] = useState(false);
  
const location = useLocation();
const urlParams = new URLSearchParams(location.search);
const prefilledDate = urlParams.get('date');
const prefilledMode = urlParams.get('mode');
  
const [formData, setFormData] = useState({
    date: prefilledDate || new Date().toISOString().split('T')[0],
    bedTime: '',
    wakeTime: '',
    intendedWakeTime: '',
    sleepQuality: 7,
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for pending sleep session on component mount
  const checkForPendingSleepSession = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      // Query the pendingSleep collection for any uncompleted sessions
      const pendingSleepQuery = query(
        collection(db, 'users', currentUser.uid, 'pendingSleep'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const pendingSleepSnapshot = await getDocs(pendingSleepQuery);
      
      if (!pendingSleepSnapshot.empty) {
        const pendingDoc = pendingSleepSnapshot.docs[0];
        const pendingData = { id: pendingDoc.id, ...pendingDoc.data() };
        
        // Check if this session is not completed and is recent (within 24 hours)
        const bedTime = new Date(`${pendingData.date}T${pendingData.bedTime}`);
        const now = new Date();
        const hoursDiff = (now - bedTime) / (1000 * 60 * 60);
        
        if (!pendingData.completed && hoursDiff <= 24) {
          setPendingSleepSession(pendingData);
          setSleepMode('woke-up');
          
          // Pre-fill form with pending data
          setFormData(prev => ({
            ...prev,
            bedTime: pendingData.bedTime,
            intendedWakeTime: pendingData.intendedWakeTime || '',
            date: pendingData.date
          }));
        }
      }
    } catch (error) {
      console.error('Error checking for pending sleep session:', error);
    }
  }, [currentUser]);

  React.useEffect(() => {
    checkForPendingSleepSession();
  }, [checkForPendingSleepSession]);
useEffect(() => {
  if (prefilledDate) {
    setFormData(prev => ({ ...prev, date: prefilledDate }));
  }
  if (prefilledMode === 'manual-entry') {
    setSleepMode('manual-entry');
  }
}, [prefilledDate, prefilledMode]);

  // Function to automatically capture current time for bedtime
  const handleGoingToBed = async () => {
    if (!currentUser) {
      setError('You must be logged in to record sleep data');
      return;
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    setLoading(true);
    setError('');

    try {
      const pendingData = {
        bedTime: currentTime,
        date: formData.date,
        createdAt: Timestamp.now()
      };
      
      await addDoc(collection(db, 'users', currentUser.uid, 'pendingSleep'), pendingData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving bedtime:', error);
      setError('Failed to save bedtime. Please try again.');
    }
    setLoading(false);
  };

  // Function to automatically capture wake up time
  const handleWokeUp = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    setFormData(prev => ({
      ...prev,
      wakeTime: currentTime,
      date: now.toISOString().split('T')[0]
    }));
    
    // Show quality rating for woke-up flow
    setShowQualityRating(true);
  };

  // Function to handle manual entry mode
  const handleManualEntry = () => {
    setSleepMode('manual-entry');
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

  const handleSubmit = async () => {
    if (!currentUser) {
      setError('You must be logged in to record sleep data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Complete sleep record
      if (!formData.bedTime || !formData.wakeTime) {
        setError('Please enter both bed time and wake time');
        setLoading(false);
        return;
      }

      const hoursSlept = calculateSleepHours();
      
      const sleepData = {
        userId: currentUser.uid,
        date: formData.date,
        bedTime: formData.bedTime,
        wakeTime: formData.wakeTime,
        intendedWakeTime: formData.intendedWakeTime,
        hoursSlept: hoursSlept,
        sleepQuality: parseInt(formData.sleepQuality),
        notes: formData.notes,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'sleep'), sleepData);
      
      // If this was from a pending session, mark it as completed
      if (pendingSleepSession) {
        const pendingDocRef = doc(db, 'users', currentUser.uid, 'pendingSleep', pendingSleepSession.id);
        await updateDoc(pendingDocRef, { completed: true });
      }
      
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording sleep:', error);
      setError('Failed to record sleep data. Please try again.');
    }

    setLoading(false);
  };

  // If showing quality rating after woke up
  if (showQualityRating) {
    const actualSleepHours = pendingSleepSession ? (() => {
      const bedDateTime = new Date(`${pendingSleepSession.date}T${pendingSleepSession.bedTime}`);
      let wakeDateTime = new Date(`${formData.date}T${formData.wakeTime}`);
      if (wakeDateTime <= bedDateTime) {
        wakeDateTime.setDate(wakeDateTime.getDate() + 1);
      }
      return (wakeDateTime - bedDateTime) / (1000 * 60 * 60);
    })() : calculateSleepHours();

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
        {/* Font Awesome CSS */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />

        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          {/* Good morning header with editable bedtime */}
          <div style={{
            background: 'rgba(40, 167, 69, 0.1)',
            border: '1px solid rgba(40, 167, 69, 0.3)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#28a745' }}>
              <i className="fas fa-sun"></i>
            </div>
            <h2 style={{ color: '#28a745', margin: '0 0 1rem 0' }}>Good Morning!</h2>
            <div style={{ color: '#4B5563', fontSize: '1rem' }}>
              <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <span>
                  <i className="fas fa-bed" style={{ marginRight: '0.5rem' }}></i>
                  Bedtime:
                </span>
                <input
                  type="time"
                  value={formData.bedTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, bedTime: e.target.value }))}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #E5E7EB',
                    background: '#FFFFFF',
                    color: '#000000',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <p style={{ margin: '0.5rem 0' }}>
                <i className="fas fa-sun" style={{ marginRight: '0.5rem' }}></i>
                Wake time: {formData.wakeTime}
              </p>
              <p style={{ margin: '0.5rem 0', fontSize: '1.1rem', fontWeight: 'bold', color: '#28a745' }}>
                <i className="fas fa-hourglass-half" style={{ marginRight: '0.5rem' }}></i>
                Slept: {Math.round(actualSleepHours * 10) / 10} hours
              </p>
            </div>
          </div>

          {/* Quick sleep quality rating */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#4682B4', marginBottom: '1rem' }}>
              How was your sleep?
            </h3>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              color: getSleepQualityColor(formData.sleepQuality)
            }}>
              {formData.sleepQuality}/10
            </div>
            <div style={{
              fontSize: '1.2rem',
              marginBottom: '1.5rem',
              color: getSleepQualityColor(formData.sleepQuality),
              fontWeight: '600'
            }}>
              <i className="fas fa-star" style={{ marginRight: '0.5rem' }}></i>
              {getSleepQualityText(formData.sleepQuality)}
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.sleepQuality}
              onChange={(e) => setFormData(prev => ({ ...prev, sleepQuality: e.target.value }))}
              style={{
                width: '100%',
                height: '12px',
                borderRadius: '6px',
                background: `linear-gradient(to right, #dc3545 0%, #ffc107 50%, #28a745 100%)`,
                outline: 'none',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            />
          </div>

          {/* Error display */}
          {error && (
            <div style={{
              background: '#f8d7da',
              border: '1px solid #dc3545',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '1rem',
              color: '#721c24',
              fontSize: '0.9rem'
            }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
              {error}
            </div>
          )}

          {/* Action buttons */}
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
                background: loading ? '#E5E7EB' : '#28a745',
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
                <><i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>Save Sleep</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Manual entry mode
  if (sleepMode === 'manual-entry') {
    const sleepHours = calculateSleepHours();
    
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F9FAFB',
        color: '#000000',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Font Awesome CSS */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />

        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              margin: 0,
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: '#1E3A8A',
              textAlign: 'center',
              flex: 1
            }}>
              <i className="fas fa-edit" style={{ marginRight: '0.5rem' }}></i>
              Manual Sleep Entry
            </h1>
            <Link
              to="/dashboard" 
              style={{
                background: 'transparent',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                color: '#4B5563',
                padding: '8px 16px',
                textDecoration: 'none',
                fontSize: '0.9rem'
              }}
            >
              <i className="fas fa-times" style={{ marginRight: '0.5rem' }}></i>
              Cancel
            </Link>
          </div>
{/* Date Selector */}
<div style={{ marginBottom: '2rem' }}>
  <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
    <i className="fas fa-calendar" style={{ marginRight: '0.5rem' }}></i>
    Sleep Date
  </h4>
  <input
    type="date"
    value={formData.date}
    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
    max={new Date().toISOString().split('T')[0]}
    style={{
      width: '100%',
      maxWidth: '200px',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #E5E7EB',
      background: '#FFFFFF',
      color: '#000000',
      fontSize: '1rem'
    }}
  />
  {prefilledDate && (
    <p style={{ 
      margin: '0.5rem 0 0 0', 
      fontSize: '0.85rem', 
      color: '#6B7280',
      fontStyle: 'italic'
    }}>
      <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
      Date selected from calendar
    </p>
  )}
</div>
          {/* Sleep times */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#4682B4'
              }}>
                <i className="fas fa-moon" style={{ marginRight: '0.5rem' }}></i>
                Bedtime
              </label>
              <input
                type="time"
                value={formData.bedTime}
                onChange={(e) => setFormData(prev => ({ ...prev, bedTime: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  background: '#FFFFFF',
                  color: '#000000',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#4682B4'
              }}>
                <i className="fas fa-sun" style={{ marginRight: '0.5rem' }}></i>
                Wake Time
              </label>
              <input
                type="time"
                value={formData.wakeTime}
                onChange={(e) => setFormData(prev => ({ ...prev, wakeTime: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  background: '#FFFFFF',
                  color: '#000000',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          {/* Sleep duration display */}
          {sleepHours > 0 && (
            <div style={{
              background: 'rgba(70, 130, 180, 0.1)',
              border: '1px solid rgba(70, 130, 180, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4682B4' }}>
                <i className="fas fa-hourglass-half" style={{ marginRight: '0.5rem' }}></i>
                Total Sleep: {sleepHours} hours
              </div>
            </div>
          )}

          {/* Sleep quality */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <label style={{
              display: 'block',
              marginBottom: '1rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#4682B4'
            }}>
              Sleep Quality
            </label>
            <div style={{
              fontSize: '2rem',
              marginBottom: '0.5rem',
              color: getSleepQualityColor(formData.sleepQuality)
            }}>
              {formData.sleepQuality}/10
            </div>
            <div style={{
              fontSize: '1rem',
              marginBottom: '1rem',
              color: getSleepQualityColor(formData.sleepQuality),
              fontWeight: '600'
            }}>
              <i className="fas fa-star" style={{ marginRight: '0.5rem' }}></i>
              {getSleepQualityText(formData.sleepQuality)}
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.sleepQuality}
              onChange={(e) => setFormData(prev => ({ ...prev, sleepQuality: e.target.value }))}
              style={{
                width: '100%',
                height: '12px',
                borderRadius: '6px',
                background: `linear-gradient(to right, #dc3545 0%, #ffc107 50%, #28a745 100%)`,
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Optional notes */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#4682B4'
            }}>
              <i className="fas fa-sticky-note" style={{ marginRight: '0.5rem' }}></i>
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional details about your sleep..."
              rows="3"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                background: '#FFFFFF',
                color: '#000000',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Error display */}
          {error && (
            <div style={{
              background: '#f8d7da',
              border: '1px solid #dc3545',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '1rem',
              color: '#721c24',
              textAlign: 'center'
            }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
              {error}
            </div>
          )}

          {/* Submit button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleSubmit}
              disabled={!formData.bedTime || !formData.wakeTime || loading}
              style={{
                background: (!formData.bedTime || !formData.wakeTime || loading) ? '#E5E7EB' : '#4682B4',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                padding: '12px 32px',
                cursor: (!formData.bedTime || !formData.wakeTime || loading) ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Saving...</>
              ) : (
                <><i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>Save Sleep Data</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main sleep mode selection (ultra-minimal)
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
      {/* Font Awesome CSS */}
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
        integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
        crossOrigin="anonymous" 
        referrerPolicy="no-referrer" 
      />

      <div style={{ maxWidth: '500px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            margin: '0 0 1rem 0',
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1E3A8A'
          }}>
            <i className="fas fa-bed" style={{ marginRight: '0.5rem' }}></i>
            Sleep Tracking
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '1.1rem', margin: 0 }}>
            Quick and easy sleep logging
          </p>
        </div>

        {/* Pending sleep session alert */}
        {pendingSleepSession && (
          <div style={{
            background: 'rgba(23, 162, 184, 0.1)',
            border: '1px solid rgba(23, 162, 184, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <h4 style={{ color: '#17a2b8', margin: '0 0 0.5rem 0' }}>
              <i className="fas fa-link" style={{ marginRight: '0.5rem' }}></i>
              Continue Your Sleep Session
            </h4>
            <p style={{ margin: 0, color: '#4B5563', fontSize: '0.9rem' }}>
              You went to bed at {pendingSleepSession.bedTime}. Ready to log your wake-up time?
            </p>
          </div>
        )}

        {/* Error display */}
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

        {/* Ultra-minimal action buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={handleGoingToBed}
            disabled={loading}
            style={{
              padding: '2rem 1rem',
              background: 'linear-gradient(135deg, #4682B4, #2c5aa0)',
              border: 'none',
              borderRadius: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(70, 130, 180, 0.3)'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              <i className="fas fa-moon"></i>
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
              Going to Bed
            </h3>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
              <i className="fas fa-clock" style={{ marginRight: '0.5rem' }}></i>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
              Tap to save bedtime
            </div>
          </button>

          <button
            onClick={handleWokeUp}
            disabled={loading}
            style={{
              padding: '2rem 1rem',
              background: 'linear-gradient(135deg, #28a745, #20c997)',
              border: 'none',
              borderRadius: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              <i className="fas fa-sun"></i>
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
              Just Woke Up
            </h3>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
              <i className="fas fa-clock" style={{ marginRight: '0.5rem' }}></i>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
              Tap to save wake time
            </div>
          </button>

          <button
            onClick={handleManualEntry}
            disabled={loading}
            style={{
              padding: '2rem 1rem',
              background: 'linear-gradient(135deg, #ffc107, #fd7e14)',
              border: 'none',
              borderRadius: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              <i className="fas fa-edit"></i>
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
              Manual Entry
            </h3>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              Enter past sleep data
            </div>
          </button>
        </div>

        {/* Back to dashboard */}
        <div style={{ textAlign: 'center' }}>
          <Link
            to="/dashboard"
            style={{
              background: 'transparent',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              color: '#4B5563',
              padding: '8px 16px',
              textDecoration: 'none',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }}></i>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
