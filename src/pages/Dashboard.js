import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  startOfMonth,
  endOfMonth,
  getCountFromServer // For potential future optimization
} from 'firebase/firestore';
import { db } from '../firebase';
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

export default function EnhancedDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
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
      sleepQualityPercent: 0,
      avgStressLevel: 0, // Added for recap
      headacheHours: 0, // Added for recap
      daysWithNoHeadache: 0, // Added for recap
      daysWithMildHeadache: 0, // Added for recap
      daysWithModerateHeadache: 0, // Added for recap
      daysWithSevereHeadache: 0, // Added for recap
      totalDaysInMonth: 0, // Added for recap
    },
  });

  const SWIPE_THRESHOLD = 50; // pixels

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart && touchEnd) {
      const distance = touchStart - touchEnd;
      if (distance > SWIPE_THRESHOLD) {
        // Swiped left
        setCurrentMetricDay((prev) => Math.min(prev + 1, dashboardData.dailyMetrics.length - 1));
      } else if (distance < -SWIPE_THRESHOLD) {
        // Swiped right
        setCurrentMetricDay((prev) => Math.max(prev - 1, 0));
      }
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const currentDayMetric = dashboardData.dailyMetrics[currentMetricDay];

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser) return;

    setDashboardData((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch daily metrics (assuming a 'dailyMetrics' collection or similar)
      const dailyMetricsRef = collection(db, `users/${currentUser.uid}/dailyMetrics`);
      const dailyMetricsQuery = query(dailyMetricsRef, orderBy('date', 'desc'), limit(7));
      const dailyMetricsSnapshot = await getDocs(dailyMetricsQuery);
      const fetchedDailyMetrics = dailyMetricsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate().toISOString().split('T')[0] : doc.data().date, // Ensure date is string
      }));

      // Fetch sleep data for average calculation
      const sleepRef = collection(db, `users/${currentUser.uid}/sleep`);
      const sleepQuery = query(sleepRef, orderBy('date', 'desc'), limit(30)); // Last 30 sleep entries for avg
      const sleepSnapshot = await getDocs(sleepQuery);
      let totalSleepHours = 0;
      let totalSleepQuality = 0;
      let sleepCount = 0;
      sleepSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.sleepDuration) {
          totalSleepHours += data.sleepDuration;
        }
        if (data.sleepQuality) {
          totalSleepQuality += data.sleepQuality;
        }
        sleepCount++;
      });
      const avgSleepHours = sleepCount > 0 ? (totalSleepHours / sleepCount).toFixed(1) : 0;
      const sleepQualityPercent = sleepCount > 0 ? ((totalSleepQuality / sleepCount) * 10).toFixed(0) : 0; // Assuming quality 1-10

      // Fetch headache data for calendar and stats
      const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
      const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59); // Last day of month, end of day

      const headachesRef = collection(db, `users/${currentUser.uid}/headaches`);
      const headachesQuery = query(
        headachesRef,
        where('date', '>=', Timestamp.fromDate(startOfCurrentMonth)),
        where('date', '<=', Timestamp.fromDate(endOfCurrentMonth)),
        orderBy('date', 'asc')
      );
      const headacheSnapshot = await getDocs(headachesQuery);

      const calendarData = {};
      let totalHeadachesCount = 0;
      let headacheHours = 0;
      const daysWithHeadache = new Set();
      const headacheSeverityCounts = { mild: 0, moderate: 0, severe: 0 };

      headacheSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const headacheDate = data.date.toDate().toISOString().split('T')[0]; // YYYY-MM-DD
        totalHeadachesCount++;
        daysWithHeadache.add(headacheDate);

        if (data.duration) {
          headacheHours += data.duration; // Assuming duration is in hours
        }

        if (data.painLevel) {
          if (data.painLevel >= 1 && data.painLevel <= 3) {
            headacheSeverityCounts.mild++;
          } else if (data.painLevel >= 4 && data.painLevel <= 7) {
            headacheSeverityCounts.moderate++;
          } else if (data.painLevel >= 8 && data.painLevel <= 10) {
            headacheSeverityCounts.severe++;
          }
        }

        // Store pain level for calendar coloring
        if (!calendarData[headacheDate] || calendarData[headacheDate].painLevel < data.painLevel) {
          calendarData[headacheDate] = { painLevel: data.painLevel };
        }
      });

      const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const daysWithNoHeadache = totalDaysInMonth - daysWithHeadache.size;


      // Fetch stress data for average calculation
      const stressRef = collection(db, `users/${currentUser.uid}/stress`);
      const stressQuery = query(stressRef, orderBy('date', 'desc'), limit(30)); // Last 30 stress entries for avg
      const stressSnapshot = await getDocs(stressQuery);
      let totalStressLevel = 0;
      let stressCount = 0;
      stressSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.stressLevel) {
          totalStressLevel += data.stressLevel;
        }
        stressCount++;
      });
      const avgStressLevel = stressCount > 0 ? (totalStressLevel / stressCount).toFixed(1) : 0;


      setDashboardData((prev) => ({
        ...prev,
        sleepStressData: [], // Revisit this if you have combined sleep/stress data
        dailyMetrics: fetchedDailyMetrics,
        calendarData: calendarData,
        loading: false,
        stats: {
          totalHeadaches: totalHeadachesCount,
          avgSleepHours: avgSleepHours,
          sleepQualityPercent: sleepQualityPercent,
          avgStressLevel: avgStressLevel,
          headacheHours: headacheHours.toFixed(1),
          daysWithNoHeadache: daysWithNoHeadache,
          daysWithMildHeadache: headacheSeverityCounts.mild,
          daysWithModerateHeadache: headacheSeverityCounts.moderate,
          daysWithSevereHeadache: headacheSeverityCounts.severe,
          totalDaysInMonth: totalDaysInMonth,
        },
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData((prev) => ({ ...prev, loading: false, error: 'Failed to load data.' }));
    }
  }, [currentUser, currentMonth, currentYear]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday, etc.
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth); // Sunday is 0, we want Monday to be 0 for consistency
    const startingDay = firstDay === 0 ? 6 : firstDay - 1; // Adjust to make Monday 0, Sunday 6

    const calendarDays = [];

    // Add empty divs for leading days
    for (let i = 0; i < startingDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty-day" />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = dashboardData.calendarData[dateString];
      let color = '#E5E7EB'; // Default: light gray for no data
      let tooltipText = '';

      if (dayData) {
        // If there's headache data, color based on painLevel
        if (dayData.painLevel >= 1 && dayData.painLevel <= 3) {
          color = '#FFD700'; // Yellow for mild
          tooltipText = 'Mild Headache';
        } else if (dayData.painLevel >= 4 && dayData.painLevel <= 7) {
          color = '#FFA500'; // Orange for moderate
          tooltipText = 'Moderate Headache';
        } else if (dayData.painLevel >= 8 && dayData.painLevel <= 10) {
          color = '#FF0000'; // Red for severe
          tooltipText = 'Severe Headache';
        }
      } else {
        // Assuming no entry means no headache, so green
        color = '#28a745'; // Green for no headache
        tooltipText = 'No Headache';
      }

      calendarDays.push(
        <div key={day} className="calendar-day" style={{ backgroundColor: color, position: 'relative' }}>
          <span style={{ position: 'absolute', top: '5px', left: '5px', fontSize: '0.75rem', color: '#fff', textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>{day}</span>
          {tooltipText && <span className="tooltip-text">{tooltipText}</span>}
        </div>
      );
    }
    return calendarDays;
  };

  const getMonthName = (monthIndex) => {
    const date = new Date(currentYear, monthIndex);
    return date.toLocaleString('en-US', { month: 'long' });
  };

  // Inline styles
  const containerStyle = {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: '#F3F4F6',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1rem',
    color: '#374151',
  };

  const headerStyle = {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    padding: '0.5rem 0',
  };

  const mainContentStyle = {
    width: '100%',
    maxWidth: '500px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  };

  const sectionTitleStyle = {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: '1rem',
  };

  const quickActionsGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  };

  const quickActionButtonStyle = {
    background: '#ffc107',
    color: 'white',
    padding: '1rem',
    borderRadius: '12px',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '0.95rem',
    boxShadow: '0 4px 10px rgba(255, 193, 7, 0.2)',
    transition: 'all 0.2s ease',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const quickActionButtonIconStyle = {
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
  };

  const dailyMetricsContainerStyle = {
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
    padding: '1rem',
    marginBottom: '1.5rem',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
  };

  const metricHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  };

  const metricValueStyle = {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: '0.5rem',
  };

  const metricLabelStyle = {
    fontSize: '0.9rem',
    color: '#6B7280',
    textAlign: 'center',
  };

  const chartContainerStyle = {
    width: '100%',
    height: '250px',
    marginBottom: '1.5rem',
  };

  const dataListStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  };

  const dataListItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.6rem 0',
    borderBottom: '1px solid #F3F4F6',
    fontSize: '0.9rem',
    color: '#374151',
  };

  const dataListItemLastStyle = {
    ...dataListItemStyle,
    borderBottom: 'none',
  };

  const footerNavStyle = {
    width: '100%',
    maxWidth: '500px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.03)',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-around',
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
  };

  const navButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#9CA3AF',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: '0.8rem',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  };

  const navButtonActiveStyle = {
    ...navButtonStyle,
    color: '#ffc107',
  };

  const navIconStyle = {
    fontSize: '1.4rem',
    marginBottom: '0.3rem',
  };

  const logoutButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#EF4444',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
  };

  // Calendar styles
  const calendarContainerStyle = {
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
    padding: '1rem',
    marginBottom: '1.5rem',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
  };

  const calendarHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    color: '#1F2937',
    fontWeight: '600',
    fontSize: '1.1rem',
  };

  const calendarGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '5px',
    textAlign: 'center',
  };

  const weekdayHeaderStyle = {
    fontSize: '0.75rem',
    color: '#6B7280',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
  };

  // Styles for individual calendar days - defined globally for access in renderCalendarDays
  const calendarDayBaseStyle = {
    padding: '8px',
    borderRadius: '8px',
    aspectRatio: '1 / 1', // Make it a square
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    fontWeight: '600',
    position: 'relative',
    overflow: 'hidden',
  };

  const tooltipTextStyle = {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    whiteSpace: 'nowrap',
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.2s ease',
    marginBottom: '5px',
  };

  // Add this to your main CSS or style block if not already present
  // .calendar-day:hover .tooltip-text {
  //   opacity: 1;
  // }

  if (dashboardData.loading) {
    return (
      <div style={containerStyle}>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div style={containerStyle}>
        <p style={{ color: '#EF4444' }}>Error: {dashboardData.error}</p>
        <button onClick={fetchDashboardData} style={quickActionButtonStyle}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={{ fontSize: '1.75rem', color: '#1F2937', margin: 0 }}>Dashboard</h1>
        <button onClick={logout} style={logoutButtonStyle}>
          Logout
        </button>
      </header>

      <main style={mainContentStyle}>
        {/* Quick Actions */}
        <h2 style={sectionTitleStyle}>Quick Actions</h2>
        <div style={quickActionsGridStyle}>
          <button style={quickActionButtonStyle} onClick={() => navigate('/record-headache')}>
            <i className="fas fa-head-side-mask" style={quickActionButtonIconStyle}></i>
            Record Headache
          </button>
          <button style={quickActionButtonStyle} onClick={() => navigate('/record-sleep')}>
            <i className="fas fa-moon" style={quickActionButtonIconStyle}></i>
            Record Sleep
          </button>
          <button style={quickActionButtonStyle} onClick={() => navigate('/record-stress')}>
            <i className="fas fa-frown-open" style={quickActionButtonIconStyle}></i>
            Record Stress
          </button>
          <button style={quickActionButtonStyle} onClick={() => navigate('/record-medication')}>
            <i className="fas fa-pills" style={quickActionButtonIconStyle}></i>
            Record Medication
          </button>
          {/* Add more quick actions as needed */}
        </div>

        {/* Combined Sleep Metrics */}
        <h2 style={sectionTitleStyle}>Sleep Metrics</h2>
        <div
          style={{ ...dailyMetricsContainerStyle, cursor: 'pointer' }}
          onClick={() => navigate('/record-sleep')}
        >
          <div style={metricHeaderStyle}>
            <span style={{ fontSize: '1rem', fontWeight: '600', color: '#1F2937' }}>Your Sleep</span>
            <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Last 30 days avg</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '1rem' }}>
            <div>
              <div style={metricValueStyle}>{dashboardData.stats.avgSleepHours}</div>
              <div style={metricLabelStyle}>Hours Slept</div>
            </div>
            <div>
              <div style={metricValueStyle}>{dashboardData.stats.sleepQualityPercent}%</div>
              <div style={metricLabelStyle}>Sleep Quality</div>
            </div>
          </div>
        </div>

        {/* Stress Metrics */}
        <h2 style={sectionTitleStyle}>Stress Metrics</h2>
        <div
          style={{ ...dailyMetricsContainerStyle, cursor: 'pointer' }}
          onClick={() => navigate('/record-stress')}
        >
          <div style={metricHeaderStyle}>
            <span style={{ fontSize: '1rem', fontWeight: '600', color: '#1F2937' }}>Your Stress</span>
            <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Last 30 days avg</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={metricValueStyle}>{dashboardData.stats.avgStressLevel}</div>
            <div style={metricLabelStyle}>Average Stress Level</div>
          </div>
        </div>


        {/* Calendar and Headache Recap */}
        <h2 style={sectionTitleStyle}>Headache Calendar & Recap</h2>
        <div style={calendarContainerStyle}>
          <div style={calendarHeaderStyle}>
            <button onClick={goToPreviousMonth} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#6B7280' }}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <span>{getMonthName(currentMonth)} {currentYear}</span>
            <button onClick={goToNextMonth} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#6B7280' }}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
          <div style={calendarGridStyle}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} style={weekdayHeaderStyle}>{day}</div>
            ))}
            {renderCalendarDays()}
          </div>

          {/* Recap Section */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1F2937', marginBottom: '1rem' }}>Monthly Recap</h3>
            <ul style={dataListStyle}>
              <li style={dataListItemStyle}>
                <span>Hours with Headache</span>
                <span>{dashboardData.stats.headacheHours} hrs</span>
              </li>
              <li style={dataListItemStyle}>
                <span>Days with No Headache</span>
                <span>{dashboardData.stats.daysWithNoHeadache} days</span>
              </li>
              <li style={dataListItemStyle}>
                <span>Days with Mild Headache</span>
                <span>{dashboardData.stats.daysWithMildHeadache} days</span>
              </li>
              <li style={dataListItemStyle}>
                <span>Days with Moderate Headache</span>
                <span>{dashboardData.stats.daysWithModerateHeadache} days</span>
              </li>
              <li style={dataListItemLastStyle}>
                <span>Days with Severe Headache</span>
                <span>{dashboardData.stats.daysWithSevereHeadache} days</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <footer style={footerNavStyle}>
        <Link to="/dashboard" style={navButtonActiveStyle}>
          <i className="fas fa-home" style={navIconStyle}></i>
          Home
        </Link>
        <Link to="/record-headache" style={navButtonStyle}>
          <i className="fas fa-plus-circle" style={navIconStyle}></i>
          Record
        </Link>
        <Link to="/history" style={navButtonStyle}>
          <i className="fas fa-history" style={navIconStyle}></i>
          History
        </Link>
        <Link to="/profile" style={navButtonStyle}>
          <i className="fas fa-user" style={navIconStyle}></i>
          Profile
        </Link>
      </footer>
    </div>
  );
}
