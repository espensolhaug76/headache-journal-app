// ==================== MODULE 1: WEEKLY HEALTH OVERVIEW ====================
const WeeklyHealthOverview = ({ dashboardData }) => {
  // Custom Tooltip for Chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '1rem',
          color: '#000000',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          fontSize: '0.85rem',
          minWidth: '200px'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '0.75rem', color: '#4682B4', fontSize: '0.9rem' }}>{label}</p>
          
          {payload.map((entry, index) => {
            if (entry.dataKey === 'sleepQualityPercent') {
              return (
                <div key={index} style={{ margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: entry.color, borderRadius: '50%' }} />
                  <span style={{ color: '#4B5563', fontSize: '0.85rem' }}>Sleep Quality: {entry.value}%</span>
                </div>
              );
            }
            if (entry.dataKey === 'stressPercent') {
              return (
                <div key={index} style={{ margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: entry.color, borderRadius: '50%' }} />
                  <span style={{ color: '#4B5563', fontSize: '0.85rem' }}>Stress Level: {entry.value}%</span>
                </div>
              );
            }
            if (entry.dataKey === 'headaches') {
              return (
                <div key={index} style={{ margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: entry.color, borderRadius: '50%' }} />
                  <span style={{ color: '#4B5563', fontSize: '0.85rem' }}>Headaches: {entry.value}</span>
                </div>
              );
            }
            if (entry.dataKey === 'avgPainLevelPercent') {
              return (
                <div key={index} style={{ margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: entry.color, borderRadius: '50%' }} />
                  <span style={{ color: '#4B5563', fontSize: '0.85rem' }}>Avg Pain: {Math.round(entry.value)}%</span>
                </div>
              );
            }
            return null;
          })}
          
          {data?.headachesByIntensity && Object.keys(data.headachesByIntensity).length > 0 && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              background: 'rgba(70, 130, 180, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(70, 130, 180, 0.1)'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#4682B4' }}>
                <i className="fas fa-head-side-virus" style={{ marginRight: '0.3rem' }}></i>
                Headache Details:
              </div>
              {Object.entries(data.headachesByIntensity).map(([intensity, count]) => (
                <div key={intensity} style={{ margin: '0.3rem 0', fontSize: '0.75rem', color: '#4B5563' }}>
                  • {count} headache{count > 1 ? 's' : ''} at {intensity}/10 intensity
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '16px',
      padding: '1rem',
      marginBottom: '3rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      overflow: 'hidden'
    }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h3 style={{ 
          margin: '0 0 0.5rem 0', 
          fontSize: '1.4rem', 
          fontWeight: '600',
          color: '#1E3A8A'
        }}>
          Weekly Health Overview
        </h3>
        <p style={{ 
          color: '#4B5563', 
          fontSize: '0.9rem', 
          margin: 0
        }}>
          Sleep quality, stress levels & headache tracking
        </p>
      </div>
      
      {dashboardData.sleepStressData.some(d => d.hasData) ? (
        <div style={{ width: '100%', height: '400px', minWidth: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={dashboardData.sleepStressData} 
              margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient id="sleepQualityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#20c997" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#20c997" stopOpacity={0.4}/>
                </linearGradient>
                <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc3545" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#dc3545" stopOpacity={0.4}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="2 2" stroke="rgba(75, 85, 99, 0.2)" />
              <XAxis 
                dataKey="day" 
                stroke="#4B5563"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="scale" 
                orientation="left" 
                domain={[0, 100]} 
                stroke="#4B5563"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <YAxis 
                yAxisId="count" 
                orientation="right" 
                domain={[0, 5]} 
                stroke="#4B5563"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '15px', color: '#4B5563', fontSize: '12px' }}
                iconType="circle"
              />
              
              {/* Sleep Quality Bars */}
              <Bar 
                yAxisId="scale"
                dataKey="sleepQualityPercent" 
                fill="url(#sleepQualityGradient)"
                name="Sleep Quality %"
                radius={[2, 2, 0, 0]}
                maxBarSize={25}
              />
              
              {/* Stress Level Bars */}
              <Bar 
                yAxisId="scale"
                dataKey="stressPercent" 
                fill="url(#stressGradient)"
                name="Stress Level %"
                radius={[2, 2, 0, 0]}
                maxBarSize={25}
              />
              
              {/* Headache Count Line */}
              <Line 
                yAxisId="count"
                type="monotone" 
                dataKey="headaches" 
                stroke="#4682B4" 
                strokeWidth={3}
                name="Headache Count"
                dot={{ fill: '#4682B4', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#4682B4', strokeWidth: 2 }}
              />
              
              {/* Average Headache Intensity Line (as percentage) */}
              <Line 
                yAxisId="scale"
                type="monotone" 
                dataKey="avgPainLevelPercent" 
                stroke="#ff6b35" 
                strokeWidth={3}
                strokeDasharray="5 5"
                name="Avg Headache Intensity %"
                dot={{ fill: '#ff6b35', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#ff6b35', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: '#9CA3AF',
          fontSize: '1.1rem'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>
            <i className="fas fa-chart-area"></i>
          </div>
          <p style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '500' }}>No data available yet</p>
          <p style={{ fontSize: '1rem', margin: '0', lineHeight: '1.5' }}>
            Start tracking your sleep, stress, and headaches to see patterns here!
          </p>
        </div>
      )}
    </div>
  );
};
// ==================== END MODULE 1 ====================

// ==================== MODULE 2: DAILY METRICS ====================
const DailyMetrics = ({ 
  dashboardData, 
  currentMetricDay, 
  setCurrentMetricDay, 
  onTouchStart, 
  onTouchMove, 
  onTouchEnd, 
  navigate 
}) => {
  // Calculate metrics for current day
  const currentDayMetrics = dashboardData.dailyMetrics[currentMetricDay] || {
    sleepHours: 0,
    sleepQuality: 0,
    stressLevel: 0,
    headacheCount: 0
  };

  const avgSleepQualityPercent = currentDayMetrics.sleepQuality * 10;
  const stressLevelPercent = currentDayMetrics.stressLevel * 10;

  // Circular Progress Component
  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = '#4682B4', label, value, unit = '', showPercentage = false }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#000000'
        }}>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', lineHeight: '1', color: color }}>
            {showPercentage ? `${Math.round(percentage)}%` : `${value}${unit}`}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#4B5563', marginTop: '4px', fontWeight: '500' }}>{label}</div>
        </div>
      </div>
    );
  };

  // Stats Display Component - Clickable Cards
  const StatsDisplay = ({ title, icon, children, color = '#4682B4', onClick, navigateTo }) => {
    const handleClick = () => {
      if (navigateTo) {
        navigate(navigateTo);
      } else if (onClick) {
        onClick();
      }
    };

    return (
      <div 
        onClick={handleClick}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease',
          minHeight: '200px',
          cursor: navigateTo || onClick ? 'pointer' : 'default',
          transform: 'scale(1)'
        }}
        onMouseEnter={e => {
          if (navigateTo || onClick) {
            e.target.style.transform = 'scale(1.02)';
            e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
          }
        }}
        onMouseLeave={e => {
          if (navigateTo || onClick) {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
          }
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem', 
          marginBottom: '1.5rem'
        }}>
          <i className={icon} style={{ fontSize: '1.2rem', color: color }}></i>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1rem', 
            fontWeight: '600', 
            color: '#4B5563'
          }}>
            {title}
          </h3>
          {(navigateTo || onClick) && (
            <i className="fas fa-arrow-right" style={{ fontSize: '0.8rem', color: '#9CA3AF', marginLeft: '0.5rem' }}></i>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setCurrentMetricDay(Math.max(0, currentMetricDay - 1))}
          disabled={currentMetricDay === 0}
          style={{
            background: 'transparent',
            border: 'none',
            color: currentMetricDay === 0 ? '#9CA3AF' : '#4682B4',
            cursor: currentMetricDay === 0 ? 'not-allowed' : 'pointer',
            fontSize: '1.5rem'
          }}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        
        <h2 style={{ 
          margin: 0, 
          fontSize: '1.3rem', 
          fontWeight: '600', 
          color: '#4682B4',
          textAlign: 'center',
          minWidth: '150px'
        }}>
          {dashboardData.dailyMetrics[currentMetricDay]?.dayLabel || 'Today'} Metrics
        </h2>
        
        <button
          onClick={() => setCurrentMetricDay(Math.min(2, currentMetricDay + 1))}
          disabled={currentMetricDay === 2}
          style={{
            background: 'transparent',
            border: 'none',
            color: currentMetricDay === 2 ? '#9CA3AF' : '#4682B4',
            cursor: currentMetricDay === 2 ? 'not-allowed' : 'pointer',
            fontSize: '1.5rem'
          }}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {/* Swipeable Health Metrics */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <StatsDisplay
          title="Sleep"
          icon="fas fa-bed"
          color="#20c997"
          navigateTo="/record-sleep"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#20c997',
                marginBottom: '0.5rem'
              }}>
                {currentDayMetrics.sleepHours}h
              </div>
              <div style={{ fontSize: '0.8rem', color: '#4B5563', fontWeight: '500' }}>
                Hours Slept
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#28a745',
                marginBottom: '0.5rem'
              }}>
                {Math.round(avgSleepQualityPercent)}%
              </div>
              <div style={{ fontSize: '0.8rem', color: '#4B5563', fontWeight: '500' }}>
                Quality
              </div>
            </div>
          </div>
        </StatsDisplay>

        <StatsDisplay
          title="Stress Level"
          icon="fas fa-brain"
          color="#dc3545"
          navigateTo="/record-stress"
        >
          <CircularProgress
            percentage={stressLevelPercent}
            color="#dc3545"
            label="Stress Level"
            value={currentDayMetrics.stressLevel}
            unit="/10"
            size={120}
            strokeWidth={8}
          />
        </StatsDisplay>

        <StatsDisplay
          title="Headaches"
          icon="fas fa-head-side-virus"
          color="#4682B4"
          navigateTo="/record-headache"
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              color: currentDayMetrics.headacheCount > 0 ? '#dc3545' : '#28a745',
              marginBottom: '0.5rem'
            }}>
              {currentDayMetrics.headacheCount}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#4B5563', fontWeight: '500' }}>
              {currentDayMetrics.headacheCount === 0 ? 'None Today' : 
               currentDayMetrics.headacheCount === 1 ? 'Headache' : 'Headaches'}
            </div>
            {currentDayMetrics.avgPainLevel > 0 && (
              <div style={{ fontSize: '0.8rem', color: '#dc3545', marginTop: '0.25rem' }}>
                Avg: {Math.round(currentDayMetrics.avgPainLevel)}/10
              </div>
            )}
          </div>
        </StatsDisplay>
      </div>
      
      {/* Swipe Indicator */}
      <div style={{ textAlign: 'center', marginTop: '1rem', color: '#9CA3AF', fontSize: '0.85rem' }}>
        <i className="fas fa-hand-point-left" style={{ marginRight: '0.5rem' }}></i>
        Swipe or use arrows to see previous days
        <i className="fas fa-hand-point-right" style={{ marginLeft: '0.5rem' }}></i>
      </div>
    </div>
  );
};
// ==================== END MODULE 2 ====================

