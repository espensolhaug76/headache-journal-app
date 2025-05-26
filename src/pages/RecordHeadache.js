import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
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
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState({
    painLevel: 5,
    location: ''
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

  const handleSubmit = async () => {
    if (!currentUser) {
      setError('You must be logged in to record headaches');
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
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            margin: '0 0 1rem 0',
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1E3A8A'
          }}>
            <i className="fas fa-head-side-virus" style={{ marginRight: '0.5rem' }}></i>
            Record Headache
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '1.1rem', margin: 0 }}>
            Quick headache logging
          </p>
        </div>

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

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#4682B4', marginBottom: '2rem', textAlign: 'center' }}>Headache Type</h3>
          
          {/* Swipeable Headache Type Selector */}
          <div style={{
            position: 'relative',
            minHeight: '350px',
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

            {/* Current Headache Type Display */}
            <div style={{ textAlign: 'center', padding: '0 4rem', width: '100%' }}>
              <div style={{ 
                height: '180px',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img 
                  src={headacheTypes[currentSlide].image} 
                  alt={headacheTypes[currentSlide].name}
                  style={{ 
                    maxHeight: '160px',
                    maxWidth: '160px',
                    objectFit: 'contain',
                    transition: 'all 0.3s ease',
                    filter: formData.location === headacheTypes[currentSlide].name ? 'none' : 'grayscale(20%)',
                    transform: formData.location === headacheTypes[currentSlide].name ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: formData.location === headacheTypes[currentSlide].name ? '0 8px 25px rgba(70, 130, 180, 0.3)' : 'none'
                  }}
                />
              </div>
              
              <h4 style={{ 
                margin: '0 0 0.75rem 0', 
                color: formData.location === headacheTypes[currentSlide].name ? '#4682B4' : '#000000',
                fontSize: '1.4rem',
                fontWeight: '600',
                transition: 'color 0.3s ease'
              }}>
                {headacheTypes[currentSlide].name}
              </h4>
              
              <p style={{ 
                margin: '0 0 0.75rem 0', 
                color: '#4B5563',
                fontSize: '1.1rem',
                fontWeight: '500'
              }}>
                {headacheTypes[currentSlide].description}
              </p>
              
              <p style={{ 
                margin: '0 0 2rem 0', 
                color: '#9CA3AF',
                fontSize: '1rem',
                fontStyle: 'italic',
                lineHeight: '1.5'
              }}>
                {headacheTypes[currentSlide].pattern}
              </p>

              {/* Select Button */}
              <button
                onClick={() => setFormData(prev => ({ ...prev, location: headacheTypes[currentSlide].name }))}
                style={{
                  background: formData.location === headacheTypes[currentSlide].name 
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
                {formData.location === headacheTypes[currentSlide].name ? (
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

          {/* Slide Indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.75rem',
            marginTop: '2rem'
          }}>
            {headacheTypes.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  border: 'none',
                  background: index === currentSlide ? '#4682B4' : '#E5E7EB',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>
          
          <div style={{
            textAlign: 'center',
            marginTop: '1rem',
            fontSize: '1rem',
            color: '#9CA3AF',
            fontWeight: '500'
          }}>
            {currentSlide + 1} of {headacheTypes.length}
          </div>
        </div>

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
            Cancel
          </Link>
          
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.location}
            style={{
              background: (loading || !formData.location) ? '#E5E7EB' : '#dc3545',
              border: 'none',
              borderRadius: '10px',
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
              <><i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>Record Headache</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
