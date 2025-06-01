/* eslint-disable no-unused-vars */
// src/pages/RecordStress.js - Complete Modularized Version with Premium Features
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Import modular components
import PremiumStressTriggerTracker from '../components/stress/PremiumStressTriggerTracker';

export default function RecordStress() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Dev toggle for testing freemium vs premium
  const [isPremiumMode, setIsPremiumMode] = useState(false);
  
  // App state management
  const [mode, setMode] = useState('selection'); // 'selection', 'quick-stress', 'evening-summary', 'manual-entry'
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Form data - updated with premium fields
  const [formData, setFormData] = useState({
    stressLevel: 5,
    mood: '',
    context: '', // where/when stress occurred
    // Premium fields
    triggers: [], // Updated - now uses the detailed trigger system
    physicalSymptoms: [],
    copingStrategies: [],
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mood options with emojis and descriptions
  const moodOptions = [
    {
      id: 'overwhelmed',
      name: 'Overwhelmed',
      emoji: '😵‍💫',
      description: 'Too much to handle',
      color: '#dc3545'
    },
    {
      id: 'anxious',
      name: 'Anxious',
      emoji: '😰',
      description: 'Worried and nervous',
      color: '#fd7e14'
    },
    {
      id: 'frustrated',
      name: 'Frustrated',
      emoji: '😤',
      description: 'Annoyed and irritated',
      color: '#ffc107'
    },
    {
      id: 'pressured',
      name: 'Pressured',
      emoji: '😬',
      description: 'Under time pressure',
      color: '#6f42c1'
    },
    {
      id: 'tired',
      name: 'Tired',
      emoji: '😴',
      description: 'Exhausted and drained',
      color: '#6c757d'
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
      description: 'Neither stressed nor relaxed',
      color: '#17a2b8'
    },
    {
      id: 'energized',
      name: 'Energized',
      emoji: '😎',
      description: 'Focused and motivated',
      color: '#20c997'
    }
  ];

  // Basic physical symptoms for non-premium
  const basicPhysicalSymptoms = [
    'Headache', 'Muscle tension', 'Fatigue', 'Sleep issues', 'Stomach upset', 'Other'
  ];

  const basicCopingStrategies = [
    'Deep breathing', 'Exercise', 'Meditation', 'Music', 'Talk to someone', 'Take a break'
  ];

  // Helper functions
  const getStressLevelColor = (level) => {
    if (level <= 3) return '#28a745';
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
    if (hour < 12) return 'Morning stress check';
    if (hour < 17) return 'Afternoon stress check';
    if (hour < 21) return 'Evening stress check';
    return 'Late night stress check';
  };

  // Event handlers
  const handleMoodSelect = (moodId) => {
    setFormData(prev => ({ ...prev, mood: moodId }));
  };

  const handleTriggersChange = (triggers) => {
    setFormData(prev => ({ ...prev, triggers: triggers }));
  };

  const handleCheckboxChange = (value, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % moodOptions.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + moodOptions.length) % moodOptions.length);
  };

  // Database operations
  const submitQuickStress = async () => {
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
        mood: formData.mood,
        context: getCurrentTimeContext(),
        timestamp: Timestamp.now(),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        type: 'quick-stress',
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
        mood: formData.mood,
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
        mood: formData.mood,
        context: formData.context || 'Manual entry',
        timestamp: Timestamp.now(),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        type: 'manual-entry',
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
              <i className="fas fa-brain" style={{ marginRight: '0.5rem' }}></i>
              Stress Tracker
            </h1>
            <p style={{ color: '#6B7280', fontSize: '1.1rem', margin: 0 }}>
              Quick emotional and stress check-in
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
            {/* I'm Stressed Now */}
            <button
              onClick={() => setMode('quick-stress')}
              disabled={loading}
              style={{
                padding: '2rem 1rem',
                background: 'linear-gradient(135deg, #dc3545, #c82333)',
                border: 'none',
                borderRadius: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                I'm Stressed Now
              </h3>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Quick stress check-in
              </div>
            </button>

            {/* Daily Summary */}
            <button
              onClick={() => setMode('evening-summary')}
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
                <i className="fas fa-calendar-check"></i>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                Daily Summary
              </h3>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                End-of-day stress review
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
                Advanced stress analysis, detailed triggers & stress-headache correlation
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

  // SHARED STRESS FORM COMPONENT
  const StressForm = ({ title, subtitle, submitAction, submitLabel, buttonColor, timeContext }) => (
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
          <h2 style={{ color: buttonColor, marginBottom: '1rem' }}>
            <i className="fas fa-brain" style={{ marginRight: '0.5rem' }}></i>
            {title}
          </h2>
          <p style={{ color: '#6B7280', fontSize: '1rem', margin: 0 }}>
            {subtitle}
          </p>
          {timeContext && (
            <p style={{ color: '#9CA3AF', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
              {timeContext} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        {/* Stress Level Slider */}
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
            onChange={(e) => setFormData(prev => ({ ...prev, stressLevel: parseInt(e.target.value) }))}
            style={{
              width: '100%',
              height: '12px',
              borderRadius: '6px',
              background: 'linear-gradient(to right, #28a745 0%, #ffc107 30%, #fd7e14 60%, #dc3545 100%)',
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
            <span>Very Low</span>
            <span>Very High</span>
          </div>
        </div>

        {/* Mood Selector */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#1E40AF', marginBottom: '1rem', textAlign: 'center' }}>How are you feeling?</h3>
          
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
                transform: formData.mood === moodOptions[currentSlide].id ? 'scale(1.1)' : 'scale(1)'
              }}>
                {moodOptions[currentSlide].emoji}
              </div>
              
              <h4 style={{ 
                margin: '0 0 0.5rem 0', 
                color: formData.mood === moodOptions[currentSlide].id ? moodOptions[currentSlide].color : '#374151',
                fontSize: '1.3rem',
                fontWeight: '600'
              }}>
                {moodOptions[currentSlide].name}
              </h4>
              
              <p style={{ 
                margin: '0 0 1.5rem 0', 
                color: '#9CA3AF',
                fontSize: '0.9rem'
              }}>
                {moodOptions[currentSlide].description}
              </p>

              <button
                onClick={() => handleMoodSelect(moodOptions[currentSlide].id)}
                style={{
                  background: formData.mood === moodOptions[currentSlide].id 
                    ? `linear-gradient(135deg, ${moodOptions[currentSlide].color}, ${moodOptions[currentSlide].color}dd)` 
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
                {formData.mood === moodOptions[currentSlide].id ? (
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
            {moodOptions.map((_, index) => (
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

        {/* Premium Stress Trigger Analysis */}
        {isPremiumMode && (
          <PremiumStressTriggerTracker
            selectedTriggers={formData.triggers}
            onTriggersChange={handleTriggersChange}
            stressLevel={formData.stressLevel}
            currentContext={timeContext || 'general'}
          />
        )}

        {/* Premium Trigger Summary */}
        {isPremiumMode && formData.triggers.length > 0 && mode === 'evening-summary' && (
          <div style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h4 style={{ color: '#B8860B', margin: '0 0 0.5rem 0' }}>
              <i className="fas fa-crown" style={{ marginRight: '0.5rem' }}></i>
              Stress Triggers Identified Today
            </h4>
            <p style={{ margin: '0', color: '#4B5563', fontSize: '0.9rem' }}>
              You identified {formData.triggers.length} specific stress trigger{formData.triggers.length > 1 ? 's' : ''} today. 
              This detailed tracking helps identify patterns that may contribute to headaches.
            </p>
          </div>
        )}

        {/* Premium Physical Symptoms */}
        {isPremiumMode && (
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
              <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
              Physical symptoms? (optional)
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '0.5rem'
            }}>
              {basicPhysicalSymptoms.map(symptom => (
                <label key={symptom} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  background: formData.physicalSymptoms.includes(symptom) ? 'rgba(220, 53, 69, 0.1)' : '#F9FAFB',
                  border: formData.physicalSymptoms.includes(symptom) ? '1px solid #dc3545' : '1px solid #E5E7EB',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.physicalSymptoms.includes(symptom)}
                    onChange={() => handleCheckboxChange(symptom, 'physicalSymptoms')}
                    style={{ transform: 'scale(0.8)' }}
                  />
                  {symptom}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Premium Coping Strategies */}
        {isPremiumMode && (
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
              <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
              What helped with stress? (optional)
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '0.5rem'
            }}>
              {basicCopingStrategies.map(strategy => (
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
        )}

        {/* Premium Notes */}
        {isPremiumMode && (
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
              <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
              Additional notes (optional)
            </h4>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="What triggered the stress? What helped? Any other observations..."
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
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Premium: Advanced Stress Analysis</h4>
            <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
              Detailed trigger tracking, coping strategies & stress-headache correlation
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
            onClick={submitAction}
            disabled={loading || !formData.mood}
            style={{
              background: (loading || !formData.mood) ? '#E5E7EB' : buttonColor,
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
              <><i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>{submitLabel}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // QUICK STRESS MODE
  if (mode === 'quick-stress') {
    return (
      <StressForm
        title="I'm Stressed Now"
        subtitle="Quick stress check-in"
        timeContext={getCurrentTimeContext()}
        submitAction={submitQuickStress}
        submitLabel="Record Stress"
        buttonColor="#dc3545"
      />
    );
  }

  // EVENING SUMMARY MODE
  if (mode === 'evening-summary') {
    return (
      <StressForm
        title="Daily Stress Summary"
        subtitle="How was your stress level today overall?"
        timeContext="Daily summary"
        submitAction={submitEveningSummary}
        submitLabel="Save Daily Summary"
        buttonColor="#28a745"
      />
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
            <p style={{ color: '#6B7280', fontSize: '1rem', margin: 0 }}>
              Log past stress data
            </p>
          </div>

          {/* Context Input for Manual Entry */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
              When/where did this stress occur?
            </h4>
            <input
              type="text"
              value={formData.context}
              onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
              placeholder="e.g., Morning meeting, Traffic jam, Work presentation..."
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

          {/* Stress Level Slider */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#1E40AF', marginBottom: '1rem' }}>Stress Level</h3>
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
              onChange={(e) => setFormData(prev => ({ ...prev, stressLevel: parseInt(e.target.value) }))}
              style={{
                width: '100%',
                height: '12px',
                borderRadius: '6px',
                background: 'linear-gradient(to right, #28a745 0%, #ffc107 30%, #fd7e14 60%, #dc3545 100%)',
                outline: 'none',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            />
          </div>

          {/* Mood Selector */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#1E40AF', marginBottom: '1rem', textAlign: 'center' }}>How were you feeling?</h3>
            
            <div style={{
              position: 'relative',
              minHeight: '180px',
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
                  transition: 'all 0.3s ease'
                }}>
                  {moodOptions[currentSlide].emoji}
                </div>
                
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: formData.mood === moodOptions[currentSlide].id ? moodOptions[currentSlide].color : '#374151',
                  fontSize: '1.2rem',
                  fontWeight: '600'
                }}>
                  {moodOptions[currentSlide].name}
                </h4>
                
                <p style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#9CA3AF',
                  fontSize: '0.9rem'
                }}>
                  {moodOptions[currentSlide].description}
                </p>

                <button
                  onClick={() => handleMoodSelect(moodOptions[currentSlide].id)}
                  style={{
                    background: formData.mood === moodOptions[currentSlide].id 
                      ? `linear-gradient(135deg, ${moodOptions[currentSlide].color}, ${moodOptions[currentSlide].color}dd)` 
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
                  {formData.mood === moodOptions[currentSlide].id ? (
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
              {moodOptions.map((_, index) => (
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

          {/* Premium Stress Trigger Analysis for Manual Entry */}
          {isPremiumMode && (
            <PremiumStressTriggerTracker
              selectedTriggers={formData.triggers}
              onTriggersChange={handleTriggersChange}
              stressLevel={formData.stressLevel}
              currentContext="Manual entry"
            />
          )}

          {/* Notes */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
              Notes about this stress (optional)
            </h4>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="What triggered the stress? How did you handle it? Duration, intensity, etc..."
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
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Premium: Detailed Stress Analysis</h4>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
                Advanced trigger tracking, pattern analysis & stress-headache correlation
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
