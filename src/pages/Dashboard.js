import React, { useState, useEffect } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
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
const CircularProgress = ({ percentage, size = 80, strokeWidth = 8, color = '#ff6b35', label, value, unit = '' }) => {
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
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
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
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{value}{unit}</div>
        <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{label}</div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon, gradient, children }) => (
  <div className="garmin-stat-card" style={{
    background: gradient || 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '1.5rem',
    color: 'white',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{ position: 'relative', zIndex: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', opacity: 0.9 }}>{title}</h3>
      </div>
      {children || (
        <div>
          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{subtitle}</div>
          )}
        </div>
      )}
    </div>
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '60px',
      height: '60px',
      background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
      borderRadius: '50%',
      transform: 'translate(20px, -20px)'
    }} />
  </div>
);

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div style={{
        background: 'rgba(26, 26, 26, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        padding: '1rem',
        color: 'white',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{label}</p>
        {payload.map((entry, index) => {
          if (entry.dataKey === 'painPercentage') {
            return (
              <p key={index} style={{ color: '#888', margin: '0.25rem 0' }}>
                Daily Pain: {entry.value}% of your worst day
              </p>
            );
          }
          return (
            <p key={index} style={{ color: entry.color, margin: '0.25rem 0' }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'sleepHours' && ' hours'}
              {(entry.dataKey === 'sleepQuality' || entry.dataKey === 'stressLevel') && '/10'}
              {entry.dataKey === 'headaches' && (entry.value === 1 ? ' headache' : ' headaches')}
            </p>
          );
        })}
        
        {data?.headachesByIntensity && Object.keys(data.headachesByIntensity).length > 0 && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: 'rgba(255, 107, 53, 0.1)',
            borderRadius: '6px',
            fontSize: '0.8rem',
            border: '1px solid rgba(255, 107, 53, 0.2)'
          }}>
            <strong>Headache Details:</strong>
            {Object.entries(data.headachesByIntensity).map(([intensity, count]) => (
              <div key={intensity} style={{ margin: '0.25rem 0' }}>
                {count} headache{count > 1 ? 's' : ''} at {intensity}/10 pain
              </div>
            ))}
            {data.dailyPainScore > 0 && (
              <div style={{ color: '#ccc', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                Total pain score: {data.dailyPainScore} ({data.painPercentage}% of worst day)
              </div>
            )}
          </div>
        )}
        
        <div style={{
          marginTop: '0.5rem',
          padding: '0.5rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '6px',
          fontSize: '0.75rem'
        }}>
          {getTooltipInsight(data)}
        </div>
      </div>
    );
  }
  return null;
};

// Helper function for tooltip insights
function getTooltipInsight(data) {
  const sleepQualityPercent = data?.sleepQualityPercent || 0;
  const stressPercent = data?.stressPercent || 0;
  const painPercentage = data?.painPercentage || 0;

  if (painPercentage === 0 && sleepQualityPercent >= 70 && stressPercent <= 40) {
    return "✅ Perfect day! Good sleep + low stress = no headaches";
  } else if (painPercentage > 50 && (sleepQualityPercent < 50 || stressPercent > 60)) {
    return "⚠️ High pain day - poor sleep or high stress may be triggers";
  } else if (painPercentage === 0) {
    return "😊 Headache-free day!";
  } else if (painPercentage < 25) {
    return "✨ Low pain day - great progress!";
  } else if (painPercentage < 50) {
    return "📊 Moderate pain day - look for patterns";
  } else {
    return "🤕 High pain day - focus on triggers";
  }
}

