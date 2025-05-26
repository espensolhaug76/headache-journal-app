import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordSleep() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Check if there's a pending sleep session (going to bed was logged)
  const [pendingSleepSession, setPendingSleepSession] = useState(null);
  const [sleepMode, setSleepMode] = useState(''); // 'going-to-bed', 'woke-up', 'manual-entry'
  const [currentStep, setCurrentStep] = useState(0);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    bedTime: '',
    wakeTime: '',
    intendedWakeTime: '', // New: for when going to bed
    sleepQuality: 7,
    awakeDuringNight: '',
    sleepProblems: [],
    screenTimeMobile: 0,
    screenTimeComputer: 0,
    sleepEvents: [],
    sleepTrackerUsed: false,
    notes: '',
    // New fields for going-to-bed mode
    preeBedRoutine: [],
    sleepEnvironment: '',
    stressLevelAtBed: 5,
    caffeineToday: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-bed routine options
  const preBedRoutines = [
    'Reading',
    'Meditation',
    'Hot bath/shower',
    'Gentle stretching',
    'Journaling',
    'Listening to music',
    'Herbal tea',
    'Deep breathing',
    'Prayer/reflection',
    'Light snack',
    'Skincare routine',
    'Dim lighting'
  ];

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

  // Check for pending sleep session on component mount - useCallback to fix ESLint warning
  const checkForPendingSleepSession = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const pendingDocRef = doc(db, 'users', currentUser.uid, 'pendingSleep', 'current');
      const pendingDoc = await getDoc(pendingDocRef);
      
      if (pendingDoc.exists()) {
        const pendingData = pendingDoc.data();
        setPendingSleepSession(pendingData);
        setSleepMode('woke-up');
        
        // Pre-fill form with pending data
        setFormData(prev => ({
          ...prev,
          bedTime: pendingData.bedTime,
          intendedWakeTime: pendingData.intendedWakeTime,
          date: pendingData.date,
          preeBedRoutine: pendingData.preBedRoutine || [],
          sleepEnvironment: pendingData.sleepEnvironment || '',
          stressLevelAtBed: pendingData.stressLevelAtBed || 5,
          caffeineToday: pendingData.caffeineToday || 0
        }));
      }
    } catch (error) {
      console.error('Error checking for pending sleep session:', error);
    }
  }, [currentUser]);

  React.useEffect(() => {
    checkForPendingSleepSession();
  }, [checkForPendingSleepSession]);

  // Function to automatically capture current time for bedtime
  const handleGoingToBed = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    setFormData(prev => ({
      ...prev,
      bedTime: currentTime,
      date: now.toISOString().split('T')[0]
    }));
    setSleepMode('going-to-bed');
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
    setSleepMode('woke-up');
  };

  // Function to request alarm permission and potentially set alarm
  const requestAlarmPermission = async () => {
    // Note: Web browsers have limited alarm capabilities
    // This is a placeholder for future native app implementation
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const questions = [
    // Sleep mode selection (only if no pending session)
    {
      id: 'sleep-mode',
      title: 'What would you like to record?',
      subtitle: 'Choose your current situation',
      component: 'sleep-mode-selection',
      condition: () => !pendingSleepSession
    },
    
    // Going to bed flow (removed bedtime-setup since time is auto-captured)
    {
      id: 'wake-intention',
      title: 'When do you want to wake up?',
      subtitle: 'Set your intended wake time',
      component: 'wake-intention',
      condition: () => sleepMode === 'going-to-bed'
    },
    {
      id: 'pre-bed-routine',
      title: 'Pre-bedtime routine',
      subtitle: 'What did you do to prepare for sleep?',
      component: 'pre-bed-routine',
      condition: () => sleepMode === 'going-to-bed'
    },
    {
      id: 'pre-bed-assessment',
      title: 'How are you feeling?',
      subtitle: 'Quick assessment before sleep',
      component: 'pre-bed-assessment',
      condition: () => sleepMode === 'going-to-bed'
    },
    
    // Woke up flow (removed wake-up-time since time is auto-captured for woke-up mode)
    {
      id: 'sleep-quality',
      title: 'How was your sleep quality?',
      subtitle: 'Rate your overall sleep experience',
      component: 'sleep-quality',
      condition: () => sleepMode === 'woke-up' || sleepMode === 'manual-entry'
    },
    {
      id: 'sleep-disruptions',
      title: 'Any sleep disruptions?',
      subtitle: 'Tell us about interruptions to your sleep',
      component: 'sleep-disruptions',
      condition: () => sleepMode === 'woke-up' || sleepMode === 'manual-entry'
    },
    {
      id: 'sleep-problems',
      title: 'What sleep problems did you experience?',
      subtitle: 'Select any issues that affected your sleep',
      component: 'sleep-problems',
      condition: () => sleepMode === 'woke-up' || sleepMode === 'manual-entry'
    },
    
    // Manual entry flow
    {
      id: 'sleep-times',
      title: 'Sleep duration',
      subtitle: 'Enter your sleep and wake times',
      component: 'sleep-times',
      condition: () => sleepMode === 'manual-entry'
    },
    {
      id: 'screen-time',
      title: 'Screen time before bed',
      subtitle: 'Screen exposure can affect sleep quality',
      component: 'screen-time',
      condition: () => sleepMode === 'manual-entry'
    },
    {
      id: 'notes',
      title: 'Additional sleep notes',
      subtitle: 'Any other details about your sleep',
      component: 'notes',
      condition: () => sleepMode === 'woke-up' || sleepMode === 'manual-entry'
    }
  ];

  // Filter questions based on conditions
  const activeQuestions = questions.filter(q => !q.condition || q.condition());

  const handleNext = () => {
    if (currentStep < activeQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < activeQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleCheckboxChange = (value, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
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

  const savePendingSleepSession = async () => {
    if (!currentUser) return;
    
    try {
      const pendingData = {
        bedTime: formData.bedTime,
        intendedWakeTime: formData.intendedWakeTime,
        date: formData.date,
        preBedRoutine: formData.preeBedRoutine,
        sleepEnvironment: formData.sleepEnvironment,
        stressLevelAtBed: formData.stressLevelAtBed,
        caffeineToday: formData.caffeineToday,
        createdAt: Timestamp.now()
      };
      
      await addDoc(collection(db, 'users', currentUser.uid, 'pendingSleep'), pendingData);
      
      // Request alarm permission if we set an intended wake time
      if (formData.intendedWakeTime) {
        await requestAlarmPermission();
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving pending sleep session:', error);
      setError('Failed to save bedtime data. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setError('You must be logged in to record sleep data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (sleepMode === 'going-to-bed') {
        await savePendingSleepSession();
        return;
      }

      // Complete sleep record (woke-up or manual-entry)
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
        awakeDuringNight: formData.awakeDuringNight,
        sleepProblems: formData.sleepProblems,
        screenTime: {
          mobile: formData.screenTimeMobile,
          computer: formData.screenTimeComputer
        },
        preBedRoutine: formData.preeBedRoutine,
        sleepEnvironment: formData.sleepEnvironment,
        stressLevelAtBed: formData.stressLevelAtBed,
        caffeineToday: formData.caffeineToday,
        sleepEvents: formData.sleepEvents,
        sleepTrackerUsed: formData.sleepTrackerUsed,
        notes: formData.notes,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'sleep'), sleepData);
      
      // If this was from a pending session, clean it up
      if (pendingSleepSession) {
        const pendingDocRef = doc(db, 'users', currentUser.uid, 'pendingSleep', 'current');
        await updateDoc(pendingDocRef, { completed: true });
      }
      
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording sleep:', error);
      setError('Failed to record sleep data. Please try again.');
    }

    setLoading(false);
  };

  const renderCurrentQuestion = () => {
    const question = activeQuestions[currentStep];
    if (!question) return null;

    switch (question.component) {
      case 'sleep-mode-selection':
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <button
              onClick={handleGoingToBed}
              style={{
                padding: '2rem',
                background: sleepMode === 'going-to-bed' ? 'rgba(70, 130, 180, 0.1)' : '#FFFFFF',
                border: sleepMode === 'going-to-bed' ? '2px solid #4682B4' : '1px solid #E5E7EB',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#4682B4' }}>
                <i className="fas fa-moon"></i>
              </div>
              <h3 style={{ margin: '0 0 1rem 0', color: '#4682B4', fontSize: '1.3rem' }}>
                I'm Going to Bed Now
              </h3>
              <p style={{ margin: 0, color: '#4B5563', fontSize: '1rem', lineHeight: '1.5' }}>
                Automatically capture bedtime and set up sleep tracking
              </p>
              <div style={{ 
                marginTop: '1rem', 
                fontSize: '0.9rem', 
                color: '#28a745',
                fontWeight: '500'
              }}>
                <i className="fas fa-clock" style={{ marginRight: '0.5rem' }}></i>
                Current time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </button>

            <button
              onClick={handleWokeUp}
              style={{
                padding: '2rem',
                background: sleepMode === 'woke-up' ? 'rgba(40, 167, 69, 0.1)' : '#FFFFFF',
                border: sleepMode === 'woke-up' ? '2px solid #28a745' : '1px solid #E5E7EB',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#28a745' }}>
                <i className="fas fa-sun"></i>
              </div>
              <h3 style={{ margin: '0 0 1rem 0', color: '#28a745', fontSize: '1.3rem' }}>
                I Just Woke Up
              </h3>
              <p style={{ margin: 0, color: '#4B5563', fontSize: '1rem', lineHeight: '1.5' }}>
                Automatically capture wake time and record how you slept
              </p>
              <div style={{ 
                marginTop: '1rem', 
                fontSize: '0.9rem', 
                color: '#28a745',
                fontWeight: '500'
              }}>
                <i className="fas fa-clock" style={{ marginRight: '0.5rem' }}></i>
                Current time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </button>

            <button
              onClick={() => setSleepMode('manual-entry')}
              style={{
                padding: '2rem',
                background: sleepMode === 'manual-entry' ? 'rgba(255, 193, 7, 0.1)' : '#FFFFFF',
                border: sleepMode === 'manual-entry' ? '2px solid #ffc107' : '1px solid #E5E7EB',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ffc107' }}>
                <i className="fas fa-edit"></i>
              </div>
              <h3 style={{ margin: '0 0 1rem 0', color: '#ffc107', fontSize: '1.3rem' }}>
                Register Sleep Manually
              </h3>
              <p style={{ margin: 0, color: '#4B5563', fontSize: '1rem', lineHeight: '1.5' }}>
                Enter complete sleep information from a previous time
              </p>
            </button>
          </div>
        );

      case 'wake-intention':
        return (
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div style={{
              background: 'rgba(40, 167, 69, 0.1)',
              border: '1px solid rgba(40, 167, 69, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#28a745' }}>
                <i className="fas fa-alarm-clock"></i>
              </div>
              <h3 style={{ color: '#28a745', margin: '0 0 0.5rem 0' }}>Set Your Wake-Up Goal</h3>
              <p style={{ margin: '0 0 1rem 0', color: '#4B5563' }}>
                This helps track if you meet your sleep goals
              </p>
              <div style={{ 
                fontSize: '1.1rem', 
                color: '#4682B4',
                fontWeight: '600',
                padding: '0.5rem',
                background: 'rgba(70, 130, 180, 0.1)',
                borderRadius: '8px'
              }}>
                <i className="fas fa-bed" style={{ marginRight: '0.5rem' }}></i>
                Bedtime set: {formData.bedTime}
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '1rem',
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#4682B4',
                textAlign: 'center'
              }}>
                <i className="fas fa-alarm-clock" style={{ marginRight: '0.5rem' }}></i>
                When do you want to wake up?
              </label>
              <input
                type="time"
                value={formData.intendedWakeTime}
                onChange={(e) => setFormData(prev => ({ ...prev, intendedWakeTime: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '2px solid #E5E7EB',
                  background: '#FFFFFF',
                  color: '#000000',
                  fontSize: '1.3rem',
                  textAlign: 'center',
                  fontWeight: '600'
                }}
              />
              
              {formData.bedTime && formData.intendedWakeTime && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: 'rgba(23, 162, 184, 0.1)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#17a2b8', fontWeight: '600' }}>
                    <i className="fas fa-hourglass-half" style={{ marginRight: '0.5rem' }}></i>
                    Planned Sleep Duration
                  </p>
                  <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#4682B4' }}>
                    {(() => {
                      const bedDateTime = new Date(`${formData.date}T${formData.bedTime}`);
                      let wakeDateTime = new Date(`${formData.date}T${formData.intendedWakeTime}`);
                      if (wakeDateTime <= bedDateTime) {
                        wakeDateTime.setDate(wakeDateTime.getDate() + 1);
                      }
                      const hours = (wakeDateTime - bedDateTime) / (1000 * 60 * 60);
                      return `${Math.round(hours * 10) / 10} hours`;
                    })()}
                  </p>
                </div>
              )}

              {/* Alarm notification info */}
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: '#856404'
              }}>
                <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
                <strong>Note:</strong> We'll request notification permission to help remind you of your wake-up time. 
                For full alarm functionality, consider using your device's built-in alarm app.
              </div>
            </div>
          </div>
        );

      case 'pre-bed-routine':
        return (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
              marginBottom: '2rem'
            }}>
              {preBedRoutines.map(routine => (
                <label key={routine} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: formData.preeBedRoutine.includes(routine)
                    ? 'rgba(70, 130, 180, 0.1)'
                    : '#F9FAFB',
                  border: formData.preeBedRoutine.includes(routine)
                    ? '1px solid #4682B4'
                    : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.preeBedRoutine.includes(routine)}
                    onChange={() => handleCheckboxChange(routine, 'preeBedRoutine')}
                  />
                  {routine}
                </label>
              ))}
            </div>

            <div style={{
              background: 'rgba(40, 167, 69, 0.1)',
              border: '1px solid rgba(40, 167, 69, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ color: '#28a745', margin: '0 0 1rem 0' }}>
                <i className="fas fa-spa" style={{ marginRight: '0.5rem' }}></i>
                Good Sleep Hygiene Tips
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#4B5563', fontSize: '0.9rem' }}>
                <li>Consistent bedtime routine helps signal your body it's time to sleep</li>
                <li>Avoid screens 1-2 hours before bed</li>
                <li>Keep bedroom cool, dark, and quiet</li>
                <li>Light stretching or reading can help you relax</li>
              </ul>
            </div>
          </div>
        );

      case 'pre-bed-assessment':
        return (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '1rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#4682B4',
                textAlign: 'center'
              }}>
                <i className="fas fa-brain" style={{ marginRight: '0.5rem' }}></i>
                How stressed do you feel right now?
              </label>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{
                  fontSize: '2rem',
                  color: formData.stressLevelAtBed <= 3 ? '#28a745' : 
                         formData.stressLevelAtBed <= 6 ? '#ffc107' : '#dc3545'
                }}>
                  {formData.stressLevelAtBed}/10
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.stressLevelAtBed}
                onChange={(e) => setFormData(prev => ({ ...prev, stressLevelAtBed: parseInt(e.target.value) }))}
                style={{
                  width: '100%',
                  height: '8px',
                  marginBottom: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '1rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#4682B4'
              }}>
                <i className="fas fa-coffee" style={{ marginRight: '0.5rem' }}></i>
                How much caffeine did you have today? (cups)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={formData.caffeineToday}
                onChange={(e) => setFormData(prev => ({ ...prev, caffeineToday: parseInt(e.target.value) || 0 }))}
                style={{
                  width: '100%',
                  maxWidth: '150px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  background: '#FFFFFF',
                  color: '#000000',
                  fontSize: '1rem'
                }}
              />
              {formData.caffeineToday > 4 && (
                <p style={{ color: '#ffc107', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                  High caffeine intake may affect sleep quality
                </p>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '1rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#4682B4'
              }}>
                <i className="fas fa-home" style={{ marginRight: '0.5rem' }}></i>
                Sleep environment notes (optional)
              </label>
              <textarea
                value={formData.sleepEnvironment}
                onChange={(e) => setFormData(prev => ({ ...prev, sleepEnvironment: e.target.value }))}
                placeholder="Room temperature, noise level, comfort, etc..."
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
          </div>
        );

      case 'sleep-quality':
        const actualSleepHours = pendingSleepSession && formData.wakeTime ? 
          (() => {
            const bedDateTime = new Date(`${pendingSleepSession.date}T${pendingSleepSession.bedTime}`);
            let wakeDateTime = new Date(`${formData.date}T${formData.wakeTime}`);
            if (wakeDateTime <= bedDateTime) {
              wakeDateTime.setDate(wakeDateTime.getDate() + 1);
            }
            return (wakeDateTime - bedDateTime) / (1000 * 60 * 60);
          })() : calculateSleepHours();

        return (
          <div>
            {/* Sleep summary for woke-up mode */}
            {pendingSleepSession && (
              <div style={{
                background: 'rgba(40, 167, 69, 0.1)',
                border: '1px solid rgba(40, 167, 69, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#28a745' }}>
                  <i className="fas fa-sun"></i>
                </div>
                <h3 style={{ color: '#28a745', margin: '0 0 1rem 0' }}>Good Morning!</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: '#4B5563' }}>Bedtime</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4682B4' }}>
                      <i className="fas fa-moon" style={{ marginRight: '0.5rem' }}></i>
                      {pendingSleepSession.bedTime}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: '#4B5563' }}>Wake Time</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4682B4' }}>
                      <i className="fas fa-sun" style={{ marginRight: '0.5rem' }}></i>
                      {formData.wakeTime}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: '#4B5563' }}>Total Sleep</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>
                      <i className="fas fa-hourglass-half" style={{ marginRight: '0.5rem' }}></i>
                      {Math.round(actualSleepHours * 10) / 10}h
                    </div>
                  </div>
                </div>
                {pendingSleepSession.intendedWakeTime && (
                  <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#4B5563' }}>
                    {(() => {
                      const intendedTime = new Date(`${formData.date}T${pendingSleepSession.intendedWakeTime}`);
                      const actualWakeTime = new Date(`${formData.date}T${formData.wakeTime}`);
                      const diffMinutes = (actualWakeTime - intendedTime) / (1000 * 60);
                      
                      if (Math.abs(diffMinutes) < 15) {
                        return <><i className="fas fa-bullseye" style={{ marginRight: '0.5rem', color: '#28a745' }}></i>Right on time!</>;
                      } else if (diffMinutes > 0) {
                        return <><i className="fas fa-clock" style={{ marginRight: '0.5rem', color: '#ffc107' }}></i>{Math.round(diffMinutes)} min later than planned</>;
                      } else {
                        return <><i className="fas fa-sunrise" style={{ marginRight: '0.5rem', color: '#17a2b8' }}></i>{Math.round(Math.abs(diffMinutes))} min earlier than planned</>;
                      }
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Sleep quality rating */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '1rem',
                color: getSleepQualityColor(formData.sleepQuality)
              }}>
                {formData.sleepQuality}/10
              </div>
              <div style={{
                fontSize: '1.5rem',
                marginBottom: '2rem',
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
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.9rem',
                color: '#9CA3AF',
                marginTop: '1rem'
              }}>
                <span><i className="fas fa-frown"></i> Poor</span>
                <span><i className="fas fa-meh"></i> Fair</span>
                <span><i className="fas fa-smile"></i> Good</span>
                <span><i className="fas fa-grin-stars"></i> Excellent</span>
              </div>
            </div>
          </div>
        );

      case 'sleep-disruptions':
        return (
          <div>
            <label style={{
              display: 'block',
              marginBottom: '1rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#4682B4'
            }}>
              <i className="fas fa-exclamation-circle" style={{ marginRight: '0.5rem' }}></i>
              How often did you wake up during the night?
            </label>
            <input
              type="text"
              value={formData.awakeDuringNight}
              onChange={(e) => setFormData(prev => ({ ...prev, awakeDuringNight: e.target.value }))}
              placeholder="e.g., 2 times, 30 minutes, bathroom visit"
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
            <p style={{
              margin: '1rem 0 0 0',
              color: '#9CA3AF',
              fontSize: '0.9rem'
            }}>
              <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
              Include details like frequency, duration, or reasons (bathroom, noise, etc.)
            </p>
          </div>
        );

      case 'sleep-problems':
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '0.75rem'
          }}>
            {sleepProblems.map(problem => (
              <label key={problem} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: formData.sleepProblems.includes(problem)
                  ? '#E3F2FD'
                  : '#F9FAFB',
                border: formData.sleepProblems.includes(problem)
                  ? '1px solid #4682B4'
                  : '1px solid #E5E7EB',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.95rem'
              }}>
                <input
                  type="checkbox"
                  checked={formData.sleepProblems.includes(problem)}
                  onChange={() => handleCheckboxChange(problem, 'sleepProblems')}
                />
                {problem}
              </label>
            ))}
          </div>
        );

      case 'sleep-times':
        const sleepHours = calculateSleepHours();
        
        return (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  <i className="fas fa-moon" style={{ marginRight: '0.5rem' }}></i>
                  Went to Bed
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
                    fontSize: '1.1rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  <i className="fas fa-sun" style={{ marginRight: '0.5rem' }}></i>
                  Woke Up
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
                    fontSize: '1.1rem'
                  }}
                />
              </div>
            </div>

            {sleepHours > 0 && (
              <div style={{
                background: 'rgba(70, 130, 180, 0.1)',
                border: '1px solid rgba(70, 130, 180, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                <h3 style={{ color: '#4682B4', margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
                  <i className="fas fa-hourglass-half" style={{ marginRight: '0.5rem' }}></i>
                  Total Sleep: {sleepHours} hours
                </h3>
                <p style={{ margin: 0, color: '#4B5563', fontSize: '1rem' }}>
                  {sleepHours < 7 ? 
                    <><i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem', color: '#ffc107' }}></i>Consider getting more sleep for optimal health</> : 
                   sleepHours > 9 ? 
                    <><i className="fas fa-check-circle" style={{ marginRight: '0.5rem', color: '#28a745' }}></i>That's plenty of sleep!</> : 
                    <><i className="fas fa-thumbs-up" style={{ marginRight: '0.5rem', color: '#28a745' }}></i>Good amount of sleep!</>}
                </p>
              </div>
            )}
          </div>
        );

      case 'screen-time':
        return (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  <i className="fas fa-mobile-alt" style={{ marginRight: '0.5rem' }}></i>
                  Mobile Screen Time (hours)
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={formData.screenTimeMobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, screenTimeMobile: parseFloat(e.target.value) || 0 }))}
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
                {formData.screenTimeMobile > 3 && (
                  <p style={{ color: '#ffc107', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                    High screen time may affect sleep quality
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  <i className="fas fa-desktop" style={{ marginRight: '0.5rem' }}></i>
                  Computer Screen Time (hours)
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={formData.screenTimeComputer}
                  onChange={(e) => setFormData(prev => ({ ...prev, screenTimeComputer: parseFloat(e.target.value) || 0 }))}
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
                {formData.screenTimeComputer > 8 && (
                  <p style={{ color: '#ffc107', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                    Consider blue light filters before bed
                  </p>
                )}
              </div>
            </div>

            <div style={{
              background: 'rgba(40, 167, 69, 0.1)',
              border: '1px solid rgba(40, 167, 69, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ color: '#28a745', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                <i className="fas fa-shield-alt" style={{ marginRight: '0.5rem' }}></i>
                Screen Time & Sleep Tips
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#4B5563', fontSize: '0.9rem' }}>
                <li>Avoid screens 1-2 hours before bed</li>
                <li>Use blue light filters in the evening</li>
                <li>Keep devices outside the bedroom</li>
                <li>Try reading or meditation instead</li>
              </ul>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional details about your sleep (dreams, environment, how you felt, etc.)..."
              rows="6"
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                background: '#FFFFFF',
                color: '#000000',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            <p style={{
              margin: '1rem 0 0 0',
              color: '#9CA3AF',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              <i className="fas fa-lightbulb" style={{ marginRight: '0.5rem' }}></i>
              This information helps identify sleep patterns that may affect your headaches
            </p>
            
            {pendingSleepSession && (
              <div style={{
                background: 'rgba(40, 167, 69, 0.1)',
                border: '1px solid rgba(40, 167, 69, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginTop: '2rem'
              }}>
                <h4 style={{ color: '#28a745', margin: '0 0 1rem 0' }}>
                  <i className="fas fa-clipboard-check" style={{ marginRight: '0.5rem' }}></i>
                  Sleep Session Summary
                </h4>
                <div style={{ color: '#4B5563', fontSize: '0.9rem' }}>
                  <p style={{ margin: '0.5rem 0' }}>
                    <i className="fas fa-moon" style={{ marginRight: '0.5rem' }}></i>
                    <strong>Bedtime:</strong> {pendingSleepSession.bedTime}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <i className="fas fa-alarm-clock" style={{ marginRight: '0.5rem' }}></i>
                    <strong>Intended wake time:</strong> {pendingSleepSession.intendedWakeTime}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <i className="fas fa-sun" style={{ marginRight: '0.5rem' }}></i>
                    <strong>Actual wake time:</strong> {formData.wakeTime}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <i className="fas fa-spa" style={{ marginRight: '0.5rem' }}></i>
                    <strong>Pre-bed routine:</strong> {pendingSleepSession.preBedRoutine?.join(', ') || 'None recorded'}
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const currentQuestion = activeQuestions[currentStep];
  const isLastStep = currentStep === activeQuestions.length - 1;
  
  const canProceed = () => {
    if (!currentQuestion) return false;
    
    switch (currentQuestion.component) {
      case 'sleep-mode-selection':
        return sleepMode !== '';
      case 'wake-intention':
        return formData.intendedWakeTime !== '';
      case 'sleep-times':
        return formData.bedTime && formData.wakeTime;
      default:
        return true;
    }
  };

  const getButtonText = () => {
    if (loading) return 'Saving...';
    if (sleepMode === 'going-to-bed' && isLastStep) return 'Save Bedtime & Set Reminder';
    if (isLastStep) return 'Record Sleep Data';
    return 'Next →';
  };

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

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1E3A8A',
              textAlign: 'center',
              flex: 1
            }}>
              <i className="fas fa-bed" style={{ marginRight: '0.5rem' }}></i>
              {sleepMode === 'going-to-bed' ? 'Bedtime Setup' : 
               sleepMode === 'woke-up' ? 'Morning Sleep Review' : 
               'Record Sleep'}
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
          
          {/* Progress Bar */}
          {activeQuestions.length > 1 && (
            <>
              <div style={{
                background: '#E5E7EB',
                borderRadius: '10px',
                height: '8px',
                overflow: 'hidden',
                marginBottom: '15px'
              }}>
                <div style={{
                  background: '#4682B4',
                  height: '100%',
                  width: `${((currentStep + 1) / activeQuestions.length) * 100}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.9rem',
                color: '#9CA3AF'
              }}>
                <span>Step {currentStep + 1} of {activeQuestions.length}</span>
                <span>{Math.round(((currentStep + 1) / activeQuestions.length) * 100)}% Complete</span>
              </div>
            </>
          )}
        </div>

        {/* Special alerts */}
        {pendingSleepSession && sleepMode === 'woke-up' && (
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
              Continuing Your Sleep Session
            </h4>
            <p style={{ margin: 0, color: '#4B5563', fontSize: '0.9rem' }}>
              We have your bedtime data from last night. Let's complete your sleep record!
            </p>
          </div>
        )}

        {/* Question Content */}
        <div style={{ marginBottom: '40px', minHeight: '400px' }}>
          {currentQuestion && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{
                  margin: '0 0 15px 0',
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  color: '#4682B4'
                }}>
                  {currentQuestion.title}
                </h2>
                <p style={{
                  margin: 0,
                  color: '#9CA3AF',
                  fontSize: '1.1rem'
                }}>
                  {currentQuestion.subtitle}
                </p>
              </div>

              {error && (
                <div style={{
                  background: '#f8d7da',
                  border: '1px solid #dc3545',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '30px',
                  color: '#721c24',
                  textAlign: 'center'
                }}>
                  <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                  {error}
                </div>
              )}

              {renderCurrentQuestion()}
            </>
          )}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            style={{
              background: currentStep === 0 ? '#E5E7EB' : 'transparent',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              color: currentStep === 0 ? '#9CA3AF' : '#4B5563',
              padding: '12px 24px',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              fontSize: '1rem'
            }}
          >
            <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }}></i>
            Previous
          </button>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {!isLastStep && currentQuestion?.component !== 'sleep-mode-selection' && (
              <button
                onClick={handleSkip}
                style={{
                  background: 'transparent',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  color: '#9CA3AF',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                <i className="fas fa-forward" style={{ marginRight: '0.5rem' }}></i>
                Skip
              </button>
            )}

            <button
              onClick={isLastStep ? handleSubmit : handleNext}
              disabled={!canProceed() || loading}
              style={{
                background: !canProceed() || loading ? '#E5E7EB' : 
                           sleepMode === 'going-to-bed' ? '#4682B4' : '#28a745',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                padding: '12px 24px',
                cursor: !canProceed() || loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                minWidth: '180px'
              }}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Saving...</>
              ) : isLastStep ? (
                <><i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>{getButtonText()}</>
              ) : (
                <>Next <i className="fas fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
