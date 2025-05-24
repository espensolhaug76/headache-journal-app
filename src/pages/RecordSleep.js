import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordSleep() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    bedTime: '',
    wakeTime: '',
    sleepQuality: 7,
    awakeDuringNight: '',
    sleepProblems: [],
    screenTimeMobile: 0,
    screenTimeComputer: 0,
    sleepEvents: [], // For future audio tracking
    sleepTrackerUsed: false, // For future automatic tracking
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sleepProblems = [
    'Difficulty falling asleep',
    'Waking during night',
    'Early morning awakening',
    'Snoring',
    'Sleep apnea symptoms',
    'Restless sleep',
    'Nightmares/Bad dreams',
    'Too hot/cold',
    'Noise disturbances',
    'Uncomfortable bed',
    'Racing thoughts',
    'Physical discomfort'
  ];

  const questions = [
    {
      id: 'sleep-times',
      title: 'When did you sleep?',
      subtitle: 'Enter your bedtime and wake time',
      component: 'sleep-times'
    },
    {
      id: 'sleep-quality',
      title: 'How was your sleep quality?',
      subtitle: 'Rate your overall sleep experience',
      component: 'sleep-quality'
    },
    {
      id: 'sleep-disruptions',
      title: 'Any sleep disruptions?',
      subtitle: 'Tell us about interruptions to your sleep',
      component: 'sleep-disruptions'
    },
    {
      id: 'sleep-problems',
      title: 'What sleep problems did you experience?',
      subtitle: 'Select any issues that affected your sleep',
      component: 'sleep-problems'
    },
    {
      id: 'screen-time',
      title: 'How much screen time before bed?',
      subtitle: 'Screen exposure can affect sleep quality',
      component: 'screen-time'
    },
    {
      id: 'sleep-tracking',
      title: 'Sleep tracking options',
      subtitle: 'Future: Automatic sleep monitoring setup',
      component: 'sleep-tracking'
    },
    {
      id: 'notes',
      title: 'Additional sleep notes',
      subtitle: 'Any other details about your sleep',
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

  const calculateSleepHours = () => {
    if (!formData.bedTime || !formData.wakeTime) return 0;
    
    const bedDateTime = new Date(`${formData.date}T${formData.bedTime}`);
    let wakeDateTime = new Date(`${formData.date}T${formData.wakeTime}`);
    
    // If wake time is earlier than bed time, assume next day
    if (wakeDateTime <= bedDateTime) {
      wakeDateTime.setDate(wakeDateTime.getDate() + 1);
    }
    
    const hoursSlept = (wakeDateTime - bedDateTime) / (1000 * 60 * 60);
    return Math.round(hoursSlept * 10) / 10;
  };

  const getSleepQualityText = (quality) => {
    if (quality <= 3) return 'Poor';
    if (quality <= 5) return 'Fair';
    if (quality <= 7) return 'Good';
    if (quality <= 9) return 'Very Good';
    return 'Excellent';
  };

  const getSleepQualityColor = (quality) => {
    if (quality <= 3) return '#dc3545';
    if (quality <= 5) return '#fd7e14';
    if (quality <= 7) return '#ffc107';
    if (quality <= 9) return '#28a745';
    return '#20c997';
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setError('You must be logged in to record sleep data');
      return;
    }

    if (!formData.bedTime || !formData.wakeTime) {
      setError('Please enter both bed time and wake time');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const hoursSlept = calculateSleepHours();
      
      const sleepData = {
        userId: currentUser.uid,
        date: formData.date,
        bedTime: formData.bedTime,
        wakeTime: formData.wakeTime,
        hoursSlept: hoursSlept,
        sleepQuality: parseInt(formData.sleepQuality),
        awakeDuringNight: formData.awakeDuringNight,
        sleepProblems: formData.sleepProblems,
        screenTime: {
          mobile: formData.screenTimeMobile,
          computer: formData.screenTimeComputer
        },
        sleepEvents: formData.sleepEvents, // For future audio tracking
        sleepTrackerUsed: formData.sleepTrackerUsed,
        notes: formData.notes,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'sleep'), sleepData);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording sleep:', error);
      setError('Failed to record sleep data. Please try again.');
    }

    setLoading(false);
  };

  const renderCurrentQuestion = () => {
    const question = questions[currentStep];

    switch (question.component) {
      case 'sleep-times':
        const sleepHours = calculateSleepHours();
        
        return (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  Went to Bed
                </label>
                <input
                  type="time"
                  value={formData.bedTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, bedTime: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    background: '#FFFFFF',
                    color: '#000000',
                    fontSize: '1.1rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  Woke Up
                </label>
                <input
                  type="time"
                  value={formData.wakeTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, wakeTime: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    background: '#FFFFFF',
                    color: '#000000',
                    fontSize: '1.1rem'
                  }}
                />
              </div>
            </div>

            {/* Sleep Hours Display */}
            {sleepHours > 0 && (
              <div style={{
                background: 'rgba(70, 130, 180, 0.1)',
                border: '1px solid rgba(70, 130, 180, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                <h3 style={{ color: '#4682B4', margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
                  Total Sleep: {sleepHours} hours
                </h3>
                <p style={{ margin: 0, color: '#4B5563', fontSize: '1rem' }}>
                  {sleepHours < 7 ? '⚠️ Consider getting more sleep for optimal health' : 
                   sleepHours > 9 ? 'That\'s plenty of sleep!' : 
                   '✅ Good amount of sleep!'}
                </p>
              </div>
            )}
          </div>
        );

      case 'sleep-quality':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem',
              color: getSleepQualityColor(formData.sleepQuality)
            }}>
              {formData.sleepQuality}/10
            </div>
            <div style={{
              fontSize: '1.5rem',
              marginBottom: '2rem',
              color: getSleepQualityColor(formData.sleepQuality),
              fontWeight: '600'
            }}>
              {getSleepQualityText(formData.sleepQuality)}
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.sleepQuality}
              onChange={(e) => setFormData(prev => ({ ...prev, sleepQuality: e.target.value }))}
              style={{
                width: '100%',
                height: '12px',
                borderRadius: '6px',
                background: `linear-gradient(to right, #dc3545 0%, #ffc107 50%, #28a745 100%)`,
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
              <span>Poor</span>
              <span>Fair</span>
              <span>Good</span>
              <span>Excellent</span>
            </div>
          </div>
        );

      case 'sleep-disruptions':
        return (
          <div>
            <label style={{
              display: 'block',
              marginBottom: '1rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#4682B4'
            }}>
              How often did you wake up during the night?
            </label>
            <input
              type="text"
              value={formData.awakeDuringNight}
              onChange={(e) => setFormData(prev => ({ ...prev, awakeDuringNight: e.target.value }))}
              placeholder="e.g., 2 times, 30 minutes, bathroom visit"
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
            <p style={{
              margin: '1rem 0 0 0',
              color: '#9CA3AF',
              fontSize: '0.9rem'
            }}>
              Include details like frequency, duration, or reasons (bathroom, noise, etc.)
            </p>
          </div>
        );

      case 'sleep-problems':
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '0.75rem'
          }}>
            {sleepProblems.map(problem => (
              <label key={problem} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: formData.sleepProblems.includes(problem)
                  ? '#E3F2FD'
                  : '#F9FAFB',
                border: formData.sleepProblems.includes(problem)
                  ? '1px solid #4682B4'
                  : '1px solid #E5E7EB',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.95rem'
              }}>
                <input
                  type="checkbox"
                  checked={formData.sleepProblems.includes(problem)}
                  onChange={() => handleCheckboxChange(problem, 'sleepProblems')}
                />
                {problem}
              </label>
            ))}
          </div>
        );

      case 'screen-time':
        return (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  Mobile Screen Time (hours)
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={formData.screenTimeMobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, screenTimeMobile: parseFloat(e.target.value) || 0 }))}
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
                {formData.screenTimeMobile > 3 && (
                  <p style={{ color: '#ffc107', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    ⚠️ High screen time may affect sleep quality
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  Computer Screen Time (hours)
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={formData.screenTimeComputer}
                  onChange={(e) => setFormData(prev => ({ ...prev, screenTimeComputer: parseFloat(e.target.value) || 0 }))}
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
                {formData.screenTimeComputer > 8 && (
                  <p style={{ color: '#ffc107', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    ⚠️ Consider blue light filters before bed
                  </p>
                )}
              </div>
            </div>

            {/* Screen Time Tips */}
            <div style={{
              background: 'rgba(40, 167, 69, 0.1)',
              border: '1px solid rgba(40, 167, 69, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ color: '#28a745', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Screen Time & Sleep Tips
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#4B5563', fontSize: '0.9rem' }}>
                <li>Avoid screens 1-2 hours before bed</li>
                <li>Use blue light filters in the evening</li>
                <li>Keep devices outside the bedroom</li>
                <li>Try reading or meditation instead</li>
              </ul>
            </div>
          </div>
        );

      case 'sleep-tracking':
        return (
          <div>
            {/* Future Sleep Tracking Options */}
            <div style={{
              background: 'rgba(23, 162, 184, 0.1)',
              border: '1px solid rgba(23, 162, 184, 0.3)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <h3 style={{ color: '#17a2b8', margin: '0 0 1rem 0', fontSize: '1.3rem' }}>
                Automatic Sleep Tracking
              </h3>
              <p style={{ color: '#4B5563', marginBottom: '1.5rem', fontSize: '1rem' }}>
                Coming soon: Audio-based sleep monitoring with morning review
              </p>
              
              <div style={{
                background: '#F9FAFB',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <h4 style={{ color: '#4682B4', margin: '0 0 0.5rem 0' }}>Planned Features:</h4>
                <ul style={{ textAlign: 'left', color: '#4B5563', fontSize: '0.9rem' }}>
                  <li>Audio event detection (snoring, sleep talking)</li>
                  <li>Sleep stage estimation (REM, Deep, Light)</li>
                  <li>Morning review and edit capabilities</li>
                  <li>Integration with headache correlation data</li>
                </ul>
              </div>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem'
              }}>
                <input
                  type="checkbox"
                  checked={formData.sleepTrackerUsed}
                  onChange={(e) => setFormData(prev => ({ ...prev, sleepTrackerUsed: e.target.checked }))}
                />
                Notify me when automatic sleep tracking is available
              </label>
            </div>

            {/* Current Manual Tracking Benefits */}
            <div style={{
              background: 'rgba(40, 167, 69, 0.1)',
              border: '1px solid rgba(40, 167, 69, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ color: '#28a745', margin: '0 0 1rem 0' }}>
                Why Sleep Tracking Helps with Headaches
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#4B5563', fontSize: '0.9rem' }}>
                <li><strong>Sleep Quality Correlation:</strong> Poor sleep is a major headache trigger</li>
                <li><strong>Pattern Recognition:</strong> Identify your optimal sleep duration</li>
                <li><strong>Early Warning:</strong> Sleep disruptions often precede headaches</li>
                <li><strong>Treatment Timing:</strong> Better sleep = fewer headaches</li>
              </ul>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional details about your sleep (dreams, environment, how you felt, etc.)..."
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
              This information helps identify sleep patterns that may affect your headaches
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
      case 'sleep-times':
        return formData.bedTime && formData.wakeTime;
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
              Record Sleep
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
                minWidth: '120px'
              }}
            >
              {loading ? 'Saving...' : isLastStep ? 'Record Sleep Data' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
