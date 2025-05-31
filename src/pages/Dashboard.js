// Dashboard.js - Main Container
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Import modular components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import QuickActionsModule from '../components/dashboard/QuickActionsModule';
import WeeklyHealthChart from '../components/dashboard/WeeklyHealthChart';
import DailyMetricsModule from '../components/dashboard/DailyMetricsModule';
import CalendarModule from '../components/dashboard/CalendarModule';
import AIInsightsModule from '../components/dashboard/AIInsightsModule';
import LogoutButton from '../components/dashboard/LogoutButton';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [currentMetricDay, setCurrentMetricDay] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dashboardData, setDashboardData] = useState({
    sleepStressData: [],
    dailyMetrics: [],
    calendarData: {},
    loading: true,
    error: null,
    stats: {
      totalHeadaches: 0,
      avgSleepHours: 0,
      avgSleepQuality: 0,
      avgStressLevel: 0,
      personalWorstDay: 0
    }
  });

  // Data fetching logic (keep in main Dashboard.js)
  useEffect(() => {
    // ... existing fetchDashboardData logic
  }, [currentUser, currentMonth, currentYear]);

  // Event handlers
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleSwipe = (direction) => {
    if (direction === 'left' && currentMetricDay < 2) {
      setCurrentMetricDay(currentMetricDay + 1);
    } else if (direction === 'right' && currentMetricDay > 0) {
      setCurrentMetricDay(currentMetricDay - 1);
    }
  };

  if (dashboardData.loading) {
    return (
      <div style={{ /* loading styles */ }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#4682B4' }}>
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <div>Loading your health data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh', color: '#000000' }}>
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />

      <DashboardHeader currentUser={currentUser} />
      
      <div style={{ padding: '0 1rem 2rem 1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {dashboardData.error && (
            <div style={{ /* error styles */ }}>
              {dashboardData.error}
            </div>
          )}

          <QuickActionsModule 
            showQuickActions={showQuickActions}
            setShowQuickActions={setShowQuickActions}
          />

          <WeeklyHealthChart 
            data={dashboardData.sleepStressData}
          />

          <DailyMetricsModule
            dailyMetrics={dashboardData.dailyMetrics}
            currentMetricDay={currentMetricDay}
            setCurrentMetricDay={setCurrentMetricDay}
            onSwipe={handleSwipe}
          />

          <CalendarModule
            calendarData={dashboardData.calendarData}
            currentMonth={currentMonth}
            currentYear={currentYear}
            setCurrentMonth={setCurrentMonth}
            setCurrentYear={setCurrentYear}
          />

          <AIInsightsModule 
            stats={dashboardData.stats}
          />

          <LogoutButton onLogout={handleLogout} />
        </div>
      </div>
    </div>
  );
}

// ===========================================
// COMPONENT 1: DashboardHeader.js
// ===========================================
import React from 'react';

export default function DashboardHeader({ currentUser }) {
  return (
    <div style={{
      padding: '2rem 1rem 1rem 1rem',
      background: '#F9FAFB'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '2rem', 
          fontWeight: '700',
          color: '#1E3A8A',
          textAlign: 'center'
        }}>
          Ultimate Migraine Tracker
        </h1>
        <p style={{ 
          color: '#4B5563', 
          margin: '0.5rem 0', 
          fontSize: '1rem',
          textAlign: 'center'
        }}>
          Welcome back, {currentUser?.email?.split('@')[0]}!
        </p>
      </div>
    </div>
  );
}

// ===========================================
// COMPONENT 2: QuickActionsModule.js
// ===========================================
import React from 'react';
import { Link } from 'react-router-dom';

const ActionButton = ({ icon, label, primary = false, to }) => {
  const buttonStyle = {
    background: primary 
      ? 'linear-gradient(135deg, #4682B4 0%, #2c5aa0 100%)' 
      : '#FFFFFF',
    border: primary ? 'none' : '1px solid #E5E7EB',
    borderRadius: '12px',
    color: primary ? 'white' : '#000000',
    padding: '1rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: primary ? '600' : '500',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    boxShadow: primary ? '0 2px 8px rgba(70, 130, 180, 0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
    minWidth: '100px',
    flex: 1
  };

  return (
    <Link to={to} style={buttonStyle}>
      <i className={icon} style={{ fontSize: '1.5rem', color: primary ? 'white' : '#4682B4' }}></i>
      <span style={{ fontSize: '0.85rem', textAlign: 'center' }}>{label}</span>
    </Link>
  );
};

export default function QuickActionsModule({ showQuickActions, setShowQuickActions }) {
  return (
    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
      <button
        onClick={() => setShowQuickActions(!showQuickActions)}
        style={{
          background: showQuickActions ? '#4682B4' : '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          color: showQuickActions ? 'white' : '#4682B4',
          padding: '1rem 2rem',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: '0 auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease'
        }}
      >
        <i className="fas fa-plus"></i>
        <span>Quick Actions</span>
        <i className={`fas fa-chevron-${showQuickActions ? 'up' : 'down'}`} style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}></i>
      </button>

      {showQuickActions && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            paddingBottom: '0.5rem'
          }}>
            <div style={{ minWidth: '140px', flex: 'none' }}>
              <ActionButton icon="fas fa-head-side-virus" label="Log Headache" primary={true} to="/record-headache" />
            </div>
            <div style={{ minWidth: '140px', flex: 'none' }}>
              <ActionButton icon="fas fa-pills" label="Log Medication" to="/record-medication" />
            </div>
            <div style={{ minWidth: '140px', flex: 'none' }}>
              <ActionButton icon="fas fa-bed" label="Log Sleep" to="/record-sleep" />
            </div>
            <div style={{ minWidth: '140px', flex: 'none' }}>
              <ActionButton icon="fas fa-brain" label="Log Stress" to="/record-stress" />
            </div>
            <div style={{ minWidth: '140px', flex: 'none' }}>
              <ActionButton icon="fas fa-running" label="Log Exercise" to="/record-exercise" />
            </div>
            <div style={{ minWidth: '140px', flex: 'none' }}>
              <ActionButton icon="fas fa-apple-alt" label="Log Nutrition" to="/record-nutrition" />
            </div>
            <div style={{ minWidth: '140px', flex: 'none' }}>
              <ActionButton icon="fas fa-user-injured" label="Log Body Pain" to="/record-body-pain" />
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '0.5rem', color: '#9CA3AF', fontSize: '0.8rem' }}>
            <i className="fas fa-hand-point-left" style={{ marginRight: '0.5rem' }}></i>
            Swipe to see all options
            <i className="fas fa-hand-point-right" style={{ marginLeft: '0.5rem' }}></i>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// COMPONENT 3: WeeklyHealthChart.js
