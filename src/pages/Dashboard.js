import React, { useState } from 'react';
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

// Mock data for demonstration
const mockDashboardData = {
  sleepStressData: [
    { day: 'Mon', sleepHours: 7.5, sleepQualityPercent: 80, stressPercent: 30, headaches: 0, painPercentage: 0, hasData: true },
    { day: 'Tue', sleepHours: 6.2, sleepQualityPercent: 60, stressPercent: 70, headaches: 2, painPercentage: 45, hasData: true, headachesByIntensity: { '6': 1, '4': 1 }, dailyPainScore: 10 },
    { day: 'Wed', sleepHours: 8.1, sleepQualityPercent: 90, stressPercent: 20, headaches: 0, painPercentage: 0, hasData: true },
    { day: 'Thu', sleepHours: 7.0, sleepQualityPercent: 70, stressPercent: 50, headaches: 1, painPercentage: 25, hasData: true, headachesByIntensity: { '5': 1 }, dailyPainScore: 5 },
    { day: 'Fri', sleepHours: 5.8, sleepQualityPercent: 40, stressPercent: 80, headaches: 3, painPercentage: 85, hasData: true, headachesByIntensity: { '8': 1, '6': 2 }, dailyPainScore: 20 },
    { day: 'Sat', sleepHours: 9.2, sleepQualityPercent: 95, stressPercent: 15, headaches: 0, painPercentage: 0, hasData: true },
    { day: 'Sun', sleepHours: 8.0, sleepQualityPercent: 85, stressPercent: 25, headaches: 1, painPercentage: 15, hasData: true, headachesByIntensity: { '3': 1 }, dailyPainScore: 3 }
  ],
  headacheData: [
    { day: 'Mon', headaches: 0 },
    { day: 'Tue', headaches: 2 },
    { day: 'Wed', headaches: 0 },
    { day: 'Thu', headaches: 1 },
    { day: 'Fri', headaches: 3 },
    { day: 'Sat', headaches: 0 },
    { day: 'Sun', headaches: 1 }
  ],
  todayStats: {
    lastSleep: { hoursSlept: 8.0, sleepQuality: 8.5 },
    todayStress: { stressLevel: 2.5 },
    weekHeadaches: 7,
    todayWater: 6,
    personalWorstDay: 24
  }
};

// Circular Progress Component
const CircularProgress = ({ percentage, size = 100, strokeWidth = 8, color = '#ff6b35', label, value, unit = '', showPercentage = false }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="circular-progress" style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
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
        color: 'white'
      }}>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', lineHeight: '1' }}>
          {showPercentage ? `${Math.round(percentage)}%` : `${value}${unit}`}
        </div>
        <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '2px' }}>{label}</div>
      </div>
    </div>
  );
};

// Action Button Component
const ActionButton = ({ icon, label, primary = false, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: primary 
        ? 'linear-gradient(135deg, #ff6b35 0%, #cc4a1a 100%)' 
        : 'rgba(255, 255, 255, 0.1)',
      border: primary ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      color: 'white',
      padding: '1rem',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: primary ? '600' : '500',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.2s ease',
      minHeight: '50px'
    }}
    onMouseEnter={(e) => {
      e.target.style.transform = 'translateY(-2px)';
      e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = 'none';
    }}
  >
    <span style={{ fontSize: '1.2rem' }}>{icon}</span>
    {label}
  </button>
);

