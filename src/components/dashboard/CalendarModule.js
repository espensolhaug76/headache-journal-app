import React from 'react';

export default function CalendarModule({
  calendarData,
  currentMonth,
  currentYear,
  setCurrentMonth,
  setCurrentYear,
  onDateClick,
  weekStartsOnMonday,
  setWeekStartsOnMonday,
  monthlyStats,
  migrainStats // NEW: Accept migraine statistics prop
}) {
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    // Adjust for Monday start if needed
    if (weekStartsOnMonday) {
      return firstDay === 0 ? 6 : firstDay - 1;
    }
    return firstDay;
  };

  // Helper function to get headache severity level for a day
  const getHeadacheSeverity = (dayData) => {
    if (!dayData || dayData.headaches.length === 0) return 'none';
    
    // Calculate average pain level for the day
    const totalPain = dayData.headaches.reduce((sum, h) => sum + (h.painLevel || 0), 0);
    const avgPain = totalPain / dayData.headaches.length;
   
    if (avgPain <= 3) return 'mild';
    if (avgPain <= 6) return 'moderate';
    return 'severe';
  };

  // Helper function to get total headache duration for a day
  const getTotalDuration = (dayData) => {
    if (!dayData || dayData.headaches.length === 0) return 0;
    return dayData.headaches.reduce((sum, h) => sum + (h.duration || 0), 0);
  };

  // Helper function to get a severity emoji
  const getSeverityEmoji = (severity) => {
    switch (severity) {
      case 'mild': return '😐';
      case 'moderate': return '😣';
      case 'severe': return '😫';
      default: return '';
    }
  };

  // NEW: Helper function to check if headache is migraine
  const isMigraine = (headache) => {
    return headache.isMigraine === true;
  };

  // NEW: Helper function to get migraine count for a day
  const getMigraineCount = (dayData) => {
    if (!dayData || dayData.headaches.length === 0) return 0;
    return dayData.headaches.filter(h => isMigraine(h)).length;
  };

  // NEW: Helper function to get regular headache count for a day
  const getRegularHeadacheCount = (dayData) => {
    if (!dayData || dayData.headaches.length === 0) return 0;
    return dayData.headaches.filter(h => !isMigraine(h)).length;
  };

  // Calculate how many weeks to display
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Adjust day headers based on week start preference
  const dayHeaders = weekStartsOnMonday 
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const allCellsForCalendar = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    allCellsForCalendar.push(
      <div key={`empty-prefix-${i}`} style={{ flex: 1, padding: '0.5rem', minHeight: '70px' }}></div>
    );
  }

  // Fill in days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = calendarData[dateStr];
    const severity = getHeadacheSeverity(dayData);
    const totalDuration = getTotalDuration(dayData);
    const hasMedication = dayData && dayData.medications.length > 0;
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    
    // NEW: Get migraine and regular headache counts
    const migraineCount = getMigraineCount(dayData);
    const regularCount = getRegularHeadacheCount(dayData);

    allCellsForCalendar.push(
      <div
        key={day}
        onClick={() => onDateClick && onDateClick(dateStr, dayData)}
        style={{
          flex: 1, // Ensure cells expand to fill column width
          padding: '0.25rem',
          minHeight: '70px',
          border: isToday ? '3px solid #4682B4' : `2px solid ${getDayBorderColor(dayData, severity, migraineCount)}`,
          borderRadius: '12px',
          cursor: onDateClick ? 'pointer' : 'default',
          position: 'relative',
          background: isToday ? 'rgba(70, 130, 180, 0.1)' : getBackgroundColor(severity, migraineCount),
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          ':hover': { // Note: CSS-in-JS :hover like this is non-standard for React inline styles
            transform: 'scale(1.02)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        title={dayData ? 
          `${day}/${currentMonth + 1}: ${migraineCount} migraine(s), ${regularCount} regular headache(s)${totalDuration > 0 ? `, ${Math.round(totalDuration / 60)}h duration` : ''}, ${dayData.medications.length} medication(s). Click to add/edit.` : 
          `${day}/${currentMonth + 1} - Click to log headache for this date`
        }
      >
        {/* Day Number */}
        <div style={{ 
          fontSize: '0.9rem', 
          fontWeight: isToday ? 'bold' : severity !== 'none' ? '600' : 'normal',
          color: isToday ? '#4682B4' : (severity === 'severe' ? '#DC2626' : '#1F2937'),
          textAlign: 'center',
          width: '100%'
        }}>
          {day}
        </div>

        {/* Severity Indicator & Duration */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          width: '100%'
        }}>
          {/* NEW: Migraine Badge */}
          {migraineCount > 0 && (
            <div style={{ 
              background: '#DC2626',
              color: 'white',
              padding: '1px 4px',
              borderRadius: '6px',
              fontSize: '0.6rem',
              fontWeight: 'bold',
              marginBottom: '2px'
            }}>
              MIGRAINE
            </div>
          )}

          {/* Severity Emoji */}
          {severity !== 'none' && (
            <div style={{ 
              fontSize: '1.2rem',
              marginBottom: '2px'
            }}>
              {getSeverityEmoji(severity)}
            </div>
          )}

          {/* Duration Display */}
          {totalDuration > 0 && (
            <div style={{
              fontSize: '0.75rem',
              color: '#374151'
            }}>
              {Math.round(totalDuration)}m
            </div>
          )}
        </div>

        {/* Medication Cross Icon */}
        {hasMedication && (
          <div style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '12px',
            height: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Red Cross */}
            <div style={{
              position: 'absolute',
              top: '2px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '2px',
              height: '8px',
              background: '#DC2626',
              borderRadius: '1px'
            }} />
            <div style={{
              position: 'absolute',
              left: '2px',
              top: '50%',
              transform: 'translateY(-50%) rotate(90deg)',
              width: '2px',
              height: '8px',
              background: '#DC2626',
              borderRadius: '1px'
            }} />
          </div>
        )}

        {/* Quick Action Indicator */}
        {!dayData && (
          <div style={{
            position: 'absolute',
            bottom: '4px',
            right: '4px',
            width: '12px',
            height: '12px',
            background: 'rgba(70, 130, 180, 0.7)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Plus icon */}
            <div style={{
              width: '10px',
              height: '2px',
              background: '#FFF',
              position: 'absolute'
            }} />
            <div style={{
              width: '2px',
              height: '10px',
              background: '#FFF',
              position: 'absolute'
            }} />
          </div>
        )}
      </div>
    );
  }

  // Add empty suffix cells to fill up the grid to a multiple of 7
  // Total cells needed = (number of empty prefix cells + number of days in month) rounded up to the nearest multiple of 7
  const totalCellsInGrid = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  let currentCellCount = allCellsForCalendar.length;
  while (currentCellCount < totalCellsInGrid) {
    allCellsForCalendar.push(
      <div key={`empty-suffix-${currentCellCount}`} style={{ flex: 1, padding: '0.5rem', minHeight: '70px' }}></div>
    );
    currentCellCount++;
  }

  // Group allCellsForCalendar into weeks
  const weeks = [];
  for (let i = 0; i < allCellsForCalendar.length; i += 7) {
    const weekCells = allCellsForCalendar.slice(i, i + 7);
    weeks.push(
      <div key={`week-${i / 7}`} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {weekCells}
      </div>
    );
  }

  // Calendar Header and Stats
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <button onClick={() => {
          setCurrentMonth(prev => (prev - 1 + 12) % 12);
          if (currentMonth === 0) {
            setCurrentYear(prev => prev - 1);
          }
        }}>Previous</button>
        <h3 style={{ margin: 0 }}>{monthNames[currentMonth]} {currentYear}</h3>
        <button onClick={() => {
          setCurrentMonth(prev => (prev + 1) % 12);
          if (currentMonth === 11) {
            setCurrentYear(prev => prev + 1);
          }
        }}>Next</button>
      </div>

      {/* Day Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        {dayHeaders.map(day => (
          <div key={day} style={{ fontWeight: '600', color: '#4B5563', textAlign: 'center' }}>{day}</div>
        ))}
      </div>

      {/* Calendar Weeks */}
      {weeks}

      {/* Monthly Statistics - MOVED BELOW CALENDAR */}
      {(monthlyStats || migrainStats) && (
        <div style={{
          background: 'linear-gradient(135deg, #EFF6FF, #F0F9FF)',
          border: '1px solid #BFDBFE',
          borderRadius: '12px',
          padding: '1rem',
          marginTop: '1.5rem'
        }}>
          <h4 style={{
            margin: '0 0 0.75rem 0',
            fontSize: '1rem',
            fontWeight: '600',
            color: '#1E40AF',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            Monthly Summary
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.75rem',
            textAlign: 'center'
          }}>
            {/* Days-based Statistics */}
            <div style={{
              background: '#FFFFFF',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#DC2626' }}>
                {monthlyStats?.daysWithHeadaches || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                days with headaches
              </div>
            </div>
            <div style={{
              background: '#FFFFFF',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7C3AED' }}>
                {migrainStats?.daysWithMigraines || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                days with migraines
              </div>
            </div>
            <div style={{
              background: '#FFFFFF',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                {(monthlyStats?.daysWithHeadaches || 0) - (migrainStats?.daysWithMigraines || 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                days with regular headaches
              </div>
            </div>

            {/* Episode-based Statistics */}
            <div style={{
              background: '#FFFFFF',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8B5CF6' }}>
                {migrainStats?.totalMigraines || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                total migraines
              </div>
            </div>
            <div style={{
              background: '#FFFFFF',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#F472B6' }}>
                {migrainStats?.totalRegularHeadaches || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                total regular headaches
              </div>
            </div>

            {/* Medication Statistics */}
            <div style={{
              background: '#FFFFFF',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3B82F6' }}>
                {monthlyStats?.daysWithOTC || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                days with OTC meds
              </div>
            </div>
            <div style={{
              background: '#FFFFFF',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                {monthlyStats?.daysWithMigraineMeds || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                days with migraine meds
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// NEW: Helper for background color with migraine awareness
const getBackgroundColor = (severity, migraineCount) => {
  if (migraineCount > 0) {
    // Migraine days get a reddish background
    if (severity === 'severe') return '#FEE2E2'; // Light red
    if (severity === 'moderate') return '#FEF3F3'; // Very light red
    return '#FFF5F5'; // Extremely light red
  }
  
  // Regular headaches
  if (severity === 'none') return '#E5E7EB';
  if (severity === 'mild') return '#FEF3C7';
  if (severity === 'moderate') return '#FEE2E2';
  return '#FEE2E2';
};

// UPDATED: Helper for day border color with migraine awareness
const getDayBorderColor = (dayData, severity, migraineCount) => {
  const hasHeadache = dayData && dayData.headaches.length > 0;
  if (!hasHeadache) return '#E5E7EB'; // gray for no headache
  
  // Migraine days get different border colors
  if (migraineCount > 0) {
    if (severity === 'severe') return '#DC2626';    // Dark red for severe migraines
    if (severity === 'moderate') return '#EF4444';  // Red for moderate migraines
    return '#F87171';                               // Light red for mild migraines
  }
  
  // Regular headaches
  if (severity === 'severe') return '#F59E0B';     // Orange for severe regular
  if (severity === 'moderate') return '#FBBF24';   // Yellow for moderate regular
  return '#FDE047';                                // Light yellow for mild regular
};
