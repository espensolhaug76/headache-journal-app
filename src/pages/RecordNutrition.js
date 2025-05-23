import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecordNutrition() {
  const { currentUser } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));
  
  // Meals
  const [breakfast, setBreakfast] = useState({ time: '', foods: '', isUltraProcessed: false });
  const [lunch, setLunch] = useState({ time: '', foods: '', isUltraProcessed: false });
  const [dinner, setDinner] = useState({ time: '', foods: '', isUltraProcessed: false });
  const [additionalMeals, setAdditionalMeals] = useState('');
  const [supplements, setSupplements] = useState('');
  
  // Drinks
  const [coffee, setCoffee] = useState(0);
  const [tea, setTea] = useState(0);
  const [water, setWater] = useState(0);
  const [alcohol, setAlcohol] = useState(0);
  const [sugaryDrinks, setSugaryDrinks] = useState(false);
  const [dietSodas, setDietSodas] = useState(0);
  
  // Trigger foods tracking
  const [triggerFoods, setTriggerFoods] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warnings, setWarnings] = useState([]);
  
  const commonTriggerFoods = [
    'Aged cheese', 'Chocolate', 'Processed meats', 'Citrus fruits',
    'Avocados', 'Bananas', 'MSG foods', 'Artificial sweeteners',
    'Fermented foods', 'Nuts', 'Alcohol', 'Caffeine'
  ];
  
  // Check for trigger foods in meal descriptions
  const checkTriggerFoods = (foodDescription, mealName) => {
    const lowerFoods = foodDescription.toLowerCase();
    const foundTriggers = [];
    
    const triggerTerms = {
      'aged cheese': ['aged cheese', 'blue cheese', 'cheddar', 'parmesan'],
      'chocolate': ['chocolate', 'cocoa'],
      'processed meats': ['salami', 'pepperoni', 'hot dog', 'bacon', 'ham'],
      'citrus fruits': ['orange', 'lemon', 'lime', 'grapefruit'],
      'msg foods': ['msg', 'chinese food', 'instant noodles'],
      'artificial sweeteners': ['aspartame', 'diet', 'zero sugar'],
      'fermented foods': ['sauerkraut', 'kimchi', 'fermented'],
      'caffeine': ['coffee', 'energy drink', 'cola']
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
  
  const handleMealChange = (meal, field, value) => {
    const mealSetters = {
      breakfast: setBreakfast,
      lunch: setLunch,
      dinner: setDinner
    };
    
    const mealValues = {
      breakfast,
      lunch,
      dinner
    };
    
    const updatedMeal = { ...mealValues[meal], [field]: value };
    
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
      const ultraProcessedTerms = ['instant', 'microwave', 'frozen dinner', 'chips', 'soda', 'candy'];
      const isUltraProcessed = ultraProcessedTerms.some(term => 
        value.toLowerCase().includes(term)
      );
      updatedMeal.isUltraProcessed = isUltraProcessed;
    }
    
    mealSetters[meal](updatedMeal);
  };
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      await addDoc(collection(db, 'users', currentUser.uid, 'nutrition'), {
        date: new Date(date),
        meals: {
          breakfast,
          lunch,
          dinner,
          additional: additionalMeals
        },
        drinks: {
          coffee,
          tea,
          water,
          alcohol,
          sugaryDrinks,
          dietSodas
        },
        supplements,
        triggerFoods,
        createdAt: new Date()
      });
      
      setSuccess('Nutrition data recorded successfully!');
      
      // Reset form
      setBreakfast({ time: '', foods: '', isUltraProcessed: false });
      setLunch({ time: '', foods: '', isUltraProcessed: false });
      setDinner({ time: '', foods: '', isUltraProcessed: false });
      setAdditionalMeals('');
      setSupplements('');
      setCoffee(0);
      setTea(0);
      setWater(0);
      setAlcohol(0);
      setSugaryDrinks(false);
      setDietSodas(0);
      setTriggerFoods([]);
      setWarnings([]);
      
    } catch (err) {
      setError('Failed to record nutrition data: ' + err.message);
    }
    
    setLoading(false);
  }
  
  function toggleTriggerFood(food) {
    if (triggerFoods.includes(food)) {
      setTriggerFoods(triggerFoods.filter(f => f !== food));
    } else {
      setTriggerFoods([...triggerFoods, food]);
    }
  }

  return (
    <div className="form-container" style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Record Nutrition</h1>
        <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
      </div>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="notification success">{success}</div>}
      
      {warnings.length > 0 && (
        <div className="warnings">
          <h3>⚠️ Potential Trigger Foods Detected:</h3>
          <ul>
            {warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        
        <h2 style={{ color: '#2c5aa0', marginTop: '2rem', marginBottom: '1rem' }}>Food</h2>
        
        {/* Breakfast */}
        <div className="meal-section" style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <h3>Breakfast</h3>
          <div className="form-group">
            <label>Time</label>
            <input
              type="time"
              value={breakfast.time}
              onChange={(e) => handleMealChange('breakfast', 'time', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>What did you eat?</label>
            <textarea
              value={breakfast.foods}
              onChange={(e) => handleMealChange('breakfast', 'foods', e.target.value)}
              placeholder="Describe your breakfast..."
              rows="3"
            />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={breakfast.isUltraProcessed}
                onChange={(e) => handleMealChange('breakfast', 'isUltraProcessed', e.target.checked)}
              />
              Ultra-processed food (UPF)
            </label>
          </div>
        </div>
        
        {/* Lunch */}
        <div className="meal-section" style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <h3>Lunch</h3>
          <div className="form-group">
            <label>Time</label>
            <input
              type="time"
              value={lunch.time}
              onChange={(e) => handleMealChange('lunch', 'time', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>What did you eat?</label>
            <textarea
              value={lunch.foods}
              onChange={(e) => handleMealChange('lunch', 'foods', e.target.value)}
              placeholder="Describe your lunch..."
              rows="3"
            />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={lunch.isUltraProcessed}
                onChange={(e) => handleMealChange('lunch', 'isUltraProcessed', e.target.checked)}
              />
              Ultra-processed food (UPF)
            </label>
          </div>
        </div>
        
        {/* Dinner */}
        <div className="meal-section" style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <h3>Dinner</h3>
          <div className="form-group">
            <label>Time</label>
            <input
              type="time"
              value={dinner.time}
              onChange={(e) => handleMealChange('dinner', 'time', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>What did you eat?</label>
            <textarea
              value={dinner.foods}
              onChange={(e) => handleMealChange('dinner', 'foods', e.target.value)}
              placeholder="Describe your dinner..."
              rows="3"
            />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={dinner.isUltraProcessed}
                onChange={(e) => handleMealChange('dinner', 'isUltraProcessed', e.target.checked)}
              />
              Ultra-processed food (UPF)
            </label>
          </div>
        </div>
        
        <div className="form-group">
          <label>Additional meals/snacks</label>
          <textarea
            value={additionalMeals}
            onChange={(e) => setAdditionalMeals(e.target.value)}
            placeholder="Any snacks or additional meals..."
            rows="2"
          />
        </div>
        
        <div className="form-group">
          <label>Vitamin/mineral supplements</label>
          <input
            type="text"
            value={supplements}
            onChange={(e) => setSupplements(e.target.value)}
            placeholder="List any supplements taken..."
          />
        </div>
        
        <h2 style={{ color: '#2c5aa0', marginTop: '2rem', marginBottom: '1rem' }}>Drinks</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>Coffee (cups)</label>
            <input
              type="number"
              min="0"
              max="20"
              value={coffee}
              onChange={(e) => setCoffee(parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div className="form-group">
            <label>Tea (cups)</label>
            <input
              type="number"
              min="0"
              max="20"
              value={tea}
              onChange={(e) => setTea(parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div className="form-group">
            <label>Water (glasses/liters)</label>
            <input
              type="number"
              min="0"
              max="20"
              step="0.5"
              value={water}
              onChange={(e) => setWater(parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div className="form-group">
            <label>Alcohol (units)</label>
            <input
              type="number"
              min="0"
              max="20"
              value={alcohol}
              onChange={(e) => setAlcohol(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={sugaryDrinks}
              onChange={(e) => setSugaryDrinks(e.target.checked)}
            />
            Had sugary drinks today
          </label>
        </div>
        
        <div className="form-group">
          <label>Diet sodas (servings)</label>
          <input
            type="number"
            min="0"
            max="10"
            value={dietSodas}
            onChange={(e) => setDietSodas(parseInt(e.target.value) || 0)}
          />
        </div>
        
        <div className="form-group">
          <label>Known Trigger Foods Consumed</label>
          <div className="triggers-list">
            {commonTriggerFoods.map(food => (
              <label key={food} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={triggerFoods.includes(food)}
                  onChange={() => toggleTriggerFood(food)}
                />
                {food}
              </label>
            ))}
          </div>
        </div>
        
        <button type="submit" disabled={loading} className="btn">
          {loading ? 'Recording...' : 'Record Nutrition'}
        </button>
      </form>
    </div>
  );
}