// ==================== MODULE 3: CALENDAR VIEW ====================
const CalendarView = ({ dashboardData, currentMonth, setCurrentMonth, currentYear, setCurrentYear }) => {
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const getDayColor = (dateStr) => {
    const dayData = dashboardData.calendarData[dateStr];
    if (!dayData || dayData.headaches.length === 0) {
      return '#4CAF50'; // Green - no headache
    }
    
    const avgPainLevel = dayData.headaches.reduce((sum, h) => sum + (h.painLevel || 0), 0) / dayData.headaches.length;
    
    if (avgPainLevel <= 3) return '#FFA726'; // Orange - mild
    if (avgPainLevel <= 6) return '#FF7043'; // Orange-red - moderate  
    return '#F44336'; // Red - severe
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
    const dayData = dashboardData.calendarData[dateStr];
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    const dayColor = getDayColor(dateStr);
    const hasMedication = dayData && dayData.medications.length > 0;
    
    days.push(
      <div
        key={day}
        style={{
          padding: '0.25rem',
          minHeight: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: dayData ? 'pointer' : 'default'
        }}
        title={dayData ? 
          `${dayData.headaches.length} headache(s), ${dayData.medications.length} medication(s)` : 
          'No headaches'}
      >
        <div style={{
          width: '36px',
          height: '36px',
          backgroundColor: dayColor,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: isToday ? 'bold' : '500',
          fontSize: '0.9rem',
          border: isToday ? '2px solid #1E3A8A' : 'none',
          position: 'relative'
        }}>
          {day}
          {hasMedication && (
            <div style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              backgroundColor: '#2196F3',
              borderRadius: '50%',
              border: '1px solid white'
            }} />
          )}
        </div>
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
            fontSize: '1.5rem'
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
            fontSize: '1.5rem'
          }}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        {['M', 'T', 'O', 'T', 'F', 'L', 'S'].map((day, index) => (
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem'
      }}>
        {days}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1.5rem',
        marginTop: '1.5rem',
        fontSize: '0.8rem',
        color: '#4B5563',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#4CAF50', borderRadius: '4px' }} />
          No headache
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#FFA726', borderRadius: '4px' }} />
          Mild
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#FF7043', borderRadius: '4px' }} />
          Moderate
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#F44336', borderRadius: '4px' }} />
          Severe
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#2196F3', borderRadius: '50%' }} />
          Medication
        </div>
      </div>
    </div>
  );
};
// ==================== END MODULE 3 ====================

