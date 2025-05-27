import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordStress() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Dev toggle for testing freemium vs premium (remove in production)
  const [isPremiumMode, setIsPremiumMode] = useState(false);
  
  // App state management
  const [mode, setMode] = useState('selection'); // 'selection', 'quick-stress', 'evening-summary', 'manual-entry'
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState({
    stressLevel: 5,
    mood: '',
    context: '', // where/when stress occurred
    // Premium fields
    triggers: [],
    physicalSymptoms: [],
    copingStrategies: [],
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mood types with visual representations (emojis work cross-platform)
  const moodTypes = [
    {
      id: 'overwhelmed',
      name: 'Overwhelmed',
      emoji: '😰',
      description: 'Too much to handle',
      color: '#dc3545'
    },
    {
      id: 'anxious',
      name: 'Anxious',
      emoji: '😟',
      description: 'Worried and nervous',
      color: '#fd7e14'
    },
    {
      id: 'frustrated',
      name: 'Frustrated',
      emoji: '😤',
      description: 'Annoyed and irritated',
      color: '#dc3545'
    },
    {
      id: 'pressured',
      name: 'Pressured',
      emoji: '😬',
      description: 'Under time pressure',
      color: '#ffc107'
    },
    {
      id: 'tense',
      name: 'Tense',
      emoji: '😑',
      description: 'Physically tight/stiff',
      color: '#6c757d'
    },
    {
      id: 'scattered',
      name: 'Scattered',
      emoji: '😵‍💫',
      description: 'Unfocused and distracted',
      color: '#17a2b8'
    },
    {
      id: 'calm',
      name: 'Calm',
      emoji: '😌',
      description: 'Peaceful and relaxed',
      color: '#28a745'
    },
    {
      id: 'neutral',
      name: 'Neutral',
      emoji: '😐',
      description: 'Neither stressed nor calm',
      color: '#6c757d'
    }
  ];

  // Premium features data
  const commonTriggers = [
    'Work pressure', 'Family issues', 'Financial concerns', 'Health worries',
    'Traffic/Commuting', 'Technology issues', 'Deadlines', 'Conflict'
  ];

  // Physical symptoms for premium features (currently unused in free version)
  // const physicalSymptoms = [
  //   'Headache', 'Muscle tension', 'Jaw clenching', 'Rapid heartbeat',
  //   'Shallow breathing', 'Stomach upset', 'Fatigue', 'Sweating'
  // ];

  const copingStrategies = [
    'Deep breathing', 'Meditation', 'Exercise', 'Talking to someone',
    'Music', 'Walking', 'Hot bath', 'Journaling'
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % moodTypes.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + moodTypes.length) % moodTypes.length);
  };

  const getStressLevelColor = (level) => {
    if (level <= 2) return '#28a745';
    if (level <= 4) return '#20c997';
    if (level <= 6) return '#ffc107';
    if (level <= 8) return '#fd7e14';
    return '#dc3545';
  };

  const getStressLevelText = (level) => {
    if (level <= 2) return 'Very Low';
    if (level <= 4) return 'Low';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'High';
    return 'Very High';
  };

  const getCurrentTimeContext = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning stress';
    if (hour < 17) return 'Afternoon stress';
    if (hour < 21) return 'Evening stress';
    return 'Late night stress';
  };

  const submitQuickStress = async () => {
    if (!currentUser || !formData.mood) {
      setError('Please select your current mood');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const now = new Date();
      const stressData = {
        userId: currentUser.uid,
        stressLevel: parseInt(formData.stressLevel),
        mood: formData.mood,
        context: formData.context || getCurrentTimeContext(),
        timestamp: Timestamp.now(),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        type: 'real-time', // vs 'evening-summary' or 'manual'
        createdAt: Timestamp.now(),
        // Premium fields
        ...(isPremiumMode && {
          triggers: formData.triggers,
          physicalSymptoms: formData.physicalSymptoms,
          copingStrategies: formData.copingStrategies,
          notes: formData.notes
        })
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'stress'), stressData);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording stress:', error);
      setError('Failed to record stress. Please try again.');
    }

    setLoading(false);
  };

  const submitEveningSummary = async () => {
    if (!currentUser) {
      setError('You must be logged in to record stress data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const now = new Date();
      const stressData = {
        userId: currentUser.uid,
        stressLevel: parseInt(formData.stressLevel),
        mood: formData.mood || 'mixed',
        context: 'Daily summary',
        timestamp: Timestamp.now(),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        type: 'evening-summary',
        createdAt: Timestamp.now(),
        // Premium fields
        ...(isPremiumMode && {
          triggers: formData.triggers,
          physicalSymptoms: formData.physicalSymptoms,
          copingStrategies: formData.copingStrategies,
          notes: formData.notes
        })
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'stress'), stressData);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording stress:', error);
      setError('Failed to record stress data. Please try again.');
    }

    setLoading(false);
  };

  const submitManualEntry = async () => {
    if (!currentUser || !formData.mood) {
      setError('Please select a mood');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const now = new Date();
      const stressData = {
        userId: currentUser.uid,
        stressLevel: parseInt(formData.stressLevel),
        mood: formData.mood,
        context: formData.context || 'Manual entry',
        timestamp: Timestamp.now(),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        type: 'manual',
        createdAt: Timestamp.now(),
        // Premium fields
        ...(isPremiumMode && {
          triggers: formData.triggers,
          physicalSymptoms: formData.physicalSymptoms,
          copingStrategies: formData.copingStrategies,
          notes: formData.notes
        })
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'stress'), stressData);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording stress:', error);
      setError('Failed to record stress data. Please try again.');
    }

    setLoading(false);
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
              <i className="fas fa-brain" style={{ marginRight: '0.5rem' }}></i>
              Stress Tracker
            </h1>
            <p style={{ color: '#6B7280', fontSize: '1.1rem', margin: 0 }}>
              Record in seconds - real-time or daily summary
            </p>
          </div>

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
            {/* Quick Stress Check - Real-time */}
            <button
              onClick={() => setMode('quick-stress')}
              disabled={loading}
              style={{
                padding: '2rem 1rem',
                background: 'linear-gradient(135deg, #F87171, #EF4444)',
                border: 'none',
                borderRadius: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(248, 113, 113, 0.3)'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                I'm Stressed Now
              </h3>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Quick real-time logging
              </div>
            </button>

            {/* Evening Summary */}
            <button
              onClick={() => setMode('evening-summary')}
              disabled={loading}
              style={{
                padding: '2rem 1rem',
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                border: 'none',
                borderRadius: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                <i className="fas fa-moon"></i>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                Daily Summary
              </h3>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                How was your day overall?
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
                Log past stress
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
                Stress triggers analysis, coping strategies & AI insights
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

  // QUICK STRESS CHECK (Real-time)
  if (mode === 'quick-stress') {
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
              <i className="fas fa-exclamation-circle" style={{ marginRight: '0.5rem' }}></i>
              Quick Stress Check
            </h2>
            <p style={{ color: '#6B7280', fontSize: '1rem', margin: 0 }}>
              {getCurrentTimeContext()} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Stress Level */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#1E40AF', marginBottom: '1rem' }}>Current Stress Level</h3>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              color: getStressLevelColor(formData.stressLevel)
            }}>
              {formData.stressLevel}/10
            </div>
            <div style={{
              fontSize: '1.2rem',
              marginBottom: '1.5rem',
              color: getStressLevelColor(formData.stressLevel),
              fontWeight: '600'
            }}>
              {getStressLevelText(formData.stressLevel)}
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.stressLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, stressLevel: e.target.value }))}
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

          {/* Mood Selector */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#1E40AF', marginBottom: '1rem', textAlign: 'center' }}>How do you feel?</h3>
            
            <div style={{
              position: 'relative',
              minHeight: '200px',
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

              {/* Current Mood Display */}
              <div style={{ textAlign: 'center', padding: '0 4rem', width: '100%' }}>
                <div style={{ 
                  fontSize: '4rem',
                  marginBottom: '1rem',
                  transition: 'all 0.3s ease',
                  transform: formData.mood === moodTypes[currentSlide].name ? 'scale(1.1)' : 'scale(1)'
                }}>
                  {moodTypes[currentSlide].emoji}
                </div>
                
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: formData.mood === moodTypes[currentSlide].name ? moodTypes[currentSlide].color : '#374151',
                  fontSize: '1.3rem',
                  fontWeight: '600'
                }}>
                  {moodTypes[currentSlide].name}
                </h4>
                
                <p style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#9CA3AF',
                  fontSize: '0.9rem'
                }}>
                  {moodTypes[currentSlide].description}
                </p>

                <button
                  onClick={() => setFormData(prev => ({ ...prev, mood: moodTypes[currentSlide].name }))}
                  style={{
                    background: formData.mood === moodTypes[currentSlide].name 
                      ? `linear-gradient(135deg, ${moodTypes[currentSlide].color}, ${moodTypes[currentSlide].color}dd)` 
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
                  {formData.mood === moodTypes[currentSlide].name ? (
                    <>
                      <i className="fas fa-check" style={{ marginRight: '0.5rem' }}></i>
                      Selected
                    </>
                  ) : (
                    'Select This Mood'
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
              {moodTypes.map((_, index) => (
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

          {/* Optional Context */}
          <div style={{ marginBottom: '2rem' }}>
            <input
              type="text"
              value={formData.context}
              onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
              placeholder="Where/why are you stressed? (optional)"
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

          {/* Premium Features Preview */}
          {isPremiumMode && (
            <>
              {/* Quick Triggers */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
                  <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
                  What's causing stress?
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {commonTriggers.slice(0, 6).map(trigger => (
                    <label key={trigger} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      background: formData.triggers.includes(trigger) ? 'rgba(255, 193, 7, 0.1)' : '#F9FAFB',
                      border: formData.triggers.includes(trigger) ? '1px solid #ffc107' : '1px solid #E5E7EB',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.triggers.includes(trigger)}
                        onChange={() => handleCheckboxChange(trigger, 'triggers')}
                        style={{ transform: 'scale(0.8)' }}
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
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Premium: Stress Triggers & Coping</h4>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
                Track what causes stress and what helps you cope
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
              onClick={submitQuickStress}
              disabled={loading || !formData.mood}
              style={{
                background: (loading || !formData.mood) ? '#E5E7EB' : '#EF4444',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '12px 24px',
                cursor: (loading || !formData.mood) ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Saving...</>
              ) : (
                <><i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>Save Stress Check</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // EVENING SUMMARY MODE
  if (mode === 'evening-summary') {
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
            <h2 style={{ color: '#6366F1', marginBottom: '1rem' }}>
              <i className="fas fa-moon" style={{ marginRight: '0.5rem' }}></i>
              Daily Stress Summary
            </h2>
            <p style={{ color: '#6B7280', fontSize: '1rem', margin: 0 }}>
              How was your overall stress today?
            </p>
          </div>

          {/* Overall Stress Level */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#1E40AF', marginBottom: '1rem' }}>Overall Stress Today</h3>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              color: getStressLevelColor(formData.stressLevel)
            }}>
              {formData.stressLevel}/10
            </div>
            <div style={{
              fontSize: '1.2rem',
              marginBottom: '1.5rem',
              color: getStressLevelColor(formData.stressLevel),
              fontWeight: '600'
            }}>
              {getStressLevelText(formData.stressLevel)}
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.stressLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, stressLevel: e.target.value }))}
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

          {/* Quick mood check */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ color: '#4682B4', marginBottom: '1rem', textAlign: 'center' }}>
              What was your predominant mood?
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem'
            }}>
              {moodTypes.slice(0, 8).map(mood => (
                <button
                  key={mood.id}
                  onClick={() => setFormData(prev => ({ ...prev, mood: mood.name }))}
                  style={{
                    padding: '1rem 0.5rem',
                    background: formData.mood === mood.name 
                      ? `rgba(${mood.color === '#28a745' ? '40, 167, 69' : 
                                   mood.color === '#dc3545' ? '220, 53, 69' :
                                   mood.color === '#ffc107' ? '255, 193, 7' : '70, 130, 180'}, 0.1)`
                      : '#FFFFFF',
                    border: formData.mood === mood.name 
                      ? `2px solid ${mood.color}`
                      : '1px solid #E5E7EB',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {mood.emoji}
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: '500',
                    color: formData.mood === mood.name ? mood.color : '#000000'
                  }}>
                    {mood.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Premium Features for Evening Summary */}
          {isPremiumMode && (
            <>
              {/* What helped today */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
                  <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
                  What helped you cope today?
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {copingStrategies.map(strategy => (
                    <label key={strategy} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      background: formData.copingStrategies.includes(strategy) ? 'rgba(40, 167, 69, 0.1)' : '#F9FAFB',
                      border: formData.copingStrategies.includes(strategy) ? '1px solid #28a745' : '1px solid #E5E7EB',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.copingStrategies.includes(strategy)}
                        onChange={() => handleCheckboxChange(strategy, 'copingStrategies')}
                        style={{ transform: 'scale(0.8)' }}
                      />
                      {strategy}
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
                  <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
                  Any additional notes about today?
                </h4>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Reflect on your day - what went well, what was challenging..."
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
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Premium: Daily Reflection</h4>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
                Track coping strategies and daily stress patterns
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
              onClick={submitEveningSummary}
              disabled={loading}
              style={{
                background: loading ? '#E5E7EB' : '#6366F1',
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
                <><i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>Save Daily Summary</>
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
              Manual Stress Entry
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '1rem', margin: 0 }}>
              Log past stress levels
            </p>
          </div>

          {/* Stress Level */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#4682B4', marginBottom: '1rem' }}>Stress Level</h3>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              color: getStressLevelColor(formData.stressLevel)
            }}>
              {formData.stressLevel}/10
            </div>
            <div style={{
              fontSize: '1.2rem',
              marginBottom: '1.5rem',
              color: getStressLevelColor(formData.stressLevel),
              fontWeight: '600'
            }}>
              {getStressLevelText(formData.stressLevel)}
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.stressLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, stressLevel: e.target.value }))}
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

          {/* Mood Selector - Same as quick-stress */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#4682B4', marginBottom: '1rem', textAlign: 'center' }}>How did you feel?</h3>
            
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
                  fontSize: '4rem',
                  marginBottom: '1rem',
                  transition: 'all 0.3s ease',
                  transform: formData.mood === moodTypes[currentSlide].name ? 'scale(1.1)' : 'scale(1)'
                }}>
                  {moodTypes[currentSlide].emoji}
                </div>
                
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: formData.mood === moodTypes[currentSlide].name ? moodTypes[currentSlide].color : '#374151',
                  fontSize: '1.3rem',
                  fontWeight: '600'
                }}>
                  {moodTypes[currentSlide].name}
                </h4>
                
                <p style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#9CA3AF',
                  fontSize: '0.9rem'
                }}>
                  {moodTypes[currentSlide].description}
                </p>

                <button
                  onClick={() => setFormData(prev => ({ ...prev, mood: moodTypes[currentSlide].name }))}
                  style={{
                    background: formData.mood === moodTypes[currentSlide].name 
                      ? `linear-gradient(135deg, ${moodTypes[currentSlide].color}, ${moodTypes[currentSlide].color}dd)` 
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
                  {formData.mood === moodTypes[currentSlide].name ? (
                    <>
                      <i className="fas fa-check" style={{ marginRight: '0.5rem' }}></i>
                      Selected
                    </>
                  ) : (
                    'Select This Mood'
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
              {moodTypes.map((_, index) => (
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

          {/* Context */}
          <div style={{ marginBottom: '2rem' }}>
            <input
              type="text"
              value={formData.context}
              onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
              placeholder="What was the context? (optional)"
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

          {/* Premium Features for Manual Entry */}
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
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Premium: Detailed Stress Analysis</h4>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
                Track triggers, symptoms, and coping strategies
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
              disabled={loading || !formData.mood}
              style={{
                background: (loading || !formData.mood) ? '#E5E7EB' : '#ffc107',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '12px 24px',
                cursor: (loading || !formData.mood) ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Saving...</>
              ) : (
                <><i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>Save Stress Entry</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
