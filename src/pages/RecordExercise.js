import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordExercise() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Dev toggle for testing freemium vs premium
  const [isPremiumMode, setIsPremiumMode] = useState(false);
  
  // App state management
  const [mode, setMode] = useState('selection'); // 'selection', 'start-exercise', 'active-exercise', 'end-exercise', 'manual-entry'
  const [ongoingSession, setOngoingSession] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState({
    exerciseType: '',
    duration: 30, // minutes
    intensity: 'moderate',
    // Premium fields
    heartRate: '',
    environment: '',
    postWorkoutFeeling: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Exercise types with Font Awesome icons
  const exerciseTypes = [
    {
      id: 'running',
      name: 'Running',
      icon: 'fas fa-running',
      description: 'Outdoor or treadmill running',
      color: '#dc3545'
    },
    {
      id: 'walking',
      name: 'Walking',
      icon: 'fas fa-walking',
      description: 'Casual or brisk walking',
      color: '#28a745'
    },
    {
      id: 'gym',
      name: 'Gym Workout',
      icon: 'fas fa-dumbbell',
      description: 'Weight training, machines',
      color: '#6c757d'
    },
    {
      id: 'cycling',
      name: 'Cycling',
      icon: 'fas fa-bicycle',
      description: 'Bike riding, spinning',
      color: '#17a2b8'
    },
    {
      id: 'swimming',
      name: 'Swimming',
      icon: 'fas fa-swimmer',
      description: 'Pool or open water',
      color: '#007bff'
    },
    {
      id: 'yoga',
      name: 'Yoga',
      icon: 'fas fa-pray',
      description: 'Yoga, stretching, meditation',
      color: '#6f42c1'
    },
    {
      id: 'sports',
      name: 'Sports',
      icon: 'fas fa-futbol',
      description: 'Tennis, basketball, soccer',
      color: '#fd7e14'
    },
    {
      id: 'other',
      name: 'Other',
      icon: 'fas fa-heart',
      description: 'Dancing, hiking, etc.',
      color: '#e83e8c'
    }
  ];

  const intensityLevels = [
    { 
      value: 'light', 
      label: 'Light',
      description: 'Easy pace, can sing',
      color: '#28a745',
      icon: 'fas fa-leaf'
    },
    { 
      value: 'moderate', 
      label: 'Moderate',
      description: 'Can talk but not sing',
      color: '#ffc107',
      icon: 'fas fa-fire'
    },
    { 
      value: 'intense', 
      label: 'Intense',
      description: 'Hard to talk',
      color: '#dc3545',
      icon: 'fas fa-bolt'
    }
  ];

  const checkForOngoingSession = useCallback(async () => {
    if (!currentUser) return;

    try {
      const ongoingQuery = query(
        collection(db, 'users', currentUser.uid, 'ongoingExercise'),
        where('ended', '==', false)
      );
      
      const ongoingSnapshot = await getDocs(ongoingQuery);
      
      if (!ongoingSnapshot.empty) {
        const sessionDoc = ongoingSnapshot.docs[0];
        const sessionData = { id: sessionDoc.id, ...sessionDoc.data() };
        
        // Check if session is within 6 hours (reasonable workout duration)
        const startTime = sessionData.startTime.toDate();
        const now = new Date();
        const hoursDiff = (now - startTime) / (1000 * 60 * 60);
        
        if (hoursDiff <= 6) {
          setOngoingSession(sessionData);
          setMode('active-exercise');
          setFormData(prev => ({
            ...prev,
            exerciseType: sessionData.exerciseType
          }));
        } else {
          // Clean up stale session
          await deleteDoc(doc(db, 'users', currentUser.uid, 'ongoingExercise', sessionDoc.id));
        }
      }
    } catch (error) {
      console.error('Error checking for ongoing session:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    checkForOngoingSession();
  }, [checkForOngoingSession]);

  const formatDuration = (startTime) => {
    const now = new Date();
    const start = startTime.toDate();
    const diffMs = now - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const startExerciseSession = async () => {
    if (!currentUser || !formData.exerciseType) {
      setError('Please select an exercise type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const sessionData = {
        startTime: Timestamp.now(),
        exerciseType: formData.exerciseType,
        ended: false,
        createdAt: Timestamp.now()
      };

      const sessionRef = await addDoc(collection(db, 'users', currentUser.uid, 'ongoingExercise'), sessionData);
      
      setOngoingSession({ id: sessionRef.id, ...sessionData });
      setMode('active-exercise');
      
    } catch (error) {
      console.error('Error starting exercise session:', error);
      setError('Failed to start tracking. Please try again.');
    }

    setLoading(false);
  };

  const endExerciseSession = async () => {
    if (!ongoingSession) return;

    setLoading(true);
    setError('');

    try {
      const endTime = Timestamp.now();
      const duration = Math.round((endTime.toDate() - ongoingSession.startTime.toDate()) / (1000 * 60)); // minutes

      const exerciseData = {
        userId: currentUser.uid,
        exerciseType: ongoingSession.exerciseType,
        startTime: ongoingSession.startTime,
        endTime: endTime,
        duration: duration,
        intensity: formData.intensity,
        date: ongoingSession.startTime.toDate().toISOString().split('T')[0],
        createdAt: Timestamp.now(),
        // Premium fields
        ...(isPremiumMode && {
          heartRate: formData.heartRate,
          environment: formData.environment,
          postWorkoutFeeling: formData.postWorkoutFeeling,
          notes: formData.notes
        })
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'exercise'), exerciseData);
      
      // Delete ongoing session
      await deleteDoc(doc(db, 'users', currentUser.uid, 'ongoingExercise', ongoingSession.id));
      
      navigate('/dashboard');

    } catch (error) {
      console.error('Error ending exercise session:', error);
      setError('Failed to end tracking. Please try again.');
    }

    setLoading(false);
  };

  const submitManualEntry = async () => {
    if (!currentUser || !formData.exerciseType) {
      setError('Please select an exercise type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const now = new Date();
      const exerciseData = {
        userId: currentUser.uid,
        exerciseType: formData.exerciseType,
        duration: parseInt(formData.duration),
        intensity: formData.intensity,
        startTime: Timestamp.fromDate(now),
        endTime: Timestamp.fromDate(now),
        date: now.toISOString().split('T')[0],
        createdAt: Timestamp.now(),
        // Premium fields
        ...(isPremiumMode && {
          heartRate: formData.heartRate,
          environment: formData.environment,
          postWorkoutFeeling: formData.postWorkoutFeeling,
          notes: formData.notes
        })
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'exercise'), exerciseData);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording exercise:', error);
      setError('Failed to record exercise. Please try again.');
    }

    setLoading(false);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % exerciseTypes.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + exerciseTypes.length) % exerciseTypes.length);
  };

  const getDurationColor = (duration) => {
    if (duration < 15) return '#dc3545';
    if (duration < 30) return '#fd7e14';
    if (duration < 60) return '#28a745';
    if (duration < 120) return '#20c997';
    return '#ffc107';
  };

  const getDurationText = (duration) => {
    if (duration < 15) return 'Short';
    if (duration < 30) return 'Brief';
    if (duration < 60) return 'Good';
    if (duration < 120) return 'Long';
    return 'Very Long';
  };

  // MAIN SELECTION SCREEN
  if (mode === 'selection') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        color: '#1E293B',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />

        <div style={{ maxWidth: '500px', width: '100%' }}>
          {/* Dev Toggle */}
          <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: '#fff',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '0.8rem'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={isPremiumMode}
                onChange={(e) => setIsPremiumMode(e.target.checked)}
              />
              {isPremiumMode ? '💎 Premium Mode' : '🆓 Free Mode'}
            </label>
          </div>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{
              margin: '0 0 1rem 0',
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1E3A8A'
            }}>
              <i className="fas fa-dumbbell" style={{ marginRight: '0.5rem' }}></i>
              Exercise Tracker
            </h1>
            <p style={{ color: '#6B7280', fontSize: '1.1rem', margin: 0 }}>
              Start workout timer or log manually
            </p>
          </div>

          {/* Ongoing Session Alert */}
          {ongoingSession && (
            <div style={{
              background: 'rgba(40, 167, 69, 0.1)',
              border: '2px solid #28a745',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#28a745' }}>
                <i className="fas fa-stopwatch"></i>
              </div>
              <h4 style={{ color: '#28a745', margin: '0 0 0.5rem 0' }}>
                Workout in Progress
              </h4>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745', marginBottom: '0.5rem' }}>
                Duration: {formatDuration(ongoingSession.startTime)}
              </div>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>
                Type: {ongoingSession.exerciseType}
              </p>
            </div>
          )}

          {/* Error Display */}
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

          {/* Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Start Exercise */}
            <button
              onClick={() => setMode('start-exercise')}
              disabled={loading || ongoingSession}
              style={{
                padding: '2rem 1rem',
                background: ongoingSession 
                  ? '#F3F4F6' 
                  : 'linear-gradient(135deg, #28a745, #20c997)',
                border: 'none',
                borderRadius: '16px',
                cursor: ongoingSession || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                color: 'white',
                boxShadow: ongoingSession ? 'none' : '0 4px 12px rgba(40, 167, 69, 0.3)',
                opacity: ongoingSession ? 0.6 : 1
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                <i className="fas fa-play"></i>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                Start Exercise
              </h3>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Begin workout timer
              </div>
            </button>

            {/* End Exercise */}
            <button
              onClick={() => setMode('end-exercise')}
              disabled={loading || !ongoingSession}
              style={{
                padding: '2rem 1rem',
                background: !ongoingSession 
                  ? '#F3F4F6' 
                  : 'linear-gradient(135deg, #dc3545, #c82333)',
                border: 'none',
                borderRadius: '16px',
                cursor: !ongoingSession || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                color: 'white',
                boxShadow: !ongoingSession ? 'none' : '0 4px 12px rgba(220, 53, 69, 0.3)',
                opacity: !ongoingSession ? 0.6 : 1
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                <i className="fas fa-stop"></i>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                End Exercise
              </h3>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Finish current workout
              </div>
            </button>

            {/* Manual Entry */}
            <button
              onClick={() => setMode('manual-entry')}
              disabled={loading}
              style={{
                padding: '2rem 1rem',
                background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                border: 'none',
                borderRadius: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                <i className="fas fa-edit"></i>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                Manual Entry
              </h3>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Log past workout
              </div>
            </button>
          </div>

          {/* Premium Teaser */}
          {!isPremiumMode && (
            <div style={{
              background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              color: 'white',
              marginBottom: '2rem'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                <i className="fas fa-crown"></i>
              </div>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Unlock Premium Features</h4>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
                Exercise-headache correlation, heart rate tracking & more
              </p>
            </div>
          )}

          {/* Back to Dashboard */}
          <div style={{ textAlign: 'center' }}>
            <Link
              to="/dashboard"
              style={{
                background: 'transparent',
                border: '1px solid #F3F4F6',
                borderRadius: '8px',
                color: '#6B7280',
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

  // START EXERCISE FLOW
  if (mode === 'start-exercise') {
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
        <div style={{ maxWidth: '500px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: '#28a745', marginBottom: '1rem' }}>
              <i className="fas fa-play" style={{ marginRight: '0.5rem' }}></i>
              Start Your Workout
            </h2>
            <p style={{ color: '#6B7280', fontSize: '1rem', margin: 0 }}>
              Choose your exercise type to begin timer
            </p>
          </div>

          {/* Exercise Type Selector */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#1E40AF', marginBottom: '1rem', textAlign: 'center' }}>What are you doing?</h3>
            
            <div style={{
              position: 'relative',
              minHeight: '250px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                style={{
                  position: 'absolute',
                  left: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(70, 130, 180, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10
                }}
              >
                <i className="fas fa-chevron-left" style={{ color: '#4682B4', fontSize: '1.2rem' }}></i>
              </button>

              <button
                onClick={nextSlide}
                style={{
                  position: 'absolute',
                  right: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(70, 130, 180, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10
                }}
              >
                <i className="fas fa-chevron-right" style={{ color: '#4682B4', fontSize: '1.2rem' }}></i>
              </button>

              {/* Current Exercise Display */}
              <div style={{ textAlign: 'center', padding: '0 4rem', width: '100%' }}>
                <div style={{ 
                  fontSize: '4rem',
                  marginBottom: '1rem',
                  color: exerciseTypes[currentSlide].color,
                  transition: 'all 0.3s ease',
                  transform: formData.exerciseType === exerciseTypes[currentSlide].name ? 'scale(1.1)' : 'scale(1)'
                }}>
                  <i className={exerciseTypes[currentSlide].icon}></i>
                </div>
                
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: formData.exerciseType === exerciseTypes[currentSlide].name ? exerciseTypes[currentSlide].color : '#374151',
                  fontSize: '1.3rem',
                  fontWeight: '600'
                }}>
                  {exerciseTypes[currentSlide].name}
                </h4>
                
                <p style={{ 
                  margin: '0 0 1.5rem 0', 
                  color: '#9CA3AF',
                  fontSize: '0.9rem'
                }}>
                  {exerciseTypes[currentSlide].description}
                </p>

                <button
                  onClick={() => setFormData(prev => ({ ...prev, exerciseType: exerciseTypes[currentSlide].name }))}
                  style={{
                    background: formData.exerciseType === exerciseTypes[currentSlide].name 
                      ? `linear-gradient(135deg, ${exerciseTypes[currentSlide].color}, ${exerciseTypes[currentSlide].color}dd)` 
                      : 'linear-gradient(135deg, #1E40AF, #1E3A8A)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {formData.exerciseType === exerciseTypes[currentSlide].name ? (
                    <>
                      <i className="fas fa-check" style={{ marginRight: '0.5rem' }}></i>
                      Selected
                    </>
                  ) : (
                    'Select This Exercise'
                  )}
                </button>
              </div>
            </div>

            {/* Slide Indicators */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '1rem'
            }}>
              {exerciseTypes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    border: 'none',
                    background: index === currentSlide ? '#1E40AF' : '#E5E7EB',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>

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
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => setMode('selection')}
              style={{
                background: 'transparent',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                color: '#4B5563',
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }}></i>
              Back
            </button>
            
            <button
              onClick={startExerciseSession}
              disabled={loading || !formData.exerciseType}
              style={{
                background: (loading || !formData.exerciseType) ? '#E5E7EB' : '#28a745',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '12px 24px',
                cursor: (loading || !formData.exerciseType) ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Starting...</>
              ) : (
                <><i className="fas fa-play" style={{ marginRight: '0.5rem' }}></i>Start Timer</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE EXERCISE MODE (Workout in Progress)
  if (mode === 'active-exercise') {
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
        <div style={{ maxWidth: '500px', width: '100%' }}>
          {/* Active Session Header */}
          <div style={{
            background: 'rgba(40, 167, 69, 0.1)',
            border: '2px solid #28a745',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#28a745' }}>
              <i className="fas fa-stopwatch"></i>
            </div>
            <h2 style={{ color: '#28a745', margin: '0 0 1rem 0' }}>
              Workout in Progress
            </h2>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745', marginBottom: '0.5rem' }}>
              {ongoingSession && formatDuration(ongoingSession.startTime)}
            </div>
            <div style={{ color: '#4B5563', fontSize: '1rem' }}>
              <i className="fas fa-dumbbell" style={{ marginRight: '0.5rem' }}></i>
              {ongoingSession?.exerciseType}
            </div>
          </div>

          {/* Premium Features Preview */}
          {isPremiumMode && (
            <>
              {/* Heart Rate */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
                  <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
                  Heart Rate (optional)
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="number"
                    min="60"
                    max="220"
                    value={formData.heartRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, heartRate: e.target.value }))}
                    placeholder="BPM"
                    style={{
                      width: '100px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      background: '#FFFFFF',
                      color: '#000000',
                      fontSize: '1rem'
                    }}
                  />
                  <span style={{ color: '#6B7280' }}>
                    <i className="fas fa-heartbeat" style={{ marginRight: '0.5rem' }}></i>
                    Peak or average heart rate
                  </span>
                </div>
              </div>

              {/* Environment */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
                  <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
                  Where are you exercising?
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem'
                }}>
                  {['Indoor Gym', 'Home', 'Outdoor', 'Pool', 'Park', 'Other'].map(env => (
                    <button
                      key={env}
                      onClick={() => setFormData(prev => ({ ...prev, environment: env }))}
                      style={{
                        padding: '0.75rem',
                        background: formData.environment === env 
                          ? 'rgba(70, 130, 180, 0.1)'
                          : '#FFFFFF',
                        border: formData.environment === env 
                          ? '2px solid #4682B4'
                          : '1px solid #E5E7EB',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: '#000000'
                      }}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Premium Teaser for Free Users */}
          {!isPremiumMode && (
            <div style={{
              background: 'linear-gradient(135deg, #4682B4, #2c5aa0)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              color: 'white',
              marginBottom: '2rem'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                <i className="fas fa-crown"></i>
              </div>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Premium: Advanced Tracking</h4>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
                Heart rate monitoring, environment tracking & exercise-headache correlation
              </p>
            </div>
          )}

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
              {error}
            </div>
          )}

          {/* End Workout Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => setMode('end-exercise')}
              style={{
                background: '#dc3545',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                padding: '16px 32px',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}
            >
              <i className="fas fa-stop" style={{ marginRight: '0.5rem' }}></i>
              End Workout
            </button>

            <div>
              <button
                onClick={() => setMode('selection')}
                style={{
                  background: 'transparent',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  color: '#4B5563',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }}></i>
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // END EXERCISE FLOW
  if (mode === 'end-exercise') {
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
        <div style={{ maxWidth: '500px', width: '100%' }}>
          {/* Session Summary */}
          <div style={{
            background: 'rgba(220, 53, 69, 0.1)',
            border: '2px solid #dc3545',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#dc3545' }}>
              <i className="fas fa-flag-checkered"></i>
            </div>
            <h2 style={{ color: '#dc3545', margin: '0 0 1rem 0' }}>
              Workout Complete!
            </h2>
            {ongoingSession && (
              <>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545', marginBottom: '0.5rem' }}>
                  Duration: {formatDuration(ongoingSession.startTime)}
                </div>
                <div style={{ color: '#4B5563', fontSize: '1rem' }}>
                  Exercise: {ongoingSession.exerciseType}
                  <br />
                  Started: {ongoingSession.startTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </>
            )}
          </div>

          {/* Intensity Rating */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#1E40AF', marginBottom: '1.5rem' }}>How intense was your workout?</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem'
            }}>
              {intensityLevels.map(level => (
                <button
                  key={level.value}
                  onClick={() => setFormData(prev => ({ ...prev, intensity: level.value }))}
                  style={{
                    padding: '1.5rem 1rem',
                    background: formData.intensity === level.value
                      ? `rgba(${level.color === '#28a745' ? '40, 167, 69' : 
                                   level.color === '#ffc107' ? '255, 193, 7' : '220, 53, 69'}, 0.1)`
                      : '#FFFFFF',
                    border: formData.intensity === level.value
                      ? `2px solid ${level.color}`
                      : '1px solid #E5E7EB',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: level.color }}>
                    <i className={level.icon}></i>
                  </div>
                  <h4 style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '1.1rem', 
                    fontWeight: '600',
                    color: formData.intensity === level.value ? level.color : '#000000'
                  }}>
                    {level.label}
                  </h4>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.85rem', 
                    color: '#6B7280'
                  }}>
                    {level.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Premium Features for End Session */}
          {isPremiumMode && (
            <>
              {/* Post-workout feeling */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
                  <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
                  How do you feel after the workout?
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem'
                }}>
                  {['Energized', 'Tired', 'Great', 'Exhausted', 'Normal', 'Sore'].map(feeling => (
                    <button
                      key={feeling}
                      onClick={() => setFormData(prev => ({ ...prev, postWorkoutFeeling: feeling }))}
                      style={{
                        padding: '0.75rem',
                        background: formData.postWorkoutFeeling === feeling 
                          ? 'rgba(40, 167, 69, 0.1)'
                          : '#FFFFFF',
                        border: formData.postWorkoutFeeling === feeling 
                          ? '2px solid #28a745'
                          : '1px solid #E5E7EB',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: '#000000'
                      }}
                    >
                      {feeling}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
                  <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
                  Workout notes (optional)
                </h4>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="How did the workout go? Any specific exercises, achievements, or observations..."
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
            </>
          )}

          {/* Premium Teaser for Free Users */}
          {!isPremiumMode && (
            <div style={{
              background: 'linear-gradient(135deg, #4682B4, #2c5aa0)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              color: 'white',
              marginBottom: '2rem'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                <i className="fas fa-crown"></i>
              </div>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Premium: Post-Workout Analysis</h4>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
                Track recovery, correlate with headaches & optimize your routine
              </p>
            </div>
          )}

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
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => setMode('selection')}
              style={{
                background: 'transparent',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                color: '#4B5563',
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }}></i>
              Back
            </button>
            
            <button
              onClick={endExerciseSession}
              disabled={loading}
              style={{
                background: loading ? '#E5E7EB' : '#dc3545',
                border: 'none',
                borderRadius: '8px',
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
                <><i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>Complete Workout</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MANUAL ENTRY MODE
  if (mode === 'manual-entry') {
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
        <div style={{ maxWidth: '500px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: '#ffc107', marginBottom: '1rem' }}>
              <i className="fas fa-edit" style={{ marginRight: '0.5rem' }}></i>
              Manual Exercise Entry
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '1rem', margin: 0 }}>
              Log a past workout
            </p>
          </div>

          {/* Exercise Type Selector - Same as start-exercise */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#4682B4', marginBottom: '1rem', textAlign: 'center' }}>Exercise Type</h3>
            
            <div style={{
              position: 'relative',
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <button
                onClick={prevSlide}
                style={{
                  position: 'absolute',
                  left: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(70, 130, 180, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10
                }}
              >
                <i className="fas fa-chevron-left" style={{ color: '#4682B4', fontSize: '1.2rem' }}></i>
              </button>

              <button
                onClick={nextSlide}
                style={{
                  position: 'absolute',
                  right: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(70, 130, 180, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10
                }}
              >
                <i className="fas fa-chevron-right" style={{ color: '#4682B4', fontSize: '1.2rem' }}></i>
              </button>

              <div style={{ textAlign: 'center', padding: '0 4rem', width: '100%' }}>
                <div style={{ 
                  fontSize: '3rem',
                  marginBottom: '1rem',
                  color: exerciseTypes[currentSlide].color,
                  transition: 'all 0.3s ease',
                  transform: formData.exerciseType === exerciseTypes[currentSlide].name ? 'scale(1.1)' : 'scale(1)'
                }}>
                  <i className={exerciseTypes[currentSlide].icon}></i>
                </div>
                
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: formData.exerciseType === exerciseTypes[currentSlide].name ? exerciseTypes[currentSlide].color : '#374151',
                  fontSize: '1.2rem',
                  fontWeight: '600'
                }}>
                  {exerciseTypes[currentSlide].name}
                </h4>
                
                <p style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#9CA3AF',
                  fontSize: '0.9rem'
                }}>
                  {exerciseTypes[currentSlide].description}
                </p>

                <button
                  onClick={() => setFormData(prev => ({ ...prev, exerciseType: exerciseTypes[currentSlide].name }))}
                  style={{
                    background: formData.exerciseType === exerciseTypes[currentSlide].name 
                      ? `linear-gradient(135deg, ${exerciseTypes[currentSlide].color}, ${exerciseTypes[currentSlide].color}dd)` 
                      : 'linear-gradient(135deg, #4682B4, #2c5aa0)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {formData.exerciseType === exerciseTypes[currentSlide].name ? (
                    <>
                      <i className="fas fa-check" style={{ marginRight: '0.5rem' }}></i>
                      Selected
                    </>
                  ) : (
                    'Select This Exercise'
                  )}
                </button>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '1rem'
            }}>
              {exerciseTypes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    border: 'none',
                    background: index === currentSlide ? '#4682B4' : '#E5E7EB',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Duration */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#4682B4', marginBottom: '1rem' }}>
              Duration: {formData.duration} minutes
            </h3>
            <div style={{
              fontSize: '1.5rem',
              marginBottom: '1rem',
              color: getDurationColor(formData.duration),
              fontWeight: 'bold'
            }}>
              {getDurationText(formData.duration)}
            </div>
            <input
              type="range"
              min="5"
              max="180"
              step="5"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              style={{
                width: '100%',
                height: '12px',
                borderRadius: '6px',
                background: `linear-gradient(to right, #dc3545 0%, #28a745 33%, #20c997 66%, #ffc107 100%)`,
                outline: 'none',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: '#9CA3AF'
            }}>
              <span>5 min</span>
              <span>3 hours</span>
            </div>
          </div>

          {/* Intensity */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#4682B4', marginBottom: '1rem', textAlign: 'center' }}>Intensity</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem'
            }}>
              {intensityLevels.map(level => (
                <button
                  key={level.value}
                  onClick={() => setFormData(prev => ({ ...prev, intensity: level.value }))}
                  style={{
                    padding: '1rem',
                    background: formData.intensity === level.value
                      ? `rgba(${level.color === '#28a745' ? '40, 167, 69' : 
                                   level.color === '#ffc107' ? '255, 193, 7' : '220, 53, 69'}, 0.1)`
                      : '#FFFFFF',
                    border: formData.intensity === level.value
                      ? `2px solid ${level.color}`
                      : '1px solid #E5E7EB',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: level.color }}>
                    <i className={level.icon}></i>
                  </div>
                  <h4 style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    color: formData.intensity === level.value ? level.color : '#000000'
                  }}>
                    {level.label}
                  </h4>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.8rem', 
                    color: '#6B7280'
                  }}>
                    {level.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Premium Teaser */}
          {!isPremiumMode && (
            <div style={{
              background: 'linear-gradient(135deg, #4682B4, #2c5aa0)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              color: 'white',
              marginBottom: '2rem'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                <i className="fas fa-crown"></i>
              </div>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Premium: Detailed Exercise Tracking</h4>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
                Heart rate, environment, recovery & headache correlation analysis
              </p>
            </div>
          )}

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
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => setMode('selection')}
              style={{
                background: 'transparent',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                color: '#4B5563',
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }}></i>
              Back
            </button>
            
            <button
              onClick={submitManualEntry}
              disabled={loading || !formData.exerciseType}
              style={{
                background: (loading || !formData.exerciseType) ? '#E5E7EB' : '#ffc107',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '12px 24px',
                cursor: (loading || !formData.exerciseType) ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Saving...</>
              ) : (
                <><i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>Save Exercise</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