// ==================== MODULE 4: AI HEALTH INSIGHTS ====================
const AIHealthInsights = ({ dashboardData }) => {
  const { stats } = dashboardData;

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '16px',
      padding: '2rem',
      marginBottom: '3rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      <h3 style={{ 
        margin: '0 0 1.5rem 0', 
        fontSize: '1.3rem', 
        fontWeight: '600', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        color: '#1E3A8A',
        justifyContent: 'center'
      }}>
        <i className="fas fa-lightbulb"></i> AI Health Insights
      </h3>
      <div style={{ lineHeight: '1.7', fontSize: '1rem', color: '#4B5563' }}>
        {stats.totalHeadaches === 0 ? (
          <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(40, 167, 69, 0.1)', borderRadius: '12px', border: '1px solid rgba(40, 167, 69, 0.2)' }}>
            <div style={{ fontSize: '1.5rem', color: '#28a745' }}>
              <i className="fas fa-trophy"></i>
            </div>
            <span style={{ color: '#155724' }}>
              <strong>Excellent week!</strong> No headaches recorded. Keep up the good work with your healthy habits!
            </span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(70, 130, 180, 0.1)', borderRadius: '12px', border: '1px solid rgba(70, 130, 180, 0.2)' }}>
              <div style={{ fontSize: '1.5rem', color: '#4682B4' }}>
                <i className="fas fa-chart-bar"></i>
              </div>
              <span style={{ color: '#2c5aa0' }}>
                You've had <strong>{stats.totalHeadaches} headache{stats.totalHeadaches > 1 ? 's' : ''}</strong> this week. 
                {stats.avgSleepQuality < 6 && ' Poor sleep quality may be contributing to headaches.'}
                {stats.avgStressLevel > 7 && ' High stress levels could be triggering headaches.'}
              </span>
            </div>
            {stats.avgSleepHours < 7 && (
              <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.2)' }}>
                <div style={{ fontSize: '1.5rem', color: '#ffc107' }}>
                  <i className="fas fa-bed"></i>
                </div>
                <span style={{ color: '#856404' }}>
                  <strong>Sleep recommendation:</strong> You're averaging {stats.avgSleepHours} hours. Aim for 7-9 hours for optimal health.
                </span>
              </div>
            )}
            {stats.avgStressLevel > 6 && (
              <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(23, 162, 184, 0.1)', borderRadius: '12px', border: '1px solid rgba(23, 162, 184, 0.2)' }}>
                <div style={{ fontSize: '1.5rem', color: '#17a2b8' }}>
                  <i className="fas fa-brain"></i>
                </div>
                <span style={{ color: '#0c5460' }}>
                  <strong>Stress management:</strong> Your stress levels are elevated (avg: {stats.avgStressLevel}/10). Try stress reduction techniques like meditation or exercise.
                </span>
              </div>
            )}
          </>
        )}
        
        <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', padding: '1rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.2)' }}>
          <div style={{ fontSize: '1.5rem', color: '#ffc107' }}>
            <i className="fas fa-star"></i>
          </div>
          <span style={{ color: '#856404' }}>
            {stats.avgSleepQuality >= 7 && stats.avgStressLevel <= 5 
              ? 'Your sleep and stress management are excellent! This creates ideal conditions for headache prevention.'
              : 'Focus on improving sleep quality and reducing stress for better headache management.'}
          </span>
        </div>
      </div>
    </div>
  );
};
// ==================== END MODULE 4 ====================