export default function GarminDashboard() {
  const [dashboardData] = useState(mockDashboardData);

  // Calculate averages for circular progress
  const avgSleepQuality = dashboardData.sleepStressData.reduce((sum, d) => sum + (d.sleepQualityPercent || 0), 0) / 7;
  const avgStress = 100 - (dashboardData.sleepStressData.reduce((sum, d) => sum + (d.stressPercent || 0), 0) / 7); // Inverted for progress
  const weeklyProgress = Math.max(0, 100 - (dashboardData.todayStats.weekHeadaches * 10)); // Less headaches = more progress

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
      minHeight: '100vh',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>Health Dashboard</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '0.5rem 0 0 0' }}>
              Your 7-day health insights
            </p>
          </div>
          <button style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)'
          }}>
            Log Out
          </button>
        </div>
      </div>

      <div style={{ padding: '2rem' }}>
        {/* Quick Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <StatCard
            title="Last Night's Sleep"
            icon="💤"
            gradient="linear-gradient(135deg, #2c5aa0 0%, #1e3f73 100%)"
          >
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              {dashboardData.todayStats.lastSleep?.hoursSlept}h
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
              Quality: {dashboardData.todayStats.lastSleep?.sleepQuality}/10
            </div>
          </StatCard>

          <StatCard
            title="Current Stress"
            icon="😰"
            gradient="linear-gradient(135deg, #dc3545 0%, #a02834 100%)"
          >
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              {dashboardData.todayStats.todayStress?.stressLevel}/10
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
              Latest reading
            </div>
          </StatCard>

          <StatCard
            title="This Week's Headaches"
            icon="🤕"
            gradient="linear-gradient(135deg, #ff6b35 0%, #cc4a1a 100%)"
          >
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              {dashboardData.todayStats.weekHeadaches}
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
              Past 7 days
            </div>
          </StatCard>

          <StatCard
            title="Quick Actions"
            icon="⚡"
            gradient="linear-gradient(135deg, #28a745 0%, #1e7e34 100%)"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '0.75rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                Log Headache
              </button>
              <button style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                padding: '0.75rem',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}>
                Log Sleep
              </button>
            </div>
          </StatCard>
        </div>

        {/* Progress Indicators */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <StatCard
            title="Sleep Quality"
            icon="🌙"
            gradient="linear-gradient(135deg, #2c5aa0 0%, #1e3f73 100%)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <CircularProgress
                percentage={avgSleepQuality}
                color="#4a90e2"
                label="Avg Quality"
                value={Math.round(avgSleepQuality)}
                unit="%"
                size={70}
              />
              <div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>7-day average</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Target: 80%+</div>
              </div>
            </div>
          </StatCard>

          <StatCard
            title="Stress Management"
            icon="🧘"
            gradient="linear-gradient(135deg, #28a745 0%, #1e7e34 100%)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <CircularProgress
                percentage={avgStress}
                color="#28a745"
                label="Low Stress"
                value={Math.round(avgStress)}
                unit="%"
                size={70}
              />
              <div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Control level</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Higher = better</div>
              </div>
            </div>
          </StatCard>

          <StatCard
            title="Weekly Progress"
            icon="📈"
            gradient="linear-gradient(135deg, #ff6b35 0%, #cc4a1a 100%)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <CircularProgress
                percentage={weeklyProgress}
                color="#ff6b35"
                label="Progress"
                value={Math.round(weeklyProgress)}
                unit="%"
                size={70}
              />
              <div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Health score</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Fewer headaches</div>
              </div>
            </div>
          </StatCard>
        </div>

        {/* Main Chart */}
        <div style={{
          background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem', fontWeight: '600' }}>
            Sleep, Stress & Headache Correlation
          </h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Track how your sleep quality and stress levels impact headache frequency • Orange dots = headaches (larger = more intense)
          </p>
          
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={dashboardData.sleepStressData}>
              <defs>
                <linearGradient id="painGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(255, 107, 53, 0.3)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="rgba(255, 107, 53, 0.1)" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="day" 
                stroke="rgba(255, 255, 255, 0.7)"
                fontSize={12}
              />
              <YAxis 
                yAxisId="hours" 
                orientation="left" 
                domain={[0, 12]} 
                stroke="rgba(255, 255, 255, 0.7)"
                fontSize={12}
              />
              <YAxis 
                yAxisId="scale" 
                orientation="right" 
                domain={[0, 100]} 
                stroke="rgba(255, 255, 255, 0.7)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Background Pain Bars */}
              <Bar 
                yAxisId="scale"
                dataKey="painPercentage" 
                fill="url(#painGradient)"
                name="Daily Pain (%)"
                radius={[4, 4, 0, 0]}
              />
              
              {/* Sleep Hours */}
              <Line 
                yAxisId="hours"
                type="monotone" 
                dataKey="sleepHours" 
                stroke="#4a90e2" 
                strokeWidth={3}
                name="Sleep Hours"
                dot={{ fill: '#4a90e2', strokeWidth: 2, r: 5 }}
              />
              
              {/* Sleep Quality */}
              <Line 
                yAxisId="scale"
                type="monotone" 
                dataKey="sleepQualityPercent" 
                stroke="#28a745" 
                strokeWidth={3}
                name="Sleep Quality"
                dot={{ fill: '#28a745', strokeWidth: 2, r: 5 }}
              />
              
              {/* Stress Level */}
              <Line 
                yAxisId="scale"
                type="monotone" 
                dataKey="stressPercent" 
                stroke="#dc3545" 
                strokeWidth={3}
                name="Stress Level"
                dot={{ fill: '#dc3545', strokeWidth: 2, r: 5 }}
              />
              
              {/* Headache Scatter Points */}
              <Line 
                yAxisId="scale"
                type="monotone" 
                dataKey="headaches" 
                stroke="transparent"
                strokeWidth={0}
                name="Headaches"
                line={false}
                dot={({ cx, cy, payload }) => {
                  if (!payload.headachesByIntensity || Object.keys(payload.headachesByIntensity).length === 0) {
                    return null;
                  }

                  const dots = [];
                  Object.entries(payload.headachesByIntensity).forEach(([intensity, count]) => {
                    const intensityNum = parseInt(intensity);
                    const intensityPercent = intensityNum * 10;
                    const yPos = cy - (intensityPercent / 100) * (cy - 50);
                    const size = Math.max(10, Math.min(24, 10 + count * 4));
                    
                    dots.push(
                      <g key={`${cx}-${intensity}`}>
                        <circle 
                          cx={cx} 
                          cy={yPos} 
                          r={size} 
                          fill="#ff6b35" 
                          stroke="#fff" 
                          strokeWidth={2}
                          opacity={0.9}
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                        />
                        <text 
                          x={cx} 
                          y={yPos + 4} 
                          textAnchor="middle" 
                          fill="white" 
                          fontSize="11" 
                          fontWeight="bold"
                        >
                          {count}
                        </text>
                      </g>
                    );
                  });

                  return <g>{dots}</g>;
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Headache Frequency Chart */}
        <div style={{
          background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem', fontWeight: '600' }}>
            Headache Frequency (Past 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dashboardData.headacheData}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#cc4a1a" stopOpacity={0.7}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="day" stroke="rgba(255, 255, 255, 0.7)" fontSize={12} />
              <YAxis stroke="rgba(255, 255, 255, 0.7)" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  background: 'rgba(26, 26, 26, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Bar 
                dataKey="headaches" 
                fill="url(#barGradient)" 
                name="Headaches"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%)',
          border: '1px solid rgba(255, 107, 53, 0.2)',
          borderRadius: '16px',
          padding: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💡 Your Health Insights
          </h3>
          <div style={{ lineHeight: '1.6' }}>
            <p>• Better sleep appears to lower your stress levels. Prioritize sleep for stress management!</p>
            <p>• Higher stress levels seem to coincide with more headaches. Stress management may help reduce headache frequency.</p>
            <p>• You tend to get more headaches on days with high stress and poor sleep quality. This is a key pattern to address!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
