import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordMedication() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    medicationType: '',
    medicationName: '',
    dosage: '',
    dosageUnit: 'mg',
    timeTaken: new Date().toISOString().slice(11, 16),
    takenFor: 'active-headache', // active-headache, prevention, other
    effectiveness: 5,
    sideEffects: [],
    headacheBeforeMedication: 0,
    headacheAfterMedication: 0,
    timeToEffect: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);

  // Check medication warnings when data changes
  useEffect(() => {
    checkMedicationWarnings();
  }, [formData.medicationType, formData.medicationName, formData.takenFor, formData.effectiveness, formData.sideEffects]);

  const medicationCategories = {
    'NSAIDs': [
      'Ibuprofen (Advil, Motrin)',
      'Naproxen (Aleve)',
      'Aspirin',
      'Diclofenac (Voltaren)',
      'Celecoxib (Celebrex)',
      'Indomethacin',
      'Other NSAID'
    ],
    'Acetaminophen': [
      'Acetaminophen (Tylenol)',
      'Acetaminophen combination'
    ],
    'Triptans': [
      'Sumatriptan (Imitrex)',
      'Rizatriptan (Maxalt)',
      'Zolmitriptan (Zomig)',
      'Eletriptan (Relpax)',
      'Almotriptan (Axert)',
      'Naratriptan (Amerge)',
      'Frovatriptan (Frova)',
      'Other Triptan'
    ],
    'Ergot Derivatives': [
      'Ergotamine',
      'Dihydroergotamine (DHE)',
      'Cafergot',
      'Other Ergot'
    ],
    'CGRP Antagonists': [
      'Ubrogepant (Ubrelvy)',
      'Rimegepant (Nurtec ODT)',
      'Zavegepant (Zavzpret)',
      'Other CGRP'
    ],
    'Preventive - Daily': [
      'Topiramate (Topamax)',
      'Propranolol (Inderal)',
      'Metoprolol',
      'Amitriptyline',
      'Nortriptyline',
      'Venlafaxine (Effexor)',
      'Valproate (Depakote)',
      'Gabapentin',
      'Candesartan',
      'Other Preventive'
    ],
    'CGRP Preventive': [
      'Erenumab (Aimovig)',
      'Fremanezumab (Ajovy)',
      'Galcanezumab (Emgality)',
      'Eptinezumab (Vyepti)',
      'Other CGRP Prevention'
    ],
    'Botox/Injections': [
      'Botulinum Toxin (Botox)',
      'Nerve Block',
      'Trigger Point Injection',
      'Other Injection'
    ],
    'Other Medications': [
      'Muscle Relaxant',
      'Anti-nausea',
      'Steroid',
      'Magnesium',
      'Riboflavin (B2)',
      'CoQ10',
      'Feverfew',
      'Butterbur',
      'Other Supplement',
      'Other Prescription'
    ]
  };

  const sideEffectsList = [
    'Nausea',
    'Dizziness',
    'Drowsiness',
    'Fatigue',
    'Stomach upset',
    'Constipation',
    'Dry mouth',
    'Tingling/numbness',
    'Chest tightness',
    'Flushing',
    'Weight gain',
    'Memory issues',
    'Hair loss',
    'Mood changes',
    'Sleep problems',
    'None'
  ];

  const dosageUnits = ['mg', 'g', 'mL', 'units', 'tablets', 'capsules', 'sprays', 'patches'];

  const questions = [
    {
      id: 'medication-type',
      title: 'What type of medication did you take?',
      subtitle: 'Select the category that best fits your medication',
      component: 'medication-type'
    },
    {
      id: 'medication-details',
      title: 'Medication details',
      subtitle: 'Specify the medication, dosage, and timing',
      component: 'medication-details'
    },
    {
      id: 'reason-taken',
      title: 'Why did you take this medication?',
      subtitle: 'Was this for an active headache or prevention?',
      component: 'reason-taken'
    },
    {
      id: 'headache-levels',
      title: 'Rate your headache before and after',
      subtitle: 'Help us track medication effectiveness',
      component: 'headache-levels'
    },
    {
      id: 'effectiveness',
      title: 'How effective was the medication?',
      subtitle: 'Rate the overall effectiveness',
      component: 'effectiveness'
    },
    {
      id: 'side-effects',
      title: 'Did you experience any side effects?',
      subtitle: 'Track any adverse reactions',
      component: 'side-effects'
    },
    {
      id: 'medication-summary',
      title: 'Medication summary and warnings',
      subtitle: 'Review your medication use patterns',
      component: 'medication-summary'
    },
    {
      id: 'notes',
      title: 'Additional medication notes',
      subtitle: 'Any other details about this medication',
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

  const checkMedicationWarnings = () => {
    const newWarnings = [];
    
    // NSAID overuse warning
    if (formData.medicationType === 'NSAIDs' && formData.takenFor === 'active-headache') {
      newWarnings.push('NSAIDs can cause medication overuse headaches if used more than 15 days per month. Track your usage carefully.');
    }
    
    // Triptan overuse warning
    if (formData.medicationType === 'Triptans' && formData.takenFor === 'active-headache') {
      newWarnings.push('Triptans can cause medication overuse headaches if used more than 10 days per month. Monitor frequency of use.');
    }
    
    // Combination medication warning
    if (formData.medicationName.toLowerCase().includes('combination') || 
        formData.medicationName.toLowerCase().includes('caffeine')) {
      newWarnings.push('Combination medications with caffeine may increase risk of medication overuse headaches.');
    }
    
    // High effectiveness with side effects
    if (formData.effectiveness >= 8 && formData.sideEffects.length > 2) {
      newWarnings.push('Consider discussing side effects with your healthcare provider, even if medication is effective.');
    }
    
    setWarnings(newWarnings);
  };

  const getEffectivenessColor = (level) => {
    if (level <= 3) return '#dc3545';
    if (level <= 5) return '#fd7e14';
    if (level <= 7) return '#ffc107';
    return '#28a745';
  };

  const getEffectivenessText = (level) => {
    if (level <= 2) return 'Not Effective';
    if (level <= 4) return 'Slightly Effective';
    if (level <= 6) return 'Moderately Effective';
    if (level <= 8) return 'Very Effective';
    return 'Extremely Effective';
  };

  const getPainLevelColor = (level) => {
    if (level === 0) return '#28a745';
    if (level <= 3) return '#ffc107';
    if (level <= 6) return '#fd7e14';
    return '#dc3545';
  };

  const getPainLevelText = (level) => {
    if (level === 0) return 'No Pain';
    if (level <= 3) return 'Mild';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'Severe';
    return 'Extreme';
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setError('You must be logged in to record medication data');
      return;
    }

    if (!formData.medicationType || !formData.medicationName) {
      setError('Please provide medication type and name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const medicationData = {
        userId: currentUser.uid,
        date: formData.date,
        medicationType: formData.medicationType,
        medicationName: formData.medicationName,
        dosage: formData.dosage,
        dosageUnit: formData.dosageUnit,
        timeTaken: formData.timeTaken,
        takenFor: formData.takenFor,
        effectiveness: parseInt(formData.effectiveness),
        sideEffects: formData.sideEffects,
        headacheBeforeMedication: parseInt(formData.headacheBeforeMedication),
        headacheAfterMedication: parseInt(formData.headacheAfterMedication),
        timeToEffect: formData.timeToEffect,
        notes: formData.notes,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'medications'), medicationData);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording medication:', error);
      setError('Failed to record medication data. Please try again.');
    }

    setLoading(false);
  };

  const renderCurrentQuestion = () => {
    const question = questions[currentStep];

    switch (question.component) {
      case 'medication-type':
        return (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              {Object.keys(medicationCategories).map(category => (
                <button
                  key={category}
                  onClick={() => setFormData(prev => ({ ...prev, medicationType: category, medicationName: '' }))}
                  style={{
                    padding: '1.5rem',
                    background: formData.medicationType === category 
                      ? 'linear-gradient(135deg, #4682B4, #2c5aa0)'
                      : '#FFFFFF',
                    border: formData.medicationType === category 
                      ? 'none'
                      : '1px solid #E5E7EB',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '1rem',
                    fontWeight: formData.medicationType === category ? '600' : '500',
                    color: formData.medicationType === category ? 'white' : '#000000',
                    textAlign: 'left',
                    boxShadow: formData.medicationType === category 
                      ? '0 4px 12px rgba(70, 130, 180, 0.3)'
                      : '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {category}
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                    {medicationCategories[category].length} medications
                  </div>
                </button>
              ))}
            </div>

            {/* Medication category info */}
            <div style={{
              background: 'rgba(70, 130, 180, 0.1)',
              border: '1px solid rgba(70, 130, 180, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginTop: '2rem'
            }}>
              <h4 style={{ color: '#4682B4', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
                Medication Categories
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <h5 style={{ color: '#dc3545', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Acute Treatment:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>NSAIDs (Ibuprofen, Naproxen)</li>
                    <li>Triptans (Sumatriptan, Rizatriptan)</li>
                    <li>CGRP Antagonists (Ubrelvy, Nurtec)</li>
                  </ul>
                </div>
                <div>
                  <h5 style={{ color: '#28a745', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Prevention:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Daily preventives (Topiramate, Propranolol)</li>
                    <li>CGRP preventives (Aimovig, Ajovy)</li>
                    <li>Botox injections</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'medication-details':
        return (
          <div>
            {formData.medicationType && (
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  Which {formData.medicationType} medication?
                </label>
                <select
                  value={formData.medicationName}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicationName: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    background: '#FFFFFF',
                    color: '#000000',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Select medication...</option>
                  {medicationCategories[formData.medicationType]?.map(med => (
                    <option key={med} value={med}>{med}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  Dosage Amount
                </label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                  placeholder="e.g., 200, 25, 1"
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

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  Unit
                </label>
                <select
                  value={formData.dosageUnit}
                  onChange={(e) => setFormData(prev => ({ ...prev, dosageUnit: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    background: '#FFFFFF',
                    color: '#000000',
                    fontSize: '1rem'
                  }}
                >
                  {dosageUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '1rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#4682B4'
              }}>
                Time Taken
              </label>
              <input
                type="time"
                value={formData.timeTaken}
                onChange={(e) => setFormData(prev => ({ ...prev, timeTaken: e.target.value }))}
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
            </div>
          </div>
        );

      case 'reason-taken':
        const reasonOptions = [
          {
            value: 'active-headache',
            title: 'Active Headache Treatment',
            description: 'To treat a headache that was already present',
            icon: 'fas fa-head-side-virus',
            color: '#dc3545'
          },
          {
            value: 'prevention',
            title: 'Prevention/Prophylaxis',
            description: 'Daily medication to prevent headaches',
            icon: 'fas fa-shield-alt',
            color: '#28a745'
          },
          {
            value: 'other',
            title: 'Other Reason',
            description: 'For a different medical condition',
            icon: 'fas fa-pills',
            color: '#4682B4'
          }
        ];

        return (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem'
            }}>
              {reasonOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setFormData(prev => ({ ...prev, takenFor: option.value }))}
                  style={{
                    padding: '2rem',
                    background: formData.takenFor === option.value 
                      ? `rgba(${option.color === '#dc3545' ? '220, 53, 69' : 
                                   option.color === '#28a745' ? '40, 167, 69' : '70, 130, 180'}, 0.1)`
                      : '#FFFFFF',
                    border: formData.takenFor === option.value 
                      ? `2px solid ${option.color}`
                      : '1px solid #E5E7EB',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '1rem', color: option.color }}>
                    <i className={option.icon}></i>
                  </div>
                  <h4 style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '1.1rem', 
                    fontWeight: '600',
                    color: formData.takenFor === option.value ? option.color : '#000000'
                  }}>
                    {option.title}
                  </h4>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.9rem', 
                    color: '#4B5563',
                    lineHeight: '1.4'
                  }}>
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'headache-levels':
        return (
          <div>
            {formData.takenFor === 'active-headache' && (
              <>
                <div style={{ marginBottom: '3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      color: '#4682B4'
                    }}>
                      Headache BEFORE Medication
                    </h3>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: getPainLevelColor(formData.headacheBeforeMedication)
                    }}>
                      {formData.headacheBeforeMedication}/10
                    </div>
                  </div>
                  <div style={{
                    fontSize: '1.1rem',
                    marginBottom: '1rem',
                    color: getPainLevelColor(formData.headacheBeforeMedication),
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    {getPainLevelText(formData.headacheBeforeMedication)}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.headacheBeforeMedication}
                    onChange={(e) => setFormData(prev => ({ ...prev, headacheBeforeMedication: parseInt(e.target.value) }))}
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

                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      color: '#4682B4'
                    }}>
                      Headache AFTER Medication
                    </h3>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: getPainLevelColor(formData.headacheAfterMedication)
                    }}>
                      {formData.headacheAfterMedication}/10
                    </div>
                  </div>
                  <div style={{
                    fontSize: '1.1rem',
                    marginBottom: '1rem',
                    color: getPainLevelColor(formData.headacheAfterMedication),
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    {getPainLevelText(formData.headacheAfterMedication)}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.headacheAfterMedication}
                    onChange={(e) => setFormData(prev => ({ ...prev, headacheAfterMedication: parseInt(e.target.value) }))}
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

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '1rem',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#4682B4'
                  }}>
                    How long until you felt the effect?
                  </label>
                  <input
                    type="text"
                    value={formData.timeToEffect}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeToEffect: e.target.value }))}
                    placeholder="e.g., 30 minutes, 1 hour, 2 hours"
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

                {/* Pain improvement indicator */}
                {formData.headacheBeforeMedication > 0 && (
                  <div style={{
                    background: formData.headacheBeforeMedication > formData.headacheAfterMedication 
                      ? 'rgba(40, 167, 69, 0.1)' 
                      : 'rgba(255, 193, 7, 0.1)',
                    border: `1px solid ${formData.headacheBeforeMedication > formData.headacheAfterMedication 
                      ? 'rgba(40, 167, 69, 0.3)' 
                      : 'rgba(255, 193, 7, 0.3)'}`,
                    borderRadius: '12px',
                    padding: '1rem',
                    marginTop: '2rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                      {formData.headacheBeforeMedication > formData.headacheAfterMedication ? (
                        <i className="fas fa-arrow-down" style={{ color: '#28a745' }}></i>
                      ) : formData.headacheBeforeMedication === formData.headacheAfterMedication ? (
                        <i className="fas fa-equals" style={{ color: '#ffc107' }}></i>
                      ) : (
                        <i className="fas fa-arrow-up" style={{ color: '#dc3545' }}></i>
                      )}
                    </div>
                    <div style={{ fontWeight: '600', color: '#4B5563' }}>
                      Pain reduction: {formData.headacheBeforeMedication - formData.headacheAfterMedication} points
                    </div>
                  </div>
                )}
              </>
            )}

            {formData.takenFor !== 'active-headache' && (
              <div style={{
                background: 'rgba(70, 130, 180, 0.1)',
                border: '1px solid rgba(70, 130, 180, 0.3)',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#4682B4' }}>
                  <i className="fas fa-shield-alt"></i>
                </div>
                <h3 style={{ color: '#4682B4', margin: '0 0 1rem 0' }}>
                  Prevention Medication
                </h3>
                <p style={{ margin: 0, color: '#4B5563' }}>
                  Since this was taken for prevention, we'll skip the before/after headache ratings.
                </p>