// ==================== MONTHLY RECAP MODULE (BONUS) ====================
const MonthlyRecap = ({ dashboardData, currentMonth, currentYear }) => {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '16px',
      padding: '2rem',
      marginBottom: '3rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      <h3 style={{ 
        margin: '0 0 1.5rem 0', 
        fontSize: '1.3rem', 
        fontWeight: '600',
        color: '#1E3A8A',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        <i className="fas fa-chart-pie"></i>
        Monthly Overview
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Total Headaches */}
        <div style={{
          background: 'linear-gradient(135deg, #F44336 0%, #ff7043 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {Object.values(dashboardData.calendarData).reduce((sum, day) => sum + day.headaches.length, 0)}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Total Headaches
          </div>
        </div>

        {/* Headache-free Days */}
        <div style={{
          background: 'linear-gradient(135deg, #4CAF50 0%, #66bb6a 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {(() => {
              const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
              const headacheDays = Object.values(dashboardData.calendarData).filter(day => day.headaches.length > 0).length;
              return totalDays - headacheDays;
            })()}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Headache-free Days
          </div>
        </div>

        {/* Average Pain Level */}
        <div style={{
          background: 'linear-gradient(135deg, #FF9800 0%, #ffb74d 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {(() => {
              const allHeadaches = Object.values(dashboardData.calendarData).flatMap(day => day.headaches);
              if (allHeadaches.length === 0) return '0';
              const avgPain = allHeadaches.reduce((sum, h) => sum + (h.painLevel || 0), 0) / allHeadaches.length;
              return Math.round(avgPain * 10) / 10;
            })()}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Avg Pain Level
          </div>
        </div>

        {/* Medications Taken */}
        <div style={{
          background: 'linear-gradient(135deg, #2196F3 0%, #64b5f6 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {Object.values(dashboardData.calendarData).reduce((sum, day) => sum + day.medications.length, 0)}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Medications Taken
          </div>
        </div>
      </div>

      {/* Month Intensity Breakdown */}
      <div style={{ marginTop: '2rem' }}>
        <h4 style={{ 
          fontSize: '1.1rem', 
          fontWeight: '600', 
          color: '#4B5563', 
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          Headache Intensity Breakdown
        </h4>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {[
            { label: 'Mild (1-3)', color: '#FFA726', range: [1, 3] },
            { label: 'Moderate (4-6)', color: '#FF7043', range: [4, 6] },
            { label: 'Severe (7-10)', color: '#F44336', range: [7, 10] }
          ].map(intensity => {
            const count = Object.values(dashboardData.calendarData)
              .flatMap(day => day.headaches)
              .filter(h => h.painLevel >= intensity.range[0] && h.painLevel <= intensity.range[1])
              .length;
            
            return (
              <div key={intensity.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                color: '#4B5563'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: intensity.color,
                  borderRadius: '50%'
                }} />
                <span>{intensity.label}: <strong>{count}</strong></span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
// ==================== END MONTHLY RECAP MODULE ====================

// ==================== USAGE EXAMPLE ====================
/*
// Import required dependencies at the top of your Dashboard.js file:
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  ComposedChart
} from 'recharts';

// Then in your main Dashboard component, replace the corresponding sections with:

export default function Dashboard() {
  // ... your existing state and logic ...

  return (
    <div style={{ your dashboard container styles }}>
      {/* Replace the chart section with: */}
      <WeeklyHealthOverview dashboardData={dashboardData} />

      {/* Replace the metrics section with: */}
      <DailyMetrics 
        dashboardData={dashboardData}
        currentMetricDay={currentMetricDay}
        setCurrentMetricDay={setCurrentMetricDay}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        navigate={navigate}
      />

      {/* Replace the calendar section with: */}
      <CalendarView 
        dashboardData={dashboardData}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
        currentYear={currentYear}
        setCurrentYear={setCurrentYear}
      />

      {/* Replace the monthly recap section with: */}
      <MonthlyRecap 
        dashboardData={dashboardData}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />

      {/* Replace the AI insights section with: */}
      <AIHealthInsights dashboardData={dashboardData} />

      {/* Keep your existing logout button and other components */}
    </div>
  );
}
*/
// ==================== END USAGE EXAMPLE ====================
