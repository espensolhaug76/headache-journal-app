import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordNutrition() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    // Meals
    breakfast: { time: '', foods: '', isUltraProcessed: false },
    lunch: { time: '', foods: '', isUltraProcessed: false },
    dinner: { time: '', foods: '', isUltraProcessed: false },
    additionalMeals: '',
    supplements: '',
    // Drinks
    coffee: 0,
    tea: 0,
    water: 8, // Default to 8 glasses
    alcohol: 0,
    sugaryDrinks: false,
    dietSodas: 0,
    // Trigger foods
    triggerFoods: [],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);

  const commonTriggerFoods = [
    'Aged cheese',
    'Chocolate', 
    'Processed meats',
    'Citrus fruits',
    'Avocados',
    'Bananas',
    'MSG foods',
    'Artificial sweeteners',
    'Fermented foods',
    'Nuts',
    'Alcohol',
    'Caffeine',
    'Red wine',
    'Onions',
    'Tomatoes',
    'Nitrates/Nitrites'
  ];

  const questions = [
    {
      id: 'breakfast',
      title: 'What did you have for breakfast?',
      subtitle: 'Your first meal of the day',
      component: 'meal',
      meal: 'breakfast'
    },
    {
      id: 'lunch', 
      title: 'What did you have for lunch?',
      subtitle: 'Your midday meal',
      component: 'meal',
      meal: 'lunch'
    },
    {
      id: 'dinner',
      title: 'What did you have for dinner?',
      subtitle: 'Your evening meal',
      component: 'meal',
      meal: 'dinner'
    },
    {
      id: 'snacks-supplements',
      title: 'Any snacks or supplements?',
      subtitle: 'Additional food and supplements throughout the day',
      component: 'snacks-supplements'
    },
    {
      id: 'beverages',
      title: 'What did you drink today?',
      subtitle: 'Track your fluid intake and caffeine',
      component: 'beverages'
    },
    {
      id: 'trigger-foods',
      title: 'Did you eat any known trigger foods?',
      subtitle: 'Foods commonly associated with headaches',
      component: 'trigger-foods'
    },
    {
      id: 'hydration-summary',
      title: 'Hydration and nutrition summary',
      subtitle: 'Review your intake and get personalized tips',
      component: 'hydration-summary'
    },
    {
      id: 'notes',
      title: 'Additional nutrition notes',
      subtitle: 'Any other details about your eating today',
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

  const handleMealChange = (meal, field, value) => {
    const updatedMeal = { ...formData[meal], [field]: value };
    
    if (field === 'foods') {
      // Check for trigger foods
      const triggers = checkTriggerFoods(value, meal);
      if (triggers.length > 0) {
        setWarnings(prev => {
          const filtered = prev.filter(w => !w.includes(`${meal}:`));
          return [...filtered, `${meal}: Contains potential triggers: ${triggers.join(', ')}`];
        });
      } else {
        setWarnings(prev => prev.filter(w => !w.includes(`${meal}:`)));
      }
      
      // Auto-detect ultra-processed foods
      const ultraProcessedTerms = ['instant', 'microwave', 'frozen dinner', 'chips', 'soda', 'candy', 'processed', 'packaged'];
      const isUltraProcessed = ultraProcessedTerms.some(term => 
        value.toLowerCase().includes(term)
      );
      updatedMeal.isUltraProcessed = isUltraProcessed;
    }
    
    setFormData(prev => ({ ...prev, [meal]: updatedMeal }));
  };

  // Check for trigger foods in meal descriptions
  const checkTriggerFoods = (foodDescription, mealName) => {
    const lowerFoods = foodDescription.toLowerCase();
    const foundTriggers = [];
    
    const triggerTerms = {
      'aged cheese': ['aged cheese', 'blue cheese', 'cheddar', 'parmesan', 'swiss cheese'],
      'chocolate': ['chocolate', 'cocoa', 'nutella'],
      'processed meats': ['salami', 'pepperoni', 'hot dog', 'bacon', 'ham', 'sausage', 'deli meat'],
      'citrus fruits': ['orange', 'lemon', 'lime', 'grapefruit', 'citrus'],
      'msg foods': ['msg', 'chinese food', 'instant noodles', 'ramen', 'bouillon'],
      'artificial sweeteners': ['aspartame', 'diet', 'zero sugar', 'sugar free'],
      'fermented foods': ['sauerkraut', 'kimchi', 'fermented', 'pickled'],
      'caffeine': ['coffee', 'energy drink', 'cola', 'espresso'],
      'red wine': ['red wine', 'wine'],
      'nuts': ['peanuts', 'almonds', 'walnuts', 'cashews', 'nuts']
    };
    
    for (const [trigger, terms] of Object.entries(triggerTerms)) {
      for (const term of terms) {
        if (lowerFoods.includes(term)) {
          foundTriggers.push(trigger);
          break;
        }
      }
    }
    
    return foundTriggers;
  };

  const getHydrationLevel = () => {
    if (formData.water >= 8) return { level: 'Excellent', color: '#28a745' };
    if (formData.water >= 6) return { level: 'Good', color: '#20c997' };
    if (formData.water >= 4) return { level: 'Fair', color: '#ffc107' };
    return { level: 'Poor', color: '#dc3545' };
  };

  const getCaffeineTotal = () => {
    return (formData.coffee * 95) + (formData.tea * 25); // Approximate mg of caffeine
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setError('You must be logged in to record nutrition data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const nutritionData = {
        userId: currentUser.uid,
        date: formData.date,
        meals: {
          breakfast: formData.breakfast,
          lunch: formData.lunch,
          dinner: formData.dinner,
          additional: formData.additionalMeals
        },
        drinks: {
          coffee: formData.coffee,
          tea: formData.tea,
          water: formData.water,
          alcohol: formData.alcohol,
          sugaryDrinks: formData.sugaryDrinks,
          dietSodas: formData.dietSodas
        },
        supplements: formData.supplements,
        triggerFoods: formData.triggerFoods,
        notes: formData.notes,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'nutrition'), nutritionData);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error recording nutrition:', error);
      setError('Failed to record nutrition data. Please try again.');
    }

    setLoading(false);
  };

  const renderCurrentQuestion = () => {
    const question = questions[currentStep];

    switch (question.component) {
      case 'meal':
        const mealData = formData[question.meal];
        const mealName = question.meal.charAt(0).toUpperCase() + question.meal.slice(1);
        
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
                What time did you eat {question.meal}?
              </label>
              <input
                type="time"
                value={mealData.time}
                onChange={(e) => handleMealChange(question.meal, 'time', e.target.value)}
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

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '1rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#4682B4'
              }}>
                What did you eat for {question.meal}?
              </label>
              <textarea
                value={mealData.foods}
                onChange={(e) => handleMealChange(question.meal, 'foods', e.target.value)}
                placeholder={`Describe your ${question.meal} in detail...`}
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
                  fontFamily: 'inherit'
                }}
              />
              <p style={{
                margin: '0.5rem 0 0 0',
                color: '#9CA3AF',
                fontSize: '0.9rem'
              }}>
                Be specific about ingredients, preparation method, and portions
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: mealData.isUltraProcessed ? 'rgba(255, 193, 7, 0.1)' : '#F9FAFB',
                border: mealData.isUltraProcessed ? '1px solid #ffc107' : '1px solid #E5E7EB',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}>
                <input
                  type="checkbox"
                  checked={mealData.isUltraProcessed}
                  onChange={(e) => handleMealChange(question.meal, 'isUltraProcessed', e.target.checked)}
                />
                This meal contained ultra-processed foods (packaged, instant, or highly processed items)
              </label>
            </div>

            {/* Trigger food warnings */}
            {warnings.filter(w => w.includes(`${question.meal}:`)).length > 0 && (
              <div style={{
                background: 'rgba(220, 53, 69, 0.1)',
                border: '1px solid rgba(220, 53, 69, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ color: '#dc3545', margin: '0 0 0.5rem 0' }}>
                  Potential Trigger Foods Detected
                </h4>
                {warnings.filter(w => w.includes(`${question.meal}:`)).map((warning, idx) => (
                  <p key={idx} style={{ margin: '0.25rem 0', color: '#721c24', fontSize: '0.9rem' }}>
                    {warning.replace(`${question.meal}: `, '')}
                  </p>
                ))}
              </div>
            )}

            {/* Meal timing tips */}
            <div style={{
              background: 'rgba(23, 162, 184, 0.1)',
              border: '1px solid rgba(23, 162, 184, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ color: '#17a2b8', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                {mealName} & Headache Tips
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#4B5563', fontSize: '0.9rem' }}>
                {question.meal === 'breakfast' && (
                  <>
                    <li>Skipping breakfast is a common headache trigger</li>
                    <li>Include protein to stabilize blood sugar</li>
                    <li>Avoid excessive caffeine on an empty stomach</li>
                  </>
                )}
                {question.meal === 'lunch' && (
                  <>
                    <li>Eat lunch within 4-6 hours of breakfast</li>
                    <li>Include complex carbs for sustained energy</li>
                    <li>Stay hydrated, especially if you had caffeine</li>
                  </>
                )}
                {question.meal === 'dinner' && (
                  <>
                    <li>Avoid heavy meals too close to bedtime</li>
                    <li>Watch portion sizes to prevent digestive issues</li>
                    <li>Limit alcohol as it can trigger headaches</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        );

      case 'snacks-supplements':
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
                Snacks and additional meals
              </label>
              <textarea
                value={formData.additionalMeals}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalMeals: e.target.value }))}
                placeholder="Any snacks, desserts, or additional meals throughout the day..."
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
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '1rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#4682B4'
              }}>
                Vitamins and supplements
              </label>
              <input
                type="text"
                value={formData.supplements}
                onChange={(e) => setFormData(prev => ({ ...prev, supplements: e.target.value }))}
                placeholder="List any vitamins, minerals, or supplements taken today..."
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

            {/* Supplement tips */}
            <div style={{
              background: 'rgba(40, 167, 69, 0.1)',
              border: '1px solid rgba(40, 167, 69, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ color: '#28a745', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Supplements for Headache Prevention
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <h5 style={{ color: '#20c997', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Evidence-Based:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Magnesium (400mg daily)</li>
                    <li>Riboflavin (B2, 400mg daily)</li>
                    <li>CoQ10 (100-300mg daily)</li>
                  </ul>
                </div>
                <div>
                  <h5 style={{ color: '#17a2b8', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Potentially Helpful:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Vitamin D (if deficient)</li>
                    <li>Omega-3 fatty acids</li>
                    <li>Feverfew (with caution)</li>
                  </ul>
                </div>
              </div>
              <p style={{ margin: '1rem 0 0 0', color: '#4B5563', fontSize: '0.8rem', fontStyle: 'italic' }}>
                Always consult healthcare providers before starting new supplements
              </p>
            </div>
          </div>
        );

      case 'beverages':
        const caffeineTotal = getCaffeineTotal();
        
        return (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  Coffee (cups): {formData.coffee}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.coffee}
                  onChange={(e) => setFormData(prev => ({ ...prev, coffee: parseInt(e.target.value) }))}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: '#E5E7EB',
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
                  <span>0</span>
                  <span>10+</span>
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
                  Tea (cups): {formData.tea}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.tea}
                  onChange={(e) => setFormData(prev => ({ ...prev, tea: parseInt(e.target.value) }))}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: '#E5E7EB',
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
                  <span>0</span>
                  <span>10+</span>
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
                  Water (glasses): {formData.water}
                </label>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={formData.water}
                  onChange={(e) => setFormData(prev => ({ ...prev, water: parseInt(e.target.value) }))}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: `linear-gradient(to right, #dc3545 0%, #ffc107 50%, #28a745 100%)`,
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
                  <span>0</span>
                  <span>15+</span>
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
                  Alcohol (units): {formData.alcohol}
                </label>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={formData.alcohol}
                  onChange={(e) => setFormData(prev => ({ ...prev, alcohol: parseInt(e.target.value) }))}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: '#E5E7EB',
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
                  <span>0</span>
                  <span>8+</span>
                </div>
              </div>
            </div>

            {/* Caffeine warning */}
            {caffeineTotal > 400 && (
              <div style={{
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ color: '#856404', margin: '0 0 0.5rem 0' }}>
                  High Caffeine Intake Detected
                </h4>
                <p style={{ margin: 0, color: '#856404', fontSize: '0.9rem' }}>
                  You've consumed approximately {caffeineTotal}mg of caffeine. Consider reducing intake as high caffeine can trigger headaches in some people.
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: formData.sugaryDrinks ? 'rgba(255, 193, 7, 0.1)' : '#F9FAFB',
                border: formData.sugaryDrinks ? '1px solid #ffc107' : '1px solid #E5E7EB',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}>
                <input
                  type="checkbox"
                  checked={formData.sugaryDrinks}
                  onChange={(e) => setFormData(prev => ({ ...prev, sugaryDrinks: e.target.checked }))}
                />
                Had sugary drinks today
              </label>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#4682B4'
                }}>
                  Diet sodas: {formData.dietSodas}
                </label>
                <input
                  type="range"
                  min="0"
                  max="6"
                  value={formData.dietSodas}
                  onChange={(e) => setFormData(prev => ({ ...prev, dietSodas: parseInt(e.target.value) }))}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: '#E5E7EB',
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
                  <span>0</span>
                  <span>6+</span>
                </div>
              </div>
            </div>

            {/* Beverage tips */}
            <div style={{
              background: 'rgba(23, 162, 184, 0.1)',
              border: '1px solid rgba(23, 162, 184, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ color: '#17a2b8', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Hydration & Headache Prevention
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#4B5563', fontSize: '0.9rem' }}>
                <li>Aim for 8+ glasses of water daily</li>
                <li>Dehydration is a major headache trigger</li>
                <li>Limit caffeine to avoid withdrawal headaches</li>
                <li>Alcohol can trigger headaches and cause dehydration</li>
                <li>Artificial sweeteners may trigger headaches in some people</li>
              </ul>
            </div>
          </div>
        );

      case 'trigger-foods':
        return (
          <div>
            <div style={{
              background: 'rgba(220, 53, 69, 0.1)',
              border: '1px solid rgba(220, 53, 69, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h4 style={{ color: '#dc3545', margin: '0 0 0.5rem 0' }}>
                Common Headache Trigger Foods
              </h4>
              <p style={{ margin: 0, color: '#721c24', fontSize: '0.9rem' }}>
                Select any trigger foods you consumed today. Everyone's triggers are different, so track what affects you personally.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem'
            }}>
              {commonTriggerFoods.map(food => (
                <label key={food} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: formData.triggerFoods.includes(food)
                    ? 'rgba(220, 53, 69, 0.1)'
                    : '#F9FAFB',
                  border: formData.triggerFoods.includes(food)
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
                    checked={formData.triggerFoods.includes(food)}
                    onChange={() => handleCheckboxChange(food, 'triggerFoods')}
                  />
                  {food}
                </label>
              ))}
            </div>

            {/* Trigger food education */}
            <div style={{
              background: 'rgba(23, 162, 184, 0.1)',
              border: '1px solid rgba(23, 162, 184, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginTop: '2rem'
            }}>
              <h4 style={{ color: '#17a2b8', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Understanding Food Triggers
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <h5 style={{ color: '#20c997', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Most Common:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Aged cheeses (tyramine)</li>
                    <li>Processed meats (nitrates)</li>
                    <li>Alcohol (especially red wine)</li>
                    <li>Chocolate (phenylethylamine)</li>
                  </ul>
                </div>
                <div>
                  <h5 style={{ color: '#28a745', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Individual Varies:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>MSG and artificial additives</li>
                    <li>Citrus fruits and tomatoes</li>
                    <li>Nuts and fermented foods</li>
                    <li>Artificial sweeteners</li>
                  </ul>
                </div>
              </div>
              <p style={{ margin: '1rem 0 0 0', color: '#4B5563', fontSize: '0.8rem', fontStyle: 'italic' }}>
                Keep tracking to identify your personal trigger patterns over time
              </p>
            </div>
          </div>
        );

      case 'hydration-summary':
        const hydration = getHydrationLevel();
        const totalCaffeine = getCaffeineTotal();
        
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
                Today's Nutrition Summary
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', color: hydration.color, fontWeight: 'bold' }}>
                    {formData.water}
                  </div>
                  <div style={{ fontSize: '1rem', color: '#4B5563', marginBottom: '0.5rem' }}>glasses of water</div>
                  <div style={{ fontSize: '1.1rem', color: hydration.color, fontWeight: '600' }}>
                    {hydration.level} Hydration
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', color: totalCaffeine > 400 ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                    {totalCaffeine}
                  </div>
                  <div style={{ fontSize: '1rem', color: '#4B5563', marginBottom: '0.5rem' }}>mg caffeine</div>
                  <div style={{ fontSize: '1.1rem', color: totalCaffeine > 400 ? '#dc3545' : '#28a745', fontWeight: '600' }}>
                    {totalCaffeine > 400 ? 'High' : totalCaffeine > 200 ? 'Moderate' : 'Low'}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', color: formData.triggerFoods.length > 0 ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                    {formData.triggerFoods.length}
                  </div>
                  <div style={{ fontSize: '1rem', color: '#4B5563', marginBottom: '0.5rem' }}>trigger foods</div>
                  <div style={{ fontSize: '1.1rem', color: formData.triggerFoods.length > 0 ? '#dc3545' : '#28a745', fontWeight: '600' }}>
                    {formData.triggerFoods.length > 0 ? 'Monitor' : 'Good'}
                  </div>
                </div>
              </div>
            </div>

            {/* Personalized recommendations */}
            <div style={{
              background: 'rgba(40, 167, 69, 0.1)',
              border: '1px solid rgba(40, 167, 69, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ color: '#28a745', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Personalized Recommendations
              </h4>
              <div style={{ fontSize: '0.9rem', color: '#4B5563' }}>
                {formData.water < 6 && (
                  <p style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'rgba(220, 53, 69, 0.1)', borderRadius: '6px' }}>
                    🚰 <strong>Increase water intake:</strong> Aim for at least 8 glasses daily to prevent dehydration headaches
                  </p>
                )}
                {totalCaffeine > 400 && (
                  <p style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '6px' }}>
                    ☕ <strong>Reduce caffeine:</strong> High caffeine intake can trigger headaches and disrupt sleep
                  </p>
                )}
                {formData.triggerFoods.length > 2 && (
                  <p style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '6px' }}>
                    🍎 <strong>Monitor trigger foods:</strong> You consumed several known triggers - watch for headaches over the next 24 hours
                  </p>
                )}
                {formData.water >= 8 && totalCaffeine <= 300 && formData.triggerFoods.length <= 1 && (
                  <p style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'rgba(40, 167, 69, 0.1)', borderRadius: '6px' }}>
                    ✅ <strong>Excellent nutrition day:</strong> Good hydration, moderate caffeine, and minimal trigger foods!
                  </p>
                )}
                <p style={{ margin: '1rem 0 0 0', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  Continue tracking to identify patterns between your nutrition and headache frequency
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
              placeholder="Any additional notes about your eating today - appetite changes, digestive issues, meal timing, social eating situations, etc..."
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
              This information helps identify nutrition patterns that may contribute to your headaches
            </p>

            {/* Final nutrition tips */}
            <div style={{
              background: 'rgba(70, 130, 180, 0.1)',
              border: '1px solid rgba(70, 130, 180, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginTop: '2rem'
            }}>
              <h4 style={{ color: '#4682B4', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Nutrition & Headache Prevention
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <h5 style={{ color: '#20c997', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Preventive Foods:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Magnesium-rich foods (spinach, almonds)</li>
                    <li>Omega-3 fatty acids (fish, walnuts)</li>
                    <li>Complex carbohydrates for stable blood sugar</li>
                    <li>Regular meal timing</li>
                  </ul>
                </div>
                <div>
                  <h5 style={{ color: '#28a745', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Healthy Habits:</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
                    <li>Don't skip meals</li>
                    <li>Stay consistently hydrated</li>
                    <li>Limit processed foods</li>
                    <li>Monitor personal trigger patterns</li>
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
              Record Nutrition
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
            background: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h4 style={{ color: '#dc3545', margin: '0 0 1rem 0' }}>
              Potential Trigger Foods Detected
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#721c24', fontSize: '0.9rem' }}>
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
              {loading ? 'Saving...' : isLastStep ? 'Record Nutrition Data' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
