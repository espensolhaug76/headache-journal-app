import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp, doc, updateDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Import headache images (keeping the same imports as before)
import migrainerHeadacheImg from '../assets/headache-types/migraine-headache.png';
import tensionHeadacheImg from '../assets/headache-types/tension-headache.png';
import reboundHeadacheImg from '../assets/headache-types/rebound-headache.png';
import exertionHeadacheImg from '../assets/headache-types/exertion-headache.png';
import caffeineHeadacheImg from '../assets/headache-types/caffeine-headache.png';
import hormoneHeadacheImg from '../assets/headache-types/hormone-headache.png';
import clusterHeadacheImg from '../assets/headache-types/cluster-headache.png';
import sinusHeadacheImg from '../assets/headache-types/sinus-headache.png';
import hemicraniaHeadacheImg from '../assets/headache-types/hemicrania-continua.png';
import hypertensionHeadacheImg from '../assets/headache-types/hypertension-headache.png';
import postTraumaticHeadacheImg from '../assets/headache-types/post-traumatic-headache.png';
import spinalHeadacheImg from '../assets/headache-types/spinal-headache.png';
import thunderclapHeadacheImg from '../assets/headache-types/thunderclap-headache.png';
import icePickHeadacheImg from '../assets/headache-types/ice-pick-headache.png';

