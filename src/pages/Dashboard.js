import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
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

export default function EnhancedDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    sleepStressData: [],
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

  // Fetch data from Firebase
  useEffect(() => {
    if (!currentUser) return;

    const fetchDashboardData = async () => {
      try {
        setDashboardData(prev => ({ ...prev, loading: true, error: null }));

        // Get last 7 days of data
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Fetch sleep data
        const sleepQuery = query(
          collection(db, 'users', currentUser.uid, 'sleep'),
          where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
          orderBy('createdAt', 'desc'),
          limit(7)
        );
        const sleepSnapshot = await getDocs(sleepQuery);
        const sleepData = sleepSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch stress data
        const stressQuery = query(
          collection(db, 'users', currentUser.uid, 'stress'),
          where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
          orderBy('createdAt', 'desc'),
          limit(7)
        );
        const stressSnapshot = await getDocs(stressQuery);
        const stressData = stressSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch headache data
        const headacheQuery = query(
          collection(db, 'users', currentUser.uid, 'headaches'),
          where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
          orderBy('createdAt', 'desc')
        );
        const headacheSnapshot = await getDocs(headacheQuery);
        const headacheData = headacheSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Process and combine data for the last 7 days
        const processedData = processLast7Days(sleepData, stressData, headacheData);
        
        // Calculate stats
        const stats = calculateStats(sleepData, stressData, headacheData);

        setDashboardData({
          sleepStressData: processedData,
          loading: false,
          error: null,
          stats
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard data. Please try refreshing.'
        }));
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  // Process last 7 days of data
  const processLast7Days = (sleepData, stressData, headacheData) => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find data for this date
      const sleepEntry = sleepData.find(entry => entry.date === dateStr);
      const stressEntry = stressData.find(entry => entry.date === dateStr);
      const dayHeadaches = headacheData.filter(entry => {
        const entryDate = entry.createdAt?.toDate ? 
          entry.createdAt.toDate().toISOString().split('T')[0] : 
          entry.date;
        return entryDate === dateStr;
      });

      // Calculate headache metrics for this day
      const headacheCount = dayHeadaches.length;
      const totalPainScore = dayHeadaches.reduce((sum, h) => sum + (h.painLevel || 0), 0);
      const avgPainLevel = headacheCount > 0 ? totalPainScore / headacheCount : 0;

      // Group headaches by intensity for visualization
      const headachesByIntensity = {};
      dayHeadaches.forEach(headache => {
        const intensity = headache.painLevel || 0;
        headachesByIntensity[intensity] = (headachesByIntensity[intensity] || 0) + 1;
      });

      days.push({
        day: dayNames[date.getDay()],
        date: dateStr,
        sleepHours: sleepEntry?.hoursSlept || 0,
        sleepQuality: sleepEntry?.sleepQuality || 0,
        sleepQualityPercent: sleepEntry ? (sleepEntry.sleepQuality || 0) * 10 : 0,
        stressLevel: stressEntry?.stressLevel || 0,
        stressPercent: stressEntry ? (stressEntry.stressLevel || 0) * 10 : 0,
        headaches: headacheCount,
        avgPainLevel: avgPainLevel,
        totalPainScore: totalPainScore,
        headachesByIntensity: headachesByIntensity,
        hasData: sleepEntry || stressEntry || headacheCount > 0
      });
    }

    // Calculate pain percentages relative to personal worst day
    const maxPainScore = Math.max(...days.map(d => d.totalPainScore), 1);
    days.forEach(day => {
      day.painPercentage = maxPainScore > 0 ? Math.round((day.totalPainScore / maxPainScore) * 100) : 0;
    });

    return days;
  };

  // Calculate summary stats
  const calculateStats = (sleepData, stressData, headacheData) => {
    const totalHeadaches = headacheData.length;
    const avgSleepHours = sleepData.length > 0 ? 
      sleepData.reduce((sum, entry) => sum + (entry.hoursSlept || 0), 0) / sleepData.length : 0;
    const avgSleepQuality = sleepData.length > 0 ? 
      sleepData.reduce((sum, entry) => sum + (entry.sleepQuality || 0), 0) / sleepData.length : 0;
    const avgStressLevel = stressData.length > 0 ? 
      stressData.reduce((sum, entry) => sum + (entry.stressLevel || 0), 0) / stressData.length : 0;
    
    // Calculate personal worst day (highest total pain score)
    const personalWorstDay = Math.max(...headacheData.map(h => h.painLevel || 0), 1);

    return {
      totalHeadaches,
      avgSleepHours: Math.round(avgSleepHours * 10) / 10,
      avgSleepQuality: Math.round(avgSleepQuality * 10) / 10,
      avgStressLevel: Math.round(avgStressLevel * 10) / 10,
      personalWorstDay
    };
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
  const ActionButton = ({ icon, label, primary = false, onClick, to }) => {
    const buttonStyle = {
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
      minHeight: '50px',
      textDecoration: 'none',
      justifyContent: 'center'
    };

    const content = (
      <>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        {label}
      </>
    );

    const handleHover = (e, isEnter) => {
      if (isEnter) {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
      } else {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = 'none';
      }
    };

    if (to) {
      return (
        <Link
          to={to}
          style={buttonStyle}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        onClick={onClick}
        style={buttonStyle}
        onMouseEnter={(e) => handleHover(e, true)}
        onMouseLeave={(e) => handleHover(e, false)}
      >
        {content}
      </button>
    );
  };

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

  // Custom Tooltip for Chart
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
                  {(entry.dataKey === 'sleepQualityPercent' || entry.dataKey === 'stressPercent') && '%'}
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  if (dashboardData.loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        minHeight: '100vh',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem'
      }}>
        Loading your health data...
      </div>
    );
  }

  // Calculate metrics for progress cards
  const { stats } = dashboardData;
  const avgSleepQualityPercent = stats.avgSleepQuality * 10;
  const avgStressPercent = 100 - (stats.avgStressLevel * 10); // Invert for "control"
  const weeklyProgress = Math.max(0, 100 - (stats.totalHeadaches * 10));
  const sleepHoursPercent = (stats.avgSleepHours / 8) * 100;

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
              Welcome back, {currentUser?.email?.split('@')[0]}! Here's your 7-day health insights
            </p>
          </div>
          <button 
            onClick={handleLogout}
            style={{
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
        {dashboardData.error && (
          <div style={{
            background: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '2rem',
            color: '#ff6b6b'
          }}>
            {dashboardData.error}
          </div>
        )}

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
            <ActionButton icon="🤕" label="Log Headache" primary={true} to="/record-headache" />
            <ActionButton icon="💤" label="Log Sleep" to="/record-sleep" />
            <ActionButton icon="😰" label="Log Stress" to="/record-stress" />
            <ActionButton icon="🏃" label="Log Exercise" to="/record-exercise" />
          </div>
        </div>

        {/* Main Chart */}
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
          
          {dashboardData.sleepStressData.some(d => d.hasData) ? (
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
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                
                {/* Pain Percentage Bars */}
                <Bar 
                  yAxisId="scale"
                  dataKey="painPercentage" 
                  fill="url(#painGradient)"
                  name="Pain Level (%)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={40}
                />
                
                {/* Sleep Hours Bars */}
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
                  name="Sleep Quality (%)"
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
                  name="Stress Level (%)"
                  dot={{ fill: '#dc3545', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#dc3545', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '1.1rem'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <p>No data available yet</p>
              <p style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>Start tracking your sleep, stress, and headaches to see patterns here!</p>
            </div>
          )}
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
                percentage={avgSleepQualityPercent}
                color="#4a90e2"
                label="Average"
                value=""
                showPercentage={true}
                size={90}
              />
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
                Target: 80%+ • Avg: {stats.avgSleepQuality}/10
              </div>
            </ProgressCard>

            <ProgressCard
              title="Sleep Hours"
              icon="💤"
              gradient="linear-gradient(135deg, #28a745 0%, #1e7e34 100%)"
            >
              <CircularProgress
                percentage={sleepHoursPercent}
                color="#28a745"
                label="Average"
                value={stats.avgSleepHours}
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
                percentage={avgStressPercent}
                color="#17a2b8"
                label="Control"
                value=""
                showPercentage={true}
                size={90}
              />
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
                Avg Stress: {stats.avgStressLevel}/10
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
                {stats.totalHeadaches} headaches this week
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
            {stats.totalHeadaches === 0 ? (
              <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🎉</span>
                <span>Great news! No headaches recorded this week. Keep up the good work with your healthy habits!</span>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>📊</span>
                  <span>
                    You've had {stats.totalHeadaches} headache{stats.totalHeadaches > 1 ? 's' : ''} this week. 
                    {stats.avgSleepQuality < 6 && ' Poor sleep quality may be contributing to headaches.'}
                    {stats.avgStressLevel > 7 && ' High stress levels could be triggering headaches.'}
                  </span>
                </div>
                {stats.avgSleepHours < 7 && (
                  <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>💤</span>
                    <span>Consider getting more sleep - you're averaging {stats.avgSleepHours} hours. Aim for 7-9 hours for optimal health.</span>
                  </div>
                )}
                {stats.avgStressLevel > 6 && (
                  <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🧘</span>
                    <span>Your stress levels are elevated (avg: {stats.avgStressLevel}/10). Try stress management techniques like meditation or exercise.</span>
                  </div>
                )}
              </>
            )}
            
            <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.2rem' }}>✨</span>
              <span>
                {stats.avgSleepQuality >= 7 && stats.avgStressLevel <= 5 
                  ? 'Your sleep and stress management are excellent! This creates ideal conditions for headache prevention.'
                  : 'Focus on improving sleep quality and reducing stress for better headache management.'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600', opacity: 0.9 }}>
            📋 Record More Data
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem'
          }}>
            <Link to="/record-nutrition" style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              textDecoration: 'none',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🥗</span>
              <span style={{ fontSize: '0.9rem' }}>Nutrition</span>
            </Link>
            
            <Link to="/record-body-pain" style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              textDecoration: 'none',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🦴</span>
              <span style={{ fontSize: '0.9rem' }}>Body Pain</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
