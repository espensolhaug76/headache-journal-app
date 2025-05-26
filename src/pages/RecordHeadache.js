import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Import headache images
import migrainerHeadacheImg from '../assets/headache-types/migraine-headache.png';
import tensionHeadacheImg from '../assets/headache-types/tension-headache.png';
import reboundHeadacheImg from '../assets/headache-types/rebound-headache.png';
import exertionHeadacheImg from '../assets/headache-types/exertion-headache.png';
import caffeineHeadacheImg from '../assets/headache-types/caffeine-headache.png';
import hormoneHeadacheImg from '../assets/headache-types/hormone-headache.png';
import clusterHeadacheImg from '../assets/headache-types/cluster-headache.png';
import sinusHeadacheImg from '../assets/headache-types/sinus-headache.png';

export default function RecordHeadache() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Dev toggle for testing freemium vs premium (remove in production)
  const [isPremiumMode, setIsPremiumMode] = useState(false);
  
  // App state management
  const [mode, setMode] = useState('selection'); // 'selection', 'auto-timer', 'manual-entry'
  const [ongoingSession, setOngoingSession] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState({
    painLevel: 5,
    location: '',
    // Premium fields
    prodromeSymptoms: [],
    currentSymptoms: [],
    triggers: [],
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const headacheTypes = [
    {
      id: 'tension',
      name: 'Tension Headache',
      description: 'Band around head/forehead',
      image: tensionHeadacheImg,
      pattern: 'Band-like pressure around the entire head'
    },
    {
      id: 'migraine',
      name: 'Migraine Headache',
      description: 'One side of head',
      image: migrainerHeadacheImg,
      pattern: 'Throbbing pain, usually on one side'
    },
    {
      id: 'cluster',
      name: 'Cluster Headache',
      description: 'Around one eye',
      image: clusterHeadacheImg,
      pattern: 'Severe pain around or behind one eye'
    },
    {
      id: 'sinus',
      name: 'Sinus Headache',
      description: 'Forehead/cheek area',
      image: sinusHeadacheImg,
      pattern: 'Sinus pressure and congestion'
    },
    {
      id: 'caffeine',
      name: 'Caffeine Headache',
      description: 'Front/temples',
      image: caffeineHeadacheImg,
      pattern: 'Dull ache at temples and front of head'
    },
    {
      id: 'hormone',
      name: 'Hormone Headache',
      description: 'One side (menstrual)',
      image: hormoneHeadacheImg,
      pattern: 'Related to hormonal changes'
    },
    {
      id: 'rebound',
      name: 'Medication Overuse',
      description: 'All over/top',
      image: reboundHeadacheImg,
      pattern: 'From medication overuse'
    },
    {
      id: 'exertion',
      name: 'Exertion Headache',
      description: 'Back/all over',
      image: exertionHeadacheImg,
      pattern: 'Exercise-induced headache'
    }
  ];

  // Premium features data
  const prodromeSymptoms = [
    'Mood changes', 'Food cravings', 'Fatigue', 'Neck stiffness', 
    'Visual disturbances', 'Sensitivity to light', 'Sensitivity to sound', 'Nausea'
  ];

  const currentSymptoms = [
    'Nausea', 'Vomiting', 'Light sensitivity', 'Sound sensitivity', 
    'Dizziness', 'Blurred vision', 'Neck pain', 'Jaw tension'
  ];

  const commonTriggers = [
    'Stress', 'Lack of sleep', 'Weather changes', 'Bright lights',
    'Loud noises', 'Strong smells', 'Certain foods', 'Alcohol',
    'Hormonal changes', 'Skipped meals', 'Dehydration', 'Screen time'
  ];

  // Check for ongoing sessions on component mount
  useEffect(() => {
    checkForOngoingSession();
  }, [currentUser]);

  const checkForOngoingSession = async () => {
    if (!currentUser) return;

    try {
      const ongoingQuery = query(
        collection(db, 'users', currentUser.uid, 'ongoingHeadaches'),
        where('ended', '==', false)
      );
      
      const ongoingSnapshot = await getDocs(ongoingQuery);
      
      if (!ongoingSnapshot.empty) {
        const sessionDoc = ongoingSnapshot.docs[0];
        const sessionData = { id: sessionDoc.id, ...sessionDoc.data() };
        
        // Check if session is within 24 hours
        const startTime = sessionData.startTime.toDate();
        const now = new Date();
        const hoursDiff = (now - startTime) / (1000 * 60 * 60);
        
        if (hoursDiff <= 24) {
          setOngoingSession(sessionData);
        } else {
          // Clean up stale session
          await deleteDoc(doc(db, 'users', currentUser.uid, 'ongoingHeadaches', sessionDoc.id));
        }
      }
    } catch (error) {
      console.error('Error checking for ongoing session:', error);
    }
  };

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

  const startHeadacheSession = async () => {
    if (!currentUser) {
      setError('You must be logged in to track headaches');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const sessionData = {
        startTime: Timestamp.now(),
        painLevel: parseInt(formData.painLevel),
        location: formData.location || 'Unknown',
        ended: false,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'ongoingHeadaches'), sessionData);
      
      setOngoingSession({ id: docRef.id, ...sessionData });
      setMode('auto-timer');
      
    } catch (error) {
      console.error('Error starting headache session:', error);
      setError('Failed to start tracking. Please try again.');
    }

    setLoading(false);
  };

  const endHeadacheSession = async () => {
    if (!ongoingSession) return;

    setLoading(true);
    setError('');

    try {
      const endTime = Timestamp.now();
      const duration = Math.round((endTime.toDate() - ongoingSession.startTime.toDate()) / (1000 * 60)); // minutes

      // Create completed headache record
      const headacheData = {
        userId: currentUser.uid,
        painLevel: ongoingSession.painLevel,
        location: ongoingSession.location,
        startTime: ongoingSession.startTime,
        endTime: endTime,
        duration: duration,
        date: ongoingSession.startTime.toDate().toISOString().split('T')[0],
        createdAt: Timestamp.now(),
        // Premium fields
        ...(isPremiumMode && {
          prodromeSymptoms: formData.prodromeSymptoms,
          currentSymptoms: formData.currentSymptoms,
          triggers: formData.triggers,
          notes: formData.notes
        })
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'headaches'), headacheData);
      
      // Delete ongoing session
      await deleteDoc(doc(db, 'users', currentUser.uid, 'ongoingHeadaches', ongoingSession.id));
      
      navigate('/dashboard');

    } catch (error) {
      console.error('Error ending headache session:', error);
      setError('Failed to end tracking. Please try again.');
    }

    setLoading(false);
  };

  const submitManualEntry = async () => {
    if (!currentUser || !formData.location) {
      setError('Please select a headache type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const now = new Date();
      const headacheData = {
        userId: currentUser.uid,
        painLevel: parseInt(formData.painLevel),
        location: formData.location,
        startTime: Timestamp.fromDate(now),
        endTime: Timestamp.fromDate(now),
        duration: 0,
        date: now.toISOString().split('T')[0],
        createdAt: Timestamp.now(),
        // Premium fields
        ...(isPremiumMode && {
          prodromeSymptoms: formData.prodromeSymptoms,
          currentSymptoms: formData.currentSymptoms,
          triggers: formData.triggers,
          notes: formData.notes
        })
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'headaches'), headacheData);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording headache:', error);
      setError('Failed to record headache. Please try again.');
    }

    setLoading(false);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % headacheTypes.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + headacheTypes.length) % headacheTypes.length);
  };

  const getPainLevelColor = (level) => {
    if (level <= 3) return '#28a745';
    if (level <= 6) return '#ffc107';
    if (level <= 8) return '#fd7e14';
    return '#dc3545';
  };

  const getPainLevelText = (level) => {
    if (level <= 2) return 'Mild';
    if (level <= 4) return 'Moderate';
    if (level <= 6) return 'Strong';
    if (level <= 8) return 'Severe';
    return 'Extreme';
  };

  const handleCheckboxChange = (value, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  // MAIN SELECTION SCREEN
  if (mode === 'selection') {
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
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />

        <div style={{ maxWidth: '500px', width: '100%' }}>
          {/* Dev Toggle for Testing */}
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
              <i className="fas fa-head-side-virus" style={{ marginRight: '0.5rem' }}></i>
              Headache Tracker
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '1.1rem', margin: 0 }}>
              Record in seconds with auto-timer
            </p>
          </div>

          {/* Ongoing Session Alert */}
          {ongoingSession && (
            <div style={{
              background: 'rgba(220, 53, 69, 0.1)',
              border: '2px solid #dc3545',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#dc3545' }}>
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h4 style={{ color: '#dc3545', margin: '0 0 0.5rem 0' }}>
                Headache in Progress
              </h4>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#dc3545', marginBottom: '0.5rem' }}>
                Duration: {formatDuration(ongoingSession.startTime)}
              </div>
              <p style={{ margin: 0, color: '#4B5563', fontSize: '0.9rem' }}>
                Pain Level: {ongoingSession.painLevel}/10 • Type: {ongoingSession.location}
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
            {/* Start Headache Button */}
            <button
              onClick={() => setMode('start-headache')}
              disabled={loading || ongoingSession}
              style={{
                padding: '2rem 1rem',
                background: ongoingSession 
                  ? '#E5E7EB' 
                  : 'linear-gradient(135deg, #dc3545, #c82333)',
                border: 'none',
                borderRadius: '16px',
                cursor: ongoingSession || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                color: 'white',
                boxShadow: ongoingSession ? 'none' : '0 4px 12px rgba(220, 53, 69, 0.3)',
                opacity: ongoingSession ? 0.6 : 1
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                <i className="fas fa-play"></i>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                I Have a Headache
              </h3>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Start auto-timer tracking
              </div>
            </button>

            {/* End Headache Button */}
            <button
              onClick={() => setMode('end-headache')}
              disabled={loading || !ongoingSession}
              style={{
                padding: '2rem 1rem',
                background: !ongoingSession 
                  ? '#E5E7EB' 
                  : 'linear-gradient(135deg, #28a745, #20c997)',
                border: 'none',
                borderRadius: '16px',
                cursor: !ongoingSession || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                color: 'white',
                boxShadow: !ongoingSession ? 'none' : '0 4px 12px rgba(40, 167, 69, 0.3)',
                opacity: !ongoingSession ? 0.6 : 1
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                <i className="fas fa-stop"></i>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                Headache Ended
              </h3>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Complete current session
              </div>
            </button>

            {/* Manual Entry */}
            <button
              onClick={() => setMode('manual-entry')}
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
                Log past headache
              </div>
            </button>
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
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Unlock Premium Features</h4>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
                Advanced analytics, triggers, AI insights & more
              </p>
            </div>
          )}

          {/* Back to Dashboard */}
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

  // START HEADACHE FLOW
  if (mode === 'start-headache') {
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
            <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>
              <i className="fas fa-play" style={{ marginRight: '0.5rem' }}></i>
              Starting Headache Tracking
            </h2>
          </div>

          {/* Pain Level */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#4682B4', marginBottom: '1rem' }}>Current Pain Level</h3>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              color: getPainLevelColor(formData.painLevel)
            }}>
              {formData.painLevel}/10
            </div>
            <div style={{
              fontSize: '1.2rem',
              marginBottom: '1.5rem',
              color: getPainLevelColor(formData.painLevel),
              fontWeight: '600'
            }}>
              {getPainLevelText(formData.painLevel)}
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.painLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, painLevel: e.target.value }))}
              style={{
                width: '100%',
                height: '12px',
                borderRadius: '6px',
                background: 'linear-gradient(to right, #28a745 0%, #ffc107 50%, #dc3545 100%)',
                outline: 'none',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            />
          </div>

          {/* Headache Type Selector */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#4682B4', marginBottom: '1rem', textAlign: 'center' }}>Headache Type</h3>
            
            <div style={{
              position: 'relative',
              minHeight: '300px',
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

              {/* Current Type Display */}
              <div style={{ textAlign: 'center', padding: '0 4rem', width: '100%' }}>
                <div style={{ 
                  height: '150px',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src={headacheTypes[currentSlide].image} 
                    alt={headacheTypes[currentSlide].name}
                    style={{ 
                      maxHeight: '120px',
                      maxWidth: '120px',
                      objectFit: 'contain',
                      transition: 'all 0.3s ease',
                      filter: formData.location === headacheTypes[currentSlide].name ? 'none' : 'grayscale(20%)',
                      transform: formData.location === headacheTypes[currentSlide].name ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: formData.location === headacheTypes[currentSlide].name ? '0 8px 25px rgba(70, 130, 180, 0.3)' : 'none'
                    }}
                  />
                </div>
                
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: formData.location === headacheTypes[currentSlide].name ? '#4682B4' : '#000000',
                  fontSize: '1.2rem',
                  fontWeight: '600'
                }}>
                  {headacheTypes[currentSlide].name}
                </h4>
                
                <p style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#9CA3AF',
                  fontSize: '0.9rem'
                }}>
                  {headacheTypes[currentSlide].pattern}
                </p>

                <button
                  onClick={() => setFormData(prev => ({ ...prev, location: headacheTypes[currentSlide].name }))}
                  style={{
                    background: formData.location === headacheTypes[currentSlide].name 
                      ? 'linear-gradient(135deg, #28a745, #20c997)' 
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
                  {formData.location === headacheTypes[currentSlide].name ? (
                    <>
                      <i className="fas fa-check" style={{ marginRight: '0.5rem' }}></i>
                      Selected
                    </>
                  ) : (
                    'Select This Type'
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
              {headacheTypes.map((_, index) => (
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
              disabled={loading || !formData.location}
              style={{
                background: (loading || !formData.location) ? '#E5E7EB' : '#ffc107',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '12px 24px',
                cursor: (loading || !formData.location) ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Saving...</>
              ) : (
                <><i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>Save Headache</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default return (should not reach here)
  return null;
}
                borderRadius: '8px';
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
              onClick={startHeadacheSession}
              disabled={loading || !formData.location}
              style={{
                background: (loading || !formData.location) ? '#E5E7EB' : '#dc3545',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '12px 24px',
                cursor: (loading || !formData.location) ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Starting...</>
              ) : (
                <><i className="fas fa-play" style={{ marginRight: '0.5rem' }}></i>Start Tracking</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AUTO-TIMER MODE (Active Headache Session)
  if (mode === 'auto-timer') {
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
            background: 'rgba(220, 53, 69, 0.1)',
            border: '2px solid #dc3545',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#dc3545' }}>
              <i className="fas fa-stopwatch"></i>
            </div>
            <h2 style={{ color: '#dc3545', margin: '0 0 1rem 0' }}>
              Tracking Active Headache
            </h2>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545', marginBottom: '0.5rem' }}>
              {ongoingSession && formatDuration(ongoingSession.startTime)}
            </div>
            <div style={{ color: '#4B5563', fontSize: '1rem' }}>
              Pain Level: {ongoingSession?.painLevel}/10 • Type: {ongoingSession?.location}
            </div>
          </div>

          {/* Pain Level Adjustment */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#4682B4', marginBottom: '1rem' }}>Update Pain Level</h3>
            <div style={{
              fontSize: '2.5rem',
              marginBottom: '1rem',
              color: getPainLevelColor(formData.painLevel || ongoingSession?.painLevel || 5)
            }}>
              {formData.painLevel || ongoingSession?.painLevel || 5}/10
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.painLevel || ongoingSession?.painLevel || 5}
              onChange={(e) => setFormData(prev => ({ ...prev, painLevel: e.target.value }))}
              style={{
                width: '100%',
                height: '12px',
                borderRadius: '6px',
                background: 'linear-gradient(to right, #28a745 0%, #ffc107 50%, #dc3545 100%)',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Premium Features Preview */}
          {isPremiumMode && (
            <>
              {/* Current Symptoms */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
                  <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
                  Current Symptoms
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {currentSymptoms.map(symptom => (
                    <label key={symptom} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      background: formData.currentSymptoms.includes(symptom) ? 'rgba(70, 130, 180, 0.1)' : '#F9FAFB',
                      border: formData.currentSymptoms.includes(symptom) ? '1px solid #4682B4' : '1px solid #E5E7EB',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.currentSymptoms.includes(symptom)}
                        onChange={() => handleCheckboxChange(symptom, 'currentSymptoms')}
                      />
                      {symptom}
                    </label>
                  ))}
                </div>
              </div>

              {/* Triggers */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
                  <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
                  Possible Triggers
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {commonTriggers.map(trigger => (
                    <label key={trigger} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      background: formData.triggers.includes(trigger) ? 'rgba(255, 193, 7, 0.1)' : '#F9FAFB',
                      border: formData.triggers.includes(trigger) ? '1px solid #ffc107' : '1px solid #E5E7EB',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.triggers.includes(trigger)}
                        onChange={() => handleCheckboxChange(trigger, 'triggers')}
                      />
                      {trigger}
                    </label>
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
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Premium: Track Symptoms & Triggers</h4>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
                Get AI insights and pattern recognition
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

          {/* End Session Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={endHeadacheSession}
              disabled={loading}
              style={{
                background: loading ? '#E5E7EB' : '#28a745',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                padding: '16px 32px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Ending...</>
              ) : (
                <><i className="fas fa-stop" style={{ marginRight: '0.5rem' }}></i>End Headache</>
              )}
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

  // END HEADACHE FLOW
  if (mode === 'end-headache') {
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
            background: 'rgba(40, 167, 69, 0.1)',
            border: '2px solid #28a745',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#28a745' }}>
              <i className="fas fa-check-circle"></i>
            </div>
            <h2 style={{ color: '#28a745', margin: '0 0 1rem 0' }}>
              Ending Headache Session
            </h2>
            {ongoingSession && (
              <>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745', marginBottom: '0.5rem' }}>
                  Total Duration: {formatDuration(ongoingSession.startTime)}
                </div>
                <div style={{ color: '#4B5563', fontSize: '1rem' }}>
                  Started: {ongoingSession.startTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  <br />
                  Type: {ongoingSession.location} • Pain: {ongoingSession.painLevel}/10
                </div>
              </>
            )}
          </div>

          {/* Premium Features for Session End */}
          {isPremiumMode && (
            <>
              {/* Session Notes */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
                  <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
                  Session Notes
                </h4>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="How did this headache progress? What helped or made it worse?"
                  rows="4"
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

              {/* What Helped */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
                  <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
                  What Helped End This Headache?
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {['Rest', 'Medication', 'Sleep', 'Water', 'Cold compress', 'Dark room', 'Fresh air', 'Food'].map(remedy => (
                    <label key={remedy} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      background: formData.currentSymptoms.includes(remedy) ? 'rgba(40, 167, 69, 0.1)' : '#F9FAFB',
                      border: formData.currentSymptoms.includes(remedy) ? '1px solid #28a745' : '1px solid #E5E7EB',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.currentSymptoms.includes(remedy)}
                        onChange={() => handleCheckboxChange(remedy, 'currentSymptoms')}
                      />
                      {remedy}
                    </label>
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
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Premium: Detailed Session Analysis</h4>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
                Track what helps, session notes & recovery patterns
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
              onClick={endHeadacheSession}
              disabled={loading}
              style={{
                background: loading ? '#E5E7EB' : '#28a745',
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
                <><i className="fas fa-check" style={{ marginRight: '0.5rem' }}></i>Complete Session</>
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
              Manual Headache Entry
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '1rem', margin: 0 }}>
              Log a past headache
            </p>
          </div>

          {/* Pain Level */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#4682B4', marginBottom: '1rem' }}>Pain Level</h3>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              color: getPainLevelColor(formData.painLevel)
            }}>
              {formData.painLevel}/10
            </div>
            <div style={{
              fontSize: '1.2rem',
              marginBottom: '1.5rem',
              color: getPainLevelColor(formData.painLevel),
              fontWeight: '600'
            }}>
              {getPainLevelText(formData.painLevel)}
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.painLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, painLevel: e.target.value }))}
              style={{
                width: '100%',
                height: '12px',
                borderRadius: '6px',
                background: 'linear-gradient(to right, #28a745 0%, #ffc107 50%, #dc3545 100%)',
                outline: 'none',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            />
          </div>

          {/* Headache Type Selector */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#4682B4', marginBottom: '1rem', textAlign: 'center' }}>Headache Type</h3>
            
            <div style={{
              position: 'relative',
              minHeight: '300px',
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

              {/* Current Type Display */}
              <div style={{ textAlign: 'center', padding: '0 4rem', width: '100%' }}>
                <div style={{ 
                  height: '150px',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src={headacheTypes[currentSlide].image} 
                    alt={headacheTypes[currentSlide].name}
                    style={{ 
                      maxHeight: '120px',
                      maxWidth: '120px',
                      objectFit: 'contain',
                      transition: 'all 0.3s ease',
                      filter: formData.location === headacheTypes[currentSlide].name ? 'none' : 'grayscale(20%)',
                      transform: formData.location === headacheTypes[currentSlide].name ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: formData.location === headacheTypes[currentSlide].name ? '0 8px 25px rgba(70, 130, 180, 0.3)' : 'none'
                    }}
                  />
                </div>
                
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: formData.location === headacheTypes[currentSlide].name ? '#4682B4' : '#000000',
                  fontSize: '1.2rem',
                  fontWeight: '600'
                }}>
                  {headacheTypes[currentSlide].name}
                </h4>
                
                <p style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#9CA3AF',
                  fontSize: '0.9rem'
                }}>
                  {headacheTypes[currentSlide].pattern}
                </p>

                <button
                  onClick={() => setFormData(prev => ({ ...prev, location: headacheTypes[currentSlide].name }))}
                  style={{
                    background: formData.location === headacheTypes[currentSlide].name 
                      ? 'linear-gradient(135deg, #28a745, #20c997)' 
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
                  {formData.location === headacheTypes[currentSlide].name ? (
                    <>
                      <i className="fas fa-check" style={{ marginRight: '0.5rem' }}></i>
                      Selected
                    </>
                  ) : (
                    'Select This Type'
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
              {headacheTypes.map((_, index) => (
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

          {/* Premium Features for Manual Entry */}
          {isPremiumMode && (
            <>
              {/* Prodrome Symptoms */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
                  <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
                  Warning Signs (Prodrome)
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {prodromeSymptoms.map(symptom => (
                    <label key={symptom} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      background: formData.prodromeSymptoms.includes(symptom) ? 'rgba(255, 193, 7, 0.1)' : '#F9FAFB',
                      border: formData.prodromeSymptoms.includes(symptom) ? '1px solid #ffc107' : '1px solid #E5E7EB',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.prodromeSymptoms.includes(symptom)}
                        onChange={() => handleCheckboxChange(symptom, 'prodromeSymptoms')}
                      />
                      {symptom}
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
                  <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
                  Notes
                </h4>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional details about this headache..."
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
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Premium: Advanced Tracking</h4>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
                Prodrome symptoms, detailed notes & AI analysis
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
                border: '1px solid #E5E
