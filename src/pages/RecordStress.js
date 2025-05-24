import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordStress() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    stressLevel: 5,
    anxietyLevel: 5,
    otherMentalState: '',
    stressTriggers: [],
    mentalIssues: [],
    copingStrategies: [],
    physicalSymptoms: [],
    stressImpact: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const commonStressTriggers = [
    'Work pressure',
    'Family issues', 
    'Financial concerns',
    'Health worries',
    'Relationship problems',
    'Social situations',
    'Traffic/Commuting',
    'Time pressure',
    'Technology issues',
    'Sleep problems',
    'Weather changes',
    'Noise',
    'Crowds',
    'Decision making',
    'Deadlines',
    'Conflict',
    'Uncertainty',
    'Perfectionism'
  ];

  const mentalHealthSymptoms = [
    'Depression',
    'Anxiety',
    'Panic attacks',
    'Mood swings',
    'Irritability',
    'Concentration problems',
    'Memory issues',
    'Brain fog',
    'Excessive worry',
    'Social anxiety',
    'Insomnia',
    'Fatigue',
    'Emotional numbness',
    'Overwhelm',
    'Racing thoughts',
    'Low motivation',
    'Restlessness'
  ];

  const copingStrategiesList = [
    'Deep breathing',
    'Meditation',
    'Exercise',
    'Talking to someone',
    'Journaling',
    'Music',
    'Walking',
    'Reading',
    'Hot bath/shower',
    'Progressive muscle relaxation',
    'Mindfulness',
    'Prayer/Spirituality',
    'Creative activities',
    'Time in nature',
    'Yoga',
    'Listening to podcasts'
  ];

  const physicalStressSymptoms = [
    'Headache',
    'Muscle tension',
    'Jaw clenching',
    'Shoulder tightness',
    'Back pain',
    'Stomach upset',
    'Rapid heartbeat',
    'Sweating',
    'Shallow breathing',
    'Fatigue',
    'Sleep problems',
    'Appetite changes'
  ];

  const questions = [
    {
      id: 'stress-levels',
      title: 'How are your stress and anxiety levels?',
      subtitle: 'Rate your current mental state',
      component: 'stress-levels'
    },
    {
      id: 'mental-state',
      title: 'How would you describe your mental state?',
      subtitle: 'Any other emotions or feelings today',
      component: 'mental-state'
    },
    {
      id: 'stress-triggers',
      title: 'What caused stress today?',
      subtitle: 'Select any triggers you experienced',
      component: 'stress-triggers'
    },
    {
      id: 'mental-symptoms',
      title: 'What mental health symptoms are you experiencing?',
      subtitle: 'Select any that apply to how you are feeling',
      component: 'mental-symptoms'
    },
    {
      id: 'physical-symptoms',
      title: 'Any physical symptoms from stress?',
      subtitle: 'Stress often shows up in the body',
      component: 'physical-symptoms'
    },
    {
      id: 'coping-strategies',
      title: 'What helped you cope with stress?',
      subtitle: 'Select strategies you used today',
      component: 'coping-strategies'
    },
    {
      id: 'stress-impact',
      title: 'How did stress impact your day?',
      subtitle: 'Describe the overall effect',
      component: 'stress-impact'
    },
    {
      id: 'notes',
      title: 'Additional stress notes',
      subtitle: 'Any other details about your stress and mental health',
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

  const getStressLevelColor = (level) => {
    if (level <= 2) return '#28a745'; // Green
    if (level <= 4) return '#20c997'; // Teal
    if (level <= 6) return '#ffc107'; // Yellow
    if (level <= 8) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
  };

  const getStressLevelText = (level) => {
    if (level <= 2) return 'Very Low';
    if (level <= 4) return 'Low';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'High';
    return 'Very High';
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setError('You must be logged in to record stress data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const stressData = {
        userId: currentUser.uid,
        date: formData.date,
        stressLevel: parseInt(formData.stressLevel),
        anxietyLevel: parseInt(formData.anxietyLevel),
        otherMentalState: formData.otherMentalState,
        stressTriggers: formData.stressTriggers,
        mentalIssues: formData.mentalIssues,
        copingStrategies: formData.copingStrategies,
        physicalSymptoms: formData.physicalSymptoms,
        stressImpact: formData.stressImpact,
        notes: formData.notes,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'stress'), stressData);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording stress:', error);
      setError('Failed to record stress data. Please try again.');
    }

    setLoading(false);
  };

  const renderCurrentQuestion = () => {
    const question = questions[currentStep];

    switch (question.component) {
      case 'stress-levels':
        return (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  Stress Level
                </h3>
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
                    background: `linear-gradient(to right, #28a745 0%, #ffc107 50%, #dc3545 100%)`,
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
                  <span>No Stress</span>
                  <span>Extreme</span>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  Anxiety Level
                </h3>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                  color: getStressLevelColor(formData.anxietyLevel)
                }}>
                  {formData.anxietyLevel}/10
                </div>
                <div style={{
                  fontSize: '1.2rem',
                  marginBottom: '1.5rem',
                  color: getStressLevelColor(formData.anxietyLevel),
                  fontWeight: '600'
                }}>
                  {getStressLevelText(formData.anxietyLevel)}
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.anxietyLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, anxietyLevel: e.target.value }))}
                  style={{
                    width: '100%',
                    height: '12px',
                    borderRadius: '6px',
                    background: `linear-gradient(to right, #28a745 0%, #ffc107 50%, #dc3545 100%)`,
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
                  <span>No Anxiety</span>
                  <span>Severe</span>
                </div>
              </div>
            </div>

            {/* High Stress Warning */}
            {(formData.stressLevel >= 8 || formData.anxietyLevel >= 8) && (
              <div style={{
                background: 'rgba(220, 53, 69, 0.1)',
                border: '1px solid rgba(220, 53, 69, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ color: '#dc3545', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                  High Stress/Anxiety Level Detected
                </h4>
                <p style={{ margin: '0 0 1rem 0', color: '#4B5563' }}>Consider these immediate stress management techniques:</p>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#4B5563', fontSize: '0.9rem' }}>
                  <li>Deep breathing exercises (4-7-8 technique)</li>
                  <li>Progressive muscle relaxation</li>
                  <li>Short meditation or mindfulness session</li>
                  <li>Light physical activity or stretching</li>
                  <li>Speaking with a friend, family member, or professional</li>
                </ul>
              </div>
            )}
          </div>
        );

      case 'mental-state':
        return (
          <div>
            <input
              type="text"
              value={formData.otherMentalState}
              onChange={(e) => setFormData(prev => ({ ...prev, otherMentalState: e.target.value }))}
              placeholder="e.g., Excited, Confused, Overwhelmed, Hopeful, Frustrated..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                background: '#FFFFFF',
                color: '#000000',
                fontSize: '1rem',
                marginBottom: '1rem'
              }}
            />
            <p style={{
              margin: 0,
              color: '#9CA3AF',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              Describe any other emotions or mental states you are experiencing beyond stress and anxiety
            </p>
          </div>
        );

      case 'stress-triggers':
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem'
          }}>
            {commonStressTriggers.map(trigger => (
              <label key={trigger} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: formData.stressTriggers.includes(trigger)
                  ? 'rgba(253, 126, 20, 0.1)'
                  : '#F9FAFB',
                border: formData.stressTriggers.includes(trigger)
                  ? '1px solid #fd7e14'
                  : '1px solid #E5E7EB',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.95rem',
                color: '#000000'
              }}>
                <input
                  type="checkbox"
                  checked={formData.stressTriggers.includes(trigger)}
                  onChange={() => handleCheckboxChange(trigger, 'stressTriggers')}
                />
                {trigger}
              </label>
            ))}
          </div>
        );

      case 'mental-symptoms':
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem'
          }}>
            {mentalHealthSymptoms.map(symptom => (
              <label key={symptom} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: formData.mentalIssues.includes(symptom)
                  ? 'rgba(220, 53, 69, 0.1)'
                  : '#F9FAFB',
                border: formData.mentalIssues.includes(symptom)
                  ? '1px solid #dc3545'
                  : '1px solid #E5E7EB',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.95rem',
                color: '#000000'
              }}>
                <input
                  type="checkbox"
                  checked={formData.mentalIssues.includes(symptom)}
                  onChange={() => handleCheckboxChange(symptom, 'mentalIssues')}
                />
                {symptom}
              </label>
            ))}
          </div>
        );

      case 'physical-symptoms':
        return (
          <div>
            <div style={{
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h4 style={{ color: '#856404', margin: '0 0 0.5rem 0' }}>
                Stress-Body Connection
              </h4>
              <p style={{ margin: 0, color: '#856404', fontSize: '0.9rem' }}>
                Stress often shows up physically. These symptoms can also trigger headaches.
              </p>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem'
            }}>
              {physicalStressSymptoms.map(symptom => (
                <label key={symptom} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: formData.physicalSymptoms.includes(symptom)
                    ? 'rgba(255, 193, 7, 0.1)'
                    : '#F9FAFB',
                  border: formData.physicalSymptoms.includes(symptom)
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
                    checked={formData.physicalSymptoms.includes(symptom)}
                    onChange={() => handleCheckboxChange(symptom, 'physicalSymptoms')}
                  />
                  {symptom}
                </label>
              ))}
            </div>
          </div>
        );

      case 'coping-strategies':
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem'
          }}>
            {copingStrategiesList.map(strategy => (
              <label key={strategy} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: formData.copingStrategies.includes(strategy)
                  ? 'rgba(40, 167, 69, 0.1)'
                  : '#F9FAFB',
                border: formData.copingStrategies.includes(strategy)
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
                  checked={formData.copingStrategies.includes(strategy)}
                  onChange={() => handleCheckboxChange(strategy, 'copingStrategies')}
                />
                {strategy}
              </label>
            ))}
          </div>
        );

      case 'stress-impact':
        return (
          <div>
            <textarea
              value={formData.stressImpact}
              onChange={(e) => setFormData(prev => ({ ...prev, stressImpact: e.target.value }))}
              placeholder="How did stress affect your work, relationships, sleep, or daily activities today?"
              rows="4"
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                background: '#FFFFFF',
                color: '#000000',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                marginBottom: '1.5rem'
              }}
            />

            {/* Stress Management Tips */}
            <div style={{
              background: 'rgba(23, 162, 184, 0.1)',
              border: '1px solid rgba(23, 162, 184, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ color: '#17a2b8', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Daily Stress Management Tips
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <h5 style={{ color: '#20c997', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Mindfulness:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>5-minute daily meditation</li>
                    <li>Deep breathing exercises</li>
                    <li>Body scan techniques</li>
                    <li>Mindful walking</li>
                  </ul>
                </div>
                <div>
                  <h5 style={{ color: '#28a745', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Physical:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Regular exercise routine</li>
                    <li>Adequate sleep (7-9 hours)</li>
                    <li>Limit caffeine intake</li>
                    <li>Stay hydrated</li>
                  </ul>
                </div>
                <div>
                  <h5 style={{ color: '#ffc107', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Social:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Connect with supportive people</li>
                    <li>Express feelings appropriately</li>
                    <li>Set healthy boundaries</li>
                    <li>Ask for help when needed</li>
                  </ul>
                </div>
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
              placeholder="Any additional notes about your stress levels, mental state, or what helped/didn't help today..."
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
              This information helps identify stress patterns that may contribute to your headaches
            </p>
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
              Record Stress & Mental State
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
              {loading ? 'Saving...' : isLastStep ? 'Record Stress Data' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
