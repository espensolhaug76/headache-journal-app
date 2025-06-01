/* eslint-disable no-unused-vars */
// src/components/stress/PremiumStressTriggerTracker.js
import React from 'react';

export default function PremiumStressTriggerTracker({ 
  selectedTriggers, 
  onTriggersChange,
  stressLevel = 5,
  currentContext = 'general'
}) {
  
  const stressTriggerCategories = [
    {
      category: 'Work & Career',
      icon: '💼',
      triggers: [
        { id: 'heavy-workload', name: 'Heavy Workload', icon: '📚', description: 'Too many tasks or deadlines', severity: 'high' },
        { id: 'difficult-boss', name: 'Difficult Boss/Manager', icon: '👔', description: 'Challenging work relationships', severity: 'high' },
        { id: 'job-insecurity', name: 'Job Insecurity', icon: '⚠️', description: 'Fear of losing job', severity: 'high' },
        { id: 'workplace-conflict', name: 'Workplace Conflict', icon: '💥', description: 'Arguments or tension with colleagues', severity: 'medium' },
        { id: 'long-commute', name: 'Long Commute', icon: '🚗', description: 'Travel time to/from work', severity: 'medium' },
        { id: 'overtime-pressure', name: 'Overtime Pressure', icon: '⏰', description: 'Working beyond normal hours', severity: 'medium' },
        { id: 'lack-recognition', name: 'Lack of Recognition', icon: '🏆', description: 'Work not being appreciated', severity: 'low' },
        { id: 'technology-issues', name: 'Technology Problems', icon: '💻', description: 'Computer or system failures', severity: 'low' }
      ]
    },
    {
      category: 'Family & Relationships',
      icon: '👨‍👩‍👧‍👦',
      triggers: [
        { id: 'relationship-conflict', name: 'Relationship Conflict', icon: '💔', description: 'Arguments with partner/spouse', severity: 'high' },
        { id: 'parenting-challenges', name: 'Parenting Challenges', icon: '👶', description: 'Difficulties with children', severity: 'high' },
        { id: 'family-illness', name: 'Family Illness', icon: '🏥', description: 'Health problems in family', severity: 'high' },
        { id: 'caregiving-burden', name: 'Caregiving Responsibilities', icon: '🤝', description: 'Caring for elderly or sick relatives', severity: 'high' },
        { id: 'social-isolation', name: 'Social Isolation', icon: '😔', description: 'Feeling alone or disconnected', severity: 'medium' },
        { id: 'family-expectations', name: 'Family Expectations', icon: '🎯', description: 'Pressure to meet family standards', severity: 'medium' },
        { id: 'friend-drama', name: 'Friend Drama', icon: '👯', description: 'Conflicts in friendships', severity: 'low' },
        { id: 'social-obligations', name: 'Social Obligations', icon: '🎉', description: 'Too many social commitments', severity: 'low' }
      ]
    },
    {
      category: 'Financial',
      icon: '💰',
      triggers: [
        { id: 'debt-problems', name: 'Debt Problems', icon: '💳', description: 'Credit card or loan debt', severity: 'high' },
        { id: 'job-loss-income', name: 'Income Loss', icon: '📉', description: 'Reduced or lost income', severity: 'high' },
        { id: 'unexpected-expenses', name: 'Unexpected Expenses', icon: '🚨', description: 'Emergency costs (medical, car, etc.)', severity: 'high' },
        { id: 'housing-costs', name: 'Housing Costs', icon: '🏠', description: 'Rent, mortgage, or housing expenses', severity: 'medium' },
        { id: 'saving-for-goals', name: 'Saving Challenges', icon: '🎯', description: 'Difficulty saving for goals', severity: 'medium' },
        { id: 'investment-worries', name: 'Investment Concerns', icon: '📊', description: 'Market volatility or losses', severity: 'medium' },
        { id: 'budgeting-issues', name: 'Budgeting Struggles', icon: '📋', description: 'Managing monthly expenses', severity: 'low' },
        { id: 'shopping-pressure', name: 'Spending Pressure', icon: '🛍️', description: 'Pressure to buy things', severity: 'low' }
      ]
    },
    {
      category: 'Health & Lifestyle',
      icon: '🏥',
      triggers: [
        { id: 'chronic-illness', name: 'Chronic Health Issues', icon: '🩺', description: 'Ongoing health problems', severity: 'high' },
        { id: 'lack-of-sleep', name: 'Sleep Deprivation', icon: '😴', description: 'Not getting enough quality sleep', severity: 'high' },
        { id: 'poor-diet', name: 'Poor Diet/Nutrition', icon: '🍔', description: 'Unhealthy eating habits', severity: 'medium' },
        { id: 'lack-exercise', name: 'Lack of Exercise', icon: '🏃‍♂️', description: 'Sedentary lifestyle', severity: 'medium' },
        { id: 'substance-use', name: 'Substance Use', icon: '🍷', description: 'Alcohol, caffeine, or other substances', severity: 'medium' },
        { id: 'weight-concerns', name: 'Weight/Body Image', icon: '⚖️', description: 'Concerns about physical appearance', severity: 'medium' },
        { id: 'medical-appointments', name: 'Medical Appointments', icon: '👩‍⚕️', description: 'Doctor visits and health screenings', severity: 'low' },
        { id: 'medication-side-effects', name: 'Medication Effects', icon: '💊', description: 'Side effects from medications', severity: 'low' }
      ]
    },
    {
      category: 'Environmental & External',
      icon: '🌍',
      triggers: [
        { id: 'weather-changes', name: 'Weather Changes', icon: '🌦️', description: 'Barometric pressure, storms', severity: 'medium' },
        { id: 'noise-pollution', name: 'Noise/Crowds', icon: '🔊', description: 'Loud environments or crowded places', severity: 'medium' },
        { id: 'traffic-delays', name: 'Traffic/Transportation', icon: '🚦', description: 'Delays, traffic jams, transport issues', severity: 'medium' },
        { id: 'news-media', name: 'News/Media Consumption', icon: '📺', description: 'Negative news or social media', severity: 'medium' },
        { id: 'political-climate', name: 'Political/Social Issues', icon: '🗳️', description: 'Current events and social tensions', severity: 'medium' },
        { id: 'seasonal-changes', name: 'Seasonal Changes', icon: '🍂', description: 'Seasonal affective patterns', severity: 'low' },
        { id: 'air-quality', name: 'Air Quality/Pollution', icon: '🏭', description: 'Environmental air conditions', severity: 'low' },
        { id: 'technology-overload', name: 'Technology Overload', icon: '📱', description: 'Too much screen time or notifications', severity: 'low' }
      ]
    },
    {
      category: 'Personal & Internal',
      icon: '🧠',
      triggers: [
        { id: 'perfectionism', name: 'Perfectionism', icon: '🎯', description: 'Setting unrealistic standards', severity: 'high' },
        { id: 'anxiety-worry', name: 'Anxiety/Worry', icon: '😰', description: 'General anxiety or worry patterns', severity: 'high' },
        { id: 'low-self-esteem', name: 'Low Self-Esteem', icon: '😞', description: 'Negative self-perception', severity: 'high' },
        { id: 'overwhelm', name: 'Feeling Overwhelmed', icon: '🌊', description: 'Too much to handle at once', severity: 'high' },
        { id: 'procrastination', name: 'Procrastination', icon: '⏳', description: 'Putting off important tasks', severity: 'medium' },
        { id: 'fear-of-failure', name: 'Fear of Failure', icon: '❌', description: 'Worry about not succeeding', severity: 'medium' },
        { id: 'impostor-syndrome', name: 'Impostor Syndrome', icon: '🎭', description: 'Feeling like a fraud', severity: 'medium' },
        { id: 'decision-making', name: 'Decision Paralysis', icon: '🤔', description: 'Difficulty making choices', severity: 'low' }
      ]
    }
  ];

  const handleTriggerToggle = (triggerId) => {
    const newTriggers = selectedTriggers.includes(triggerId)
      ? selectedTriggers.filter(id => id !== triggerId)
      : [...selectedTriggers, triggerId];
    
    onTriggersChange(newTriggers);
  };

  const getSelectedCount = () => selectedTriggers.length;

  const getStressImpactColor = (severity, isSelected) => {
    if (!isSelected) return '#F9FAFB';
    
    switch(severity) {
      case 'high': return 'rgba(220, 53, 69, 0.15)';
      case 'medium': return 'rgba(255, 193, 7, 0.15)';
      case 'low': return 'rgba(23, 162, 184, 0.15)';
      default: return 'rgba(70, 130, 180, 0.15)';
    }
  };

  const getStressImpactBorder = (severity, isSelected) => {
    if (!isSelected) return '1px solid #E5E7EB';
    
    switch(severity) {
      case 'high': return '2px solid #dc3545';
      case 'medium': return '2px solid #ffc107';
      case 'low': return '2px solid #17a2b8';
      default: return '2px solid #4682B4';
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#17a2b8';
      default: return '#4682B4';
    }
  };

  const getHighStressTriggers = () => {
    const highStressTriggers = [];
    stressTriggerCategories.forEach(category => {
      category.triggers.forEach(trigger => {
        if (selectedTriggers.includes(trigger.id) && trigger.severity === 'high') {
          highStressTriggers.push(trigger);
        }
      });
    });
    return highStressTriggers;
  };

  const getStressLevelInsight = () => {
    const highTriggers = getHighStressTriggers().length;
    const totalSelected = getSelectedCount();
    
    if (stressLevel >= 8 && highTriggers >= 2) {
      return {
        type: 'critical',
        message: 'Multiple high-impact triggers detected with severe stress level',
        color: '#dc3545',
        icon: '🚨'
      };
    } else if (stressLevel >= 6 && totalSelected >= 3) {
      return {
        type: 'warning',
        message: 'Several stress triggers identified - consider stress management',
        color: '#ffc107',
        icon: '⚠️'
      };
    } else if (totalSelected >= 1) {
      return {
        type: 'info',
        message: 'Good awareness of stress triggers - tracking helps management',
        color: '#17a2b8',
        icon: '💡'
      };
    } else {
      return {
        type: 'neutral',
        message: 'Identify stress triggers to better understand patterns',
        color: '#6c757d',
        icon: '🔍'
      };
    }
  };

  const insight = getStressLevelInsight();

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
            Premium: Stress Trigger Analysis
          </h3>
          <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
            Identify what specifically causes your stress
          </p>
        </div>
      </div>

      {/* Summary & Insight */}
      <div style={{
        background: `rgba(${insight.color === '#dc3545' ? '220, 53, 69' : 
                            insight.color === '#ffc107' ? '255, 193, 7' :
                            insight.color === '#17a2b8' ? '23, 162, 184' : '108, 117, 125'}, 0.1)`,
        border: `1px solid ${insight.color}`,
        borderRadius: '12px',
        padding: '1.5rem',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>{insight.icon}</div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: insight.color }}>
              {getSelectedCount()}
            </div>
            <div style={{ color: '#4B5563', fontSize: '1rem' }}>
              stress triggers identified
            </div>
          </div>
        </div>
        <div style={{ color: insight.color, fontSize: '0.9rem', fontWeight: '500' }}>
          {insight.message}
        </div>
      </div>

      {/* Stress Triggers by Category */}
      {stressTriggerCategories.map((category) => (
        <div key={category.category} style={{ marginBottom: '2.5rem' }}>
          <h4 style={{ 
            color: '#4682B4', 
            marginBottom: '1rem', 
            fontSize: '1.1rem',
            fontWeight: '600',
            borderBottom: '2px solid rgba(70, 130, 180, 0.2)',
            paddingBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1.2rem' }}>{category.icon}</span>
            {category.category}
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '0.75rem'
          }}>
            {category.triggers.map((trigger) => {
              const isSelected = selectedTriggers.includes(trigger.id);
              return (
                <button
                  key={trigger.id}
                  onClick={() => handleTriggerToggle(trigger.id)}
                  style={{
                    padding: '1rem',
                    background: getStressImpactColor(trigger.severity, isSelected),
                    border: getStressImpactBorder(trigger.severity, isSelected),
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
                    {trigger.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: '600', 
                      fontSize: '0.95rem',
                      color: isSelected ? getSeverityColor(trigger.severity) : '#000000',
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {trigger.name}
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: getSeverityColor(trigger.severity),
                        color: 'white',
                        textTransform: 'uppercase',
                        fontWeight: '500'
                      }}>
                        {trigger.severity}
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#6B7280',
                      lineHeight: '1.3'
                    }}>
                      {trigger.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{ 
                      color: getSeverityColor(trigger.severity), 
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

      {/* Stress Management Tips */}
      {getSelectedCount() > 0 && (
        <div style={{
          background: 'rgba(40, 167, 69, 0.1)',
          border: '1px solid rgba(40, 167, 69, 0.3)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginTop: '2rem'
        }}>
          <h4 style={{ color: '#28a745', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
            <i className="fas fa-lightbulb" style={{ marginRight: '0.5rem' }}></i>
            Personalized Stress Management Tips
          </h4>
          <div style={{ color: '#4B5563', fontSize: '0.9rem' }}>
            {getHighStressTriggers().length > 0 && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(220, 53, 69, 0.1)', borderRadius: '8px' }}>
                <strong style={{ color: '#dc3545' }}>🚨 High-Impact Triggers Identified:</strong>
                <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
                  <li>Consider professional stress management support</li>
                  <li>Prioritize addressing these specific triggers</li>
                  <li>Track how these relate to your headache patterns</li>
                </ul>
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <strong style={{ color: '#28a745' }}>✓ Quick Stress Relief:</strong>
                <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0, fontSize: '0.85rem' }}>
                  <li>Deep breathing (4-7-8 technique)</li>
                  <li>5-minute walk or movement</li>
                  <li>Progressive muscle relaxation</li>
                  <li>Mindfulness or meditation apps</li>
                </ul>
              </div>
              <div>
                <strong style={{ color: '#17a2b8' }}>💡 Long-term Strategy:</strong>
                <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0, fontSize: '0.85rem' }}>
                  <li>Identify trigger patterns over time</li>
                  <li>Develop coping strategies for each trigger</li>
                  <li>Consider lifestyle changes to reduce exposure</li>
                  <li>Track correlation with headache occurrences</li>
                </ul>
              </div>
            </div>
            
            <p style={{ margin: '1rem 0 0 0', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center' }}>
              💎 <strong>Premium Tip:</strong> Tracking specific triggers helps identify which stressors most commonly lead to your headaches
            </p>
          </div>
        </div>
      )}

      {/* Educational Content */}
      <div style={{
        background: 'rgba(23, 162, 184, 0.1)',
        border: '1px solid rgba(23, 162, 184, 0.3)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginTop: '2rem'
      }}>
        <h4 style={{ color: '#17a2b8', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
          <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
          Understanding Stress Triggers
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <h5 style={{ color: '#20c997', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Why Track Triggers?</h5>
            <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4B5563', fontSize: '0.85rem' }}>
              <li>Identify patterns between stress and headaches</li>
              <li>Develop targeted coping strategies</li>
              <li>Recognize early warning signs</li>
              <li>Make informed lifestyle changes</li>
            </ul>
          </div>
          <div>
            <h5 style={{ color: '#28a745', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Severity Levels:</h5>
            <div style={{ fontSize: '0.85rem', color: '#4B5563' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
                <span style={{ width: '12px', height: '12px', background: '#dc3545', borderRadius: '2px' }}></span>
                <strong>High:</strong> Major life stressors
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
                <span style={{ width: '12px', height: '12px', background: '#ffc107', borderRadius: '2px' }}></span>
                <strong>Medium:</strong> Manageable but persistent
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
                <span style={{ width: '12px', height: '12px', background: '#17a2b8', borderRadius: '2px' }}></span>
                <strong>Low:</strong> Minor daily irritations
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}