// Progress Card Component  
const ProgressCard = ({ title, icon, children, gradient }) => (
  <div style={{
    background: gradient || 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '1.5rem',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', opacity: 0.9 }}>{title}</h3>
      </div>
      {children}
    </div>
    <div style={{
      position: 'absolute',
      top: '-20px',
      right: '-20px',
      width: '80px',
      height: '80px',
      background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
      borderRadius: '50%'
    }} />
  </div>
);

// Custom Tooltip inspired by Garmin
const GarminTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div style={{
        background: 'rgba(26, 26, 26, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        padding: '1rem',
        color: 'white',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        fontSize: '0.85rem'
      }}>
        <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#ff6b35' }}>{label}</p>
        
        {payload.map((entry, index) => {
          if (entry.dataKey === 'painPercentage') {
            return (
              <div key={index} style={{ margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: entry.color, borderRadius: '50%' }} />
                <span style={{ color: '#ccc' }}>Daily Pain: {entry.value}%</span>
              </div>
            );
          }
          return (
            <div key={index} style={{ margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: entry.color, borderRadius: '50%' }} />
              <span style={{ color: entry.color }}>
                {entry.name}: {entry.value}
                {entry.dataKey === 'sleepHours' && ' hrs'}
                {(entry.dataKey === 'sleepQuality' || entry.dataKey === 'stressLevel') && '/10'}
              </span>
            </div>
          );
        })}
        
        {data?.headachesByIntensity && Object.keys(data.headachesByIntensity).length > 0 && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.5rem',
            background: 'rgba(255, 107, 53, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 107, 53, 0.2)'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.8rem' }}>🤕 Headache Details:</div>
            {Object.entries(data.headachesByIntensity).map(([intensity, count]) => (
              <div key={intensity} style={{ margin: '0.2rem 0', fontSize: '0.75rem' }}>
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

export default function GarminDashboard() {
  const [dashboardData] = useState(mockDashboardData);

  // Calculate metrics for progress cards
  const avgSleepQuality = dashboardData.sleepStressData.reduce((sum, d) => sum + (d.sleepQualityPercent || 0), 0) / 7;
  const avgStress = 100 - (dashboardData.sleepStressData.reduce((sum, d) => sum + (d.stressPercent || 0), 0) / 7);
  const weeklyProgress = Math.max(0, 100 - (dashboardData.todayStats.weekHeadaches * 10));
  const avgSleepHours = dashboardData.sleepStressData.reduce((sum, d) => sum + (d.sleepHours || 0), 0) / 7;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
      minHeight: '100vh',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem 2rem',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>Health Dashboard</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '0.3rem 0 0 0', fontSize: '0.9rem' }}>
              Your 7-day health insights
            </p>
          </div>
          <button style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            padding: '0.6rem 1.2rem',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            fontSize: '0.9rem'
          }}>
            Log Out
          </button>
        </div>
      </div>

      <div style={{ padding: '2rem' }}>
        {/* Quick Actions */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '600', opacity: 0.9 }}>
            ⚡ Quick Actions
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <ActionButton icon="🤕" label="Log Headache" primary={true} />
            <ActionButton icon="💤" label="Log Sleep" />
            <ActionButton icon="😰" label="Log Stress" />
            <ActionButton icon="🏃" label="Log Exercise" />
          </div>
        </div>

        {/* Main Chart - Garmin Style */}
        <div style={{
          background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '600' }}>
                Weekly Health Overview
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                Sleep, stress & headache correlation • Orange bars show pain intensity
              </p>
            </div>
            <div style={{ 
              background: 'rgba(255, 107, 53, 0.1)', 
              padding: '0.5rem 1rem', 
              borderRadius: '20px',
              border: '1px solid rgba(255, 107, 53, 0.2)',
              fontSize: '0.8rem'
            }}>
              📊 Past 7 Days
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={dashboardData.sleepStressData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="painGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ff6b35" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4a90e2" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4a90e2" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="2 2" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="day" 
                stroke="rgba(255, 255, 255, 0.8)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="hours" 
                orientation="left" 
                domain={[0, 12]} 
                stroke="rgba(255, 255, 255, 0.8)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="scale" 
                orientation="right" 
                domain={[0, 100]} 
                stroke="rgba(255, 255, 255, 0.8)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<GarminTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              
              {/* Pain Percentage Bars - Garmin style */}
              <Bar 
                yAxisId="scale"
                dataKey="painPercentage" 
                fill="url(#painGradient)"
                name="Pain Level"
                radius={[2, 2, 0, 0]}
                maxBarSize={40}
              />
              
              {/* Sleep Hours as Area-like bars */}
              <Bar 
                yAxisId="hours"
                dataKey="sleepHours" 
                fill="url(#sleepGradient)"
                name="Sleep Hours"
                radius={[2, 2, 0, 0]}
                maxBarSize={25}
                opacity={0.7}
              />
              
              {/* Sleep Quality Line */}
              <Line 
                yAxisId="scale"
                type="monotone" 
                dataKey="sleepQualityPercent" 
                stroke="#28a745" 
                strokeWidth={3}
                name="Sleep Quality"
                dot={{ fill: '#28a745', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#28a745', strokeWidth: 2 }}
              />
              
              {/* Stress Level Line */}
              <Line 
                yAxisId="scale"
                type="monotone" 
                dataKey="stressPercent" 
                stroke="#dc3545" 
                strokeWidth={3}
                name="Stress Level"
                dot={{ fill: '#dc3545', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#dc3545', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Progress Cards */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '600', opacity: 0.9 }}>
            📊 Health Metrics
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem'
          }}>
            <ProgressCard
              title="Sleep Quality"
              icon="🌙"
              gradient="linear-gradient(135deg, #2c5aa0 0%, #1e3f73 100%)"
            >
              <CircularProgress
                percentage={avgSleepQuality}
                color="#4a90e2"
                label="Average"
                value=""
                showPercentage={true}
                size={90}
              />
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
                Target: 80%+
              </div>
            </ProgressCard>

            <ProgressCard
              title="Sleep Hours"
              icon="💤"
              gradient="linear-gradient(135deg, #28a745 0%, #1e7e34 100%)"
            >
              <CircularProgress
                percentage={(avgSleepHours / 8) * 100}
                color="#28a745"
                label="Average"
                value={avgSleepHours.toFixed(1)}
                unit="h"
                size={90}
              />
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
                Target: 7-9h
              </div>
            </ProgressCard>

            <ProgressCard
              title="Stress Control"
              icon="🧘"
              gradient="linear-gradient(135deg, #17a2b8 0%, #117a8b 100%)"
            >
              <CircularProgress
                percentage={avgStress}
                color="#17a2b8"
                label="Control"
                value=""
                showPercentage={true}
                size={90}
              />
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
                Higher = Better
              </div>
            </ProgressCard>

            <ProgressCard
              title="Weekly Score"
              icon="📈"
              gradient="linear-gradient(135deg, #ff6b35 0%, #cc4a1a 100%)"
            >
              <CircularProgress
                percentage={weeklyProgress}
                color="#ff6b35"
                label="Health"
                value=""
                showPercentage={true}
                size={90}
              />
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
                {dashboardData.todayStats.weekHeadaches} headaches this week
              </div>
            </ProgressCard>
          </div>
        </div>

        {/* AI Insights */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%)',
          border: '1px solid rgba(255, 107, 53, 0.2)',
          borderRadius: '16px',
          padding: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💡 AI Health Insights
          </h3>
          <div style={{ lineHeight: '1.7', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📊</span>
              <span>Better sleep appears to lower your stress levels. Prioritize sleep for stress management!</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🤕</span>
              <span>Higher stress levels coincide with more headaches. Consider stress management techniques.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <span>You tend to get more headaches on days with high stress and poor sleep quality. This is a key pattern to address!</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
