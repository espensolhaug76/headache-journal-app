// 1. Enhanced RecordHeadache.js - Add Migraine Attack Toggle
// This goes in your RecordHeadache.js file

// NEW: Migraine Attack Toggle Component
const MigraneAttackToggle = () => (
  <div style={{
    background: formData.isMigrineAttack ? 'rgba(220, 53, 69, 0.1)' : '#F9FAFB',
    border: formData.isMigrineAttack ? '2px solid #DC3545' : '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '2rem'
  }}>
    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
      <h4 style={{ 
        color: formData.isMigrineAttack ? '#DC3545' : '#4682B4', 
        margin: '0 0 0.5rem 0',
        fontSize: '1.1rem'
      }}>
        <i className={`fas ${formData.isMigrineAttack ? 'fa-exclamation-triangle' : 'fa-question-circle'}`} 
           style={{ marginRight: '0.5rem' }}></i>
        Is this a migraine attack?
      </h4>
      <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>
        Migraine attacks are different from regular headaches and often include additional symptoms
      </p>
    </div>

    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
      <button
        onClick={() => handleMigrineAttackChange(true)}
        style={{
          padding: '1rem 1.5rem',
          background: formData.isMigrineAttack ? '#DC3545' : '#FFFFFF',
          border: formData.isMigrineAttack ? 'none' : '1px solid #E5E7EB',
          borderRadius: '8px',
          color: formData.isMigrineAttack ? 'white' : '#374151',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <i className="fas fa-check-circle"></i>
        Yes, migraine attack
      </button>

      <button
        onClick={() => handleMigrineAttackChange(false)}
        style={{
          padding: '1rem 1.5rem',
          background: !formData.isMigrineAttack ? '#4682B4' : '#FFFFFF',
          border: !formData.isMigrineAttack ? 'none' : '1px solid #E5E7EB',
          borderRadius: '8px',
          color: !formData.isMigrineAttack ? 'white' : '#374151',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <i className="fas fa-times-circle"></i>
        No, regular headache
      </button>
    </div>

    {formData.isMigrineAttack && (
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        background: 'rgba(220, 53, 69, 0.05)',
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: '#6B7280'
      }}>
        <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#DC3545' }}>
          Migraine Attack Indicators:
        </p>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>Severe throbbing or pulsing pain</li>
          <li>Pain usually on one side of the head</li>
          <li>Nausea or vomiting</li>
          <li>Sensitivity to light and sound</li>
          <li>Pain worsens with physical activity</li>
        </ul>
      </div>
    )}
  </div>
);

// Update formData to include migraine attack status
const [formData, setFormData] = useState({
  date: prefilledDate || new Date().toISOString().split('T')[0],
  painLevel: 5,
  location: '',
  isMigrineAttack: false, // NEW: Track if this is a migraine attack
  // ... other fields
});

// NEW: Handle migraine attack toggle
const handleMigrineAttackChange = (isMigrineAttack) => {
  setFormData(prev => ({ ...prev, isMigrineAttack }));
};

// Update handleTypeSelect to auto-suggest migraine for migraine headaches
const handleTypeSelect = (typeName) => {
  setFormData(prev => ({ 
    ...prev, 
    location: typeName,
    // Auto-suggest migraine attack for migraine headaches
    isMigrineAttack: typeName === 'Migraine Headache' ? true : prev.isMigrineAttack
  }));
};

// Update database save to include migraine attack status
const submitManualEntry = async () => {
  // ... existing code ...
  
  const headacheData = {
    userId: currentUser.uid,
    painLevel: parseInt(formData.painLevel),
    location: formData.location,
    isMigrineAttack: formData.isMigrineAttack, // NEW: Include migraine attack status
    startTime: Timestamp.fromDate(entryDate),
    endTime: Timestamp.fromDate(entryDate),
    duration: 0,
    date: formData.date,
    createdAt: Timestamp.now(),
    // ... other fields
  };

  console.log('=== HEADACHE DEBUG ===');
  console.log('Date being saved:', formData.date);
  console.log('Is Migraine Attack:', formData.isMigrineAttack);
  console.log('Full headache data:', headacheData);

  await addDoc(collection(db, 'users', currentUser.uid, 'headaches'), headacheData);
  navigate('/dashboard');
};

// Add the MigraneAttackToggle component to your form flow
// Place it after the headache type selector and before premium features

// 2. Enhanced Dashboard.js - Add Migraine Statistics
// This goes in your Dashboard.js file

// NEW: Calculate migraine-specific statistics
const calculateMigrainStats = React.useCallback((headacheData) => {
  const migrineAttacks = headacheData.filter(h => h.isMigrineAttack === true);
  const regularHeadaches = headacheData.filter(h => h.isMigrineAttack !== true);
  
  // Days with migraines
  const daysWithMigrines = new Set();
  migrineAttacks.forEach(migraine => {
    const date = getRecordDate(migraine);
    daysWithMigrines.add(date);
  });

  // Days with regular headaches
  const daysWithRegularHeadaches = new Set();
  regularHeadaches.forEach(headache => {
    const date = getRecordDate(headache);
    daysWithRegularHeadaches.add(date);
  });

  // Average pain levels
  const avgMigrainePain = migrineAttacks.length > 0 
    ? migrineAttacks.reduce((sum, m) => sum + (m.painLevel || 0), 0) / migrineAttacks.length
    : 0;

  const avgRegularHeadachePain = regularHeadaches.length > 0
    ? regularHeadaches.reduce((sum, h) => sum + (h.painLevel || 0), 0) / regularHeadaches.length
    : 0;

  console.log('=== MIGRAINE STATS DEBUG ===');
  console.log('Total headaches:', headacheData.length);
  console.log('Migraine attacks:', migrineAttacks.length);
  console.log('Regular headaches:', regularHeadaches.length);
  console.log('Days with migraines:', daysWithMigrines.size);
  console.log('Average migraine pain:', avgMigrainePain);

  return {
    totalMigrineAttacks: migrineAttacks.length,
    totalRegularHeadaches: regularHeadaches.length,
    daysWithMigrines: daysWithMigrines.size,
    daysWithRegularHeadaches: daysWithRegularHeadaches.size,
    avgMigrainePain: avgMigrainePain,
    avgRegularHeadachePain: avgRegularHeadachePain
  };
}, [getRecordDate]);

// Update dashboard state to include migraine stats
const [dashboardData, setDashboardData] = useState({
  // ... existing fields ...
  migrainStats: {
    totalMigrineAttacks: 0,
    totalRegularHeadaches: 0,
    daysWithMigrines: 0,
    daysWithRegularHeadaches: 0,
    avgMigrainePain: 0,
    avgRegularHeadachePain: 0
  }
});

// Update fetchDashboardData to calculate migraine stats
useEffect(() => {
  // ... existing fetch logic ...
  
  // Process data
  const processedData = processLast7Days(sleepData, stressData, headacheData);
  const dailyMetrics = processDailyMetrics(sleepData, stressData, headacheData);
  const calendarData = processCalendarData(monthlyHeadaches, monthlyMedications);
  const stats = calculateStats(sleepData, stressData, headacheData);
  const monthlyStats = calculateMonthlyStats(monthlyHeadaches, monthlyMedications);
  const migrainStats = calculateMigrainStats(monthlyHeadaches); // NEW: Calculate migraine stats

  setDashboardData({
    sleepStressData: processedData,
    dailyMetrics: dailyMetrics,
    calendarData: calendarData,
    loading: false,
    error: null,
    stats,
    monthlyStats,
    migrainStats // NEW: Add migraine stats to dashboard data
  });
}, [/* dependencies */]);

// 3. Enhanced CalendarModule.js - Show Migraine Indicators
// This goes in your CalendarModule.js file

// Update the calendar day rendering to show migraine indicators
const renderCalendarDay = (day, dateStr, dayData) => {
  const severity = getHeadacheSeverity(dayData);
  const totalDuration = getTotalDuration(dayData);
  const hasMedication = dayData && dayData.medications.length > 0;
  const isToday = dateStr === new Date().toISOString().split('T')[0];
  
  // NEW: Check for migraine attacks
  const hasMigraine = dayData && dayData.headaches.some(h => h.isMigrineAttack);
  const migrineCount = dayData ? dayData.headaches.filter(h => h.isMigrineAttack).length : 0;
  const regularHeadacheCount = dayData ? dayData.headaches.filter(h => !h.isMigrineAttack).length : 0;

  return (
    <div
      key={day}
      onClick={() => onDateClick && onDateClick(dateStr, dayData)}
      style={{
        // ... existing styles ...
        title: dayData ? 
          `${day}/${currentMonth + 1}: ${migrineCount} migraine(s), ${regularHeadacheCount} regular headache(s), ${dayData.medications.length} medication(s). Click to add/edit.` : 
          `${day}/${currentMonth + 1} - Click to log headache for this date`
      }}
    >
      {/* Day Number */}
      <div style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#1F2937', textAlign: 'center' }}>
        {day}
      </div>

      {/* NEW: Migraine Indicator */}
      {hasMigraine && (
        <div style={{ 
          fontSize: '1.2rem', 
          color: '#8B5CF6', 
          textAlign: 'center',
          marginBottom: '2px'
        }} title="Migraine attack day">
          🤕
        </div>
      )}

      {/* Regular severity indicator for non-migraine headaches */}
      {regularHeadacheCount > 0 && (
        <div style={{ fontSize: '1rem', textAlign: 'center' }}>
          {getSeverityEmoji(severity)}
        </div>
      )}

      {/* Duration and medication indicators */}
      {/* ... rest of existing indicators ... */}
    </div>
  );
};

// 4. NEW: MigraineDashboardModule.js - Dedicated Migraine Statistics
// Create this as a new component file

import React from 'react';

export default function MigraineDashboardModule({ 
  migrainStats, 
  monthlyStats, 
  currentMonth, 
  currentYear 
}) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMigraineSeverityColor = (avgPain) => {
    if (avgPain === 0) return '#28a745';
    if (avgPain <= 5) return '#ffc107';
    if (avgPain <= 7) return '#fd7e14';
    return '#dc3545';
  };

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '16px',
      padding: '2rem',
      marginBottom: '3rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '1.4rem',
          fontWeight: '600',
          color: '#8B5CF6',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🤕 Migraine vs Headache Analysis - {monthNames[currentMonth]} {currentYear}
        </h3>
      </div>

      {/* Main Statistics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Migraine Attacks */}
        <div style={{
          background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {migrainStats.totalMigrineAttacks}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Migraine Attacks
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>
            {migrainStats.daysWithMigrines} days affected
          </div>
        </div>

        {/* Regular Headaches */}
        <div style={{
          background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {migrainStats.totalRegularHeadaches}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Regular Headaches
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>
            {migrainStats.daysWithRegularHeadaches} days affected
          </div>
        </div>

        {/* Migraine Severity */}
        <div style={{
          background: `linear-gradient(135deg, ${getMigraineSeverityColor(migrainStats.avgMigrainePain)}, ${getMigraineSeverityColor(migrainStats.avgMigrainePain)}dd)`,
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {migrainStats.avgMigrainePain.toFixed(1)}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Avg Migraine Pain
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>
            out of 10
          </div>
        </div>

        {/* Total Headache Days */}
        <div style={{
          background: 'linear-gradient(135deg, #EF4444, #DC2626)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {monthlyStats.daysWithHeadaches}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Total Headache Days
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>
            this month
          </div>
        </div>
      </div>

      {/* Comparison Insights */}
      {(migrainStats.totalMigrineAttacks > 0 || migrainStats.totalRegularHeadaches > 0) && (
        <div style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <h4 style={{ color: '#8B5CF6', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
            📊 Key Insights
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <h5 style={{ color: '#7C3AED', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                Migraine vs Regular Ratio:
              </h5>
              <p style={{ margin: 0, color: '#4B5563', fontSize: '0.9rem' }}>
                {migrainStats.totalMigrineAttacks > 0 && migrainStats.totalRegularHeadaches > 0 ? (
                  `${Math.round((migrainStats.totalMigrineAttacks / (migrainStats.totalMigrineAttacks + migrainStats.totalRegularHeadaches)) * 100)}% of your headaches are migraines`
                ) : migrainStats.totalMigrineAttacks > 0 ? (
                  "All tracked headaches were migraine attacks"
                ) : (
                  "No migraine attacks recorded this month"
                )}
              </p>
            </div>
            <div>
              <h5 style={{ color: '#7C3AED', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                Pain Level Difference:
              </h5>
              <p style={{ margin: 0, color: '#4B5563', fontSize: '0.9rem' }}>
                {migrainStats.avgMigrainePain > 0 && migrainStats.avgRegularHeadachePain > 0 ? (
                  `Migraines are ${(migrainStats.avgMigrainePain - migrainStats.avgRegularHeadachePain).toFixed(1)} points more severe on average`
                ) : migrainStats.avgMigrainePain > 0 ? (
                  `Average migraine pain: ${migrainStats.avgMigrainePain.toFixed(1)}/10`
                ) : (
                  "Track more data to see pain level comparisons"
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 5. Update existing calendar modal to show migraine information
// In your existing date modal, update headache display:

{detailedDateRecords.headaches.map((headache) => (
  <div key={headache.id} style={{
    background: headache.isMigrineAttack ? '#FEF2F2' : '#F9FAFB',
    border: headache.isMigrineAttack ? '2px solid #DC2626' : '1px solid #E5E7EB',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        {/* NEW: Migraine Attack Badge */}
        {headache.isMigrineAttack && (
          <span style={{
            background: '#DC2626',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 'bold'
          }}>
            MIGRAINE
          </span>
        )}
        <span style={{
          background: getPainLevelColor(headache.painLevel),
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: 'bold'
        }}>
          {headache.painLevel}/10
        </span>
        <span style={{ fontWeight: '600', color: '#374151' }}>
          {headache.location}
        </span>
      </div>
      {/* ... rest of headache details ... */}
    </div>
    {/* ... edit/delete buttons ... */}
  </div>
))}
