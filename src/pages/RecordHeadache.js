// src/pages/RecordHeadache.js - Updated with modular components
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Import modular components
import HeadacheTypeSelector from '../components/headache/HeadacheTypeSelector';

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
  const currentSymptoms = [
    'Nausea', 'Vomiting', 'Light sensitivity', 'Sound sensitivity', 
    'Dizziness', 'Blurred vision', 'Neck pain', 'Jaw tension'
  ];

  const commonTriggers = [
    'Stress', 'Lack of sleep', 'Weather changes', 'Bright lights',
    'Loud noises', 'Strong smells', 'Certain foods', 'Alcohol',
    'Hormonal changes', 'Skipped meals', 'Dehydration', 'Screen time'
  ];

  // Helper functions
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

  // Existing functions (checkForOngoingSession, formatDuration, etc.)
  const checkForOngoingSession = React.useCallback(async () => {
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
        
        const startTime = sessionData.startTime.toDate();
        const now = new Date();
        const hoursDiff = (now - startTime) / (1000 * 60 * 60);
        
        if (hoursDiff <= 24) {
          setOngoingSession(sessionData);
        } else {
          await deleteDoc(doc(db, 'users', currentUser.uid, 'ongoingHeadaches', sessionDoc.id));
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

  // Event handlers
  const handleTypeSelect = (typeName) => {
    setFormData(prev => ({ ...prev, location: typeName }));
  };

  const handlePainLevelChange = (level) => {
    setFormData(prev => ({ ...prev, painLevel: level }));
  };

  // Database operations (existing functions)
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

      const sessionRef = await addDoc(collection(db, 'users', currentUser.uid, 'ongoingHeadaches'), sessionData);
      
      setOngoingSession({ id: sessionRef.id, ...sessionData });
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
      const duration = Math.round((endTime.toDate() - ongoingSession.startTime.toDate()) / (1000 * 60));

      const headacheData = {
        userId: currentUser.uid,
        painLevel: ongoingSession.painLevel,
        location: ongoingSession.location,
        startTime: ongoingSession.startTime,
        endTime: endTime,
        duration: duration,
        date: ongoingSession.startTime.toDate().toISOString().split('T')[0],
        createdAt: Timestamp.now(),
        ...(isPremiumMode && {
          currentSymptoms: formData.currentSymptoms,
          triggers: formData.triggers,
          notes: formData.notes
        })
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'headaches'), headacheData);
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
        ...(isPremiumMode && {
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

  // MAIN SELECTION SCREEN (unchanged)
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
              <i className="fas fa-head-side-virus" style={{ marginRight: '0.5rem' }}></i>
              Headache Tracker
            </h1>
            <p style={{ color: '#6B7280', fontSize: '1.1rem', margin: 0 }}>
              Record in seconds with auto-timer
            </p>
          </div>

          {/* Ongoing Session Alert */}
          {ongoingSession && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid #F87171',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#F87171' }}>
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h4 style={{ color: '#F87171', margin: '0 0 0.5rem 0' }}>
                Headache in Progress
              </h4>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#F87171', marginBottom: '0.5rem' }}>
                Duration: {formatDuration(ongoingSession.startTime)}
              </div>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>
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
              onClick={startHeadacheSession}
              disabled={loading || !formData.location}
              style={{
                background: (loading || !formData.location) ? '#E5E7EB' : '#EF4444',
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

  // Continue with other modes (auto-timer, manual-entry, etc.)
  // These would also use modular components as we create them

  return null;
}8d7da',
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
            <button
              onClick={() => setMode('start-headache')}
              disabled={loading || ongoingSession}
              style={{
                padding: '2rem 1rem',
                background: ongoingSession 
                  ? '#F3F4F6' 
                  : 'linear-gradient(135deg, #F87171, #EF4444)',
                border: 'none',
                borderRadius: '16px',
                cursor: ongoingSession || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                color: 'white',
                boxShadow: ongoingSession ? 'none' : '0 4px 12px rgba(248, 113, 113, 0.2)',
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

            <button
              onClick={() => setMode('end-headache')}
              disabled={loading || !ongoingSession}
              style={{
                padding: '2rem 1rem',
                background: !ongoingSession 
                  ? '#F3F4F6' 
                  : 'linear-gradient(135deg, #34D399, #10B981)',
                border: 'none',
                borderRadius: '16px',
                cursor: !ongoingSession || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                color: 'white',
                boxShadow: !ongoingSession ? 'none' : '0 4px 12px rgba(52, 211, 153, 0.2)',
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
                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)'
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

  // START HEADACHE FLOW - NOW USING MODULAR COMPONENTS
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
            <h2 style={{ color: '#EF4444', marginBottom: '1rem' }}>
              <i className="fas fa-play" style={{ marginRight: '0.5rem' }}></i>
              Starting Headache Tracking
            </h2>
          </div>

          {/* Pain Level Slider */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#1E40AF', marginBottom: '1rem' }}>Current Pain Level</h3>
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
              onChange={(e) => handlePainLevelChange(parseInt(e.target.value))}
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

          {/* MODULAR COMPONENT USAGE */}
          <HeadacheTypeSelector
            headacheTypes={headacheTypes}
            currentSlide={currentSlide}
            setCurrentSlide={setCurrentSlide}
            selectedType={formData.location}
            onTypeSelect={handleTypeSelect}
          />

          {error && (
            <div style={{
              background: '#f
