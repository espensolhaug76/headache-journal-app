import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordNutrition() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Dev toggle for testing freemium vs premium
  const [isPremiumMode, setIsPremiumMode] = useState(false);
  
  // App state management
  const [mode, setMode] = useState('selection'); // 'selection', 'headache-nutrition', 'prevention-check', 'manual-entry'
  
  // Form data - simplified for headache focus
  const [formData, setFormData] = useState({
    hydrationLevel: 7, // 1-10 scale
    skippedMeals: false,
    highSugar: false,
    ultraProcessed: false,
    caffeineChange: 'same', // 'more', 'less', 'same'
    // Premium fields
    specificTriggers: [],
    inflammationScore: 0,
    detailedNotes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Specific trigger foods for premium (inflammation-focused)
  const inflammatoryTriggers = [
    'Added sugar drinks', 'Artificial sweeteners', 'Processed meats', 
    'Fried foods', 'White bread/pasta', 'Packaged snacks'
  ];

  const getHydrationColor = (level) => {
    if (level <= 3) return '#dc3545'; // Red - dehydrated
    if (level <= 6) return '#ffc107'; // Yellow - moderate
    return '#17a2b8'; // Blue - well hydrated
  };

  const getHydrationText = (level) => {
    if (level <= 3) return 'Dehydrated';
    if (level <= 6) return 'Moderate';
    return 'Well Hydrated';
  };

  const getHydrationEmoji = (level) => {
    if (level <= 3) return '🏜️';
    if (level <= 6) return '💧';
    return '🌊';
  };

  const calculateInflammationRisk = () => {
    let risk = 0;
    if (formData.hydrationLevel <= 4) risk += 2;
    if (formData.skippedMeals) risk += 2;
    if (formData.highSugar) risk += 3;
    if (formData.ultraProcessed) risk += 2;
    if (formData.caffeineChange !== 'same') risk += 1;
    return risk;
  };

  const getInflammationRiskText = (score) => {
    if (score <= 2) return 'Low Risk';
    if (score <= 5) return 'Moderate Risk';
    return 'High Risk';
  };

  const getInflammationRiskColor = (score) => {
    if (score <= 2) return '#28a745';
    if (score <= 5) return '#ffc107';
    return '#dc3545';
  };

  const getCurrentTimeContext = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning nutrition check';
    if (hour < 17) return 'Afternoon nutrition check';
    if (hour < 21) return 'Evening nutrition check';
    return 'Late night nutrition check';
  };

  const submitHeadacheNutrition = async () => {
    if (!currentUser) {
      setError('You must be logged in to record nutrition data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const now = new Date();
      const inflammationScore = calculateInflammationRisk();
      
      const nutritionData = {
        userId: currentUser.uid,
        // Core simplified data
        hydrationLevel: parseInt(formData.hydrationLevel),
        skippedMeals: formData.skippedMeals,
        highSugar: formData.highSugar,
        ultraProcessed: formData.ultraProcessed,
        caffeineChange: formData.caffeineChange,
        inflammationScore: inflammationScore,
        context: getCurrentTimeContext(),
        timestamp: Timestamp.now(),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        type: 'headache-nutrition', // vs 'prevention-check' or 'manual'
        createdAt: Timestamp.now(),
        // Premium fields
        ...(isPremiumMode && {
          specificTriggers: formData.specificTriggers,
          detailedNotes: formData.detailedNotes
        })
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'nutrition'), nutritionData);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording nutrition:', error);
      setError('Failed to record nutrition data. Please try again.');
    }

    setLoading(false);
  };

  const submitPreventionCheck = async () => {
    if (!currentUser) {
      setError('You must be logged in to record nutrition data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const now = new Date();
      const inflammationScore = calculateInflammationRisk();
      
      const nutritionData = {
        userId: currentUser.uid,
        hydrationLevel: parseInt(formData.hydrationLevel),
        skippedMeals: formData.skippedMeals,
        highSugar: formData.highSugar,
        ultraProcessed: formData.ultraProcessed,
        caffeineChange: formData.caffeineChange,
        inflammationScore: inflammationScore,
        context: 'Daily prevention summary',
        timestamp: Timestamp.now(),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        type: 'prevention-check',
        createdAt: Timestamp.now(),
        // Premium fields
        ...(isPremiumMode && {
          specificTriggers: formData.specificTriggers,
          detailedNotes: formData.detailedNotes
        })
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'nutrition'), nutritionData);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording nutrition:', error);
      setError('Failed to record nutrition data. Please try again.');
    }

    setLoading(false);
  };

  const submitManualEntry = async () => {
    if (!currentUser) {
      setError('You must be logged in to record nutrition data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const now = new Date();
      const inflammationScore = calculateInflammationRisk();
      
      const nutritionData = {
        userId: currentUser.uid,
        hydrationLevel: parseInt(formData.hydrationLevel),
        skippedMeals: formData.skippedMeals,
        highSugar: formData.highSugar,
        ultraProcessed: formData.ultraProcessed,
        caffeineChange: formData.caffeineChange,
        inflammationScore: inflammationScore,
        context: 'Manual entry',
        timestamp: Timestamp.now(),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        type: 'manual',
        createdAt: Timestamp.now(),
        // Premium fields
        ...(isPremiumMode && {
          specificTriggers: formData.specificTriggers,
          detailedNotes: formData.detailedNotes
        })
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'nutrition'), nutritionData);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording nutrition:', error);
      setError('Failed to record nutrition data. Please try again.');
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
              <i className="fas fa-apple-alt" style={{ marginRight: '0.5rem' }}></i>
              Headache Nutrition
            </h1>
            <p style={{ color: '#6B7280', fontSize: '1.1rem', margin: 0 }}>
              Track inflammation triggers in seconds
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
            {/* Headache Nutrition Check */}
            <button
              onClick={() => setMode('headache-nutrition')}
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
                <i className="fas fa-fire"></i>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                Headache Nutrition
              </h3>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Check inflammation triggers
              </div>
            </button>

            {/* Prevention Check */}
            <button
              onClick={() => setMode('prevention-check')}
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
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                Prevention Check
              </h3>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Daily nutrition habits
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
                Log past nutrition
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
                Detailed trigger analysis, inflammation tracking & food-headache correlation
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

  // SHARED NUTRITION QUESTIONS COMPONENT
  const NutritionQuestions = ({ title, subtitle, submitAction, submitLabel, buttonColor }) => (
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
            <i className="fas fa-apple-alt" style={{ marginRight: '0.5rem' }}></i>
            {title}
          </h2>
          <p style={{ color: '#6B7280', fontSize: '1rem', margin: 0 }}>
            {subtitle}
          </p>
        </div>

        {/* 1. Hydration Level */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h3 style={{ color: '#1E40AF', marginBottom: '1rem' }}>
            💧 Hydration Level
          </h3>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>
            {getHydrationEmoji(formData.hydrationLevel)}
          </div>
          <div style={{
            fontSize: '1.5rem',
            marginBottom: '1rem',
            color: getHydrationColor(formData.hydrationLevel),
            fontWeight: '600'
          }}>
            {getHydrationText(formData.hydrationLevel)}
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.hydrationLevel}
            onChange={(e) => setFormData(prev => ({ ...prev, hydrationLevel: e.target.value }))}
            style={{
              width: '100%',
              height: '12px',
              borderRadius: '6px',
              background: 'linear-gradient(to right, #dc3545 0%, #ffc107 50%, #17a2b8 100%)',
              outline: 'none',
              cursor: 'pointer',
              marginBottom: '0.5rem'
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#9CA3AF'
          }}>
            <span>Dehydrated</span>
            <span>Well Hydrated</span>
          </div>
        </div>

        {/* 2. Skipped Meals */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#1E40AF', marginBottom: '1rem', textAlign: 'center' }}>
            ⏰ Did you skip any meals today?
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button
              onClick={() => setFormData(prev => ({ ...prev, skippedMeals: true }))}
              style={{
                padding: '2rem 1rem',
                background: formData.skippedMeals 
                  ? 'rgba(220, 53, 69, 0.1)'
                  : '#FFFFFF',
                border: formData.skippedMeals 
                  ? '2px solid #dc3545'
                  : '1px solid #E5E7EB',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#dc3545' }}>
                ❌
              </div>
              <h4 style={{ margin: 0, color: formData.skippedMeals ? '#dc3545' : '#000000' }}>
                Yes, Skipped Meals
              </h4>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6B7280' }}>
                Blood sugar crashes
              </p>
            </button>

            <button
              onClick={() => setFormData(prev => ({ ...prev, skippedMeals: false }))}
              style={{
                padding: '2rem 1rem',
                background: !formData.skippedMeals 
                  ? 'rgba(40, 167, 69, 0.1)'
                  : '#FFFFFF',
                border: !formData.skippedMeals 
                  ? '2px solid #28a745'
                  : '1px solid #E5E7EB',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#28a745' }}>
                ✅
              </div>
              <h4 style={{ margin: 0, color: !formData.skippedMeals ? '#28a745' : '#000000' }}>
                No, Ate Regularly
              </h4>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6B7280' }}>
                Stable blood sugar
              </p>
            </button>
          </div>
        </div>

        {/* 3. High Sugar */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#1E40AF', marginBottom: '1rem', textAlign: 'center' }}>
            🍭 High sugar foods today?
          </h3>
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#6B7280', marginBottom: '1rem' }}>
            Soda, candy, pastries, sweet drinks
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button
              onClick={() => setFormData(prev => ({ ...prev, highSugar: true }))}
              style={{
                padding: '1.5rem 1rem',
                background: formData.highSugar 
                  ? 'rgba(255, 193, 7, 0.1)'
                  : '#FFFFFF',
                border: formData.highSugar 
                  ? '2px solid #ffc107'
                  : '1px solid #E5E7EB',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                🍭
              </div>
              <h4 style={{ margin: 0, color: formData.highSugar ? '#ffc107' : '#000000', fontSize: '1rem' }}>
                Yes
              </h4>
            </button>

            <button
              onClick={() => setFormData(prev => ({ ...prev, highSugar: false }))}
              style={{
                padding: '1.5rem 1rem',
                background: !formData.highSugar 
                  ? 'rgba(40, 167, 69, 0.1)'
                  : '#FFFFFF',
                border: !formData.highSugar 
                  ? '2px solid #28a745'
                  : '1px solid #E5E7EB',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                🥗
              </div>
              <h4 style={{ margin: 0, color: !formData.highSugar ? '#28a745' : '#000000', fontSize: '1rem' }}>
                No
              </h4>
            </button>
          </div>
        </div>

        {/* 4. Ultra-Processed Foods */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#1E40AF', marginBottom: '1rem', textAlign: 'center' }}>
            📦 Ultra-processed foods today?
          </h3>
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#6B7280', marginBottom: '1rem' }}>
            Chips, frozen meals, fast food, packaged snacks
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button
              onClick={() => setFormData(prev => ({ ...prev, ultraProcessed: true }))}
              style={{
                padding: '1.5rem 1rem',
                background: formData.ultraProcessed 
                  ? 'rgba(253, 126, 20, 0.1)'
                  : '#FFFFFF',
                border: formData.ultraProcessed 
                  ? '2px solid #fd7e14'
                  : '1px solid #E5E7EB',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                📦
              </div>
              <h4 style={{ margin: 0, color: formData.ultraProcessed ? '#fd7e14' : '#000000', fontSize: '1rem' }}>
                Yes
              </h4>
            </button>

            <button
              onClick={() => setFormData(prev => ({ ...prev, ultraProcessed: false }))}
              style={{
                padding: '1.5rem 1rem',
                background: !formData.ultraProcessed 
                  ? 'rgba(40, 167, 69, 0.1)'
                  : '#FFFFFF',
                border: !formData.ultraProcessed 
                  ? '2px solid #28a745'
                  : '1px solid #E5E7EB',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                🥙
              </div>
              <h4 style={{ margin: 0, color: !formData.ultraProcessed ? '#28a745' : '#000000', fontSize: '1rem' }}>
                No
              </h4>
            </button>
          </div>
        </div>

        {/* 5. Caffeine Changes */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#1E40AF', marginBottom: '1rem', textAlign: 'center' }}>
            ☕ Caffeine different than usual?
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              { value: 'more', label: 'More', emoji: '☕☕', color: '#ffc107' },
              { value: 'same', label: 'Same', emoji: '☕', color: '#28a745' },
              { value: 'less', label: 'Less', emoji: '🚫', color: '#dc3545' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setFormData(prev => ({ ...prev, caffeineChange: option.value }))}
                style={{
                  padding: '1.5rem 1rem',
                  background: formData.caffeineChange === option.value 
                    ? `rgba(${option.color === '#28a745' ? '40, 167, 69' : 
                                 option.color === '#dc3545' ? '220, 53, 69' : '255, 193, 7'}, 0.1)`
                    : '#FFFFFF',
                  border: formData.caffeineChange === option.value 
                    ? `2px solid ${option.color}`
                    : '1px solid #E5E7EB',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  {option.emoji}
                </div>
                <h4 style={{ margin: 0, color: formData.caffeineChange === option.value ? option.color : '#000000', fontSize: '1rem' }}>
                  {option.label}
                </h4>
              </button>
            ))}
          </div>
        </div>

        {/* Inflammation Risk Summary */}
        <div style={{
          background: 'rgba(70, 130, 180, 0.1)',
          border: '1px solid rgba(70, 130, 180, 0.3)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h3 style={{ color: '#4682B4', margin: '0 0 1rem 0' }}>
            🔥 Inflammation Risk
          </h3>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: getInflammationRiskColor(calculateInflammationRisk()),
            marginBottom: '0.5rem'
          }}>
            {getInflammationRiskText(calculateInflammationRisk())}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#4B5563' }}>
            Based on headache trigger factors
          </div>
        </div>

        {/* Premium Features Preview */}
        {isPremiumMode && (
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ color: '#4682B4', marginBottom: '1rem' }}>
              <i className="fas fa-star" style={{ color: '#ffd700', marginRight: '0.5rem' }}></i>
              Specific inflammatory triggers?
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.5rem'
            }}>
              {inflammatoryTriggers.map(trigger => (
                <label key={trigger} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  background: formData.specificTriggers.includes(trigger) ? 'rgba(220, 53, 69, 0.1)' : '#F9FAFB',
                  border: formData.specificTriggers.includes(trigger) ? '1px solid #dc3545' : '1px solid #E5E7EB',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.specificTriggers.includes(trigger)}
                    onChange={() => handleCheckboxChange(trigger, 'specificTriggers')}
                    style={{ transform: 'scale(0.8)' }}
                  />
                  {trigger}
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
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Premium: Detailed Inflammation Analysis</h4>
            <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
              Track specific triggers, inflammation scores & food-headache patterns
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
            onClick={submitAction}
            disabled={loading}
            style={{
              background: loading ? '#E5E7EB' : buttonColor,
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
              <><i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>{submitLabel}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // HEADACHE NUTRITION CHECK
  if (mode === 'headache-nutrition') {
    return (
      <NutritionQuestions
        title="Headache Nutrition Check"
        subtitle={`${getCurrentTimeContext()} • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        submitAction={submitHeadacheNutrition}
        submitLabel="Save Nutrition Check"
        buttonColor="#dc3545"
      />
    );
  }

  // PREVENTION CHECK
  if (mode === 'prevention-check') {
    return (
      <NutritionQuestions
        title="Daily Prevention Check"
        subtitle="How was your nutrition for headache prevention today?"
        submitAction={submitPreventionCheck}
        submitLabel="Save Prevention Check"
        buttonColor="#28a745"
      />
    );
  }

  // MANUAL ENTRY
  if (mode === 'manual-entry') {
    return (
      <NutritionQuestions
        title="Manual Nutrition Entry"
        subtitle="Log past nutrition data"
        submitAction={submitManualEntry}
        submitLabel="Save Nutrition Entry"
        buttonColor="#ffc107"
      />
    );
  }

  return null;
}