// ===========================================
import React from 'react';
import {
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

export default function WeeklyHealthChart({ data }) {
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
      
      {data.some(d => d.hasData) ? (
        <div style={{ width: '100%', height: '400px', minWidth: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={data} 
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
              
              <Bar 
                yAxisId="scale"
                dataKey="sleepQualityPercent" 
                fill="url(#sleepQualityGradient)"
                name="Sleep Quality %"
                radius={[2, 2, 0, 0]}
                maxBarSize={25}
              />
              
              <Bar 
                yAxisId="scale"
                dataKey="stressPercent" 
                fill="url(#stressGradient)"
                name="Stress Level %"
                radius={[2, 2, 0, 0]}
                maxBarSize={25}
              />
              
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
}

// ===========================================
// COMPONENT 4: DailyMetricsModule.js
// ===========================================
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

// ===========================================
// COMPONENT 5: CalendarModule.js
// ===========================================
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
    const hasHeadache = dayData && dayData.headaches.length > 0;
    const hasMedication = dayData && dayData.medications.length > 0;
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    
    days.push(
      <div
        key={day}
        style={{
          padding: '0.5rem',
          minHeight: '60px',
          border: isToday ? '2px solid #4682B4' : '1px solid #E5E7EB',
          borderRadius: '8px',
          cursor: dayData ? 'pointer' : 'default',
          position: 'relative',
          background: isToday ? 'rgba(70, 130, 180, 0.1)' : '#FFFFFF'
        }}
        title={dayData ? `${dayData.headaches.length} headache(s), ${dayData.medications.length} medication(s)` : ''}
      >
        <div style={{ fontSize: '0.9rem', fontWeight: isToday ? 'bold' : 'normal' }}>
          {day}
        </div>
        {hasHeadache && (
          <div style={{
            width: '8px',
            height: '8px',
            background: '#dc3545',
            borderRadius: '50%',
            position: 'absolute',
            top: '8px',
            right: '8px'
          }} />
        )}
        {hasMedication && (
          <div style={{
            width: '8px',
            height: '8px',
            background: '#28a745',
            borderRadius: '50%',
            position: 'absolute',
            bottom: '8px',
            right: '8px'
          }} />
        )}
        {dayData && (
          <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
            {dayData.headaches.length > 0 && `H:${dayData.headaches.length} `}
            {dayData.medications.length > 0 && `M:${dayData.medications.length}`}
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem'
      }}>
        {days}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '2rem',
        marginTop: '1rem',
        fontSize: '0.85rem',
        color: '#4B5563'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#dc3545',
            borderRadius: '50%'
          }} />
          Headache
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#28a745',
            borderRadius: '50%'
          }} />
          Medication
        </div>
      </div>
    </div>
  );
}