export default function RecordHeadache() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Check if there's an ongoing headache session
  const [ongoingHeadache, setOngoingHeadache] = useState(null);
  const [headacheMode, setHeadacheMode] = useState(''); // 'start-headache', 'end-headache', 'manual-entry'
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [showPremiumFeatures, setShowPremiumFeatures] = useState(false);
  const [isPremium] = useState(false); // TODO: Connect to actual premium status
  
  const [formData, setFormData] = useState({
    painLevel: 5,
    location: '',
    // Premium features
    prodromeSymptoms: [],
    symptoms: [],
    triggers: [],
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Complete list of 14 headache types
  const headacheTypes = [
    {
      id: 'tension',
      name: 'Tension Headache',
      description: 'Band around head/forehead',
      icon: 'fas fa-head-side-virus',
      image: tensionHeadacheImg,
      pattern: 'Band-like pressure around the entire head'
    },
    {
      id: 'migraine',
      name: 'Migraine Headache',
      description: 'One side of head',
      icon: 'fas fa-head-side-cough',
      image: migrainerHeadacheImg,
      pattern: 'Throbbing pain, usually on one side'
    },
    {
      id: 'rebound',
      name: 'Medication Overuse Headache',
      description: 'All over/top (rebound)',
      icon: 'fas fa-pills',
      image: reboundHeadacheImg,
      pattern: 'Medication overuse headache'
    },
    {
      id: 'exertion',
      name: 'Exertion Headache',
      description: 'Back/all over',
      icon: 'fas fa-running',
      image: exertionHeadacheImg,
      pattern: 'Exercise-induced headache'
    },
    {
      id: 'caffeine',
      name: 'Caffeine Headache',
      description: 'Front/temples',
      icon: 'fas fa-coffee',
      image: caffeineHeadacheImg,
      pattern: 'Dull ache at temples and front of head'
    },
    {
      id: 'hormone',
      name: 'Hormone Headache',
      description: 'One side (menstrual migraine)',
      icon: 'fas fa-moon',
      image: hormoneHeadacheImg,
      pattern: 'Related to hormonal changes'
    },
    {
      id: 'cluster',
      name: 'Cluster Headache',
      description: 'Around one eye',
      icon: 'fas fa-eye',
      image: clusterHeadacheImg,
      pattern: 'Severe pain around or behind one eye'
    },
    {
      id: 'sinus',
      name: 'Allergy or Sinus',
      description: 'Forehead/cheek area',
      icon: 'fas fa-head-side-mask',
      image: sinusHeadacheImg,
      pattern: 'Not a headache disorder but symptom description'
    },
    {
      id: 'hemicrania',
      name: 'Hemicrania Continua',
      description: 'One side continuous',
      icon: 'fas fa-clock',
      image: hemicraniaHeadacheImg,
      pattern: 'Continuous one-sided headache'
    },
    {
      id: 'hypertension',
      name: 'Hypertension Headache',
      description: 'Back of head/neck',
      icon: 'fas fa-heartbeat',
      image: hypertensionHeadacheImg,
      pattern: 'Back of head related to high blood pressure'
    },
    {
      id: 'post-traumatic',
      name: 'Post-Traumatic Headache',
      description: 'Multiple scattered areas',
      icon: 'fas fa-brain',
      image: postTraumaticHeadacheImg,
      pattern: 'Following head injury or trauma'
    },
    {
      id: 'spinal',
      name: 'Spinal Headache',
      description: 'Back of head/neck',
      icon: 'fas fa-spine',
      image: spinalHeadacheImg,
      pattern: 'Related to spinal fluid pressure'
    },
    {
      id: 'thunderclap',
      name: 'Thunderclap Headache',
      description: 'Sudden severe (multiple spots)',
      icon: 'fas fa-bolt',
      image: thunderclapHeadacheImg,
      pattern: 'Sudden, severe headache (seek immediate medical attention)'
    },
    {
      id: 'ice-pick',
      name: 'Ice Pick Headache',
      description: 'Sharp isolated spots',
      icon: 'fas fa-map-pin',
      image: icePickHeadacheImg,
      pattern: 'Brief, sharp, stabbing pains'
    }
  ];

  // Premium features data
  const prodromeSymptoms = [
    'Irritability', 'Depressed mood', 'Yawning', 'Fatigue',
    'Difficulty sleeping', 'Frequent urination', 'Food cravings',
    'Nausea', 'Light sensitivity', 'Sound sensitivity',
    'Trouble concentrating', 'Difficulty speaking',
    'Neck pain or stiffness', 'Hyperactivity'
  ];

  const currentSymptoms = [
    'Nausea', 'Vomiting', 'Light sensitivity', 'Sound sensitivity',
    'Visual aura', 'Dizziness', 'Fatigue', 'Irritability',
    'Difficulty concentrating', 'Neck stiffness', 'Runny nose', 'Tearing'
  ];

  const commonTriggers = [
    'Stress', 'Poor sleep', 'Skipped meal', 'Caffeine', 'Alcohol',
    'Weather change', 'Bright lights', 'Loud noise', 'Strong smell',
    'Exercise', 'Hormonal changes', 'Certain foods'
  ];

  // Check for ongoing headache session on component mount
  const checkForOngoingHeadache = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const ongoingQuery = query(
        collection(db, 'users', currentUser.uid, 'ongoingHeadaches'),
        orderBy('startTime', 'desc'),
        limit(1)
      );
      const ongoingSnapshot = await getDocs(ongoingQuery);
      
      if (!ongoingSnapshot.empty) {
        const ongoingDoc = ongoingSnapshot.docs[0];
        const ongoingData = { id: ongoingDoc.id, ...ongoingDoc.data() };
        
        // Check if this headache is still ongoing (within last 24 hours and not ended)
        const startTime = ongoingData.startTime.toDate();
        const now = new Date();
        const hoursSince = (now - startTime) / (1000 * 60 * 60);
        
        if (!ongoingData.ended && hoursSince <= 24) {
          setOngoingHeadache(ongoingData);
          setHeadacheMode('end-headache');
          
          // Pre-fill form with ongoing data
          setFormData(prev => ({
            ...prev,
            painLevel: ongoingData.painLevel || 5,
            location: ongoingData.location || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error checking for ongoing headache:', error);
    }
  }, [currentUser]);

  React.useEffect(() => {
    checkForOngoingHeadache();
  }, [checkForOngoingHeadache]);

  // AUTO-TIMER: Start headache tracking
  const handleStartHeadache = async () => {
    if (!currentUser) {
      setError('You must be logged in to track headaches');
      return;
    }

    const now = new Date();
    
    setLoading(true);
    setError('');

    try {
      const ongoingData = {
        startTime: Timestamp.fromDate(now),
        painLevel: formData.painLevel,
        location: formData.location || 'Not specified',
        createdAt: Timestamp.now(),
        ended: false
      };
      
      await addDoc(collection(db, 'users', currentUser.uid, 'ongoingHeadaches'), ongoingData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error starting headache tracking:', error);
      setError('Failed to start headache tracking. Please try again.');
    }
    setLoading(false);
  };

  // AUTO-TIMER: End headache tracking
  const handleEndHeadache = async () => {
    if (!currentUser || !ongoingHeadache) {
      setError('No ongoing headache found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const now = new Date();
      const startTime = ongoingHeadache.startTime.toDate();
      const durationMinutes = Math.round((now - startTime) / (1000 * 60));
      
      // Create completed headache record
      const completedHeadache = {
        userId: currentUser.uid,
        painLevel: parseInt(formData.painLevel),
        location: formData.location || ongoingHeadache.location,
        startTime: ongoingHeadache.startTime,
        endTime: Timestamp.fromDate(now),
        duration: durationMinutes,
        // Premium features (if user has premium)
        prodromeSymptoms: isPremium ? formData.prodromeSymptoms : [],
        symptoms: isPremium ? formData.symptoms : [],
        triggers: isPremium ? formData.triggers : [],
        notes: isPremium ? formData.notes : '',
        createdAt: Timestamp.now(),
        date: startTime.toISOString().split('T')[0]
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'headaches'), completedHeadache);
      
      // Mark ongoing headache as ended
      const ongoingDocRef = doc(db, 'users', currentUser.uid, 'ongoingHeadaches', ongoingHeadache.id);
      await updateDoc(ongoingDocRef, { ended: true });
      
      navigate('/dashboard');

    } catch (error) {
      console.error('Error ending headache:', error);
      setError('Failed to end headache tracking. Please try again.');
    }

    setLoading(false);
  };

  // Manual entry mode
  const handleManualEntry = () => {
    setHeadacheMode('manual-entry');
  };

  // Manual entry submit
  const handleManualSubmit = async () => {
    if (!currentUser) {
      setError('You must be logged in to record headaches');
      return;
    }

    if (!formData.location) {
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
        endTime: Timestamp.fromDate(now), // For manual entry, assume it's already over
        duration: 0, // Manual entry doesn't track duration
        // Premium features (if user has premium)
        prodromeSymptoms: isPremium ? formData.prodromeSymptoms : [],
        symptoms: isPremium ? formData.symptoms : [],
        triggers: isPremium ? formData.triggers : [],
        notes: isPremium ? formData.notes : '',
        createdAt: Timestamp.now(),
        date: now.toISOString().split('T')[0]
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'headaches'), headacheData);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording headache:', error);
      setError('Failed to record headache. Please try again.');
    }

    setLoading(false);
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

  // Slider navigation functions
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % headacheTypes.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + headacheTypes.length) % headacheTypes.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Touch/swipe handlers for mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
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

  // END HEADACHE FLOW (when there's an ongoing headache)
  if (headacheMode === 'end-headache' && ongoingHeadache) {
    const duration = formatDuration(ongoingHeadache.startTime);
    
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

        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          {/* Ongoing headache status */}
          <div style={{
            background: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#dc3545' }}>
              <i className="fas fa-head-side-virus"></i>
            </div>
            <h2 style={{ color: '#dc3545', margin: '0 0 1rem 0' }}>Headache Ongoing</h2>
            <div style={{ color: '#4B5563', fontSize: '1rem' }}>
              <p style={{ margin: '0.5rem 0', fontSize: '1.2rem', fontWeight: 'bold' }}>
                <i className="fas fa-clock" style={{ marginRight: '0.5rem' }}></i>
                Duration: {duration}
              </p>
              <p style={{ margin: '0.5rem 0' }}>
                <i className="fas fa-map-marker-alt" style={{ marginRight: '0.5rem' }}></i>
                Type: {ongoingHeadache.location}
              </p>
              <p style={{ margin: '0.5rem 0' }}>
                <i className="fas fa-thermometer-half" style={{ marginRight: '0.5rem' }}></i>
                Pain Level: {ongoingHeadache.painLevel}/10
              </p>
            </div>
          </div>

          {/* Current pain level update */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#4682B4', marginBottom: '1rem' }}>
              Current pain level?
            </h3>
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
              <i className="fas fa-star" style={{ marginRight: '0.5rem' }}></i>
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
                background: `linear-gradient(to right, #28a745 0%, #ffc107 50%, #dc3545 100%)`,
                outline: 'none',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            />
          </div>

          {/* Headache Type Selector (same swipeable interface as before) */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#4682B4', marginBottom: '1rem', textAlign: 'center' }}>Headache Type</h3>
            
            <div 
              style={{
                position: 'relative',
                minHeight: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              
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
                  zIndex: 10,
                  transition: 'all 0.2s ease'
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
                  zIndex: 10,
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fas fa-chevron-right" style={{ color: '#4682B4', fontSize: '1.2rem' }}></i>
              </button>

              {/* Content */}
              <div style={{ textAlign: 'center', padding: '0 4rem', width: '100%' }}>
                {/* Image/Icon Area */}
                <div style={{ 
                  height: '160px',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {currentType.image ? (
                    <img 
                      src={currentType.image} 
                      alt={currentType.name}
                      style={{ 
                        maxHeight: '140px',
                        maxWidth: '140px',
                        objectFit: 'contain',
                        transition: 'all 0.3s ease',
                        filter: formData.location === currentType.name ? 'none' : 'grayscale(30%)',
                        transform: formData.location === currentType.name ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: formData.location === currentType.name ? '0 8px 25px rgba(70, 130, 180, 0.3)' : 'none'
                      }}
                    />
                  ) : (
                    <i 
                      className={currentType.icon} 
                      style={{ 
                        fontSize: '5rem',
                        color: formData.location === currentType.name ? '#4682B4' : '#9CA3AF',
                        transition: 'all 0.3s ease'
                      }}
                    ></i>
                  )}
                </div>
                
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: formData.location === currentType.name ? '#4682B4' : '#000000',
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  transition: 'color 0.3s ease'
                }}>
                  {currentType.name}
                </h4>
                
                <p style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: '#4B5563',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}>
                  {currentType.description}
                </p>
                
                <p style={{ 
                  margin: '0 0 1.5rem 0', 
                  color: '#9CA3AF',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  lineHeight: '1.4'
                }}>
                  {currentType.pattern}
                </p>

                {/* Special warning for thunderclap */}
                {currentType.id === 'thunderclap' && (
                  <div style={{
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: '#f8d7da',
                    border: '1px solid #dc3545',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: '#721c24'
                  }}>
                    <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                    <strong>Seek immediate medical attention</strong>
                  </div>
                )}

                {/* Select Button */}
                <button
                  onClick={() => setFormData(prev => ({ ...prev, location: currentType.name }))}
                  style={{
                    background: formData.location === currentType.name 
                      ? 'linear-gradient(135deg, #28a745, #20c997)' 
                      : 'linear-gradient(135deg, #4682B4, #2c5aa0)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {formData.location === currentType.name ? (
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

            {/* Slide Counter */}
            <div style={{
              textAlign: 'center',
              margin: '1rem 0',
              fontSize: '0.9rem',
              color: '#9CA3AF',
              fontWeight: '500'
            }}>
              {currentSlide + 1} of {headacheTypes.length}
            </div>

            {/* Dot Indicators */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              {headacheTypes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    border: 'none',
                    background: index === currentSlide ? '#4682B4' : '#E5E7EB',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Premium features for manual entry */}
          {!isPremium && (
            <div style={{
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h4 style={{ color: '#856404', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                💎 Get More Insights with Premium
              </h4>
              <p style={{ margin: '0 0 0.5rem 0', color: '#856404', fontSize: '0.85rem' }}>
                Track symptoms, triggers, and prodrome signs for better headache prediction
              </p>
              <button
                style={{
                  background: '#ffc107',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Upgrade to Premium
              </button>
            </div>
          )}

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
              onClick={handleManualSubmit}
              disabled={!formData.location || loading}
              style={{
                background: (!formData.location || loading) ? '#E5E7EB' : '#4682B4',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                padding: '12px 32px',
                cursor: (!formData.location || loading) ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Saving...</>
              ) : (
                <><i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>Record Headache</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN ULTRA-MINIMAL SELECTION SCREEN (following RecordSleep pattern)
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

        {/* Ongoing headache alert */}
        {ongoingHeadache && (
          <div style={{
            background: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <h4 style={{ color: '#dc3545', margin: '0 0 0.5rem 0' }}>
              <i className="fas fa-clock" style={{ marginRight: '0.5rem' }}></i>
              Headache in Progress
            </h4>
            <p style={{ margin: 0, color: '#4B5563', fontSize: '0.9rem' }}>
              Duration: {formatDuration(ongoingHeadache.startTime)} • Pain: {ongoingHeadache.painLevel}/10
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
          {/* START HEADACHE BUTTON */}
          <div>
            {/* Quick pain level selector above button */}
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.5rem', color: getPainLevelColor(formData.painLevel), fontWeight: 'bold' }}>
                {formData.painLevel}/10
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.painLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, painLevel: e.target.value }))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: `linear-gradient(to right, #28a745 0%, #ffc107 50%, #dc3545 100%)`,
                  outline: 'none',
                  cursor: 'pointer',
                  margin: '0.5rem 0'
                }}
              />
            </div>

            <button
              onClick={() => setHeadacheMode('start-headache')}
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
                boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)',
                width: '100%'
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
          </div>

          {/* HEADACHE ENDED BUTTON (only show if ongoing) */}
          {ongoingHeadache && (
            <button
              onClick={() => setHeadacheMode('end-headache')}
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
                <i className="fas fa-stop"></i>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                Headache Ended
              </h3>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Stop timer & save
              </div>
            </button>
          )}

          {/* MANUAL ENTRY BUTTON */}
          <button
            onClick={handleManualEntry}
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

        {/* Premium upgrade teaser */}
        {!isPremium && (
          <div style={{
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <h4 style={{ color: '#856404', margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
              💎 Unlock Advanced Tracking
            </h4>
            <p style={{ margin: '0 0 1rem 0', color: '#856404', fontSize: '0.9rem' }}>
              Premium features: Prodrome tracking • Trigger analysis • AI insights • Headache prediction
            </p>
            <button
              style={{
                background: '#ffc107',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Upgrade to Premium
            </button>
          </div>
        )}

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
} 'none',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            />
          </div>

          {/* Premium features teaser */}
          {!isPremium && (
            <div style={{
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '2rem'
            }}>
              <h4 style={{ color: '#856404', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                💎 Premium Features Available
              </h4>
              <p style={{ margin: '0', color: '#856404', fontSize: '0.85rem' }}>
                Track symptoms, triggers, and get AI insights to better understand your headaches
              </p>
              <button
                onClick={() => setShowPremiumFeatures(!showPremiumFeatures)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#856404',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  marginTop: '0.5rem'
                }}
              >
                {showPremiumFeatures ? 'Hide' : 'Show'} premium options
              </button>
            </div>
          )}

          {/* Premium features (collapsed by default for free users) */}
          {(isPremium || showPremiumFeatures) && (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '2rem',
              opacity: isPremium ? 1 : 0.6
            }}>
              {!isPremium && (
                <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#856404', fontSize: '0.9rem' }}>
                  💎 Upgrade to Premium to use these features
                </div>
              )}
              
              {/* Quick symptom checkboxes */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#4682B4' }}>Current Symptoms:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                  {['Nausea', 'Light sensitivity', 'Sound sensitivity', 'Visual aura'].map(symptom => (
                    <label key={symptom} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.symptoms.includes(symptom)}
                        onChange={() => handleCheckboxChange(symptom, 'symptoms')}
                        disabled={!isPremium}
                      />
                      {symptom}
                    </label>
                  ))}
                </div>
              </div>

              {/* Quick trigger checkboxes */}
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#4682B4' }}>Possible Triggers:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                  {['Stress', 'Poor sleep', 'Bright lights', 'Weather change'].map(trigger => (
                    <label key={trigger} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.triggers.includes(trigger)}
                        onChange={() => handleCheckboxChange(trigger, 'triggers')}
                        disabled={!isPremium}
                      />
                      {trigger}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

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
              Keep Tracking
            </Link>
            
            <button
              onClick={handleEndHeadache}
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
                <><i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Ending...</>
              ) : (
                <><i className="fas fa-stop" style={{ marginRight: '0.5rem' }}></i>Headache Ended</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MANUAL ENTRY MODE (simplified from original)
  if (headacheMode === 'manual-entry') {
    const currentType = headacheTypes[currentSlide];
    
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F9FAFB',
        color: '#000000',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
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
              Manual Headache Entry
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
                background: `linear-gradient(to right, #28a745 0%, #ffc107 50%, #dc3545 100%)`,
                outline:
