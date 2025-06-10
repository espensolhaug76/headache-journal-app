/* eslint-disable no-unused-vars */
// src/pages/RecordHeadache.js - Complete Version with Simple Migraine Question

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEditMode } from '../hooks/useEditMode';
import { collection, addDoc, Timestamp, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Import modular components
import HeadacheTypeSelector from '../components/headache/HeadacheTypeSelector';
import PremiumProdromeTracker from '../components/headache/PremiumProdromeTracker';

// Import headache images - with fallback for missing images
let migrainerHeadacheImg, tensionHeadacheImg, reboundHeadacheImg, exertionHeadacheImg;
let caffeineHeadacheImg, hormoneHeadacheImg, clusterHeadacheImg, sinusHeadacheImg;

try {
  migrainerHeadacheImg = require('../assets/headache-types/migraine-headache.png');
  tensionHeadacheImg = require('../assets/headache-types/tension-headache.png');
  reboundHeadacheImg = require('../assets/headache-types/rebound-headache.png');
  exertionHeadacheImg = require('../assets/headache-types/exertion-headache.png');
  caffeineHeadacheImg = require('../assets/headache-types/caffeine-headache.png');
  hormoneHeadacheImg = require('../assets/headache-types/hormone-headache.png');
  clusterHeadacheImg = require('../assets/headache-types/cluster-headache.png');
  sinusHeadacheImg = require('../assets/headache-types/sinus-headache.png');
} catch (error) {
  console.log('Some headache images not found, using placeholders');
  const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjYwIiB5PSI2NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNkI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5IZWFkYWNoZTwvdGV4dD4KPC9zdmc+';
  
  migrainerHeadacheImg = placeholder;
  tensionHeadacheImg = placeholder;
  reboundHeadacheImg = placeholder;
  exertionHeadacheImg = placeholder;
  caffeineHeadacheImg = placeholder;
  hormoneHeadacheImg = placeholder;
  clusterHeadacheImg = placeholder;
  sinusHeadacheImg = placeholder;
}

export default function RecordHeadache() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Dev toggle for testing freemium vs premium (remove in production)
  const [isPremiumMode, setIsPremiumMode] = useState(false);
  
  // App state management
  const [mode, setMode] = useState('selection');
  const [ongoingSession, setOngoingSession] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Edit mode functionality
  const { 
    isEditMode, 
    editDocId, 
    loading: editLoading, 
    error: editError, 
    statusMessage: editStatusMessage,
    loadExistingData, 
    updateRecord, 
    deleteRecord,
    clearMessages 
  } = useEditMode('headaches');
  
  // Form data
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const prefilledDate = urlParams.get('date');
  const prefilledMode = urlParams.get('mode');

  const [formData, setFormData] = useState({
    date: prefilledDate || new Date().toISOString().split('T')[0],
    painLevel: 5,
    location: '',
    isMigrineAttack: false, // NEW: Simple migraine question
    prodromeSymptoms: [],
    currentSymptoms: [],
    triggers: [],
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Headache types data
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

  // Simple Migraine Question Component
  const MigrineQuestion = () => {
    return (
      <div style={{
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h4 style={{ 
          color: '#1E40AF', 
          margin: '0 0 1rem 0',
          fontSize: '1.1rem',
          fontWeight: '600'
        }}>
          <i className="fas fa-question-circle" style={{ marginRight: '0.5rem' }}></i>
          Is this a migraine attack?
        </h4>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: !formData.isMigrineAttack ? '#EBF8FF' : '#F9FAFB',
            border: !formData.isMigrineAttack ? '2px solid #3B82F6' : '1px solid #E5E7EB',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: !formData.isMigrineAttack ? '600' : '400',
            color: !formData.isMigrineAttack ? '#1E40AF' : '#6B7280'
          }}>
            <input
              type="radio"
              name="migrineAttack"
              checked={!formData.isMigrineAttack}
              onChange={() => setFormData(prev => ({ ...prev, isMigrineAttack: false }))}
              style={{ 
                width: '18px', 
                height: '18px',
                accentColor: '#3B82F6'
              }}
            />
            No, regular headache
          </label>
          
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: formData.isMigrineAttack ? '#FEF2F2' : '#F9FAFB',
            border: formData.isMigrineAttack ? '2px solid #DC2626' : '1px solid #E5E7EB',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: formData.isMigrineAttack ? '600' : '400',
            color: formData.isMigrineAttack ? '#DC2626' : '#6B7280'
          }}>
            <input
              type="radio"
              name="migrineAttack"
              checked={formData.isMigrineAttack}
              onChange={() => setFormData(prev => ({ ...prev, isMigrineAttack: true }))}
              style={{ 
                width: '18px', 
                height: '18px',
                accentColor: '#DC2626'
              }}
            />
            Yes, migraine attack
          </label>
        </div>
        
        {formData.isMigrineAttack && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(220, 38, 38, 0.1)',
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: '#DC2626'
          }}>
            <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
            This will be tracked as a migraine attack for better pattern analysis.
          </div>
        )}
      </div>
    );
  };

  // Event handlers
  const handleTypeSelect = (typeName) => {
    setFormData(prev => ({ ...prev, location: typeName }));
  };

  const handlePainLevelChange = (level) => {
    setFormData(prev => ({ ...prev, painLevel: level }));
  };

  const handleProdromeChange = (symptoms) => {
    setFormData(prev => ({ ...prev, prodromeSymptoms: symptoms }));
  };

  // Check for ongoing session
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

  useEffect(() => {
    if (prefilledDate) {
      setFormData(prev => ({ ...prev, date: prefilledDate }));
    }
    if (prefilledMode) {
      setMode(prefilledMode);
    }
  }, [prefilledDate, prefilledMode]);

  // Load existing data for editing
  useEffect(() => {
    const loadData = async () => {
      if (isEditMode && editDocId) {
        setIsLoadingData(true);
        const existingData = await loadExistingData();
        if (existingData) {
          setFormData(prev => ({
            ...prev,
            date: existingData.date || prev.date,
            painLevel: existingData.painLevel || prev.painLevel,
            location: existingData.location || prev.location,
            isMigrineAttack: existingData.isMigrineAttack || false,
            prodromeSymptoms: existingData.prodromeSymptoms || [],
            currentSymptoms: existingData.currentSymptoms || [],
            triggers: existingData.triggers || [],
            notes: existingData.notes || ''
          }));
        }
        setIsLoadingData(false);
      }
    };
    loadData();
  }, [isEditMode, editDocId, loadExistingData]);

  // Database operations
  const startHeadacheSession = async () => {
    if (!currentUser) {
      setError('You must be logged in to track headaches');
      return;
    }

    if (!formData.location) {
      setError('Please select a headache type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const sessionData = {
        startTime: Timestamp.now(),
        painLevel: parseInt(formData.painLevel),
        location: formData.location,
        isMigrineAttack: formData.isMigrineAttack,
        ended: false,
        createdAt: Timestamp.now(),
        ...(isPremiumMode && {
          prodromeSymptoms: formData.prodromeSymptoms
        })
      };

      const sessionRef = await addDoc(collection(db, 'users', currentUser.uid, 'ongoingHeadaches'), sessionData);
      
      setOngoingSession({ id: sessionRef.id, ...sessionData });
      setMode('active-headache');
      
    } catch (error) {
      console.error('Error starting headache session:', error);
      setError('Failed to start tracking. Please try again.');
    }

    setLoading(false);
  };

  const endHeadacheSession = async () => {
    if (!ongoingSession) {
      setError('No ongoing headache session found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endTime = Timestamp.now();
      const duration = Math.round((endTime.toDate() - ongoingSession.startTime.toDate()) / (1000 * 60));

      const headacheData = {
        userId: currentUser.uid,
        painLevel: ongoingSession.painLevel,
        location: ongoingSession.location,
        isMigrineAttack: ongoingSession.isMigrineAttack,
        startTime: ongoingSession.startTime,
        endTime: endTime,
        duration: duration,
        date: formData.date,
        createdAt: Timestamp.now(),
        ...(isPremiumMode && {
          prodromeSymptoms: ongoingSession.prodromeSymptoms || formData.prodromeSymptoms,
          currentSymptoms: formData.currentSymptoms,
          triggers: formData.triggers,
          notes: formData.notes
        })
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'headaches'), headacheData);
      await deleteDoc(doc(db, 'users', currentUser.uid, 'ongoingHeadaches', ongoingSession.id));
      
      setOngoingSession(null);
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
      if (isEditMode && editDocId) {
        const success = await updateRecord({
          painLevel: parseInt(formData.painLevel),
          location: formData.location,
          isMigrineAttack: formData.isMigrineAttack,
          date: formData.date,
          ...(isPremiumMode && {
            prodromeSymptoms: formData.prodromeSymptoms,
            currentSymptoms: formData.currentSymptoms,
            triggers: formData.triggers,
            notes: formData.notes
          })
        });
        
        if (success) {
          navigate('/dashboard');
        }
      } else {
        const entryDate = new Date(formData.date + 'T' + new Date().toTimeString().slice(0, 8));
        const headacheData = {
          userId: currentUser.uid,
          painLevel: parseInt(formData.painLevel),
          location: formData.location,
          isMigrineAttack: formData.isMigrineAttack,
          startTime: Timestamp.fromDate(entryDate),
          endTime: Timestamp.fromDate(entryDate),
          duration: 0,
          date: formData.date,
          createdAt: Timestamp.now(),
          ...(isPremiumMode && {
            prodromeSymptoms: formData.prodromeSymptoms,
            currentSymptoms: formData.currentSymptoms,
            triggers: formData.triggers,
            notes: formData.notes
          })
        };

        await addDoc(collection(db, 'users', currentUser.uid, 'headaches'), headacheData);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error recording headache:', error);
      setError('Failed to record headache. Please try again.');
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (isEditMode && editDocId) {
      const success = await deleteRecord();
      if (success) {
        // Will navigate automatically via the hook
      }
    }
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
                {ongoingSession.isMigrineAttack && (
                  <span style={{ color: '#DC2626', fontWeight: 'bold' }}> • Migraine Attack</span>
                )}
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
                Prodrome tracking, advanced analytics, triggers, AI insights & more
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

          {/* Headache Type Selector */}
          <HeadacheTypeSelector
            headacheTypes={headacheTypes}
            currentSlide={currentSlide}
            setCurrentSlide={setCurrentSlide}
            selectedType={formData.location}
            onTypeSelect={handleTypeSelect}
          />

          {/* Simple Migraine Question */}
          <MigrineQuestion />

          {/* Premium Prodrome Tracking */}
          {isPremiumMode && (
            <PremiumProdromeTracker
              selectedProdromeSymptoms={formData.prodromeSymptoms}
              onProdromeChange={handleProdromeChange}
              timeframe="in the last 24 hours"
            />
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
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
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
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                  Starting...
                </>
              ) : (
                <>
                  <i className="fas fa-play" style={{ marginRight: '0.5rem' }}></i>
                  Start Tracking
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE HEADACHE - Timer Running
  if (mode === 'active-headache') {
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
          {/* Active Session Display */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid #F87171',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#F87171' }}>
              <i className="fas fa-stopwatch"></i>
            </div>
            <h2 style={{ color: '#F87171', margin: '0 0 1rem 0' }}>
              Headache in Progress
            </h2>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#F87171', marginBottom: '0.5rem' }}>
              {ongoingSession && formatDuration(ongoingSession.startTime)}
            </div>
            <div style={{ color: '#4B5563', fontSize: '1rem' }}>
              <div>Pain Level: {ongoingSession?.painLevel}/10</div>
              <div>Type: {ongoingSession?.location}</div>
              {ongoingSession?.isMigrineAttack && (
                <div style={{ color: '#DC2626', fontWeight: 'bold' }}>
                  <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                  Migraine Attack
                </div>
              )}
              <div>Started: {ongoingSession?.startTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          {/* Premium Features Preview */}
          {isPremiumMode && (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
                <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
                Track symptoms (optional)
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '0.5rem'
              }}>
                {currentSymptoms.slice(0, 6).map(symptom => (
                  <label key={symptom} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: formData.currentSymptoms.includes(symptom) ? 'rgba(220, 53, 69, 0.1)' : '#F9FAFB',
                    border: formData.currentSymptoms.includes(symptom) ? '1px solid #dc3545' : '1px solid #E5E7EB',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.currentSymptoms.includes(symptom)}
                      onChange={() => {
                        setFormData(prev => ({
                          ...prev,
                          currentSymptoms: prev.currentSymptoms.includes(symptom)
                            ? prev.currentSymptoms.filter(s => s !== symptom)
                            : [...prev.currentSymptoms, symptom]
                        }));
                      }}
                      style={{ transform: 'scale(0.8)' }}
                    />
                    {symptom}
                  </label>
                ))}
              </div>
            </div>
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
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Premium: Real-time Symptom Tracking</h4>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
                Track symptoms during headaches for better pattern recognition
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
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
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
              onClick={() => setMode('end-headache')}
              style={{
                background: '#10B981',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              <i className="fas fa-stop" style={{ marginRight: '0.5rem' }}></i>
              End Headache
            </button>
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
            background: 'rgba(16, 185, 129, 0.1)',
            border: '2px solid #10B981',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#10B981' }}>
              <i className="fas fa-flag-checkered"></i>
            </div>
            <h2 style={{ color: '#10B981', margin: '0 0 1rem 0' }}>
              Headache Complete!
            </h2>
            {ongoingSession && (
              <>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10B981', marginBottom: '0.5rem' }}>
                  Duration: {formatDuration(ongoingSession.startTime)}
                </div>
                <div style={{ color: '#4B5563', fontSize: '1rem' }}>
                  Type: {ongoingSession.location}
                  <br />
                  Pain Level: {ongoingSession.painLevel}/10
                  {ongoingSession.isMigrineAttack && (
                    <>
                      <br />
                      <span style={{ color: '#DC2626', fontWeight: 'bold' }}>
                        <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                        Migraine Attack
                      </span>
                    </>
                  )}
                  <br />
                  Started: {ongoingSession.startTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </>
            )}
          </div>

          {/* Quick notes (optional) */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
              Any notes about this headache? (optional)
            </h4>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="What helped? What made it worse? Any observations..."
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

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => setMode('active-headache')}
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
                background: loading ? '#E5E7EB' : '#10B981',
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
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>
                  Complete & Save
                </>
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
              {isEditMode ? 'Edit Headache' : 'Manual Headache Entry'}
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '1rem', margin: 0 }}>
              {isEditMode ? 'Modify existing headache data' : 'Log past headache'}
            </p>
          </div>

          {/* Date Selector */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
              <i className="fas fa-calendar" style={{ marginRight: '0.5rem' }}></i>
              Date of Headache
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

          {/* Pain Level Slider */}
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

          {/* Headache Type Selector */}
          <HeadacheTypeSelector
            headacheTypes={headacheTypes}
            currentSlide={currentSlide}
            setCurrentSlide={setCurrentSlide}
            selectedType={formData.location}
            onTypeSelect={handleTypeSelect}
          />

          {/* Simple Migraine Question */}
          <MigrineQuestion />

          {/* Premium Prodrome Tracking for Manual Entry */}
          {isPremiumMode && (
            <PremiumProdromeTracker
              selectedProdromeSymptoms={formData.prodromeSymptoms}
              onProdromeChange={handleProdromeChange}
              timeframe="before this headache"
            />
          )}

          {/* Notes */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
              Notes about this headache (optional)
            </h4>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Duration, triggers, what helped, etc..."
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
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Premium: Advanced Headache Tracking</h4>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
                Track prodrome symptoms, triggers, detailed analytics & more
              </p>
            </div>
          )}

          {/* Status Messages */}
          {(error || editError || editStatusMessage) && (
            <div style={{ marginBottom: '2rem' }}>
              {(error || editError) && (
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
                  {error || editError}
                </div>
              )}

              {editStatusMessage && (
                <div style={{
                  background: '#d4edda',
                  border: '1px solid #28a745',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '1rem',
                  color: '#155724',
                  textAlign: 'center'
                }}>
                  <i className="fas fa-check-circle" style={{ marginRight: '0.5rem' }}></i>
                  {editStatusMessage}
                </div>
              )}
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
              disabled={loading || editLoading || !formData.location}
              style={{
                background: (loading || editLoading || !formData.location) ? '#E5E7EB' : '#ffc107',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '12px 24px',
                cursor: (loading || editLoading || !formData.location) ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {(loading || editLoading) ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>
                  {isEditMode ? 'Update Headache' : 'Save Headache'}
                </>
              )}
            </button>

            {/* Delete button for edit mode */}
            {isEditMode && (
              <button
                onClick={handleDelete}
                disabled={loading || editLoading}
                style={{
                  background: (loading || editLoading) ? '#F87171' : '#DC2626',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '12px 24px',
                  cursor: (loading || editLoading) ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                {(loading || editLoading) ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash" style={{ marginRight: '0.5rem' }}></i>
                    Delete
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
