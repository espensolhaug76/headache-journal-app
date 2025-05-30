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

  // Get headache status emoji and text (Norwegian app style)
  const getHeadacheStatus = () => {
    const days = dashboardData.stats.daysSinceLastHeadache;
    if (days === 0) return { emoji: '😢', text: 'Today', color: '#dc3545', status: 'Severe' };
    if (days === 1) return { emoji: '😞', text: '1 day ago', color: '#fd7e14', status: 'Recent' };
    if (days <= 3) return { emoji: '😐', text: `${days} days ago`, color: '#ffc107', status: 'Moderate' };
    if (days <= 7) return { emoji: '🙂', text: `${days} days ago`, color: '#20c997', status: 'Good' };
    return { emoji: '😊', text: `${days} days ago`, color: '#28a745', status: 'Excellent' };
  };

  // Combined Sleep Score (Norwegian app style - single metric)
  const getCombinedSleepScore = () => {
    const hours = dashboardData.stats.avgSleepHours;
    const quality = dashboardData.stats.avgSleepQuality;
    
    // Weighted score: 40% hours (optimal 7-9), 60% quality (1-10 scale)
    const hoursScore = Math.min(100, Math.max(0, (hours / 8) * 100));
    const qualityScore = quality * 10;
    const combinedScore = Math.round((hoursScore * 0.4) + (qualityScore * 0.6));
    
    return {
      score: combinedScore,
      text: combinedScore >= 80 ? 'Excellent' : 
            combinedScore >= 60 ? 'Good' : 
            combinedScore >= 40 ? 'Fair' : 'Poor',
      color: combinedScore >= 80 ? '#28a745' : 
             combinedScore >= 60 ? '#20c997' : 
             combinedScore >= 40 ? '#ffc107' : '#dc3545',
      emoji: combinedScore >= 80 ? '😴' : 
             combinedScore >= 60 ? '😊' : 
             combinedScore >= 40 ? '😐' : '😓'
    };
  };

  // Calendar component (Norwegian app inspired)
  const CalendarView = () => {
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
      const dayData = dashboardData.calendarData[dateStr];
      const hasHeadache = dayData && dayData.headaches.length > 0;
      const hasMedication = dayData && dayData.medications.length > 0;
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      
      // Norwegian app style: Green = good day, Orange = mild headache, Red = severe headache
      let bgColor = '#28a745'; // Default green (good day)
      if (hasHeadache) {
        const maxPain = Math.max(...dayData.headaches.map(h => h.painLevel));
        if (maxPain >= 7) bgColor = '#dc3545'; // Red for severe
        else if (maxPain >= 4) bgColor = '#fd7e14'; // Orange for moderate
        else bgColor = '#ffc107'; // Yellow for mild
      }
      
      days.push(
        <div
          key={day}
          style={{
            padding: '0.5rem',
            minHeight: '60px',
            backgroundColor: bgColor,
            borderRadius: '12px',
            cursor: dayData ? 'pointer' : 'default',
            position: 'relative',
            border: isToday ? '3px solid #ffffff' : 'none',
            color: 'white',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={dayData ? `${dayData.headaches.length} headache(s), ${dayData.medications.length} medication(s)` : ''}
        >
          <div style={{ fontSize: '1.1rem' }}>
            {day}
          </div>
          {hasMedication && (
            <div style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '16px',
              height: '16px',
              background: '#ffffff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: '#dc3545', fontSize: '10px', fontWeight: 'bold' }}>+</span>
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
        marginBottom: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        {/* Calendar Header */}
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
            fontSize: '1.4rem', 
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

        {/* Day Headers */}
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

        {/* Calendar Days */}
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
          gap: '2rem',
          marginTop: '1.5rem',
          fontSize: '0.85rem',
          color: '#4B5563'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', background: '#28a745', borderRadius: '3px' }} />
            Good Day
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', background: '#ffc107', borderRadius: '3px' }} />
            Mild
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', background: '#fd7e14', borderRadius: '3px' }} />
            Moderate
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', background: '#dc3545', borderRadius: '3px' }} />
            Severe
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#dc3545', fontSize: '12px', fontWeight: 'bold' }}>+</span>
            Medication
          </div>
        </div>
      </div>
    );
  };

  // Quick Action Card Component
  const QuickActionCard = ({ icon, title, subtitle, color, onClick, emoji }) => (
    <button
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
        backdropFilter: 'blur(10px)',
        border: `2px solid ${color}20`,
        borderRadius: '16px',
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'center',
        color: '#000000',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
    >
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        width: '40px',
        height: '40px',
        background: `${color}20`,
        borderRadius: '50%'
      }} />
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        {emoji || <i className={icon} style={{ color }}></i>}
      </div>
      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '600', color }}>
        {title}
      </h4>
      <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
        {subtitle}
      </p>
    </button>
  );

  // Status Card Component (Norwegian app inspired)
  const StatusCard = ({ emoji, title, value, subtitle, color, onClick, hasAction = false }) => (
    <div
      onClick={hasAction ? onClick : undefined}
      style={{
        background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
        border: `2px solid ${color}30`,
        borderRadius: '16px',
        padding: '1.5rem',
        cursor: hasAction ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        position: 'relative'
      }}
      onMouseEnter={hasAction ? (e) => {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
      } : undefined}
      onMouseLeave={hasAction ? (e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      } : undefined}
    >
      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
        {emoji}
      </div>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#4B5563' }}>
        {title}
      </h3>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color, marginBottom: '0.25rem' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.9rem', color: '#9CA3AF' }}>
        {subtitle}
      </div>
      {hasAction && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          color: '#9CA3AF',
          fontSize: '0.8rem'
        }}>
          <i className="fas fa-arrow-right"></i>
        </div>
      )}
    </div>
  );

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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        color: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <div>Loading your health data...</div>
        </div>
      </div>
    );
  }

  const headacheStatus = getHeadacheStatus();
  const sleepScore = getCombinedSleepScore();

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: '#000000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Font Awesome CSS */}
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
        integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
        crossOrigin="anonymous" 
        referrerPolicy="no-referrer" 
      />

      {/* Header */}
      <div style={{
        padding: '2rem 1rem 1rem 1rem',
        background: 'transparent'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '2rem', 
            fontWeight: '700',
            color: 'white',
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Ultimate Migraine Tracker
          </h1>
          <p style={{ 
            color: 'rgba(255,255,255,0.9)', 
            margin: '0.5rem 0', 
            fontSize: '1rem',
            textAlign: 'center'
          }}>
            Welcome back, {currentUser?.email?.split('@')[0]}!
          </p>
        </div>
      </div>

      <div style={{ padding: '0 1rem 2rem 1rem' }}>
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

          {/* View Toggle Buttons (Norwegian app style) */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '4px',
              display: 'flex'
            }}>
              <button
                onClick={() => setCurrentView('overview')}
                style={{
                  background: currentView === 'overview' ? 'rgba(255,255,255,0.9)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: currentView === 'overview' ? '#1E3A8A' : 'rgba(255,255,255,0.8)',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                OVERVIEW
              </button>
              <button
                onClick={() => setCurrentView('calendar')}
                style={{
                  background: currentView === 'calendar' ? 'rgba(255,255,255,0.9)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: currentView === 'calendar' ? '#1E3A8A' : 'rgba(255,255,255,0.8)',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                CALENDAR
              </button>
            </div>
          </div>

          {/* Overview View */}
          {currentView === 'overview' && (
            <>
              {/* Main Status Cards (Norwegian app inspired) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                {/* Last Headache Status */}
                <StatusCard
                  emoji={headacheStatus.emoji}
                  title="Last Headache"
                  value={headacheStatus.text}
                  subtitle={`${headacheStatus.status} • ${dashboardData.stats.headacheFreeDays} headache-free days`}
                  color={headacheStatus.color}
                  onClick={() => navigate('/record-headache')}
                  hasAction={true}
                />

                {/* Combined Sleep Score */}
                <StatusCard
                  emoji={sleepScore.emoji}
                  title="Sleep Quality"
                  value={`${sleepScore.score}%`}
                  subtitle={`${sleepScore.text} • ${dashboardData.stats.avgSleepHours}h avg`}
                  color={sleepScore.color}
                  onClick={() => navigate('/record-sleep')}
                  hasAction={true}
                />

                {/* Stress Level */}
                <StatusCard
                  emoji={dashboardData.stats.avgStressLevel <= 3 ? '😌' : 
                        dashboardData.stats.avgStressLevel <= 6 ? '😐' : '😰'}
                  title="Stress Level"
                  value={`${dashboardData.stats.avgStressLevel}/10`}
                  subtitle={dashboardData.stats.avgStressLevel <= 3 ? 'Low stress' : 
                           dashboardData.stats.avgStressLevel <= 6 ? 'Moderate stress' : 'High stress'}
                  color={dashboardData.stats.avgStressLevel <= 3 ? '#28a745' : 
                         dashboardData.stats.avgStressLevel <= 6 ? '#ffc107' : '#dc3545'}
                  onClick={() => navigate('/record-stress')}
                  hasAction={true}
                />
              </div>

              {/* Big Register Headache Button (Norwegian app style) */}
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <Link
                  to="/record-headache"
                  style={{
                    background: 'linear-gradient(135deg, #dc3545, #c82333)',
                    border: 'none',
                    borderRadius: '16px',
                    color: 'white',
                    padding: '1.5rem 3rem',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    textDecoration: 'none',
                    display: 'inline-block',
                    boxShadow: '0 8px 20px rgba(220, 53, 69, 0.3)',
                    transition: 'all 0.2s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 25px rgba(220, 53, 69, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 20px rgba(220, 53, 69, 0.3)';
                  }}
                >
                  <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
                  Register Headache
                </Link>
              </div>

              {/* Quick Action Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '1rem',
                marginBottom: '3rem'
              }}>
                <QuickActionCard
                  emoji="💊"
                  title="Medication"
                  subtitle="Log pills & effects"
                  color="#6c757d"
                  onClick={() => navigate('/record-medication')}
                />
                <QuickActionCard
                  emoji="🏃"
                  title="Exercise"
                  subtitle="Track workouts"
                  color="#28a745"
                  onClick={() => navigate('/record-exercise')}
                />
                <QuickActionCard
                  emoji="🍎"
                  title="Nutrition"
                  subtitle="Food triggers"
                  color="#fd7e14"
                  onClick={() => navigate('/record-nutrition')}
                />
                <QuickActionCard
                  emoji="🩹"
                  title="Body Pain"
                  subtitle="Tension tracking"
                  color="#17a2b8"
                  onClick={() => navigate('/record-body-pain')}
                />
              </div>

              {/* Weekly Chart */}
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '3rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
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
                        <Tooltip />
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
                      Start tracking your health to see patterns here!
                    </p>
                  </div>
                )}
              </div>

              {/* AI Insights */}
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '3rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
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
                  {dashboardData.stats.totalHeadaches === 0 ? (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'start', 
                      gap: '1rem', 
                      marginBottom: '1rem', 
                      padding: '1rem', 
                      background: 'rgba(40, 167, 69, 0.1)', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(40, 167, 69, 0.2)' 
                    }}>
                      <div style={{ fontSize: '1.5rem', color: '#28a745' }}>
                        <i className="fas fa-trophy"></i>
                      </div>
                      <span style={{ color: '#155724' }}>
                        <strong>Excellent month!</strong> {dashboardData.stats.headacheFreeDays} headache-free days. Keep up the healthy habits!
                      </span>
                    </div>
                  ) : (
                    <>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'start', 
                        gap: '1rem', 
                        marginBottom: '1rem', 
                        padding: '1rem', 
                        background: 'rgba(70, 130, 180, 0.1)', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(70, 130, 180, 0.2)' 
                      }}>
                        <div style={{ fontSize: '1.5rem', color: '#4682B4' }}>
                          <i className="fas fa-chart-bar"></i>
                        </div>
                        <span style={{ color: '#2c5aa0' }}>
                          You've had <strong>{dashboardData.stats.totalHeadaches} headache{dashboardData.stats.totalHeadaches > 1 ? 's' : ''}</strong> this month 
                          with <strong>{dashboardData.stats.headacheFreeDays} headache-free days</strong>.
                        </span>
                      </div>
                      
                      {dashboardData.stats.avgSleepHours < 7 && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'start', 
                          gap: '1rem', 
                          marginBottom: '1rem', 
                          padding: '1rem', 
                          background: 'rgba(255, 193, 7, 0.1)', 
                          borderRadius: '12px', 
                          border: '1px solid rgba(255, 193, 7, 0.2)' 
                        }}>
                          <div style={{ fontSize: '1.5rem', color: '#ffc107' }}>
                            <i className="fas fa-bed"></i>
                          </div>
                          <span style={{ color: '#856404' }}>
                            <strong>Sleep recommendation:</strong> You're averaging {dashboardData.stats.avgSleepHours} hours. Aim for 7-9 hours for optimal health.
                          </span>
                        </div>
                      )}
                      
                      {dashboardData.stats.avgStressLevel > 6 && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'start', 
                          gap: '1rem', 
                          marginBottom: '1rem', 
                          padding: '1rem', 
                          background: 'rgba(23, 162, 184, 0.1)', 
                          borderRadius: '12px', 
                          border: '1px solid rgba(23, 162, 184, 0.2)' 
                        }}>
                          <div style={{ fontSize: '1.5rem', color: '#17a2b8' }}>
                            <i className="fas fa-brain"></i>
                          </div>
                          <span style={{ color: '#0c5460' }}>
                            <strong>Stress management:</strong> Your stress levels are elevated (avg: {dashboardData.stats.avgStressLevel}/10). Try stress reduction techniques.
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Calendar View */}
          {currentView === 'calendar' && (
            <>
              <CalendarView />
              
              {/* Calendar Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '2rem', color: '#28a745', marginBottom: '0.5rem' }}>
                    {dashboardData.stats.headacheFreeDays}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#4B5563' }}>Good Days</div>
                </div>
                
                <div style={{
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '2rem', color: '#dc3545', marginBottom: '0.5rem' }}>
                    {dashboardData.stats.totalHeadaches}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#4B5563' }}>Headache Days</div>
                </div>
                
                <div style={{
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '2rem', color: headacheStatus.color, marginBottom: '0.5rem' }}>
                    {dashboardData.stats.daysSinceLastHeadache}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#4B5563' }}>Days Since Last</div>
                </div>
              </div>
            </>
          )}

          {/* Logout Button */}
          <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
            <button 
              onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.8)',
                padding: '1rem 2rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '0 auto'
              }}
            >
              <i className="fas fa-sign-out-alt"></i>
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
