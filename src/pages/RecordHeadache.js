import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordHeadache() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0); // For headache location slider
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [formData, setFormData] = useState({
    painLevel: 5,
    location: '',
    startTime: 'just-now',
    customStartTime: new Date().toISOString().slice(0, 16),
    prodromeSymptoms: [],
    symptoms: [],
    triggers: [],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Complete list of 14 headache types - reordered as requested
  const headacheTypes = [
    {
      id: 'tension',
      name: 'Tension Headache',
      description: 'Band around head/forehead',
      icon: 'fas fa-head-side-virus',
      image: '/src/assets/headache-types/tension-headache.png',
      pattern: 'Band-like pressure around the entire head'
    },
    {
      id: 'migraine',
      name: 'Migraine Headache',
      description: 'One side of head',
      icon: 'fas fa-head-side-cough',
      image: '/src/assets/headache-types/migraine-headache.png',
      pattern: 'Throbbing pain, usually on one side'
    },
    {
      id: 'rebound',
      name: 'Medication Overuse Headache',
      description: 'All over/top (rebound)',
      icon: 'fas fa-pills',
      image: '/src/assets/headache-types/rebound-headache.png',
      pattern: 'Medication overuse headache'
    },
    {
      id: 'exertion',
      name: 'Exertion Headache',
      description: 'Back/all over',
      icon: 'fas fa-running',
      image: '/src/assets/headache-types/exertion-headache.png',
      pattern: 'Exercise-induced headache'
    },
    {
      id: 'caffeine',
      name: 'Caffeine Headache',
      description: 'Front/temples',
      icon: 'fas fa-coffee',
      image: '/src/assets/headache-types/caffeine-headache.png',
      pattern: 'Dull ache at temples and front of head'
    },
    {
      id: 'hormone',
      name: 'Hormone Headache',
      description: 'One side (menstrual migraine)',
      icon: 'fas fa-moon',
      image: '/src/assets/headache-types/hormone-headache.png',
      pattern: 'Related to hormonal changes'
    },
    {
      id: 'cluster',
      name: 'Cluster Headache',
      description: 'Around one eye',
      icon: 'fas fa-eye',
      image: '/src/assets/headache-types/cluster-headache.png',
      pattern: 'Severe pain around or behind one eye'
    },
    {
      id: 'sinus',
      name: 'Allergy or Sinus',
      description: 'Forehead/cheek area',
      icon: 'fas fa-head-side-mask',
      image: '/src/assets/headache-types/sinus-headache.png',
      pattern: 'Not a headache disorder but symptom description'
    },
    {
      id: 'hemicrania',
      name: 'Hemicrania Continua',
      description: 'One side continuous',
      icon: 'fas fa-clock',
      image: '/src/assets/headache-types/hemicrania-continua.png',
      pattern: 'Continuous one-sided headache'
    },
    {
      id: 'hypertension',
      name: 'Hypertension Headache',
      description: 'Back of head/neck',
      icon: 'fas fa-heartbeat',
      image: '/src/assets/headache-types/hypertension-headache.png',
      pattern: 'Back of head related to high blood pressure'
    },
    {
      id: 'post-traumatic',
      name: 'Post-Traumatic Headache',
      description: 'Multiple scattered areas',
      icon: 'fas fa-brain',
      image: '/src/assets/headache-types/post-traumatic-headache.png',
      pattern: 'Following head injury or trauma'
    },
    {
      id: 'spinal',
      name: 'Spinal Headache',
      description: 'Back of head/neck',
      icon: 'fas fa-spine',
      image: '/src/assets/headache-types/spinal-headache.png',
      pattern: 'Related to spinal fluid pressure'
    },
    {
      id: 'thunderclap',
      name: 'Thunderclap Headache',
      description: 'Sudden severe (multiple spots)',
      icon: 'fas fa-bolt',
      image: '/src/assets/headache-types/thunderclap-headache.png',
      pattern: 'Sudden, severe headache (seek immediate medical attention)'
    },
    {
      id: 'ice-pick',
      name: 'Ice Pick Headache',
      description: 'Sharp isolated spots',
      icon: 'fas fa-map-pin',
      image: '/src/assets/headache-types/ice-pick-headache.png',
      pattern: 'Brief, sharp, stabbing pains'
    }
  ];

  // Prodrome symptoms (early warning signs)
  const prodromeSymptoms = [
    'Irritability', 'Depressed mood', 'Yawning', 'Fatigue',
    'Difficulty sleeping', 'Frequent urination', 'Food cravings',
    'Nausea', 'Light sensitivity', 'Sound sensitivity',
    'Trouble concentrating', 'Difficulty speaking',
    'Neck pain or stiffness', 'Hyperactivity'
  ];

  // Current symptoms during headache
  const currentSymptoms = [
    'Nausea', 'Vomiting', 'Light sensitivity', 'Sound sensitivity',
    'Visual aura', 'Dizziness', 'Fatigue', 'Irritability',
    'Difficulty concentrating', 'Neck stiffness', 'Runny nose', 'Tearing'
  ];

  // Possible triggers
  const commonTriggers = [
    'Stress', 'Poor sleep', 'Skipped meal', 'Caffeine', 'Alcohol',
    'Weather change', 'Bright lights', 'Loud noise', 'Strong smell',
    'Exercise', 'Hormonal changes', 'Certain foods'
  ];

  const timeOptions = [
    { value: 'just-now', label: 'Just now' },
    { value: '1hr-ago', label: '1 hour ago' },
    { value: 'this-morning', label: 'This morning' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'custom', label: 'Custom time' }
  ];

  const questions = [
    {
      id: 'pain-level',
      title: 'How bad is your headache?',
      subtitle: 'Rate your current pain level',
      component: 'pain-slider'
    },
    {
      id: 'location',
      title: 'Where is the pain?',
      subtitle: 'Select the type that best matches your headache',
      component: 'headache-location'
    },
    {
      id: 'timing',
      title: 'When did it start?',
      subtitle: 'Help us understand the timeline',
      component: 'timing'
    },
    {
      id: 'prodrome',
      title: 'Did you notice any warning signs?',
      subtitle: 'Symptoms that occurred before the headache started',
      component: 'prodrome'
    },
    {
      id: 'current-symptoms',
      title: 'What symptoms are you experiencing?',
      subtitle: 'Current symptoms during the headache',
      component: 'symptoms'
    },
    {
      id: 'triggers',
      title: 'What might have triggered it?',
      subtitle: 'Select any potential triggers',
      component: 'triggers'
    },
    {
      id: 'notes',
      title: 'Anything else to add?',
      subtitle: 'Optional additional notes',
      component: 'notes'
    }
  ];

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < questions.length - 1) {
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

  const handleSubmit = async () => {
    if (!currentUser) {
      setError('You must be logged in to record headaches');
      return;
    }

    if (!formData.location) {
      setError('Please select a headache location');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Calculate actual start time
      let actualStartTime = new Date();
      if (formData.startTime === '1hr-ago') {
        actualStartTime = new Date(Date.now() - 60 * 60 * 1000);
      } else if (formData.startTime === 'this-morning') {
        actualStartTime = new Date();
        actualStartTime.setHours(8, 0, 0, 0);
      } else if (formData.startTime === 'yesterday') {
        actualStartTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      } else if (formData.startTime === 'custom') {
        actualStartTime = new Date(formData.customStartTime);
      }

      const headacheData = {
        userId: currentUser.uid,
        painLevel: parseInt(formData.painLevel),
        location: formData.location,
        startTime: Timestamp.fromDate(actualStartTime),
        prodromeSymptoms: formData.prodromeSymptoms,
        symptoms: formData.symptoms,
        triggers: formData.triggers,
        notes: formData.notes,
        createdAt: Timestamp.now(),
        date: actualStartTime.toISOString().split('T')[0]
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'headaches'), headacheData);
      
      // Success - redirect to dashboard
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

  const renderCurrentQuestion = () => {
    const question = questions[currentStep];

    switch (question.component) {
      case 'pain-slider':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '4rem', 
              marginBottom: '1rem',
              color: getPainLevelColor(formData.painLevel)
            }}>
              {formData.painLevel}/10
            </div>
            <div style={{ 
              fontSize: '1.5rem', 
              marginBottom: '2rem',
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
              <span>Mild</span>
              <span>Moderate</span>
              <span>Severe</span>
              <span>Extreme</span>
            </div>
          </div>
        );

      case 'headache-location':
        const currentType = headacheTypes[currentSlide];
        
        return (
          <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            {/* FontAwesome CSS */}
            <link 
              rel="stylesheet" 
              href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
              integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
              crossOrigin="anonymous" 
              referrerPolicy="no-referrer" 
            />

            {/* Main Slider Container - No Card Design */}
            <div 
              style={{
                position: 'relative',
                minHeight: '350px',
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
                onMouseEnter={(e) => e.target.style.background = 'rgba(70, 130, 180, 0.2)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(70, 130, 180, 0.1)'}
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
                onMouseEnter={(e) => e.target.style.background = 'rgba(70, 130, 180, 0.2)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(70, 130, 180, 0.1)'}
              >
                <i className="fas fa-chevron-right" style={{ color: '#4682B4', fontSize: '1.2rem' }}></i>
              </button>

              {/* Content - Clean, no cards */}
              <div style={{ textAlign: 'center', padding: '0 4rem', width: '100%' }}>
                {/* Image/Icon Area */}
                <div style={{ 
                  height: '140px', 
                  marginBottom: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i 
                    className={currentType.icon} 
                    style={{ 
                      fontSize: '5rem', 
                      color: formData.location === currentType.name ? '#4682B4' : '#9CA3AF',
                      transition: 'all 0.3s ease',
                      filter: formData.location === currentType.name ? 'drop-shadow(0 4px 8px rgba(70, 130, 180, 0.3))' : 'none'
                    }}
                  ></i>
                  {/* Future: Replace with actual headache location image */}
                  {/* <img 
                    src={currentType.image} 
                    alt={currentType.name}
                    style={{
                      width: '140px',
                      height: '140px',
                      objectFit: 'contain'
                    }}
                  /> */}
                </div>
                
                <h3 style={{ 
                  margin: '0 0 0.75rem 0', 
                  color: formData.location === currentType.name ? '#4682B4' : '#000000',
                  fontSize: '1.6rem',
                  fontWeight: '600',
                  transition: 'color 0.3s ease'
                }}>
                  {currentType.name}
                </h3>
                
                <p style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#4B5563',
                  fontSize: '1.1rem',
                  fontWeight: '500'
                }}>
                  {currentType.description}
                </p>
                
                <p style={{ 
                  margin: '0 0 2rem 0', 
                  color: '#9CA3AF',
                  fontSize: '1rem',
                  fontStyle: 'italic',
                  lineHeight: '1.5',
                  maxWidth: '400px',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}>
                  {currentType.pattern}
                </p>

                {/* Special warning for thunderclap */}
                {currentType.id === 'thunderclap' && (
                  <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: '#f8d7da',
                    border: '1px solid #dc3545',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    color: '#721c24',
                    maxWidth: '400px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
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
                    borderRadius: '12px',
                    padding: '16px 32px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: formData.location === currentType.name 
                      ? '0 4px 16px rgba(40, 167, 69, 0.3)' 
                      : '0 4px 16px rgba(70, 130, 180, 0.3)',
                    transform: formData.location === currentType.name ? 'translateY(-2px)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (formData.location !== currentType.name) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(70, 130, 180, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.location !== currentType.name) {
                      e.target.style.transform = 'none';
                      e.target.style.boxShadow = '0 4px 16px rgba(70, 130, 180, 0.3)';
                    }
                  }}
                >
                  {formData.location === currentType.name ? (
                    <>
                      <i className="fas fa-check" style={{ marginRight: '0.75rem' }}></i>
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
              margin: '2rem 0 1rem 0',
              fontSize: '1rem',
              color: '#9CA3AF',
              fontWeight: '500'
            }}>
              {currentSlide + 1} of {headacheTypes.length}
            </div>

            {/* Dot Indicators */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '2rem'
            }}>
              {headacheTypes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    border: 'none',
                    background: index === currentSlide ? '#4682B4' : '#E5E7EB',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: index === currentSlide ? 'scale(1.2)' : 'scale(1)'
                  }}
                />
              ))}
            </div>

            {/* Quick Navigation Grid - Simplified */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '0.5rem',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              {headacheTypes.slice(0, 8).map((type, index) => (
                <button
                  key={type.id}
                  onClick={() => goToSlide(index)}
                  style={{
                    padding: '0.75rem 0.5rem',
                    background: index === currentSlide ? '#4682B4' : 'transparent',
                    border: index === currentSlide ? 'none' : '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: index === currentSlide ? 'white' : '#4B5563',
                    lineHeight: '1.2',
                    fontWeight: index === currentSlide ? '500' : '400'
                  }}
                >
                  {type.name.replace(' Headache', '').replace('Medication Overuse', 'Rebound')}
                </button>
              ))}
            </div>
            
            {/* "More types" indicator for remaining headaches */}
            {headacheTypes.length > 8 && (
              <div style={{
                textAlign: 'center',
                marginTop: '1rem',
                fontSize: '0.9rem',
                color: '#9CA3AF'
              }}>
                <i className="fas fa-chevron-left" style={{ marginRight: '0.5rem' }}></i>
                Swipe or use arrows to see all {headacheTypes.length} types
                <i className="fas fa-chevron-right" style={{ marginLeft: '0.5rem' }}></i>
              </div>
            )}
          </div>
        );pattern}
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
                    background: formData.location === currentType.name ? '#28a745' : '#4682B4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
              color: '#9CA3AF'
            }}>
              {currentSlide + 1} of {headacheTypes.length}
            </div>

            {/* Dot Indicators */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '1rem'
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
                    transition: 'background 0.2s ease'
                  }}
                />
              ))}
            </div>

            {/* Quick Navigation Grid */}
            <div style={{
              marginTop: '2rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '0.5rem'
            }}>
              {headacheTypes.map((type, index) => (
                <button
                  key={type.id}
                  onClick={() => goToSlide(index)}
                  style={{
                    padding: '0.5rem',
                    background: index === currentSlide ? '#E3F2FD' : '#F9FAFB',
                    border: index === currentSlide ? '1px solid #4682B4' : '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: index === currentSlide ? '#4682B4' : '#4B5563',
                    lineHeight: '1.2'
                  }}
                >
                  {type.name.replace(' Headache', '')}
                </button>
              ))}
            </div>
          </div>
        );

      case 'timing':
        return (
          <div>
            {timeOptions.map(option => (
              <div key={option.value} style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: formData.startTime === option.value 
                    ? '#E3F2FD'
                    : '#FFFFFF',
                  border: formData.startTime === option.value 
                    ? '2px solid #4682B4'
                    : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <input
                    type="radio"
                    name="startTime"
                    value={option.value}
                    checked={formData.startTime === option.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ fontSize: '1.1rem', color: '#000000' }}>{option.label}</span>
                </label>
              </div>
            ))}
            {formData.startTime === 'custom' && (
              <div style={{ marginTop: '1rem' }}>
                <input
                  type="datetime-local"
                  value={formData.customStartTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, customStartTime: e.target.value }))}
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
            )}
          </div>
        );

      case 'prodrome':
        return (
          <div>
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem', 
              background: '#fff3cd',
              borderRadius: '8px',
              border: '1px solid #ffc107'
            }}>
              <p style={{ margin: 0, color: '#856404', fontSize: '0.9rem' }}>
                💡 <strong>Prodrome symptoms</strong> are early warning signs that occur hours or days before a headache. 
                Recognizing these patterns can help with early treatment.
              </p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.5rem'
            }}>
              {prodromeSymptoms.map(symptom => (
                <label key={symptom} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  background: formData.prodromeSymptoms.includes(symptom) 
                    ? '#fff3cd'
                    : '#F9FAFB',
                  border: formData.prodromeSymptoms.includes(symptom)
                    ? '1px solid #ffc107'
                    : '1px solid #E5E7EB',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem',
                  color: '#000000'
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
        );

      case 'symptoms':
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.5rem'
          }}>
            {currentSymptoms.map(symptom => (
              <label key={symptom} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                background: formData.symptoms.includes(symptom) 
                  ? '#f8d7da'
                  : '#F9FAFB',
                border: formData.symptoms.includes(symptom)
                  ? '1px solid #dc3545'
                  : '1px solid #E5E7EB',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.9rem',
                color: '#000000'
              }}>
                <input
                  type="checkbox"
                  checked={formData.symptoms.includes(symptom)}
                  onChange={() => handleCheckboxChange(symptom, 'symptoms')}
                />
                {symptom}
              </label>
            ))}
          </div>
        );

      case 'triggers':
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.5rem'
          }}>
            {commonTriggers.map(trigger => (
              <label key={trigger} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                background: formData.triggers.includes(trigger) 
                  ? '#d1ecf1'
                  : '#F9FAFB',
                border: formData.triggers.includes(trigger)
                  ? '1px solid #17a2b8'
                  : '1px solid #E5E7EB',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.9rem',
                color: '#000000'
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
        );

      case 'notes':
        return (
          <div>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional details about your headache (optional)..."
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
              This information helps identify patterns and improve treatment
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const canProceed = () => {
    switch (currentQuestion.component) {
      case 'location':
        return formData.location !== '';
      default:
        return true;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      color: '#000000',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header with Progress */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h1 style={{
              margin: 0,
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: '#1E3A8A'
            }}>
              🤕 Record Headache
            </h1>
            <Link
              to="/dashboard"
              style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                color: '#4B5563',
                padding: '8px 16px',
                textDecoration: 'none',
                fontSize: '0.9rem'
              }}
            >
              Cancel
            </Link>
          </div>
          
          {/* Progress Bar */}
          <div style={{
            background: '#E5E7EB',
            borderRadius: '10px',
            height: '8px',
            overflow: 'hidden',
            marginBottom: '10px'
          }}>
            <div style={{
              background: '#4682B4',
              height: '100%',
              width: `${((currentStep + 1) / questions.length) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            color: '#9CA3AF'
          }}>
            <span>Step {currentStep + 1} of {questions.length}</span>
            <span>{Math.round(((currentStep + 1) / questions.length) * 100)}% Complete</span>
          </div>
        </div>

        {/* Question Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '40px',
          marginBottom: '30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #E5E7EB',
          minHeight: '400px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{
              margin: '0 0 10px 0',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#4682B4'
            }}>
              {currentQuestion.title}
            </h2>
            <p style={{
              margin: 0,
              color: '#9CA3AF',
              fontSize: '1rem'
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
              marginBottom: '20px',
              color: '#721c24',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {renderCurrentQuestion()}
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
              background: currentStep === 0 ? '#E5E7EB' : '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              color: currentStep === 0 ? '#9CA3AF' : '#4B5563',
              padding: '12px 24px',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              boxShadow: currentStep === 0 ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            ← Previous
          </button>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {!isLastStep && (
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
                Skip
              </button>
            )}

            <button
              onClick={isLastStep ? handleSubmit : handleNext}
              disabled={!canProceed() || loading}
              style={{
                background: !canProceed() || loading 
                  ? '#E5E7EB' 
                  : '#4682B4',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                padding: '12px 24px',
                cursor: !canProceed() || loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                minWidth: '120px',
                boxShadow: !canProceed() || loading ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {loading ? 'Saving...' : isLastStep ? 'Record Headache' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
