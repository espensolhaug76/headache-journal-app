import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  query,
  where,
  orderBy,
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
  const [currentView, setCurrentView] = useState('overview'); // 'overview', 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dashboardData, setDashboardData] = useState({
    sleepStressData: [],
    calendarData: {},
    loading: true,
    error: null,
    stats: {
      totalHeadaches: 0,
      daysSinceLastHeadache: 0,
      avgSleepHours: 0,
      avgSleepQuality: 0,
      avgStressLevel: 0,
      headacheFreeDays: 0
    }
  });

  // Fetch data from Firebase
  useEffect(() => {
    if (!currentUser) return;

    const fetchDashboardData = async () => {
      try {
        setDashboardData(prev => ({ ...prev, loading: true, error: null }));

        // Get last 30 days of data for comprehensive analysis
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch headache data
        const headacheQuery = query(
          collection(db, 'users', currentUser.uid, 'headaches'),
          where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
          orderBy('createdAt', 'desc')
        );
        const headacheSnapshot = await getDocs(headacheQuery);
        const headacheData = headacheSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch sleep data
        const sleepQuery = query(
          collection(db, 'users', currentUser.uid, 'sleep'),
          where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
          orderBy('createdAt', 'desc')
        );
        const sleepSnapshot = await getDocs(sleepQuery);
        const sleepData = sleepSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch stress data
        const stressQuery = query(
          collection(db, 'users', currentUser.uid, 'stress'),
          where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
          orderBy('createdAt', 'desc')
        );
        const stressSnapshot = await getDocs(stressQuery);
        const stressData = stressSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch medication data
        const medicationQuery = query(
          collection(db, 'users', currentUser.uid, 'medications'),
          where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
          orderBy('createdAt', 'desc')
        );
        const medicationSnapshot = await getDocs(medicationQuery);
        const medicationData = medicationSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Process data
        const processedData = processLast7Days(sleepData, stressData, headacheData);
        const calendarData = processCalendarData(headacheData, medicationData);
        const stats = calculateStats(sleepData, stressData, headacheData);

        setDashboardData({
          sleepStressData: processedData,
          calendarData: calendarData,
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
  }, [currentUser, currentMonth, currentYear]);

  // Process calendar data for monthly view
  const processCalendarData = (headaches, medications) => {
    const calendarData = {};
    
    headaches.forEach(headache => {
      const date = headache.createdAt?.toDate ? 
        headache.createdAt.toDate().toISOString().split('T')[0] : 
        headache.date;
      
      if (!calendarData[date]) {
        calendarData[date] = { headaches: [], medications: [] };
      }
      calendarData[date].headaches.push({
        painLevel: headache.painLevel,
        location: headache.location
      });
    });

    medications.forEach(medication => {
      const date = medication.createdAt?.toDate ? 
        medication.createdAt.toDate().toISOString().split('T')[0] : 
        medication.date;
      
      if (!calendarData[date]) {
        calendarData[date] = { headaches: [], medications: [] };
      }
      calendarData[date].medications.push({
        name: medication.medicationName,
        type: medication.medicationType,
        effectiveness: medication.effectiveness
      });
    });

    return calendarData;
  };

  // Process last 7 days of data
  const processLast7Days = (sleepData, stressData, headacheData) => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const sleepEntry = sleepData.find(entry => entry.date === dateStr);
      const stressEntry = stressData.find(entry => entry.date === dateStr);
      const dayHeadaches = headacheData.filter(entry => {
        const entryDate = entry.createdAt?.toDate ? 
          entry.createdAt.toDate().toISOString().split('T')[0] : 
          entry.date;
        return entryDate === dateStr;
      });

      const headacheCount = dayHeadaches.length;
      const totalPainScore = dayHeadaches.reduce((sum, h) => sum + (h.painLevel || 0), 0);
      const avgPainLevel = headacheCount > 0 ? totalPainScore / headacheCount : 0;

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
        avgPainLevelPercent: avgPainLevel * 10,
        totalPainScore: totalPainScore,
        hasData: sleepEntry || stressEntry || headacheCount > 0
      });
    }

    return days;
  };

  // Calculate summary stats
  const calculateStats = (sleepData, stressData, headacheData) => {
    const totalHeadaches = headacheData.length;
    
    // Calculate days since last headache
    let daysSinceLastHeadache = 0;
    if (headacheData.length > 0) {
      const lastHeadache = headacheData[0]; // Most recent
      const lastHeadacheDate = lastHeadache.createdAt?.toDate ? 
        lastHeadache.createdAt.toDate() : new Date(lastHeadache.date);
      const today = new Date();
      daysSinceLastHeadache = Math.floor((today - lastHeadacheDate) / (1000 * 60 * 60 * 24));
    } else {
      daysSinceLastHeadache = 30; // If no headaches in 30 days
    }
    
    const avgSleepHours = sleepData.length > 0 ? 
      sleepData.reduce((sum, entry) => sum + (entry.hoursSlept || 0), 0) / sleepData.length : 0;
    const avgSleepQuality = sleepData.length > 0 ? 
      sleepData.reduce((sum, entry) => sum + (entry.sleepQuality || 0), 0) / sleepData.length : 0;
    const avgStressLevel = stressData.length > 0 ? 
      stressData.reduce((sum, entry) => sum + (entry.stressLevel || 0), 0) / stressData.length : 0;
    
    // Calculate headache-free days in last 30 days
    const headacheDates = new Set(headacheData.map(h => {
      const date = h.createdAt?.toDate ? 
        h.createdAt.toDate().toISOString().split('T')[0] : 
        h.date;
      return date;
    }));
    const headacheFreeDays = 30 - headacheDates.size;

    return {
      totalHeadaches,
      daysSinceLastHeadache,
      avgSleepHours: Math.round(avgSleepHours * 10) / 10,
      avgSleepQuality: Math.round(avgSleepQuality * 10) / 10,
      avgStressLevel: Math.round(avgStressLevel * 10) / 10,
      headacheFreeDays
    };
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
      <div className="container">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>Loading...</div>
          <div>Fetching your health data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <nav className="nav">
        <div className="nav-content">
          <div className="nav-brand">
            <h1>Headache Journal</h1>
          </div>
          <div className="nav-links">
            <button onClick={handleLogout} className="btn btn-secondary">
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard">
        <h1>Welcome back, {currentUser?.email?.split('@')[0]}!</h1>
        
        {dashboardData.error && (
          <div className="error">{dashboardData.error}</div>
        )}

        {/* View Toggle */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '2rem',
          gap: '1rem'
        }}>
          <button 
            onClick={() => setCurrentView('overview')}
            className={`btn ${currentView === 'overview' ? '' : 'btn-secondary'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setCurrentView('calendar')}
            className={`btn ${currentView === 'calendar' ? '' : 'btn-secondary'}`}
          >
            Calendar
          </button>
        </div>

        {currentView === 'overview' ? (
          <>
            {/* Quick Track */}
            <div className="quick-track">
              <h2>Quick Track</h2>
              <Link to="/record-headache" className="quick-track-btn">
                Record Headache
              </Link>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <h3>This Month</h3>
                <p><strong>{dashboardData.stats.totalHeadaches}</strong> headaches</p>
                <p><strong>{dashboardData.stats.headacheFreeDays}</strong> headache-free days</p>
                <p><strong>{dashboardData.stats.daysSinceLastHeadache}</strong> days since last headache</p>
              </div>
              
              <div className="stat-card">
                <h3>Sleep & Stress</h3>
                <p><strong>{dashboardData.stats.avgSleepHours}h</strong> average sleep</p>
                <p><strong>{dashboardData.stats.avgSleepQuality}/10</strong> sleep quality</p>
                <p><strong>{dashboardData.stats.avgStressLevel}/10</strong> stress level</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="quick-links">
              <Link to="/record-headache">🤕 Record Headache</Link>
              <Link to="/record-sleep">😴 Record Sleep</Link>
              <Link to="/record-stress">😰 Record Stress</Link>
              <Link to="/record-nutrition">🍎 Record Nutrition</Link>
              <Link to="/record-exercise">🏃 Record Exercise</Link>
              <Link to="/record-body-pain">🩹 Record Body Pain</Link>
              <Link to="/record-medication">💊 Record Medication</Link>
            </div>

            {/* Weekly Chart */}
            {dashboardData.sleepStressData.some(d => d.hasData) && (
              <div className="stat-card">
                <h3>Weekly Health Overview</h3>
                <div style={{ width: '100%', height: '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dashboardData.sleepStressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis yAxisId="scale" orientation="left" domain={[0, 100]} />
                      <YAxis yAxisId="count" orientation="right" domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="scale" dataKey="sleepQualityPercent" fill="#8884d8" name="Sleep Quality %" />
                      <Bar yAxisId="scale" dataKey="stressPercent" fill="#82ca9d" name="Stress Level %" />
                      <Line yAxisId="count" type="monotone" dataKey="headaches" stroke="#ff7300" name="Headache Count" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Norwegian-Inspired Calendar View */
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            {/* Calendar Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #F3F4F6'
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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
              >
                ←
              </button>
              
              <h2 style={{ 
                margin: 0, 
                fontSize: '2rem', 
                fontWeight: '700',
                color: '#1E3A8A',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'][currentMonth]} {currentYear}
              </h2>
              
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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
              >
                →
              </button>
            </div>

            {/* Day Headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px',
              marginBottom: '1rem'
            }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} style={{
                  padding: '12px',
                  textAlign: 'center',
                  fontWeight: '700',
                  color: '#6B7280',
                  fontSize: '0.9rem',
                  background: '#F8FAFC',
                  borderRadius: '8px'
                }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px'
            }}>
              {(() => {
                const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
                const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
                
                const daysInMonth = getDaysInMonth(currentYear, currentMonth);
                const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
                const days = [];
                
                // Empty cells for days before the first day
                for (let i = 0; i < firstDay; i++) {
                  days.push(<div key={`empty-${i}`} style={{ padding: '12px' }}></div>);
                }
                
                // Calendar days
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayData = dashboardData.calendarData[dateStr];
                  const hasHeadache = dayData && dayData.headaches.length > 0;
                  const hasMedication = dayData && dayData.medications.length > 0;
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  
                  // Norwegian app style colors
                  let bgColor = '#E8F5E8'; // Light green (good day)
                  let textColor = '#155724';
                  let emoji = '😊';
                  
                  if (hasHeadache) {
                    const maxPain = Math.max(...dayData.headaches.map(h => h.painLevel));
                    if (maxPain >= 7) {
                      bgColor = '#FFE6E6'; // Light red for severe
                      textColor = '#721C24';
                      emoji = '😢';
                    } else if (maxPain >= 4) {
                      bgColor = '#FFF3CD'; // Light yellow for moderate  
                      textColor = '#856404';
                      emoji = '😐';
                    } else {
                      bgColor = '#FFE8CC'; // Light orange for mild
                      textColor = '#B45309';
                      emoji = '🙂';
                    }
                  }
                  
                  days.push(
                    <div
                      key={day}
                      style={{
                        padding: '12px',
                        minHeight: '80px',
                        backgroundColor: bgColor,
                        borderRadius: '12px',
                        cursor: dayData ? 'pointer' : 'default',
                        position: 'relative',
                        border: isToday ? '3px solid #667eea' : '2px solid transparent',
                        color: textColor,
                        fontWeight: '600',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: isToday ? '0 4px 16px rgba(102, 126, 234, 0.3)' : '0 2px 8px rgba(0,0,0,0.06)'
                      }}
                      title={dayData ? `${dayData.headaches.length} headache(s), ${dayData.medications.length} medication(s)` : ''}
                      onMouseEnter={(e) => {
                        if (dayData) {
                          e.target.style.transform = 'translateY(-3px)';
                          e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (dayData) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = isToday ? '0 4px 16px rgba(102, 126, 234, 0.3)' : '0 2px 8px rgba(0,0,0,0.06)';
                        }
                      }}
                    >
                      <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
                        {day}
                      </div>
                      <div style={{ fontSize: '1.5rem' }}>
                        {emoji}
                      </div>
                      {hasMedication && (
                        <div style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          width: '18px',
                          height: '18px',
                          background: '#dc3545',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: 'white'
                        }}>
                          💊
                        </div>
                      )}
                    </div>
                  );
                }
                
                return days;
              })()}
            </div>

            {/* Legend */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem',
              marginTop: '2rem',
              fontSize: '0.9rem',
              color: '#4B5563',
              paddingTop: '1.5rem',
              borderTop: '2px solid #F3F4F6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '16px', background: '#E8F5E8', borderRadius: '4px' }} />
                😊 Good Day
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '16px', background: '#FFE8CC', borderRadius: '4px' }} />
                🙂 Mild Headache
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '16px', background: '#FFF3CD', borderRadius: '4px' }} />
                😐 Moderate Headache
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '16px', background: '#FFE6E6', borderRadius: '4px' }} />
                😢 Severe Headache
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💊 Medication Taken
              </div>
            </div>

            {/* Calendar Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #E8F5E8, #C8E6C9)',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontSize: '2.5rem', color: '#2E7D32', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  {dashboardData.stats.headacheFreeDays}
                </div>
                <div style={{ fontSize: '1rem', color: '#1B5E20', fontWeight: '600' }}>Good Days</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #FFE6E6, #FFCDD2)',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontSize: '2.5rem', color: '#C62828', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  {dashboardData.stats.totalHeadaches}
                </div>
                <div style={{ fontSize: '1rem', color: '#B71C1C', fontWeight: '600' }}>Headache Days</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontSize: '2.5rem', color: '#1565C0', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  {dashboardData.stats.daysSinceLastHeadache}
                </div>
                <div style={{ fontSize: '1rem', color: '#0D47A1', fontWeight: '600' }}>Days Since Last</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