// ===========================================
// COMPONENT 6: AIInsightsModule.js
// ===========================================
import React from 'react';

export default function AIInsightsModule({ stats }) {
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
        textAlign: 'center'
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
}

// ===========================================
// COMPONENT 7: LogoutButton.js
// ===========================================
import React from 'react';

export default function LogoutButton({ onLogout }) {
  return (
    <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
      <button 
        onClick={onLogout}
        style={{
          background: 'transparent',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          color: '#4B5563',
          padding: '1rem 2rem',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: '0 auto'
        }}>
        <i className="fas fa-sign-out-alt"></i>
        Log Out
      </button>
    </div>
  );
}

// ===========================================
// FOLDER STRUCTURE RECOMMENDATION:
// ===========================================
/*
src/
├── components/
│   └── dashboard/
│       ├── DashboardHeader.js
│       ├── QuickActionsModule.js
│       ├── WeeklyHealthChart.js
│       ├── DailyMetricsModule.js
│       ├── CalendarModule.js
│       ├── AIInsightsModule.js
│       └── LogoutButton.js
├── pages/
│   └── Dashboard.js (main container)
└── ...
*/

// ===========================================
// UPDATED MAIN DASHBOARD.JS EXAMPLE:
// ===========================================
/*
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Import modular components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import QuickActionsModule from '../components/dashboard/QuickActionsModule';
import WeeklyHealthChart from '../components/dashboard/WeeklyHealthChart';
import DailyMetricsModule from '../components/dashboard/DailyMetricsModule';
import CalendarModule from '../components/dashboard/CalendarModule';
import AIInsightsModule from '../components/dashboard/AIInsightsModule';
import LogoutButton from '../components/dashboard/LogoutButton';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [currentMetricDay, setCurrentMetricDay] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dashboardData, setDashboardData] = useState({
    sleepStressData: [],
    dailyMetrics: [],
    calendarData: {},
    loading: true,
    error: null,
    stats: { totalHeadaches: 0, avgSleepHours: 0, avgSleepQuality: 0, avgStressLevel: 0, personalWorstDay: 0 }
  });

  // Data fetching logic (keep existing fetchDashboardData function here)
  useEffect(() => {
    // ... your existing data fetching logic
  }, [currentUser, currentMonth, currentYear]);

  // Event handlers
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  if (dashboardData.loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh', color: '#000000' }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <DashboardHeader currentUser={currentUser} />
      
      <div style={{ padding: '0 1rem 2rem 1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {dashboardData.error && <div>{dashboardData.error}</div>}

          <QuickActionsModule 
            showQuickActions={showQuickActions}
            setShowQuickActions={setShowQuickActions}
          />

          <WeeklyHealthChart 
            data={dashboardData.sleepStressData}
          />

          <DailyMetricsModule
            dailyMetrics={dashboardData.dailyMetrics}
            currentMetricDay={currentMetricDay}
            setCurrentMetricDay={setCurrentMetricDay}
          />

          <CalendarModule
            calendarData={dashboardData.calendarData}
            currentMonth={currentMonth}
            currentYear={currentYear}
            setCurrentMonth={setCurrentMonth}
            setCurrentYear={setCurrentYear}
          />

          <AIInsightsModule 
            stats={dashboardData.stats}
          />

          <LogoutButton onLogout={handleLogout} />
        </div>
      </div>
    </div>
  );
}
*/
