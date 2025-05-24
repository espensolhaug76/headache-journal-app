import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordExercise() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    exercises: '',
    duration: 30,
    type: '',
    intensity: 'moderate',
    heartRate: '',
    activities: '',
    environment: '',
    hydration: 'adequate',
    preExerciseFood: '',
    postExerciseSymptoms: [],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);

  const exerciseTypes = [
    'Walking',
    'Running', 
    'Cycling',
    'Swimming',
    'Yoga',
    'Pilates',
    'Strength training',
    'HIIT',
    'Cardio machines',
    'Dancing',
    'Hiking',
    'Tennis',
    'Basketball',
    'Soccer',
    'Weightlifting',
    'CrossFit',
    'Rock climbing',
    'Martial arts',
    'Other'
  ];

  const intensityLevels = [
    { 
      value: 'light', 
      label: 'Light',
      description: 'Can sing while exercising',
      color: '#28a745'
    },
    { 
      value: 'moderate', 
      label: 'Moderate',
      description: 'Can talk but not sing',
      color: '#ffc107'
    },
    { 
      value: 'vigorous', 
      label: 'Vigorous',
      description: 'Difficult to talk',
      color: '#fd7e14'
    },
    { 
      value: 'high', 
      label: 'High Intensity',
      description: 'Cannot maintain conversation',
      color: '#dc3545'
    }
  ];

  const environmentOptions = [
    'Indoor gym',
    'Home workout',
    'Outdoor park',
    'Beach/waterfront',
    'Mountain/hiking trail',
    'Swimming pool',
    'Sports facility',
    'Urban streets',
    'Other'
  ];

  const postExerciseSymptoms = [
    'Headache',
    'Dizziness',
    'Nausea',
    'Excessive fatigue',
    'Muscle tension',
    'Neck stiffness',
    'Eye strain',
    'Dehydration symptoms',
    'Rapid heartbeat (prolonged)',
    'Difficulty breathing',
    'Joint pain',
    'None - felt great!'
  ];

  // High-impact exercises that may trigger headaches
  const highImpactExercises = ['running', 'hiit', 'crossfit', 'basketball', 'soccer', 'weightlifting', 'boxing', 'jumping'];

  const questions = [
    {
      id: 'exercise-type',
      title: 'What type of exercise did you do?',
      subtitle: 'Select your primary activity today',
      component: 'exercise-type'
    },
    {
      id: 'duration-intensity',
      title: 'How long and intense was your workout?',
      subtitle: 'Duration and intensity level',
      component: 'duration-intensity'
    },
    {
      id: 'exercise-details',
      title: 'Tell us about your workout',
      subtitle: 'Describe what you did in detail',
      component: 'exercise-details'
    },
    {
      id: 'environment-conditions',
      title: 'Where and how did you exercise?',
      subtitle: 'Environment and conditions',
      component: 'environment-conditions'
    },
    {
      id: 'pre-exercise',
      title: 'How did you prepare for exercise?',
      subtitle: 'Food, hydration, and preparation',
      component: 'pre-exercise'
    },
    {
      id: 'post-exercise',
      title: 'How did you feel after exercising?',
      subtitle: 'Any symptoms or effects afterward',
      component: 'post-exercise'
    },
    {
      id: 'exercise-summary',
      title: 'Exercise and headache insights',
      subtitle: 'Personalized recommendations for your workout',
      component: 'exercise-summary'
    },
    {
      id: 'notes',
      title: 'Additional exercise notes',
      subtitle: 'Any other details about your workout',
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

  const checkHighImpactExercise = (exerciseType) => {
    const isHighImpact = highImpactExercises.some(exercise => 
      exerciseType.toLowerCase().includes(exercise)
    );
    
    if (isHighImpact) {
      setWarnings(prev => {
        const filtered = prev.filter(w => !w.includes('high-impact'));
        return [...filtered, 'This is a high-impact exercise that may trigger headaches in some people. Monitor for headaches in the next 4-24 hours.'];
      });
    } else {
      setWarnings(prev => prev.filter(w => !w.includes('high-impact')));
    }
  };

  const getDurationColor = (duration) => {
    if (duration < 15) return '#dc3545';
    if (duration < 30) return '#fd7e14';
    if (duration < 60) return '#28a745';
    if (duration < 120) return '#20c997';
    return '#ffc107';
  };

  const getDurationText = (duration) => {
    if (duration < 15) return 'Short';
    if (duration < 30) return 'Brief';
    if (duration < 60) return 'Good';
    if (duration < 120) return 'Long';
    return 'Very Long';
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setError('You must be logged in to record exercise data');
      return;
    }

    if (!formData.type || !formData.exercises) {
      setError('Please provide exercise type and description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const exerciseData = {
        userId: currentUser.uid,
        date: formData.date,
        exercises: formData.exercises,
        duration: formData.duration,
        type: formData.type,
        intensity: formData.intensity,
        heartRate: formData.heartRate,
        activities: formData.activities,
        environment: formData.environment,
        hydration: formData.hydration,
        preExerciseFood: formData.preExerciseFood,
        postExerciseSymptoms: formData.postExerciseSymptoms,
        notes: formData.notes,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'exercise'), exerciseData);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording exercise:', error);
      setError('Failed to record exercise data. Please try again.');
    }

    setLoading(false);
  };

  const renderCurrentQuestion = () => {
    const question = questions[currentStep];

    switch (question.component) {
      case 'exercise-type':
        return (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {exerciseTypes.map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, type }));
                    checkHighImpactExercise(type);
                  }}
                  style={{
                    padding: '1rem',
                    background: formData.type === type 
                      ? 'linear-gradient(135deg, #28a745, #20c997)'
                      : '#FFFFFF',
                    border: formData.type === type 
                      ? 'none'
                      : '1px solid #E5E7EB',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '0.95rem',
                    fontWeight: formData.type === type ? '600' : '400',
                    color: formData.type === type ? 'white' : '#000000',
                    textAlign: 'center'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* High impact warning */}
            {warnings.length > 0 && (
              <div style={{
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ color: '#856404', margin: '0 0 0.5rem 0' }}>
                  Exercise & Headache Alert
                </h4>
                {warnings.map((warning, idx) => (
                  <p key={idx} style={{ margin: '0.25rem 0', color: '#856404', fontSize: '0.9rem' }}>
                    {warning}
                  </p>
                ))}
              </div>
            )}

            {/* Exercise selection tips */}
            <div style={{
              background: 'rgba(23, 162, 184, 0.1)',
              border: '1px solid rgba(23, 162, 184, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ color: '#17a2b8', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Exercise & Headache Prevention
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <h5 style={{ color: '#20c997', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Low Risk:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Walking, swimming, yoga</li>
                    <li>Steady-state cardio</li>
                    <li>Light strength training</li>
                    <li>Stretching and flexibility</li>
                  </ul>
                </div>
                <div>
                  <h5 style={{ color: '#ffc107', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Higher Risk:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>High-intensity interval training</li>
                    <li>Heavy weightlifting</li>
                    <li>Contact sports</li>
                    <li>Explosive movements</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'duration-intensity':
        const selectedIntensity = intensityLevels.find(level => level.value === formData.intensity);
        
        return (
          <div>
            <div style={{ marginBottom: '3rem' }}>
              <h3 style={{
                margin: '0 0 2rem 0',
                fontSize: '1.3rem',
                fontWeight: '600',
                color: '#4682B4',
                textAlign: 'center'
              }}>
                Duration: {formData.duration} minutes
              </h3>
              <div style={{
                fontSize: '2rem',
                textAlign: 'center',
                marginBottom: '1rem',
                color: getDurationColor(formData.duration),
                fontWeight: 'bold'
              }}>
                {getDurationText(formData.duration)}
              </div>
              <input
                type="range"
                min="5"
                max="180"
                step="5"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                style={{
                  width: '100%',
                  height: '12px',
                  borderRadius: '6px',
                  background: `linear-gradient(to right, #dc3545 0%, #28a745 33%, #20c997 66%, #ffc107 100%)`,
                  outline: 'none',
                  cursor: 'pointer',
                  marginBottom: '1rem'
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: '#9CA3AF'
              }}>
                <span>5 min</span>
                <span>3 hours</span>
              </div>
              {formData.duration < 30 && (
                <p style={{ textAlign: 'center', color: '#856404', fontSize: '0.9rem', marginTop: '1rem' }}>
                  Tip: Aim for at least 30 minutes of exercise for optimal health benefits
                </p>
              )}
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <h3 style={{
                margin: '0 0 2rem 0',
                fontSize: '1.3rem',
                fontWeight: '600',
                color: '#4682B4',
                textAlign: 'center'
              }}>
                Exercise Intensity
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {intensityLevels.map(level => (
                  <label key={level.value} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1.5rem',
                    background: formData.intensity === level.value
                      ? `rgba(${level.color === '#28a745' ? '40, 167, 69' : 
                                   level.color === '#ffc107' ? '255, 193, 7' :
                                   level.color === '#fd7e14' ? '253, 126, 20' : '220, 53, 69'}, 0.1)`
                      : '#F9FAFB',
                    border: formData.intensity === level.value
                      ? `1px solid ${level.color}`
                      : '1px solid #E5E7EB',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}>
                    <input
                      type="radio"
                      name="intensity"
                      value={level.value}
                      checked={formData.intensity === level.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, intensity: e.target.value }))}
                      style={{ marginBottom: '0.5rem' }}
                    />
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: formData.intensity === level.value ? level.color : '#000000'
                    }}>
                      {level.label}
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#4B5563',
                      fontStyle: 'italic'
                    }}>
                      {level.description}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Heart rate input */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '1rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#4682B4'
              }}>
                Peak Heart Rate (optional)
              </label>
              <input
                type="number"
                min="60"
                max="220"
                value={formData.heartRate}
                onChange={(e) => setFormData(prev => ({ ...prev, heartRate: e.target.value }))}
                placeholder="e.g., 150 bpm"
                style={{
                  width: '100%',
                  maxWidth: '200px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  background: '#FFFFFF',
                  color: '#000000',
                  fontSize: '1rem'
                }}
              />
              <p style={{
                margin: '0.5rem 0 0 0',
                color: '#9CA3AF',
                fontSize: '0.9rem'
              }}>
                If you wore a fitness tracker or monitored your heart rate
              </p>
            </div>
          </div>
        );

      case 'exercise-details':
        return (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '1rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#4682B4'
              }}>
                Describe your workout in detail
              </label>
              <textarea
                value={formData.exercises}
                onChange={(e) => setFormData(prev => ({ ...prev, exercises: e.target.value }))}
                placeholder="Describe what exercises you did, sets, reps, weights, distances, routes, etc..."
                rows="5"
                required
                style={{
                  width: '100%',
                  padding: '12px',
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
                margin: '0.5rem 0 0 0',
                color: '#9CA3AF',
                fontSize: '0.9rem'
              }}>
                Be specific about exercises, duration, intensity, and any equipment used
              </p>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '1rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#4682B4'
              }}>
                Other physical activities today
              </label>
              <textarea
                value={formData.activities}
                onChange={(e) => setFormData(prev => ({ ...prev, activities: e.target.value }))}
                placeholder="Other activities like walking to work, carrying groceries, playing with kids, yard work, etc..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '12px',
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
                margin: '0.5rem 0 0 0',
                color: '#9CA3AF',
                fontSize: '0.9rem'
              }}>
                Include daily activities that might contribute to physical exertion
              </p>
            </div>
          </div>
        );

      case 'environment-conditions':
        return (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '1rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#4682B4'
              }}>
                Where did you exercise?
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem'
              }}>
                {environmentOptions.map(env => (
                  <label key={env} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    background: formData.environment === env 
                      ? 'rgba(70, 130, 180, 0.1)'
                      : '#F9FAFB',
                    border: formData.environment === env 
                      ? '1px solid #4682B4'
                      : '1px solid #E5E7EB',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '0.95rem',
                    color: '#000000'
                  }}>
                    <input
                      type="radio"
                      name="environment"
                      value={env}
                      checked={formData.environment === env}
                      onChange={(e) => setFormData(prev => ({ ...prev, environment: e.target.value }))}
                    />
                    {env}
                  </label>
                ))}
              </div>
            </div>

            {/* Environment-specific tips */}
            <div style={{
              background: 'rgba(40, 167, 69, 0.1)',
              border: '1px solid rgba(40, 167, 69, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ color: '#28a745', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Environment & Headache Prevention
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <h5 style={{ color: '#20c997', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Outdoor Exercise:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Protect from bright sunlight</li>
                    <li>Stay hydrated in heat</li>
                    <li>Watch for temperature extremes</li>
                    <li>Be aware of air quality</li>
                  </ul>
                </div>
                <div>
                  <h5 style={{ color: '#17a2b8', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Indoor Exercise:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Ensure good ventilation</li>
                    <li>Avoid fluorescent lighting</li>
                    <li>Maintain comfortable temperature</li>
                    <li>Use proper lighting</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pre-exercise':
        return (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '1rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#4682B4'
              }}>
                Hydration before exercise
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                {[
                  { value: 'poor', label: 'Poor', color: '#dc3545' },
                  { value: 'fair', label: 'Fair', color: '#ffc107' },
                  { value: 'adequate', label: 'Adequate', color: '#28a745' },
                  { value: 'excellent', label: 'Excellent', color: '#20c997' }
                ].map(option => (
                  <label key={option.value} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    background: formData.hydration === option.value 
                      ? `rgba(${option.color === '#dc3545' ? '220, 53, 69' :
                                  option.color === '#ffc107' ? '255, 193, 7' :
                                  option.color === '#28a745' ? '40, 167, 69' : '32, 201, 151'}, 0.1)`
                      : '#F9FAFB',
                    border: formData.hydration === option.value 
                      ? `1px solid ${option.color}`
                      : '1px solid #E5E7EB',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '0.95rem',
                    color: '#000000'
                  }}>
                    <input
                      type="radio"
                      name="hydration"
                      value={option.value}
                      checked={formData.hydration === option.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, hydration: e.target.value }))}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '1rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#4682B4'
              }}>
                What did you eat before exercising?
              </label>
              <input
                type="text"
                value={formData.preExerciseFood}
                onChange={(e) => setFormData(prev => ({ ...prev, preExerciseFood: e.target.value }))}
                placeholder="e.g., banana 30 minutes before, light breakfast 2 hours ago, nothing..."
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
                margin: '0.5rem 0 0 0',
                color: '#9CA3AF',
                fontSize: '0.9rem'
              }}>
                Include timing and type of food/drink consumed before exercise
              </p>
            </div>

            {/* Pre-exercise tips */}
            <div style={{
              background: 'rgba(23, 162, 184, 0.1)',
              border: '1px solid rgba(23, 162, 184, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ color: '#17a2b8', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Pre-Exercise Headache Prevention
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#4B5563', fontSize: '0.9rem' }}>
                <li><strong>Hydration:</strong> Drink water 2-3 hours before exercise</li>
                <li><strong>Nutrition:</strong> Light snack 30-60 minutes before if needed</li>
                <li><strong>Warm-up:</strong> Gradually increase intensity to prevent sudden strain</li>
                <li><strong>Environment:</strong> Check temperature and lighting conditions</li>
                <li><strong>Rest:</strong> Ensure adequate sleep the night before</li>
              </ul>
            </div>
          </div>
        );

      case 'post-exercise':
        return (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '1rem', 
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#4682B4'
              }}>
                How did you feel after exercising?
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem'
              }}>
                {postExerciseSymptoms.map(symptom => {
                  const isPositive = symptom === 'None - felt great!';
                  return (
                    <label key={symptom} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '1rem',
                      background: formData.postExerciseSymptoms.includes(symptom)
                        ? isPositive 
                          ? 'rgba(40, 167, 69, 0.1)'
                          : 'rgba(255, 193, 7, 0.1)'
                        : '#F9FAFB',
                      border: formData.postExerciseSymptoms.includes(symptom)
                        ? isPositive 
                          ? '1px solid #28a745'
                          : '1px solid #ffc107'
                        : '1px solid #E5E7EB',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '0.95rem',
                      color: '#000000'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.postExerciseSymptoms.includes(symptom)}
                        onChange={() => handleCheckboxChange(symptom, 'postExerciseSymptoms')}
                      />
                      {symptom}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Post-exercise warnings */}
            {formData.postExerciseSymptoms.filter(s => ['Headache', 'Dizziness', 'Nausea'].includes(s)).length > 0 && (
              <div style={{
                background: 'rgba(220, 53, 69, 0.1)',
                border: '1px solid rgba(220, 53, 69, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ color: '#dc3545', margin: '0 0 1rem 0' }}>
                  Exercise-Related Symptoms Detected
                </h4>
                <p style={{ margin: '0 0 1rem 0', color: '#721c24', fontSize: '0.9rem' }}>
                  You reported symptoms that may be related to exercise-induced headaches. Consider these strategies:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#721c24', fontSize: '0.85rem' }}>
                  <li>Increase hydration before, during, and after exercise</li>
                  <li>Extend warm-up and cool-down periods</li>
                  <li>Reduce exercise intensity temporarily</li>
                  <li>Check if symptoms persist with different activities</li>
                  <li>Consider consulting a healthcare provider if symptoms are severe</li>
                </ul>
              </div>
            )}

            {/* Recovery tips */}
            <div style={{
              background: 'rgba(40, 167, 69, 0.1)',
              border: '1px solid rgba(40, 167, 69, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ color: '#28a745', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Post-Exercise Recovery
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <h5 style={{ color: '#20c997', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Immediate (0-30 min):</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Cool down gradually</li>
                    <li>Rehydrate with water</li>
                    <li>Light stretching</li>
                    <li>Monitor how you feel</li>
                  </ul>
                </div>
                <div>
                  <h5 style={{ color: '#17a2b8', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Later (30+ min):</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Refuel with balanced nutrition</li>
                    <li>Continue hydrating</li>
                    <li>Rest and recover</li>
                    <li>Track any delayed symptoms</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'exercise-summary':
        const hasHighImpact = highImpactExercises.some(exercise => 
          formData.type.toLowerCase().includes(exercise)
        );
        const hasSymptoms = formData.postExerciseSymptoms.filter(s => 
          ['Headache', 'Dizziness', 'Nausea', 'Excessive fatigue'].includes(s)
        ).length > 0;
        const longDuration = formData.duration > 90;
        const highIntensity = ['vigorous', 'high'].includes(formData.intensity);
        
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
                Your Exercise Summary
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', color: getDurationColor(formData.duration), fontWeight: 'bold' }}>
                    {formData.duration}
                  </div>
                  <div style={{ fontSize: '1rem', color: '#4B5563', marginBottom: '0.5rem' }}>minutes</div>
                  <div style={{ fontSize: '1.1rem', color: getDurationColor(formData.duration), fontWeight: '600' }}>
                    {getDurationText(formData.duration)}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', color: intensityLevels.find(l => l.value === formData.intensity)?.color, fontWeight: 'bold' }}>
                    {formData.intensity.charAt(0).toUpperCase() + formData.intensity.slice(1)}
                  </div>
                  <div style={{ fontSize: '1rem', color: '#4B5563', marginBottom: '0.5rem' }}>intensity</div>
                  <div style={{ fontSize: '1.1rem', color: intensityLevels.find(l => l.value === formData.intensity)?.color, fontWeight: '600' }}>
                    {formData.type}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', color: hasSymptoms ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                    {hasSymptoms ? '⚠️' : '✅'}
                  </div>
                  <div style={{ fontSize: '1rem', color: '#4B5563', marginBottom: '0.5rem' }}>recovery</div>
                  <div style={{ fontSize: '1.1rem', color: hasSymptoms ? '#dc3545' : '#28a745', fontWeight: '600' }}>
                    {hasSymptoms ? 'Monitor' : 'Good'}
                  </div>
                </div>
              </div>
            </div>

            {/* Personalized recommendations */}
            <div style={{
              background: 'rgba(23, 162, 184, 0.1)',
              border: '1px solid rgba(23, 162, 184, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ color: '#17a2b8', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Personalized Exercise Recommendations
              </h4>
              <div style={{ fontSize: '0.9rem', color: '#4B5563' }}>
                {hasSymptoms && (
                  <p style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'rgba(220, 53, 69, 0.1)', borderRadius: '6px' }}>
                    ⚠️ <strong>Monitor symptoms:</strong> You experienced some concerning symptoms. Consider reducing intensity or duration next time.
                  </p>
                )}
                {hasHighImpact && !hasSymptoms && (
                  <p style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '6px' }}>
                    🏃 <strong>High-impact exercise:</strong> Monitor for delayed headaches over the next 24 hours.
                  </p>
                )}
                {longDuration && highIntensity && (
                  <p style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '6px' }}>
                    💪 <strong>Intense workout:</strong> Ensure adequate recovery with rest, hydration, and nutrition.
                  </p>
                )}
                {formData.hydration === 'poor' && (
                  <p style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'rgba(220, 53, 69, 0.1)', borderRadius: '6px' }}>
                    🚰 <strong>Improve hydration:</strong> Poor hydration before exercise increases headache risk.
                  </p>
                )}
                {!hasSymptoms && formData.hydration !== 'poor' && formData.duration >= 30 && (
                  <p style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'rgba(40, 167, 69, 0.1)', borderRadius: '6px' }}>
                    ✅ <strong>Great workout:</strong> Good duration, proper preparation, and no concerning symptoms!
                  </p>
                )}
                <p style={{ margin: '1rem 0 0 0', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  Continue tracking to identify which exercises work best for you and which may trigger headaches
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
              placeholder="Any additional notes about your exercise session - how you felt, what worked well, what you might change next time, equipment used, etc..."
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
              This information helps identify exercise patterns that may contribute to or prevent your headaches
            </p>

            {/* Final exercise tips */}
            <div style={{
              background: 'rgba(40, 167, 69, 0.1)',
              border: '1px solid rgba(40, 167, 69, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginTop: '2rem'
            }}>
              <h4 style={{ color: '#28a745', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Exercise & Headache Prevention Summary
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <h5 style={{ color: '#20c997', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Best Practices:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Stay consistently hydrated</li>
                    <li>Warm up and cool down properly</li>
                    <li>Exercise regularly but moderately</li>
                    <li>Listen to your body's signals</li>
                  </ul>
                </div>
                <div>
                  <h5 style={{ color: '#17a2b8', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Monitor For:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Headaches during or after exercise</li>
                    <li>Exercise in extreme temperatures</li>
                    <li>High-intensity without proper buildup</li>
                    <li>Changes in usual exercise patterns</li>
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
  const canProceed = () => {
    switch (currentQuestion.component) {
      case 'exercise-type':
        return formData.type !== '';
      case 'exercise-details':
        return formData.exercises.trim() !== '';
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
              Record Exercise & Activities
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

        {/* Warnings Display - No Card */}
        {warnings.length > 0 && (
          <div style={{
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h4 style={{ color: '#856404', margin: '0 0 1rem 0' }}>
              Exercise & Headache Alert
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#856404', fontSize: '0.9rem' }}>
              {warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

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
                background: !canProceed() || loading ? '#E5E7EB' : '#4682B4',
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
              {loading ? 'Saving...' : isLastStep ? 'Record Exercise Data' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
