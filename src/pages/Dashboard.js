// src/pages/Dashboard.js - Updated with Calendar Date Shortcuts
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
  
  // NEW: Calendar date modal state
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateData, setSelectedDateData] = useState(null);
  
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

  // Data fetching logic - RESTORED FROM ORIGINAL
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


        // Fetch monthly calendar data
               
       const monthlyHeadacheQuery = query(
  collection(db, 'users', currentUser.uid, 'headaches'),
  orderBy('createdAt', 'desc')
);
const monthlyHeadacheSnapshot = await getDocs(monthlyHeadacheQuery);
const allHeadaches = monthlyHeadacheSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// Filter by date field instead of createdAt
const monthlyHeadaches = allHeadaches.filter(headache => {
  if (headache.date) {
    const headacheDate = new Date(headache.date);
    const headacheMonth = headacheDate.getMonth();
    const headacheYear = headacheDate.getFullYear();
    return headacheMonth === currentMonth && headacheYear === currentYear;
  }
  return false;
});
        console.log('=== DASHBOARD DEBUG ===');
console.log('Current calendar month/year:', currentMonth, currentYear);
console.log('All headaches from database:', monthlyHeadaches);
console.log('Filtered monthly headaches:', monthlyHeadaches);

       const monthlyMedicationQuery = query(
  collection(db, 'users', currentUser.uid, 'medications'),
  orderBy('createdAt', 'desc')
);
        const monthlyMedicationSnapshot = await getDocs(monthlyMedicationQuery);
