import React from 'react';

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

const StatsDisplay = ({ title, icon, children, color = '#4682B4' }) => (
  <div style={{
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '16px',
    padding: '2rem 1.5rem',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.2s ease',
    minHeight: '200px'
  }}>
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
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      {children}
    </div>
  </div>
);

export default function DailyMetricsModule({ 
  dailyMetrics, 
  currentMetricDay, 
  setCurrentMetricDay, 
  onSwipe 
}) {
  const handleTouchStart = (e) => {
    const touchStart = e.targetTouches[0].clientX;
    e.currentTarget.touchStart = touchStart;
  };

  const handleTouchMove = (e) => {
    e.currentTarget.touchEnd = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchStart = e.currentTarget.touchStart;
    const touchEnd = e.currentTarget.touchEnd;
    
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentMetricDay < 2) {
      setCurrentMetricDay(currentMetricDay + 1);
    } else if (isRightSwipe && currentMetricDay > 0) {
      setCurrentMetricDay(currentMetricDay - 1);
    }
  };

  const currentDayMetrics = dailyMetrics[currentMetricDay] || {
    sleepHours: 0,
    sleepQuality: 0,
    stressLevel: 0,
    headacheCount: 0,
    avgPainLevel: 0
  };

  const avgSleepQualityPercent = currentDayMetrics.sleepQuality * 10;
  const stressLevelPercent = currentDayMetrics.stressLevel * 10;
  const sleepHoursPercent = (currentDayMetrics.sleepHours / 8) * 100;

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
          {dailyMetrics[currentMetricDay]?.dayLabel || 'Today'} Metrics
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

      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <StatsDisplay
          title="Sleep Quality"
          icon="fas fa-moon"
          color="#20c997"
        >
          <CircularProgress
            percentage={avgSleepQualityPercent}
            color="#20c997"
            label="Quality Rating"
            value=""
            showPercentage={true}
            size={120}
            strokeWidth={8}
          />
        </StatsDisplay>

        <StatsDisplay
          title="Sleep Hours"
          icon="fas fa-bed"
          color="#28a745"
        >
          <CircularProgress
            percentage={sleepHoursPercent}
            color="#28a745"
            label="Hours Slept"
            value={currentDayMetrics.sleepHours}
            unit="h"
            size={120}
            strokeWidth={8}
          />
        </StatsDisplay>

        <StatsDisplay
          title="Stress Level"
          icon="fas fa-brain"
          color="#dc3545"
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
      
      <div style={{ textAlign: 'center', marginTop: '1rem', color: '#9CA3AF', fontSize: '0.85rem' }}>
        <i className="fas fa-hand-point-left" style={{ marginRight: '0.5rem' }}></i>
        Swipe or use arrows to see previous days
        <i className="fas fa-hand-point-right" style={{ marginLeft: '0.5rem' }}></i>
      </div>
    </div>
  );
}