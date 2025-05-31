// src/components/headache/HeadacheTypeSelector.js
import React from 'react';

export default function HeadacheTypeSelector({ 
  headacheTypes, 
  currentSlide, 
  setCurrentSlide, 
  selectedType, 
  onTypeSelect 
}) {
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % headacheTypes.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + headacheTypes.length) % headacheTypes.length);
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ color: '#1E40AF', marginBottom: '1rem', textAlign: 'center' }}>
        Headache Type
      </h3>
      
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
                filter: selectedType === headacheTypes[currentSlide].name ? 'none' : 'grayscale(20%)',
                transform: selectedType === headacheTypes[currentSlide].name ? 'scale(1.05)' : 'scale(1)',
                boxShadow: selectedType === headacheTypes[currentSlide].name ? '0 8px 25px rgba(70, 130, 180, 0.3)' : 'none'
              }}
            />
          </div>
          
          <h4 style={{ 
            margin: '0 0 0.5rem 0', 
            color: selectedType === headacheTypes[currentSlide].name ? '#1E40AF' : '#374151',
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
            onClick={() => onTypeSelect(headacheTypes[currentSlide].name)}
            style={{
              background: selectedType === headacheTypes[currentSlide].name 
                ? 'linear-gradient(135deg, #10B981, #059669)' 
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
            {selectedType === headacheTypes[currentSlide].name ? (
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
              background: index === currentSlide ? '#1E40AF' : '#E5E7EB',
              cursor: 'pointer'
            }}
          />
        ))}
      </div>
    </div>
  );
}
