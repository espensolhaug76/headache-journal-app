// Updated DailyMetricsModule.js with Combined Sleep Metrics - CLICKABLE VERSION
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

// New Combined Sleep Component
const CombinedSleepDisplay = ({ sleepHours, sleepQuality }) => {
  const sleepQualityPercent = sleepQuality * 10;
  const sleepHoursPercent = (sleepHours / 8) * 100;
  
  // Calculate overall sleep score (weighted: 60% quality, 40% duration)
  const overallSleepScore = (sleepQualityPercent * 0.6) + (sleepHoursPercent * 0.4);
  
  const getSleepColor = (score) => {
    if (score >= 80) return '#28a745'; // Green - Excellent
    if (score >= 60) return '#20c997'; // Teal - Good  
    if (score >= 40) return '#ffc107'; // Yellow - Fair
    return '#dc3545'; // Red - Poor
  };

  const getSleepRating = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Main Sleep Score Circle */}
      <div style={{ marginBottom: '1rem' }}>
        <CircularProgress
          percentage={overallSleepScore}
          color={getSleepColor(overallSleepScore)}
          label="Sleep Score"
          value=""
          showPercentage={true}
          size={120}
          strokeWidth={8}
        />
      </div>
      
      {/* Sleep Rating */}
      <div style={{
        fontSize: '1.1rem',
        fontWeight: '600',
        color: getSleepColor(overallSleepScore),
        marginBottom: '1rem'
      }}>
        {getSleepRating(overallSleepScore)}
      </div>

      {/* Detailed Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        fontSize: '0.85rem'
      }}>
        <div style={{
          padding: '0.75rem',
          background: 'rgba(32, 201, 151, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(32, 201, 151, 0.2)'
        }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#20c997', marginBottom: '0.25rem' }}>
            {sleepHours}h
          </div>
          <div style={{ color: '#4B5563', fontSize: '0.8rem' }}>
            Duration
          </div>
        </div>
        
        <div style={{
          padding: '0.75rem',
          background: 'rgba(32, 201, 151, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(32, 201, 151, 0.2)'
        }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#20c997', marginBottom: '0.25rem' }}>
            {sleepQuality}/10
          </div>
          <div style={{ color: '#4B5563', fontSize: '0.8rem' }}>
            Quality
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsDisplay = ({ title, icon, children, color = '#4682B4', onClick, isClickable = false }) => (
  <div 
    onClick={onClick}
    style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '16px',
      padding: '2rem 1.5rem',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'all 0.2s ease',
      minHeight: '200px',
      cursor: isClickable ? 'pointer' : 'default',
      position: 'relative',
      // Add hover effects for clickable items
      ...(isClickable && {
        ':hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          borderColor: color
        }
      })
    }}
    onMouseEnter={isClickable ? (e) => {
      e.target.style.transform = 'translateY(-2px)';
      e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
      e.target.style.borderColor = color;
    } : undefined}
    onMouseLeave={isClickable ? (e) => {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      e.target.style.borderColor = '#E5E7EB';
    } : undefined}
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
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      {children}
    </div>
    
    {/* Click indicator for interactive boxes */}
    {isClickable && (
      <div style={{
        position: 'absolute',
        top: '0.5rem',
        right: '0.5rem',
        width: '24px',
        height: '24px',
        background: `rgba(${color === '#20c997' ? '32, 201, 151' : 
                               color === '#dc3545' ? '220, 53, 69' : '70, 130, 180'}, 0.1)`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.7
      }}>
        <i className="fas fa-external-link-alt" style={{ 
          fontSize: '0.7rem', 
          color: color 
        }}></i>
      </div>
    )}
    
    {/* Tooltip for clickable items */}
    {isClickable && (
      <div style={{
        position: 'absolute',
        bottom: '0.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.7rem',
        opacity: 0,
        transition: 'opacity 0.2s ease',
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
      }}
      className="tooltip"
    >
      Click to view details
    </div>
    )}
  </div>
);

export default function DailyMetricsModule({ 
  dailyMetrics, 
  currentMetricDay, 
  setCurrentMetricDay, 
  onSwipe,
  onMetricsDayClick 
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

  const stressLevelPercent = currentDayMetrics.stressLevel * 10;

  // Handler for metric box clicks
  const handleMetricClick = () => {
    if (onMetricsDayClick) {
      onMetricsDayClick(currentMetricDay);
    }
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

      {/* Updated Grid - Now 3 columns instead of 4, all clickable */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Combined Sleep Metrics - CLICKABLE */}
        <StatsDisplay
          title="Sleep"
          icon="fas fa-bed"
          color="#20c997"
          onClick={handleMetricClick}
          isClickable={true}
        >
          <CombinedSleepDisplay
            sleepHours={currentDayMetrics.sleepHours}
            sleepQuality={currentDayMetrics.sleepQuality}
          />
        </StatsDisplay>

        {/* Stress Level - CLICKABLE */}
        <StatsDisplay
          title="Stress Level"
          icon="fas fa-brain"
          color="#dc3545"
          onClick={handleMetricClick}
          isClickable={true}
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

        {/* Headaches - CLICKABLE */}
        <StatsDisplay
          title="Headaches"
          icon="fas fa-head-side-virus"
          color="#4682B4"
          onClick={handleMetricClick}
          isClickable={true}
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
        Swipe or use arrows to see previous days • Click boxes to manage data
        <i className="fas fa-hand-point-right" style={{ marginLeft: '0.5rem' }}></i>
      </div>
      
      {/* Add CSS for hover tooltips */}
      <style>
        {`
          .tooltip {
            opacity: 0 !important;
          }
          
          div:hover .tooltip {
            opacity: 1 !important;
          }
        `}
      </style>
    </div>
  );
}
