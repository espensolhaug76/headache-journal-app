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
  monthlyStats
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

  // Adjust day headers based on week start preference
  const dayHeaders = weekStartsOnMonday 
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
        onClick={() => onDateClick && onDateClick(dateStr, dayData)}
        style={{
          padding: '0.25rem',
          minHeight: '70px',
          border: isToday ? '3px solid #4682B4' : `2px solid ${getDayBorderColor(dayData, severity)}`,
          borderRadius: '12px',
          cursor: 'pointer', // Always clickable now
          position: 'relative',
          background: isToday ? 'rgba(70, 130, 180, 0.1)' : getDayBackgroundColor(severity),
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          ':hover': {
            transform: 'scale(1.02)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.02)';
          e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = 'none';
        }}
        title={dayData ? 
          `${day}/${currentMonth + 1}: ${dayData.headaches.length} headache(s)${totalDuration > 0 ? `, ${Math.round(totalDuration / 60)}h duration` : ''}, ${dayData.medications.length} medication(s). Click to add/edit.` : 
          `${day}/${currentMonth + 1} - Click to log headache for this date`
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
            justifyContent: 'center',
            opacity: 0.6
          }}>
            <i className="fas fa-plus" style={{ 
              fontSize: '0.5rem', 
              color: 'white' 
            }}></i>
          </div>
        )}

        {/* Edit Indicator for existing data */}
        {dayData && (
          <div style={{
            position: 'absolute',
            bottom: '4px',
            left: '4px',
            width: '10px',
            height: '10px',
            background: 'rgba(70, 130, 180, 0.7)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.6
          }}>
            <i className="fas fa-edit" style={{ 
              fontSize: '0.4rem', 
              color: 'white' 
            }}></i>
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

      {/* Week Start Preference Toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '1rem',
        gap: '1rem'
      }}>
        <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>Week starts on:</span>
        <div style={{
          display: 'flex',
          background: '#F3F4F6',
          borderRadius: '8px',
          padding: '2px'
        }}>
          <button
            onClick={() => setWeekStartsOnMonday(false)}
            style={{
              padding: '6px 12px',
              background: !weekStartsOnMonday ? '#4682B4' : 'transparent',
              color: !weekStartsOnMonday ? 'white' : '#6B7280',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            Sunday
          </button>
          <button
            onClick={() => setWeekStartsOnMonday(true)}
            style={{
              padding: '6px 12px',
              background: weekStartsOnMonday ? '#4682B4' : 'transparent',
              color: weekStartsOnMonday ? 'white' : '#6B7280',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            Monday
          </button>
        </div>
      </div>

      {/* Monthly Statistics */}
      {monthlyStats && (
        <div style={{
          background: 'linear-gradient(135deg, #EFF6FF, #F0F9FF)',
          border: '1px solid #BFDBFE',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <h4 style={{
            margin: '0 0 0.75rem 0',
            fontSize: '1rem',
            fontWeight: '600',
            color: '#1E40AF',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <i className="fas fa-chart-bar"></i>
            This Month's Summary
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.75rem',
            textAlign: 'center'
          }}>
            <div style={{
              background: '#FFFFFF',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#DC2626' }}>
                {monthlyStats.daysWithHeadaches}
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
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#F59E0B' }}>
                {monthlyStats.totalAttacks}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                total attacks
              </div>
            </div>
            
            <div style={{
              background: '#FFFFFF',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3B82F6' }}>
                {monthlyStats.daysWithOTC}
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
                {monthlyStats.daysWithMigraineMeds}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                days with migraine meds
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        {dayHeaders.map(day => (
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: 'rgba(70, 130, 180, 0.7)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="fas fa-plus" style={{ 
                fontSize: '0.5rem', 
                color: 'white' 
              }}></i>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>Click empty day to add</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '10px',
              height: '10px',
              background: 'rgba(70, 130, 180, 0.7)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="fas fa-edit" style={{ 
                fontSize: '0.4rem', 
                color: 'white' 
              }}></i>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>Click day with data to edit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