const allMedications = monthlyMedicationSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// Filter by date field instead of createdAt
const monthlyMedications = allMedications.filter(medication => {
  if (medication.date) {
    const medicationDate = new Date(medication.date);
    const medicationMonth = medicationDate.getMonth();
    const medicationYear = medicationDate.getFullYear();
    return medicationMonth === currentMonth && medicationYear === currentYear;
  }
  return false;
});

        // Process data
        const processedData = processLast7Days(sleepData, stressData, headacheData);
        const dailyMetrics = processDailyMetrics(sleepData, stressData, headacheData);
        const calendarData = processCalendarData(monthlyHeadaches, monthlyMedications);
        const stats = calculateStats(sleepData, stressData, headacheData);

        setDashboardData({
          sleepStressData: processedData,
          dailyMetrics: dailyMetrics,
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

  // Helper functions - RESTORED FROM ORIGINAL
  const processCalendarData = (headaches, medications) => {
    const calendarData = {};
    
    headaches.forEach(headache => {
      const date = headache.date || 
  (headache.createdAt?.toDate ? 
    headache.createdAt.toDate().toISOString().split('T')[0] : 
    new Date().toISOString().split('T')[0]);

      
      if (!calendarData[date]) {
        calendarData[date] = { headaches: [], medications: [] };
      }
      calendarData[date].headaches.push({
        painLevel: headache.painLevel,
        location: headache.location,
        duration: headache.duration || 0
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

  const processDailyMetrics = (sleepData, stressData, headacheData) => {
    const days = [];
    const dayNames = ['Today', 'Yesterday', '2 Days Ago'];
    
    for (let i = 0; i < 3; i++) {
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

      days.push({
        dayLabel: dayNames[i],
        date: dateStr,
        sleepHours: sleepEntry?.hoursSlept || 0,
        sleepQuality: sleepEntry?.sleepQuality || 0,
        stressLevel: stressEntry?.stressLevel || 0,
        headacheCount: dayHeadaches.length,
        avgPainLevel: dayHeadaches.length > 0 ? 
          dayHeadaches.reduce((sum, h) => sum + (h.painLevel || 0), 0) / dayHeadaches.length : 0
      });
    }
    
    return days;
  };

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
        avgPainLevelPercent: avgPainLevel * 10,
        totalPainScore: totalPainScore,
        headachesByIntensity: headachesByIntensity,
        hasData: sleepEntry || stressEntry || headacheCount > 0
      });
    }

    return days;
  };

  const calculateStats = (sleepData, stressData, headacheData) => {
    const totalHeadaches = headacheData.length;
    const avgSleepHours = sleepData.length > 0 ? 
      sleepData.reduce((sum, entry) => sum + (entry.hoursSlept || 0), 0) / sleepData.length : 0;
    const avgSleepQuality = sleepData.length > 0 ? 
      sleepData.reduce((sum, entry) => sum + (entry.sleepQuality || 0), 0) / sleepData.length : 0;
    const avgStressLevel = stressData.length > 0 ? 
      stressData.reduce((sum, entry) => sum + (entry.stressLevel || 0), 0) / stressData.length : 0;
    
    const personalWorstDay = Math.max(...headacheData.map(h => h.painLevel || 0), 1);

    return {
      totalHeadaches,
      avgSleepHours: Math.round(avgSleepHours * 10) / 10,
      avgSleepQuality: Math.round(avgSleepQuality * 10) / 10,
      avgStressLevel: Math.round(avgStressLevel * 10) / 10,
      personalWorstDay
    };
  };

  // NEW: Calendar date click handlers
  const handleCalendarDateClick = (dateStr, dayData) => {
    setSelectedDate(dateStr);
    setSelectedDateData(dayData);
    setShowDateModal(true);
  };

  // NEW: Quick entry handlers
  const handleQuickHeadacheEntry = () => {
    navigate(`/record-headache?date=${selectedDate}&mode=manual-entry`);
  };

  const handleQuickMedicationEntry = () => {
    navigate(`/record-medication?date=${selectedDate}`);
  };

  const handleQuickSleepEntry = () => {
    navigate(`/record-sleep?date=${selectedDate}&mode=manual-entry`);
  };

  const handleQuickStressEntry = () => {
    navigate(`/record-stress?date=${selectedDate}&mode=manual-entry`);
  };

  const closeModal = () => {
    setShowDateModal(false);
    setSelectedDate(null);
    setSelectedDateData(null);
  };

  // NEW: Format date for display
  const formatSelectedDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Event handlers
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Loading state
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
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
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
        integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
        crossOrigin="anonymous" 
        referrerPolicy="no-referrer" 
      />

      <DashboardHeader currentUser={currentUser} />
      
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

          {/* UPDATED: Calendar with date click handler */}
          <CalendarModule
            calendarData={dashboardData.calendarData}
            currentMonth={currentMonth}
            currentYear={currentYear}
            setCurrentMonth={setCurrentMonth}
            setCurrentYear={setCurrentYear}
            onDateClick={handleCalendarDateClick}
          />

          <AIInsightsModule 
            stats={dashboardData.stats}
          />

          <LogoutButton onLogout={handleLogout} />

          {/* NEW: Date Selection Modal */}
          {showDateModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}>
                {/* Close Button */}
                <button
                  onClick={closeModal}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.5rem',
                    color: '#9CA3AF',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>

                {/* Modal Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h3 style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '1.5rem', 
                    fontWeight: '600',
                    color: '#1E3A8A'
                  }}>
                    {selectedDateData ? 'Edit Day' : 'Add Data'}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    color: '#6B7280', 
                    fontSize: '1rem' 
                  }}>
                    {selectedDate && formatSelectedDate(selectedDate)}
                  </p>
                </div>

                {/* Existing Data Summary */}
                {selectedDateData && (
                  <div style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '2rem'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 1rem 0', 
                      fontSize: '1rem', 
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Current Data for This Day:
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                          Headaches
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#DC2626' }}>
                          {selectedDateData.headaches.length}
                          {selectedDateData.headaches.length > 0 && (
                            <span style={{ fontSize: '0.8rem', color: '#6B7280', marginLeft: '0.5rem' }}>
                              avg: {Math.round(selectedDateData.headaches.reduce((sum, h) => sum + (h.painLevel || 0), 0) / selectedDateData.headaches.length)}/10
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                          Medications
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#059669' }}>
                          {selectedDateData.medications.length}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Action Buttons */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ 
                    margin: '0 0 1rem 0', 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    {selectedDateData ? 'Add More Data:' : 'What would you like to track?'}
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.75rem'
                  }}>
                    <button
                      onClick={handleQuickHeadacheEntry}
                      style={{
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}
                    >
                      <i className="fas fa-head-side-virus" style={{ marginRight: '0.5rem' }}></i>
                      Log Headache
                    </button>

                    <button
                      onClick={handleQuickMedicationEntry}
                      style={{
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #059669, #047857)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}
                    >
                      <i className="fas fa-pills" style={{ marginRight: '0.5rem' }}></i>
                      Log Medication
                    </button>

                    <button
                      onClick={handleQuickSleepEntry}
                      style={{
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}
                    >
                      <i className="fas fa-bed" style={{ marginRight: '0.5rem' }}></i>
                      Log Sleep
                    </button>

                    <button
                      onClick={handleQuickStressEntry}
                      style={{
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}
                    >
                      <i className="fas fa-brain" style={{ marginRight: '0.5rem' }}></i>
                      Log Stress
                    </button>
                  </div>
                </div>

                {/* Additional Quick Actions */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                  marginBottom: '1.5rem'
                }}>
                  <button
                    onClick={() => navigate(`/record-exercise?date=${selectedDate}&mode=manual-entry`)}
                    style={{
                      padding: '0.75rem',
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: '#374151',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    <i className="fas fa-dumbbell" style={{ marginRight: '0.5rem' }}></i>
                    Exercise
                  </button>

                  <button
                    onClick={() => navigate(`/record-nutrition?date=${selectedDate}&mode=manual-entry`)}
                    style={{
                      padding: '0.75rem',
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: '#374151',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    <i className="fas fa-apple-alt" style={{ marginRight: '0.5rem' }}></i>
                    Nutrition
                  </button>
                </div>

                {/* Close Button */}
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={closeModal}
                    style={{
                      background: 'transparent',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: '#6B7280',
                      padding: '0.75rem 1.5rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
