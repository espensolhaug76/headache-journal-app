// src/components/headache/PremiumProdromeTracker.js
import React from 'react';

export default function PremiumProdromeTracker({ 
  selectedProdromeSymptoms, 
  onProdromeChange,
  timeframe = '24 hours' 
}) {
  
  const prodromeSymptoms = [
    {
      category: 'Mood & Mental',
      symptoms: [
        { id: 'irritability', name: 'Irritability', icon: '😤', description: 'Feeling easily annoyed' },
        { id: 'anxiety', name: 'Anxiety', icon: '😰', description: 'Nervous or worried feeling' },
        { id: 'depression', name: 'Depression', icon: '😔', description: 'Feeling down or sad' },
        { id: 'euphoria', name: 'Euphoria', icon: '😊', description: 'Unusually happy or energetic' },
        { id: 'confusion', name: 'Confusion', icon: '😵‍💫', description: 'Difficulty thinking clearly' },
        { id: 'difficulty-concentrating', name: 'Concentration Issues', icon: '🤔', description: 'Hard to focus' }
      ]
    },
    {
      category: 'Physical Sensations',
      symptoms: [
        { id: 'neck-stiffness', name: 'Neck Stiffness', icon: '🦴', description: 'Tight or stiff neck muscles' },
        { id: 'yawning', name: 'Excessive Yawning', icon: '🥱', description: 'Frequent yawning' },
        { id: 'fatigue', name: 'Fatigue', icon: '😴', description: 'Unusual tiredness' },
        { id: 'muscle-tension', name: 'Muscle Tension', icon: '💪', description: 'Tight muscles' },
        { id: 'cold-hands-feet', name: 'Cold Hands/Feet', icon: '🧊', description: 'Unusually cold extremities' },
        { id: 'hot-flashes', name: 'Hot Flashes', icon: '🔥', description: 'Sudden warmth or sweating' }
      ]
    },
    {
      category: 'Neurological',
      symptoms: [
        { id: 'visual-aura', name: 'Visual Aura', icon: '✨', description: 'Flashing lights, zigzag lines' },
        { id: 'sensory-aura', name: 'Sensory Aura', icon: '🖐️', description: 'Tingling, numbness' },
        { id: 'speech-difficulty', name: 'Speech Difficulty', icon: '🗣️', description: 'Trouble finding words' },
        { id: 'dizziness', name: 'Dizziness', icon: '💫', description: 'Feeling unsteady' },
        { id: 'ringing-ears', name: 'Ringing in Ears', icon: '👂', description: 'Tinnitus or ear noise' },
        { id: 'phantom-smells', name: 'Phantom Smells', icon: '👃', description: 'Smelling things that aren\'t there' }
      ]
    },
    {
      category: 'Digestive & Appetite',
      symptoms: [
        { id: 'food-cravings', name: 'Food Cravings', icon: '🍕', description: 'Craving specific foods' },
        { id: 'loss-appetite', name: 'Loss of Appetite', icon: '🚫', description: 'Not wanting to eat' },
        { id: 'nausea', name: 'Nausea', icon: '🤢', description: 'Feeling sick to stomach' },
        { id: 'thirst', name: 'Excessive Thirst', icon: '💧', description: 'Drinking more than usual' },
        { id: 'frequent-urination', name: 'Frequent Urination', icon: '🚽', description: 'Needing to urinate often' },
        { id: 'constipation', name: 'Constipation', icon: '😣', description: 'Difficulty with bowel movements' }
      ]
    },
    {
      category: 'Sleep & Energy',
      symptoms: [
        { id: 'insomnia', name: 'Insomnia', icon: '🌙', description: 'Trouble falling asleep' },
        { id: 'hypersomnia', name: 'Hypersomnia', icon: '😴', description: 'Sleeping too much' },
        { id: 'restless-sleep', name: 'Restless Sleep', icon: '🛏️', description: 'Poor quality sleep' },
        { id: 'energy-bursts', name: 'Energy Bursts', icon: '⚡', description: 'Sudden increase in energy' },
        { id: 'hyperactivity', name: 'Hyperactivity', icon: '🏃', description: 'Unable to sit still' },
        { id: 'sluggishness', name: 'Sluggishness', icon: '🐌', description: 'Moving or thinking slowly' }
      ]
    }
  ];

  const handleSymptomToggle = (symptomId) => {
    const newSymptoms = selectedProdromeSymptoms.includes(symptomId)
      ? selectedProdromeSymptoms.filter(id => id !== symptomId)
      : [...selectedProdromeSymptoms, symptomId];
    
    onProdromeChange(newSymptoms);
  };

  const getSelectedCount = () => selectedProdromeSymptoms.length;

  const getSymptomsByCategory = (category) => {
    return prodromeSymptoms.find(cat => cat.category === category)?.symptoms || [];
  };

  return (
    <div style={{
      background: '#FFFFFF',
      border: '2px solid #FFD700',
      borderRadius: '16px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 4px 12px rgba(255, 215, 0, 0.2)'
    }}>
      {/* Premium Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: '1.5rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
        borderRadius: '12px',
        color: 'white'
      }}>
        <i className="fas fa-crown" style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}></i>
        <div>
          <h3 style={{ margin: '0', fontSize: '1.3rem', fontWeight: '700' }}>
            Premium: Prodrome Tracking
          </h3>
          <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
            Track warning signs {timeframe} before headaches
          </p>
        </div>
      </div>

      {/* Summary */}
      <div style={{
        background: 'rgba(70, 130, 180, 0.1)',
        border: '1px solid rgba(70, 130, 180, 0.3)',
        borderRadius: '12px',
        padding: '1rem',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4682B4', marginBottom: '0.5rem' }}>
          {getSelectedCount()}
        </div>
        <div style={{ color: '#4B5563', fontSize: '1rem' }}>
          prodrome symptoms selected
        </div>
        {getSelectedCount() > 0 && (
          <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '0.5rem' }}>
            These symptoms occurred before your headache started
          </div>
        )}
      </div>

      {/* Symptoms by Category */}
      {prodromeSymptoms.map((category) => (
        <div key={category.category} style={{ marginBottom: '2rem' }}>
          <h4 style={{ 
            color: '#4682B4', 
            marginBottom: '1rem', 
            fontSize: '1.1rem',
            fontWeight: '600',
            borderBottom: '2px solid rgba(70, 130, 180, 0.2)',
            paddingBottom: '0.5rem'
          }}>
            {category.category}
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem'
          }}>
            {category.symptoms.map((symptom) => {
              const isSelected = selectedProdromeSymptoms.includes(symptom.id);
              return (
                <button
                  key={symptom.id}
                  onClick={() => handleSymptomToggle(symptom.id)}
                  style={{
                    padding: '1rem',
                    background: isSelected 
                      ? 'rgba(255, 215, 0, 0.15)'
                      : '#F9FAFB',
                    border: isSelected 
                      ? '2px solid #FFD700'
                      : '1px solid #E5E7EB',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ 
                    fontSize: '1.5rem', 
                    flexShrink: 0,
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.2s ease'
                  }}>
                    {symptom.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: '600', 
                      fontSize: '0.95rem',
                      color: isSelected ? '#B8860B' : '#000000',
                      marginBottom: '0.25rem'
                    }}>
                      {symptom.name}
                    </div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#6B7280',
                      lineHeight: '1.3'
                    }}>
                      {symptom.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{ 
                      color: '#FFD700', 
                      fontSize: '1.2rem',
                      flexShrink: 0
                    }}>
                      <i className="fas fa-check-circle"></i>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Educational Info */}
      <div style={{
        background: 'rgba(23, 162, 184, 0.1)',
        border: '1px solid rgba(23, 162, 184, 0.3)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginTop: '2rem'
      }}>
        <h4 style={{ color: '#17a2b8', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
          <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
          Understanding Prodrome Symptoms
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <h5 style={{ color: '#20c997', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>What is Prodrome?</h5>
            <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
              <li>Early warning signs before headache pain begins</li>
              <li>Can occur hours to days before headache</li>
              <li>Help predict and prepare for headaches</li>
              <li>May allow for early intervention</li>
            </ul>
          </div>
          <div>
            <h5 style={{ color: '#28a745', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Tracking Benefits:</h5>
            <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
              <li>Identify personal warning patterns</li>
              <li>Take preventive action early</li>
              <li>Better medication timing</li>
              <li>Reduce headache severity</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      {getSelectedCount() > 0 && (
        <div style={{
          background: 'rgba(40, 167, 69, 0.1)',
          border: '1px solid rgba(40, 167, 69, 0.3)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginTop: '1.5rem'
        }}>
          <h4 style={{ color: '#28a745', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
            <i className="fas fa-lightbulb" style={{ marginRight: '0.5rem' }}></i>
            Smart Tracking Tips
          </h4>
          <div style={{ color: '#4B5563', fontSize: '0.9rem' }}>
            <p style={{ margin: '0.5rem 0' }}>
              <strong>✓ Great job tracking {getSelectedCount()} symptoms!</strong> This data helps identify your personal headache patterns.
            </p>
            <p style={{ margin: '0.5rem 0' }}>
              💡 <strong>Pro tip:</strong> Track these symptoms even when you don't get a headache - it helps identify false alarms vs real warnings.
            </p>
            <p style={{ margin: '0.5rem 0' }}>
              ⏰ <strong>Next time:</strong> When you notice these symptoms, consider taking preventive medication or using relaxation techniques.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}