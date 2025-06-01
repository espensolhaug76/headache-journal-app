import React from 'react';

export default function CalendarModule({
  calendarData,
  currentMonth,
  currentYear,
  setCurrentMonth,
  setCurrentYear
}) {
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
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

  // Helper function to get day background color based on severity
  const getDayBackgroundColor = (severity) => {
    switch (severity) {
      case 'none': return '#FFFFFF'; // White - no headache
      case 'mild': return '#FEF3C7'; // Light yellow - mild
      case 'moderate': return '#FED7AA'; // Light orange - moderate  
      case 'severe': return '#FECACA'; // Light red - severe
      default: return '#FFFFFF';
    }
  };

  // Helper function to get day border color (for headache attacks)
  const getDayBorderColor = (dayData, severity) => {
    const hasHeadache = dayData && dayData.headaches.length > 0;
    
    if (!hasHeadache) return '#E5E7EB'; // Default gray border
    
    // Red border for headache days, intensity varies by severity
    switch (severity) {
      case 'mild': return '#F59E0B'; // Yellow border
      case 'moderate': return '#F97316'; // Orange border
      case 'severe': return '#DC2626'; // Red border
      default: return '#E5E7EB';
    }
  };

  // Helper function to get severity emoji
  const getSeverityEmoji = (severity) => {
    switch (severity) {
      case 'mild': return '😐';
      case 'moderate': return '😣';
      case 'severe': return '😫';
      default: return '';
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} style={{ padding: '0.5rem' }}></div>);
  }
  
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = calendarData[dateStr];
    const severity = getHeadacheSeverity(dayData);
    const totalDuration = getTotalDuration(dayData);
    const hasMedication = dayData && dayData.medications.length > 0;
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    
    days.push(
      <div
        key={day}
        style={{
          padding: '0.25rem',
          minHeight: '70px',
          border: isToday ? '3px solid #4682B4' : `2px solid ${getDayBorderColor(dayData, severity)}`,
          borderRadius: '12px',
          cursor: dayData ? 'pointer' : 'default',
          position: 'relative',
          background: isToday ? 'rgba(70, 130, 180, 0.1)' : getDayBackgroundColor(severity),
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
        title={dayData ? 
          `${day}/${currentMonth + 1}: ${dayData.headaches.length} headache(s)${totalDuration > 0 ? `, ${Math.round(totalDuration / 60)}h duration` : ''}, ${dayData.medications.length} medication(s)` : 
          `${day}/${currentMonth + 1}`
        }
      >
        {/* Day Number */}
        <div style={{ 
          fontSize: '0.9rem', 
          fontWeight: isToday ? 'bold' : severity !== 'none' ? '600' : 'normal',
          color: isToday ? '#4682B4' : severity === 'severe' ? '#DC2626' : '#1F2937',
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
              fontSize: '0.6rem',
              color: '#6B7280',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              {totalDuration >= 60 ? 
                `${Math.round(totalDuration / 60)}h` : 
                `${totalDuration}m`}
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
            <div style={{
              width: '8px',
              height: '8px',
              position: 'relative'
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
                top: '50%',
                left: '1px',
                transform: 'translateY(-50%)',
                width: '8px',
                height: '2px',
                background: '#DC2626',
                borderRadius: '1px'
              }} />
            </div>
          </div>
        )}

        {/* Multiple Headaches Indicator */}
        {dayData && dayData.headaches.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: '2px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.6rem',
            color: '#DC2626',
            fontWeight: 'bold',
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '1px 3px',
            borderRadius: '2px'
          }}>
            {dayData.headaches.length}×
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '16px',
      padding: '1.5rem',
      marginBottom: '3rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      {/* Header with Navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem' 
      }}>
        <button
          onClick={() => {
            if (currentMonth === 0) {
              setCurrentMonth(11);
              setCurrentYear(currentYear - 1);
            } else {
              setCurrentMonth(currentMonth - 1);
            }
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#4682B4',
            cursor: 'pointer',
            fontSize: '1.5rem',
            padding: '0.5rem'
          }}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        
        <h3 style={{ 
          margin: 0, 
          fontSize: '1.3rem', 
          fontWeight: '600', 
          color: '#1E3A8A',
          textAlign: 'center' 
        }}>
          {monthNames[currentMonth]} {currentYear}
        </h3>
        
        <button
          onClick={() => {
            if (currentMonth === 11) {
              setCurrentMonth(0);
              setCurrentYear(currentYear + 1);
            } else {
              setCurrentMonth(currentMonth + 1);
            }
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#4682B4',
            cursor: 'pointer',
            fontSize: '1.5rem',
            padding: '0.5rem'
          }}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {/* Day Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{
            padding: '0.5rem',
            textAlign: 'center',
            fontWeight: 'bold',
            color: '#4B5563',
            fontSize: '0.9rem'
          }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem'
      }}>
        {days}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: '#F9FAFB',
        borderRadius: '12px',
        border: '1px solid #E5E7EB'
      }}>
        <h4 style={{ 
          margin: '0 0 1rem 0', 
          fontSize: '1rem', 
          fontWeight: '600',
          color: '#4682B4',
          textAlign: 'center'
        }}>
          Calendar Legend
        </h4>
        
        {/* Severity Colors */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
            Headache Severity:
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '16px',
                height: '16px',
                background: '#FFFFFF',
                border: '2px solid #E5E7EB',
                borderRadius: '4px'
              }} />
              <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>No headache</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '16px',
                height: '16px',
                background: '#FEF3C7',
                border: '2px solid #F59E0B',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6rem'
              }}>
                😐
              </div>
              <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>Mild (1-3)</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '16px',
                height: '16px',
                background: '#FED7AA',
                border: '2px solid #F97316',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6rem'
              }}>
                😣
              </div>
              <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>Moderate (4-6)</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '16px',
                height: '16px',
                background: '#FECACA',
                border: '2px solid #DC2626',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6rem'
              }}>
                😫
              </div>
              <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>Severe (7-10)</span>
            </div>
          </div>
        </div>

        {/* Other Indicators */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '16px',
              height: '16px',
              position: 'relative',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '4px'
            }}>
              {/* Red Cross */}
              <div style={{
                position: 'absolute',
                top: '5px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '2px',
                height: '8px',
                background: '#DC2626',
                borderRadius: '1px'
              }} />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '2px',
                transform: 'translateY(-50%)',
                width: '8px',
                height: '2px',
                background: '#DC2626',
                borderRadius: '1px'
              }} />
            </div>
            <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>Medication taken</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '3px solid #4682B4',
              borderRadius: '4px',
              background: 'rgba(70, 130, 180, 0.1)'
            }} />
            <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>Today</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              fontSize: '0.7rem',
              color: '#DC2626',
              fontWeight: 'bold',
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '1px 3px',
              borderRadius: '2px',
              border: '1px solid #E5E7EB'
            }}>
              2×
            </div>
            <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>Multiple headaches</span>
          </div>
        </div>
      </div>
    </div>
  );
}
