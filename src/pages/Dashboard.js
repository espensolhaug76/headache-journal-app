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

  // Circular Progress Component - Light Mode Version
  const CircularProgress = ({ percentage, size = 100, strokeWidth = 6, color = '#4682B4', label, value, unit = '', showPercentage = false }) => {
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
          <div style={{ fontSize: '1.4rem', fontWeight: '700', lineHeight: '1', color: color }}>
            {showPercentage ? `${Math.round(percentage)}%` : `${value}${unit}`}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#4B5563', marginTop: '4px', fontWeight: '500' }}>{label}</div>
        </div>
      </div>
    );
  };

  // Action Button Component - Light Mode
  const ActionButton = ({ icon, label, primary = false, onClick, to }) => {
    const buttonStyle = {
      background: primary 
        ? 'linear-gradient(135deg, #4682B4 0%, #2c5aa0 100%)' 
        : '#FFFFFF',
      border: primary ? 'none' : '1px solid #E5E7EB',
      borderRadius: '12px',
      color: primary ? 'white' : '#000000',
      padding: '1rem 1.25rem',
      cursor: 'pointer',
      fontSize: '0.95rem',
      fontWeight: primary ? '600' : '500',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      transition: 'all 0.2s ease',
      minHeight: '56px',
      textDecoration: 'none',
      justifyContent: 'center',
      boxShadow: primary ? '0 2px 8px rgba(70, 130, 180, 0.2)' : '0 1px 3px rgba(0,0,0,0.1)'
    };

    const content = (
      <>
        <span style={{ fontSize: '1.3rem', color: primary ? 'white' : '#4682B4' }}>{icon}</span>
        <span>{label}</span>
      </>
    );

    const handleHover = (e, isEnter) => {
      if (isEnter) {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = primary 
          ? '0 4px 16px rgba(70, 130, 180, 0.3)' 
          : '0 4px 12px rgba(0,0,0,0.15)';
      } else {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = primary 
          ? '0 2px 8px rgba(70, 130, 180, 0.2)' 
          : '0 1px 3px rgba(0,0,0,0.1)';
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

  // Stats Display Component - Light Mode
  const StatsDisplay = ({ title, icon, children, color = '#4682B4' }) => (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '16px',
      padding: '1.5rem',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'all 0.2s ease'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '0.5rem', 
        marginBottom: '1rem'
      }}>
        <span style={{ fontSize: '1.1rem', color: color }}>{icon}</span>
        <h3 style={{ 
          margin: 0, 
          fontSize: '0.9rem', 
          fontWeight: '600', 
          color: '#4B5563'
        }}>
          {title}
        </h3>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100px' }}>
        {children}
      </div>
    </div>
  );

  // Custom Tooltip for Chart - Light Mode
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
            if (entry.dataKey === 'painPercentage') {
              return (
                <div key={index} style={{ margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: entry.color, borderRadius: '50%' }} />
                  <span style={{ color: '#4B5563', fontSize: '0.85rem' }}>Daily Pain: {entry.value}%</span>
                </div>
              );
            }
            return (
              <div key={index} style={{ margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: entry.color, borderRadius: '50%' }} />
                <span style={{ color: '#4B5563', fontSize: '0.85rem' }}>
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
              padding: '0.75rem',
              background: 'rgba(70, 130, 180, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(70, 130, 180, 0.1)'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#4682B4' }}>
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
        background: '#F9FAFB',
        minHeight: '100vh',
        color: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#4682B4' }}>⚡</div>
          <div>Loading your health data...</div>
        </div>
      </div>
    );
  }

  // Calculate metrics for progress displays
  const { stats } = dashboardData;
  const avgSleepQualityPercent = stats.avgSleepQuality * 10;
  const avgStressPercent = 100 - (stats.avgStressLevel * 10); // Invert for "control"
  const weeklyProgress = Math.max(0, 100 - (stats.totalHeadaches * 10));
  const sleepHoursPercent = (stats.avgSleepHours / 8) * 100;

  return (
    <div style={{
      background: '#F9FAFB',
      minHeight: '100vh',
      color: '#000000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header - No Card */}
      <div style={{
        padding: '2rem 2rem 1rem 2rem',
        background: '#F9FAFB'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: '2rem', 
                fontWeight: '700',
                color: '#1E3A8A',
                textAlign: 'center'
              }}>
                Health Dashboard
              </h1>
              <p style={{ 
                color: '#4B5563', 
                margin: '0.5rem 0 0 0', 
                fontSize: '1rem',
                textAlign: 'center'
              }}>
                Welcome back, {currentUser?.email?.split('@')[0]}! Here are your 7-day health insights
              </p>
            </div>
            <button 
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                color: '#4B5563',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
              Log Out
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 2rem 2rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {dashboardData.error && (
            <div style={{
              background: 'rgba(220, 53, 69, 0.1)',
              border: '1px solid rgba(220, 53, 69, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '2rem',
              color: '#dc3545',
              textAlign: 'center'
            }}>
              {dashboardData.error}
            </div>
          )}

          {/* Quick Actions - No Cards */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ 
              margin: '0 0 1.5rem 0', 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              color: '#4682B4',
              textAlign: 'center'
            }}>
              Quick Actions
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <ActionButton icon="🤕" label="Log Headache" primary={true} to="/record-headache" />
              <ActionButton icon="😴" label="Log Sleep" to="/record-sleep" />
              <ActionButton icon="🧠" label="Log Stress" to="/record-stress" />
              <ActionButton icon="🏃" label="Log Exercise" to="/record-exercise" />
            </div>
          </div>

          {/* Main Chart - No Card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '3rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '1.4rem', 
                  fontWeight: '600',
                  color: '#1E3A8A',
                  textAlign: 'center'
                }}>
                  Weekly Health Overview
                </h3>
                <p style={{ 
                  color: '#4B5563', 
                  fontSize: '0.9rem', 
                  margin: '0.5rem 0 0 0',
                  textAlign: 'center'
                }}>
                  Sleep, stress & headache correlation • Orange bars show pain intensity
                </p>
              </div>
              <div style={{ 
                background: 'rgba(70, 130, 180, 0.1)', 
                padding: '0.5rem 1rem', 
                borderRadius: '20px',
                border: '1px solid rgba(70, 130, 180, 0.2)',
                fontSize: '0.8rem',
                color: '#4682B4',
                fontWeight: '500'
              }}>
                📊 Past 7 Days
              </div>
            </div>
            
            {dashboardData.sleepStressData.some(d => d.hasData) ? (
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={dashboardData.sleepStressData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="painGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4682B4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4682B4" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#20c997" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#20c997" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="2 2" stroke="rgba(75, 85, 99, 0.2)" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#4B5563"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    yAxisId="hours" 
                    orientation="left" 
                    domain={[0, 12]} 
                    stroke="#4B5563"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    yAxisId="scale" 
                    orientation="right" 
                    domain={[0, 100]} 
                    stroke="#4B5563"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px', color: '#4B5563' }}
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
                color: '#9CA3AF',
                fontSize: '1.1rem'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>
                  📊
                </div>
                <p style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '500' }}>No data available yet</p>
                <p style={{ fontSize: '1rem', margin: '0', lineHeight: '1.5' }}>
                  Start tracking your sleep, stress, and headaches to see patterns here!
                </p>
              </div>
            )}
          </div>

          {/* Health Metrics - No Cards */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ 
              margin: '0 0 1.5rem 0', 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              color: '#4682B4',
              textAlign: 'center'
            }}>
              Health Metrics
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem'
            }}>
              <StatsDisplay
                title="Sleep Quality"
                icon="🌙"
                color="#20c997"
              >
                <CircularProgress
                  percentage={avgSleepQualityPercent}
                  color="#20c997"
                  label="Average Quality"
                  value=""
                  showPercentage={true}
                  size={90}
                  strokeWidth={6}
                />
              </StatsDisplay>

              <StatsDisplay
                title="Sleep Hours"
                icon="😴"
                color="#28a745"
              >
                <CircularProgress
                  percentage={sleepHoursPercent}
                  color="#28a745"
                  label="Avg Hours"
                  value={stats.avgSleepHours}
                  unit="h"
                  size={90}
                  strokeWidth={6}
                />
              </StatsDisplay>

              <StatsDisplay
                title="Stress Control"
                icon="🧘"
                color="#17a2b8"
              >
                <CircularProgress
                  percentage={avgStressPercent}
                  color="#17a2b8"
                  label="Control Level"
                  value=""
                  showPercentage={true}
                  size={90}
                  strokeWidth={6}
                />
              </StatsDisplay>

              <StatsDisplay
                title="Weekly Score"
                icon="🏆"
                color="#4682B4"
              >
                <CircularProgress
                  percentage={weeklyProgress}
                  color="#4682B4"
                  label="Health Score"
                  value=""
                  showPercentage={true}
                  size={90}
                  strokeWidth={6}
                />
              </StatsDisplay>
            </div>
            
            {/* Stats Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '1rem'
            }}>
              <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#4B5563', marginBottom: '0.25rem' }}>Target: 80%+ • {stats.avgSleepQuality}/10</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#4B5563', marginBottom: '0.25rem' }}>Target: 7-9h</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#4B5563', marginBottom: '0.25rem' }}>Avg: {stats.avgStressLevel}/10</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#4B5563', marginBottom: '0.25rem' }}>{stats.totalHeadaches} headaches</div>
              </div>
            </div>
          </div>

          {/* AI Insights - No Card */}
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
              💡 AI Health Insights
            </h3>
            <div style={{ lineHeight: '1.7', fontSize: '1rem', color: '#4B5563' }}>
              {stats.totalHeadaches === 0 ? (
                <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(40, 167, 69, 0.1)', borderRadius: '12px', border: '1px solid rgba(40, 167, 69, 0.2)' }}>
                  <div style={{ fontSize: '1.5rem', color: '#28a745' }}>🏆</div>
                  <span style={{ color: '#155724' }}>
                    <strong>Excellent week!</strong> No headaches recorded. Keep up the good work with your healthy habits!
                  </span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(70, 130, 180, 0.1)', borderRadius: '12px', border: '1px solid rgba(70, 130, 180, 0.2)' }}>
                    <div style={{ fontSize: '1.5rem', color: '#4682B4' }}>📊</div>
                    <span style={{ color: '#2c5aa0' }}>
                      You've had <strong>{stats.totalHeadaches} headache{stats.totalHeadaches > 1 ? 's' : ''}</strong> this week. 
                      {stats.avgSleepQuality < 6 && ' Poor sleep quality may be contributing to headaches.'}
                      {stats.avgStressLevel > 7 && ' High stress levels could be triggering headaches.'}
                    </span>
                  </div>
                  {stats.avgSleepHours < 7 && (
                    <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.2)' }}>
                      <div style={{ fontSize: '1.5rem', color: '#ffc107' }}>😴</div>
                      <span style={{ color: '#856404' }}>
                        <strong>Sleep recommendation:</strong> You're averaging {stats.avgSleepHours} hours. Aim for 7-9 hours for optimal health.
                      </span>
                    </div>
                  )}
                  {stats.avgStressLevel > 6 && (
                    <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(23, 162, 184, 0.1)', borderRadius: '12px', border: '1px solid rgba(23, 162, 184, 0.2)' }}>
                      <div style={{ fontSize: '1.5rem', color: '#17a2b8' }}>🧘</div>
                      <span style={{ color: '#0c5460' }}>
                        <strong>Stress management:</strong> Your stress levels are elevated (avg: {stats.avgStressLevel}/10). Try stress reduction techniques like meditation or exercise.
                      </span>
                    </div>
                  )}
                </>
              )}
              
              <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', padding: '1rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.2)' }}>
                <div style={{ fontSize: '1.5rem', color: '#ffc107' }}>⭐</div>
                <span style={{ color: '#856404' }}>
                  {stats.avgSleepQuality >= 7 && stats.avgStressLevel <= 5 
                    ? 'Your sleep and stress management are excellent! This creates ideal conditions for headache prevention.'
                    : 'Focus on improving sleep quality and reducing stress for better headache management.'}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Tracking Links - No Cards */}
          <div>
            <h3 style={{ 
              margin: '0 0 1.5rem 0', 
              fontSize: '1.2rem', 
              fontWeight: '600', 
              color: '#4682B4',
              textAlign: 'center'
            }}>
              Record More Data
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem'
            }}>
              <Link to="/record-nutrition" style={{
                background: '#FFFFFF',
                color: '#000000',
                textDecoration: 'none',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '2rem' }}>🍎</div>
                <span style={{ fontSize: '1rem', fontWeight: '500', color: '#28a745' }}>Nutrition</span>
              </Link>
              
              <Link to="/record-body-pain" style={{
                background: '#FFFFFF',
                color: '#000000',
                textDecoration: 'none',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '2rem' }}>🦴</div>
                <span style={{ fontSize: '1rem', fontWeight: '500', color: '#dc3545' }}>Body Pain</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
