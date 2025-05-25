import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Import the images at the top of the file
import migrainerHeadacheImg from '../assets/headache-types/migraine-headache.png';
import tensionHeadacheImg from '../assets/headache-types/tension-headache.png';

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
      image: tensionHeadacheImg, // Use imported image
      pattern: 'Band-like pressure around the entire head'
    },
    {
      id: 'migraine',
      name: 'Migraine Headache',
      description: 'One side of head',
      icon: 'fas fa-head-side-cough',
      image: migrainerHeadacheImg, // Use imported image
      pattern: 'Throbbing pain, usually on one side'
    },
    {
      id: 'rebound',
      name: 'Medication Overuse Headache',
      description: 'All over/top (rebound)',
      icon: 'fas fa-pills',
      image: null, // No image yet - will show icon
      pattern: 'Medication overuse headache'
    },
    {
      id: 'exertion',
      name: 'Exertion Headache',
      description: 'Back/all over',
      icon: 'fas fa-running',
      image: null, // No image yet - will show icon
      pattern: 'Exercise-induced headache'
    },
    {
      id: 'caffeine',
      name: 'Caffeine Headache',
      description: 'Front/temples',
      icon: 'fas fa-coffee',
      image: null, // No image yet - will show icon
      pattern: 'Dull ache at temples and front of head'
    },
    {
      id: 'hormone',
      name: 'Hormone Headache',
      description: 'One side (menstrual migraine)',
      icon: 'fas fa-moon',
      image: null, // No image yet - will show icon
      pattern: 'Related to hormonal changes'
    },
    {
      id: 'cluster',
      name: 'Cluster Headache',
      description: 'Around one eye',
      icon: 'fas fa-eye',
      image: null, // No image yet - will show icon
      pattern: 'Severe pain around or behind one eye'
    },
    {
      id: 'sinus',
      name: 'Allergy or Sinus',
      description: 'Forehead/cheek area',
      icon: 'fas fa-head-side-mask',
      image: null, // No image yet - will show icon
      pattern: 'Not a headache disorder but symptom description'
    },
    {
      id: 'hemicrania',
      name: 'Hemicrania Continua',
      description: 'One side continuous',
      icon: 'fas fa-clock',
      image: null, // No image yet - will show icon
      pattern: 'Continuous one-sided headache'
    },
    {
      id: 'hypertension',
      name: 'Hypertension Headache',
      description: 'Back of head/neck',
      icon: 'fas fa-heartbeat',
      image: null, // No image yet - will show icon
      pattern: 'Back of head related to high blood pressure'
    },
    {
      id: 'post-traumatic',
      name: 'Post-Traumatic Headache',
      description: 'Multiple scattered areas',
      icon: 'fas fa-brain',
      image: null, // No image yet - will show icon
      pattern: 'Following head injury or trauma'
    },
    {
      id: 'spinal',
      name: 'Spinal Headache',
      description: 'Back of head/neck',
      icon: 'fas fa-spine',
      image: null, // No image yet - will show icon
      pattern: 'Related to spinal fluid pressure'
    },
    {
      id: 'thunderclap',
      name: 'Thunderclap Headache',
      description: 'Sudden severe (multiple spots)',
      icon: 'fas fa-bolt',
      image: null, // No image yet - will show icon
      pattern: 'Sudden, severe headache (seek immediate medical attention)'
    },
    {
      id: 'ice-pick',
      name: 'Ice Pick Headache',
      description: 'Sharp isolated spots',
      icon: 'fas fa-map-pin',
      image: null, // No image yet - will show icon
      pattern: 'Brief, sharp, stabbing pains'
    }
  ];

  // ... rest of your component code remains the same until the render section ...

  const renderCurrentQuestion = () => {
    const question = questions[currentStep];

    switch (question.component) {
      // ... other cases remain the same ...

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
                  {currentType.image ? (
                    <img 
                      src={currentType.image} 
                      alt={currentType.name}
                      style={{ 
                        maxHeight: '120px',
                        maxWidth: '120px',
                        objectFit: 'contain',
                        transition: 'all 0.3s ease',
                        filter: formData.location === currentType.name ? 'none' : 'grayscale(50%)'
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
                    transition: 'all 0.3s ease'
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

            {/* Rest of the slider UI remains the same... */}
            {/* Slide Counter, Dot Indicators, Quick Navigation Grid, etc. */}
          </div>
        );

      // ... other cases remain the same ...
    }
  };

  // ... rest of your component code remains exactly the same ...
}
