import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordBodyPain() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    neckPain: 0,
    upperBackPain: 0,
    lowerBackPain: 0,
    jawPain: 0,
    shoulderPain: 0,
    otherPainLocations: [],
    activities: '',
    painTriggers: [],
    reliefMethods: [],
    painImpact: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const otherBodyLocations = [
    'Temples',
    'Forehead', 
    'Eyes',
    'Sinuses',
    'Arms',
    'Hands/Wrists',
    'Chest',
    'Abdomen',
    'Hips',
    'Thighs',
    'Knees',
    'Calves',
    'Feet/Ankles',
    'Teeth'
  ];

  const headacheRelatedAreas = ['Temples', 'Forehead', 'Eyes', 'Sinuses'];

  const painTriggers = [
    'Poor posture',
    'Prolonged sitting',
    'Computer/desk work',
    'Heavy lifting',
    'Sleeping position',
    'Stress/tension',
    'Weather changes',
    'Physical activity',
    'Carrying heavy bags',
    'Driving long distances',
    'Phone/tablet use',
    'Repetitive motions'
  ];

  const reliefMethods = [
    'Heat therapy',
    'Cold therapy',
    'Gentle stretching',
    'Massage',
    'Rest/lying down',
    'Pain medication',
    'Movement/walking',
    'Posture adjustment',
    'Deep breathing',
    'Hot shower/bath',
    'Physical therapy exercises',
    'Meditation/relaxation'
  ];

  const questions = [
    {
      id: 'primary-pain-areas',
      title: 'Rate your pain in key areas',
      subtitle: 'Areas commonly related to headaches',
      component: 'primary-pain-areas'
    },
    {
      id: 'other-pain-locations',
      title: 'Any pain in other areas?',
      subtitle: 'Select any additional areas of discomfort',
      component: 'other-pain-locations'
    },
    {
      id: 'pain-triggers',
      title: 'What might have caused the pain?',
      subtitle: 'Select potential triggers or activities',
      component: 'pain-triggers'
    },
    {
      id: 'activities',
      title: 'What activities did you do today?',
      subtitle: 'Physical activities that might contribute to pain',
      component: 'activities'
    },
    {
      id: 'relief-methods',
      title: 'What helped relieve the pain?',
      subtitle: 'Methods you used for pain management',
      component: 'relief-methods'
    },
    {
      id: 'pain-impact',
      title: 'How did pain affect your day?',
      subtitle: 'Impact on daily activities and mood',
      component: 'pain-impact'
    },
    {
      id: 'pain-summary',
      title: 'Body pain and headache insights',
      subtitle: 'Understanding the connection to your headaches',
      component: 'pain-summary'
    },
    {
      id: 'notes',
      title: 'Additional pain notes',
      subtitle: 'Any other details about your body pain',
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

  const getPainLevelColor = (level) => {
    if (level === 0) return '#28a745'; // Green
    if (level <= 3) return '#ffc107'; // Yellow
    if (level <= 6) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
  };

  const getPainLevelText = (level) => {
    if (level === 0) return 'No Pain';
    if (level <= 3) return 'Mild';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'Severe';
    return 'Extreme';
  };

  const getHeadacheRelatedPainTotal = () => {
    return formData.neckPain + formData.upperBackPain + formData.jawPain + formData.shoulderPain;
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setError('You must be logged in to record body pain data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const painData = {
        userId: currentUser.uid,
        date: formData.date,
        painLevels: {
          neck: formData.neckPain,
          upperBack: formData.upperBackPain,
          lowerBack: formData.lowerBackPain,
          jaw: formData.jawPain,
          shoulder: formData.shoulderPain,
          other: formData.otherPainLocations
        },
        activities: formData.activities,
        painTriggers: formData.painTriggers,
        reliefMethods: formData.reliefMethods,
        painImpact: formData.painImpact,
        notes: formData.notes,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'bodyPain'), painData);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording body pain:', error);
      setError('Failed to record body pain data. Please try again.');
    }

    setLoading(false);
  };

  const renderCurrentQuestion = () => {
    const question = questions[currentStep];

    switch (question.component) {
      case 'primary-pain-areas':
        return (
          <div>
            <div style={{
              background: 'rgba(70, 130, 180, 0.1)',
              border: '1px solid rgba(70, 130, 180, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '3rem'
            }}>
              <h4 style={{ color: '#4682B4', margin: '0 0 0.5rem 0' }}>
                Areas Commonly Related to Headaches
              </h4>
              <p style={{ margin: 0, color: '#4B5563', fontSize: '0.9rem' }}>
                Tension and pain in these areas can contribute to or trigger headaches. Rate your current pain level.
              </p>
            </div>

            {/* Neck Pain */}
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  Neck Pain
                </h3>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: getPainLevelColor(formData.neckPain)
                }}>
                  {formData.neckPain}/10
                </div>
              </div>
              <div style={{
                fontSize: '1.1rem',
                marginBottom: '1rem',
                color: getPainLevelColor(formData.neckPain),
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {getPainLevelText(formData.neckPain)}
                {formData.neckPain >= 5 && <span style={{ color: '#dc3545', marginLeft: '1rem' }}>May contribute to headaches</span>}
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={formData.neckPain}
                onChange={(e) => setFormData(prev => ({ ...prev, neckPain: parseInt(e.target.value) }))}
                style={{
                  width: '100%',
                  height: '12px',
                  borderRadius: '6px',
                  background: `linear-gradient(to right, #28a745 0%, #ffc107 30%, #fd7e14 60%, #dc3545 100%)`,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: '#9CA3AF',
                marginTop: '0.5rem'
              }}>
                <span>No Pain</span>
                <span>Extreme Pain</span>
              </div>
            </div>

            {/* Shoulder Pain */}
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  Shoulder Pain
                </h3>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: getPainLevelColor(formData.shoulderPain)
                }}>
                  {formData.shoulderPain}/10
                </div>
              </div>
              <div style={{
                fontSize: '1.1rem',
                marginBottom: '1rem',
                color: getPainLevelColor(formData.shoulderPain),
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {getPainLevelText(formData.shoulderPain)}
                {formData.shoulderPain >= 5 && <span style={{ color: '#dc3545', marginLeft: '1rem' }}>May contribute to headaches</span>}
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={formData.shoulderPain}
                onChange={(e) => setFormData(prev => ({ ...prev, shoulderPain: parseInt(e.target.value) }))}
                style={{
                  width: '100%',
                  height: '12px',
                  borderRadius: '6px',
                  background: `linear-gradient(to right, #28a745 0%, #ffc107 30%, #fd7e14 60%, #dc3545 100%)`,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: '#9CA3AF',
                marginTop: '0.5rem'
              }}>
                <span>No Pain</span>
                <span>Extreme Pain</span>
              </div>
            </div>

            {/* Upper Back Pain */}
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  Upper Back Pain
                </h3>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: getPainLevelColor(formData.upperBackPain)
                }}>
                  {formData.upperBackPain}/10
                </div>
              </div>
              <div style={{
                fontSize: '1.1rem',
                marginBottom: '1rem',
                color: getPainLevelColor(formData.upperBackPain),
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {getPainLevelText(formData.upperBackPain)}
                {formData.upperBackPain >= 5 && <span style={{ color: '#dc3545', marginLeft: '1rem' }}>May contribute to headaches</span>}
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={formData.upperBackPain}
                onChange={(e) => setFormData(prev => ({ ...prev, upperBackPain: parseInt(e.target.value) }))}
                style={{
                  width: '100%',
                  height: '12px',
                  borderRadius: '6px',
                  background: `linear-gradient(to right, #28a745 0%, #ffc107 30%, #fd7e14 60%, #dc3545 100%)`,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: '#9CA3AF',
                marginTop: '0.5rem'
              }}>
                <span>No Pain</span>
                <span>Extreme Pain</span>
              </div>
            </div>

            {/* Jaw Pain */}
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  Jaw Pain
                </h3>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: getPainLevelColor(formData.jawPain)
                }}>
                  {formData.jawPain}/10
                </div>
              </div>
              <div style={{
                fontSize: '1.1rem',
                marginBottom: '1rem',
                color: getPainLevelColor(formData.jawPain),
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {getPainLevelText(formData.jawPain)}
                {formData.jawPain >= 5 && <span style={{ color: '#dc3545', marginLeft: '1rem' }}>May contribute to headaches</span>}
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={formData.jawPain}
                onChange={(e) => setFormData(prev => ({ ...prev, jawPain: parseInt(e.target.value) }))}
                style={{
                  width: '100%',
                  height: '12px',
                  borderRadius: '6px',
                  background: `linear-gradient(to right, #28a745 0%, #ffc107 30%, #fd7e14 60%, #dc3545 100%)`,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: '#9CA3AF',
                marginTop: '0.5rem'
              }}>
                <span>No Pain</span>
                <span>Extreme Pain</span>
              </div>
            </div>

            {/* Lower Back Pain (less related but still tracked) */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  Lower Back Pain
                </h3>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: getPainLevelColor(formData.lowerBackPain)
                }}>
                  {formData.lowerBackPain}/10
                </div>
              </div>
              <div style={{
                fontSize: '1.1rem',
                marginBottom: '1rem',
                color: getPainLevelColor(formData.lowerBackPain),
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {getPainLevelText(formData.lowerBackPain)}
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={formData.lowerBackPain}
                onChange={(e) => setFormData(prev => ({ ...prev, lowerBackPain: parseInt(e.target.value) }))}
                style={{
                  width: '100%',
                  height: '12px',
                  borderRadius: '6px',
                  background: `linear-gradient(to right, #28a745 0%, #ffc107 30%, #fd7e14 60%, #dc3545 100%)`,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: '#9CA3AF',
                marginTop: '0.5rem'
              }}>
                <span>No Pain</span>
                <span>Extreme Pain</span>
              </div>
            </div>
          </div>
        );

      case 'other-pain-locations':
        return (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem'
            }}>
              {otherBodyLocations.map(location => {
                const isHeadacheRelated = headacheRelatedAreas.includes(location);
                return (
                  <label key={location} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    background: formData.otherPainLocations.includes(location)
                      ? isHeadacheRelated 
                        ? 'rgba(220, 53, 69, 0.1)'
                        : 'rgba(70, 130, 180, 0.1)'
                      : '#F9FAFB',
                    border: formData.otherPainLocations.includes(location)
                      ? isHeadacheRelated 
                        ? '1px solid #dc3545'
                        : '1px solid #4682B4'
                      : '1px solid #E5E7EB',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '0.95rem',
                    color: '#000000'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.otherPainLocations.includes(location)}
                      onChange={() => handleCheckboxChange(location, 'otherPainLocations')}
                    />
                    {location}
                    {isHeadacheRelated && (
                      <span style={{ fontSize: '0.8rem', color: '#dc3545', fontStyle: 'italic' }}>
                        (headache-related)
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            {/* Educational info */}
            <div style={{
              background: 'rgba(23, 162, 184, 0.1)',
              border: '1px solid rgba(23, 162, 184, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginTop: '2rem'
            }}>
              <h4 style={{ color: '#17a2b8', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Body Pain & Headache Connections
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <h5 style={{ color: '#dc3545', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>High Connection:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Temples, forehead, eye area</li>
                    <li>Neck and shoulder tension</li>
                    <li>Jaw clenching (TMJ)</li>
                    <li>Sinus pressure</li>
                  </ul>
                </div>
                <div>
                  <h5 style={{ color: '#4682B4', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Moderate Connection:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Upper back and spine</li>
                    <li>Arms and hands (posture)</li>
                    <li>Chest and breathing</li>
                    <li>Lower body (compensation)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pain-triggers':
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem'
          }}>
            {painTriggers.map(trigger => (
              <label key={trigger} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: formData.painTriggers.includes(trigger)
                  ? 'rgba(255, 193, 7, 0.1)'
                  : '#F9FAFB',
                border: formData.painTriggers.includes(trigger)
                  ? '1px solid #ffc107'
                  : '1px solid #E5E7EB',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.95rem',
                color: '#000000'
              }}>
                <input
                  type="checkbox"
                  checked={formData.painTriggers.includes(trigger)}
                  onChange={() => handleCheckboxChange(trigger, 'painTriggers')}
                />
                {trigger}
              </label>
            ))}
          </div>
        );

      case 'activities':
        return (
          <div>
            <textarea
              value={formData.activities}
              onChange={(e) => setFormData(prev => ({ ...prev, activities: e.target.value }))}
              placeholder="Describe activities that may have contributed to pain: driving, heavy lifting, painting, computer work, sleeping position, exercise, etc..."
              rows="5"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                background: '#FFFFFF',
                color: '#000000',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                marginBottom: '2rem'
              }}
            />

            {/* Activity tips */}
            <div style={{
              background: 'rgba(40, 167, 69, 0.1)',
              border: '1px solid rgba(40, 167, 69, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ color: '#28a745', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Common Pain-Causing Activities
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <h5 style={{ color: '#20c997', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Posture-Related:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Computer/desk work</li>
                    <li>Phone/tablet use</li>
                    <li>Driving long distances</li>
                    <li>Poor sleeping position</li>
                  </ul>
                </div>
                <div>
                  <h5 style={{ color: '#17a2b8', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Physical Strain:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Heavy lifting or moving</li>
                    <li>Repetitive motions</li>
                    <li>Overhead activities</li>
                    <li>Sudden movements</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'relief-methods':
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem'
          }}>
            {reliefMethods.map(method => (
              <label key={method} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: formData.reliefMethods.includes(method)
                  ? 'rgba(40, 167, 69, 0.1)'
                  : '#F9FAFB',
                border: formData.reliefMethods.includes(method)
                  ? '1px solid #28a745'
                  : '1px solid #E5E7EB',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.95rem',
                color: '#000000'
              }}>
                <input
                  type="checkbox"
                  checked={formData.reliefMethods.includes(method)}
                  onChange={() => handleCheckboxChange(method, 'reliefMethods')}
                />
                {method}
              </label>
            ))}
          </div>
        );

      case 'pain-impact':
        return (
          <div>
            <textarea
              value={formData.painImpact}
              onChange={(e) => setFormData(prev => ({ ...prev, painImpact: e.target.value }))}
              placeholder="How did pain affect your work, daily activities, mood, or sleep? Did it limit what you could do today?"
              rows="4"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                background: '#FFFFFF',
                color: '#000000',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                marginBottom: '2rem'
              }}
            />

            {/* Pain management tips */}
            <div style={{
              background: 'rgba(23, 162, 184, 0.1)',
              border: '1px solid rgba(23, 162, 184, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ color: '#17a2b8', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Pain Management Strategies
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <h5 style={{ color: '#20c997', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Immediate Relief:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Apply heat or cold</li>
                    <li>Gentle stretching</li>
                    <li>Change positions frequently</li>
                    <li>Take breaks from activities</li>
                  </ul>
                </div>
                <div>
                  <h5 style={{ color: '#28a745', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Prevention:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Improve posture</li>
                    <li>Regular movement/exercise</li>
                    <li>Ergonomic workspace setup</li>
                    <li>Stress management</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pain-summary':
        const headacheRelatedPain = getHeadacheRelatedPainTotal();
        const maxPossiblePain = 40; // 4 areas × 10 max each
        const painPercentage = Math.round((headacheRelatedPain / maxPossiblePain) * 100);
        const highPainAreas = [
          formData.neckPain >= 7 ? 'Neck' : null,
          formData.shoulderPain >= 7 ? 'Shoulder' : null,
          formData.upperBackPain >= 7 ? 'Upper Back' : null,
          formData.jawPain >= 7 ? 'Jaw' : null
        ].filter(Boolean);
        
        return (
          <div>
            <div style={{
              background: 'rgba(70, 130, 180, 0.1)',
              border: '1px solid rgba(70, 130, 180, 0.3)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <h3 style={{ color: '#4682B4', margin: '0 0 1rem 0', fontSize: '1.5rem' }}>
                Your Body Pain Summary
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', color: getPainLevelColor(headacheRelatedPain / 4), fontWeight: 'bold' }}>
                    {painPercentage}%
                  </div>
                  <div style={{ fontSize: '1rem', color: '#4B5563', marginBottom: '0.5rem' }}>headache-related pain</div>
                  <div style={{ fontSize: '1.1rem', color: getPainLevelColor(headacheRelatedPain / 4), fontWeight: '600' }}>
                    {painPercentage < 25 ? 'Low Risk' : painPercentage < 50 ? 'Moderate Risk' : 'High Risk'}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', color: formData.painTriggers.length > 3 ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                    {formData.painTriggers.length}
                  </div>
                  <div style={{ fontSize: '1rem', color: '#4B5563', marginBottom: '0.5rem' }}>pain triggers</div>
                  <div style={{ fontSize: '1.1rem', color: formData.painTriggers.length > 3 ? '#dc3545' : '#28a745', fontWeight: '600' }}>
                    {formData.painTriggers.length > 3 ? 'Multiple' : 'Manageable'}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', color: formData.reliefMethods.length > 0 ? '#28a745' : '#ffc107', fontWeight: 'bold' }}>
                    {formData.reliefMethods.length}
                  </div>
                  <div style={{ fontSize: '1rem', color: '#4B5563', marginBottom: '0.5rem' }}>relief methods</div>
                  <div style={{ fontSize: '1.1rem', color: formData.reliefMethods.length > 0 ? '#28a745' : '#ffc107', fontWeight: '600' }}>
                    {formData.reliefMethods.length > 0 ? 'Active Management' : 'Need Strategies'}
                  </div>
                </div>
              </div>
            </div>

            {/* High pain warnings */}
            {highPainAreas.length > 0 && (
              <div style={{
                background: 'rgba(220, 53, 69, 0.1)',
                border: '1px solid rgba(220, 53, 69, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ color: '#dc3545', margin: '0 0 1rem 0' }}>
                  High Pain Level Alert
                </h4>
                <p style={{ margin: '0 0 1rem 0', color: '#721c24', fontSize: '0.9rem' }}>
                  High pain levels detected in: <strong>{highPainAreas.join(', ')}</strong>
                </p>
                <p style={{ margin: '0 0 1rem 0', color: '#721c24', fontSize: '0.9rem' }}>
                  These areas are commonly associated with headaches. Consider:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#721c24', fontSize: '0.85rem' }}>
                  <li>Immediate pain relief measures (heat, cold, gentle stretching)</li>
                  <li>Posture assessment and correction</li>
                  <li>Stress reduction techniques</li>
                  <li>Monitoring for associated headaches</li>
                  <li>Consulting healthcare provider if pain persists</li>
                </ul>
              </div>
            )}

            {/* Personalized recommendations */}
            <div style={{
              background: 'rgba(40, 167, 69, 0.1)',
              border: '1px solid rgba(40, 167, 69, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ color: '#28a745', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Personalized Pain Management Recommendations
              </h4>
              <div style={{ fontSize: '0.9rem', color: '#4B5563' }}>
                {painPercentage > 50 && (
                  <p style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'rgba(220, 53, 69, 0.1)', borderRadius: '6px' }}>
                    🚨 <strong>High headache-related pain:</strong> Focus on neck, shoulder, and jaw tension relief to prevent headaches.
                  </p>
                )}
                {formData.painTriggers.includes('Poor posture') && (
                  <p style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '6px' }}>
                    💺 <strong>Posture improvement needed:</strong> Consider ergonomic assessment and regular posture breaks.
                  </p>
                )}
                {formData.painTriggers.includes('Stress/tension') && formData.reliefMethods.includes('Deep breathing') && (
                  <p style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'rgba(40, 167, 69, 0.1)', borderRadius: '6px' }}>
                    🧘 <strong>Good stress management:</strong> Continue using breathing techniques and consider expanding relaxation methods.
                  </p>
                )}
                {formData.reliefMethods.length === 0 && (
                  <p style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '6px' }}>
                    🛠️ <strong>Develop pain management toolkit:</strong> Try heat/cold therapy, gentle stretching, or massage techniques.
                  </p>
                )}
                {painPercentage < 25 && formData.reliefMethods.length > 2 && (
                  <p style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'rgba(40, 167, 69, 0.1)', borderRadius: '6px' }}>
                    ✅ <strong>Excellent pain management:</strong> Low pain levels and good relief strategies - keep it up!
                  </p>
                )}
                <p style={{ margin: '1rem 0 0 0', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  Continue tracking to identify patterns between body pain and your headaches over time
                </p>
              </div>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes about your body pain - pain patterns, what makes it better or worse, how it relates to your daily activities, etc..."
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
              This information helps identify body pain patterns that may contribute to your headaches
            </p>

            {/* Final body pain tips */}
            <div style={{
              background: 'rgba(70, 130, 180, 0.1)',
              border: '1px solid rgba(70, 130, 180, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginTop: '2rem'
            }}>
              <h4 style={{ color: '#4682B4', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Body Pain & Headache Prevention Summary
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <h5 style={{ color: '#20c997', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Key Connections:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Neck tension → tension headaches</li>
                    <li>Jaw clenching → TMJ headaches</li>
                    <li>Shoulder tension → referred head pain</li>
                    <li>Poor posture → muscle strain headaches</li>
                  </ul>
                </div>
                <div>
                  <h5 style={{ color: '#28a745', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Prevention Focus:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Regular movement and stretching</li>
                    <li>Ergonomic workspace setup</li>
                    <li>Stress management techniques</li>
                    <li>Early intervention when pain starts</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      color: '#000000',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header - No Card */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1E3A8A',
              textAlign: 'center',
              flex: 1
            }}>
              Record Body Pain
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
              Cancel
            </Link>
          </div>
          
          {/* Progress Bar - No Card */}
          <div style={{
            background: '#E5E7EB',
            borderRadius: '10px',
            height: '8px',
            overflow: 'hidden',
            marginBottom: '15px'
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

        {/* Question Content - No Card */}
        <div style={{ marginBottom: '40px', minHeight: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{
              margin: '0 0 15px 0',
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: '#4682B4'
            }}>
              {currentQuestion.title}
            </h2>
            <p style={{
              margin: 0,
              color: '#9CA3AF',
              fontSize: '1.1rem'
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
              marginBottom: '30px',
              color: '#721c24',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {renderCurrentQuestion()}
        </div>

        {/* Navigation - No Card */}
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
              background: currentStep === 0 ? '#E5E7EB' : 'transparent',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              color: currentStep === 0 ? '#9CA3AF' : '#4B5563',
              padding: '12px 24px',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              fontSize: '1rem'
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
              disabled={loading}
              style={{
                background: loading ? '#E5E7EB' : '#4682B4',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                padding: '12px 24px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                minWidth: '120px'
              }}
            >
              {loading ? 'Saving...' : isLastStep ? 'Record Body Pain Data' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
