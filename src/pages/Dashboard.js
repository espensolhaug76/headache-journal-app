// src/pages/Dashboard.js - Enhanced with Calendar Date Management
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, limit, getDocs, Timestamp, deleteDoc, doc } from 'firebase/firestore';
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
  
  // Enhanced calendar date modal state
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [detailedDateRecords, setDetailedDateRecords] = useState({
    headaches: [],
    medications: [],
    sleep: [],
    stress: []
  });
  const [loadingDateRecords, setLoadingDateRecords] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
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
        id: headache.id,
        painLevel: headache.painLevel,
        location: headache.location,
        duration: headache.duration || 0,
        notes: headache.notes || '',
        startTime: headache.startTime,
        endTime: headache.endTime
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
        id: medication.id,
        name: medication.medicationName,
        type: medication.medicationType,
        effectiveness: medication.effectiveness,
        dosage: medication.dosage || '',
        time: medication.timeOfDay || ''
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

  // Enhanced: Load detailed records for specific date
  const loadDetailedDateRecords = async (dateStr) => {
    if (!currentUser) return;

    setLoadingDateRecords(true);

    try {
      // Fetch all records and filter by date (matching calendar logic)
      const [headaches, medications, sleep, stress] = await Promise.all([
        // Headaches - get all and filter by date
        getDocs(query(
          collection(db, 'users', currentUser.uid, 'headaches'),
          orderBy('createdAt', 'desc')
        )),
        // Medications - get all and filter by date
        getDocs(query(
          collection(db, 'users', currentUser.uid, 'medications'),
          orderBy('createdAt', 'desc')
        )),
        // Sleep - get all and filter by date
        getDocs(query(
          collection(db, 'users', currentUser.uid, 'sleep'),
          orderBy('createdAt', 'desc')
        )),
        // Stress - get all and filter by date
        getDocs(query(
          collection(db, 'users', currentUser.uid, 'stress'),
          orderBy('createdAt', 'desc')
        ))
      ]);

      // Filter headaches by date (matching calendar logic)
      const filteredHeadaches = headaches.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(headache => {
          const recordDate = headache.date || 
            (headache.createdAt?.toDate ? 
              headache.createdAt.toDate().toISOString().split('T')[0] : 
              new Date().toISOString().split('T')[0]);
          return recordDate === dateStr;
        });

      // Filter medications by date (matching calendar logic)
      const filteredMedications = medications.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(medication => {
          const recordDate = medication.date || 
            (medication.createdAt?.toDate ? 
              medication.createdAt.toDate().toISOString().split('T')[0] : 
              new Date().toISOString().split('T')[0]);
          return recordDate === dateStr;
        });

      // Filter sleep by date
      const filteredSleep = sleep.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(sleepRecord => {
          const recordDate = sleepRecord.date || 
            (sleepRecord.createdAt?.toDate ? 
              sleepRecord.createdAt.toDate().toISOString().split('T')[0] : 
              new Date().toISOString().split('T')[0]);
          return recordDate === dateStr;
        });

      // Filter stress by date
      const filteredStress = stress.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(stressRecord => {
          const recordDate = stressRecord.date || 
            (stressRecord.createdAt?.toDate ? 
              stressRecord.createdAt.toDate().toISOString().split('T')[0] : 
              new Date().toISOString().split('T')[0]);
          return recordDate === dateStr;
        });

      console.log('=== DETAIL MODAL DEBUG ===');
      console.log('Selected date:', dateStr);
      console.log('Filtered headaches:', filteredHeadaches);
      console.log('Filtered medications:', filteredMedications);

      setDetailedDateRecords({
        headaches: filteredHeadaches,
        medications: filteredMedications,
        sleep: filteredSleep,
        stress: filteredStress
      });

    } catch (error) {
      console.error('Error loading detailed date records:', error);
    }

    setLoadingDateRecords(false);
  };

  // Enhanced: Calendar date click handler
  const handleCalendarDateClick = async (dateStr, dayData) => {
    setSelectedDate(dateStr);
    setShowDateModal(true);
    
    // Load detailed records for this date
    await loadDetailedDateRecords(dateStr);
  };

  // Delete record functionality
  const handleDeleteRecord = async (recordType, recordId) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, recordType, recordId));
      
      // Update local state
      setDetailedDateRecords(prev => ({
        ...prev,
        [recordType]: prev[recordType].filter(record => record.id !== recordId)
      }));

      // Refresh dashboard data
      window.location.reload(); // Simple refresh for now

    } catch (error) {
      console.error('Error deleting record:', error);
    }

    setDeleteConfirm(null);
  };

  // Helper functions for modal
  const getPainLevelColor = (level) => {
    if (level <= 3) return '#28a745';
    if (level <= 6) return '#ffc107';
    if (level <= 8) return '#fd7e14';
    return '#dc3545';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (duration) => {
    if (!duration || duration === 0) return 'Manual Entry';
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Quick entry handlers
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
    setDetailedDateRecords({ headaches: [], medications: [], sleep: [], stress: [] });
  };

  // Format date for display
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

          {/* Enhanced: Date Management Modal */}
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
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
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
                    <i className="fas fa-calendar-day" style={{ marginRight: '0.5rem' }}></i>
                    Daily Overview
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    color: '#6B7280', 
                    fontSize: '1rem' 
                  }}>
                    {selectedDate && formatSelectedDate(selectedDate)}
                  </p>
                </div>

                {/* Loading State */}
                {loadingDateRecords && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
                    <div>Loading records...</div>
                  </div>
                )}

                {/* Records Display */}
                {!loadingDateRecords && (
                  <div style={{ marginBottom: '2rem' }}>
                    {/* Headaches Section */}
                    <div style={{ marginBottom: '2rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '1rem'
                      }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '1.1rem', 
                          fontWeight: '600',
                          color: '#DC2626',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <i className="fas fa-head-side-virus" style={{ marginRight: '0.5rem' }}></i>
                          Headaches ({detailedDateRecords.headaches.length})
                        </h4>
                        <button
                          onClick={handleQuickHeadacheEntry}
                          style={{
                            background: '#DC2626',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          <i className="fas fa-plus" style={{ marginRight: '0.25rem' }}></i>
                          Add
                        </button>
                      </div>
                      
                      {detailedDateRecords.headaches.length === 0 ? (
                        <p style={{ color: '#9CA3AF', fontStyle: 'italic', margin: 0 }}>No headaches recorded</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {detailedDateRecords.headaches.map((headache, index) => (
                            <div key={headache.id} style={{
                              background: '#FEF2F2',
                              border: '1px solid #FECACA',
                              borderRadius: '8px',
                              padding: '1rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                  <span style={{
                                    background: getPainLevelColor(headache.painLevel),
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold'
                                  }}>
                                    {headache.painLevel}/10
                                  </span>
                                  <span style={{ fontWeight: '600', color: '#374151' }}>
                                    {headache.location}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                                  Duration: {formatDuration(headache.duration)} | 
                                  Time: {formatTime(headache.startTime)}
                                  {headache.notes && (
                                    <div style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                                      "{headache.notes}"
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Link
                                  to={`/record-headache?mode=edit&id=${headache.id}`}
                                  style={{
                                    background: '#3B82F6',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    padding: '6px 8px',
                                    textDecoration: 'none',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  <i className="fas fa-edit"></i>
                                </Link>
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'headaches', id: headache.id, name: `${headache.location} headache` })}
                                  style={{
                                    background: '#DC2626',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    padding: '6px 8px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Medications Section */}
                    <div style={{ marginBottom: '2rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '1rem'
                      }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '1.1rem', 
                          fontWeight: '600',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <i className="fas fa-pills" style={{ marginRight: '0.5rem' }}></i>
                          Medications ({detailedDateRecords.medications.length})
                        </h4>
                        <button
                          onClick={handleQuickMedicationEntry}
                          style={{
                            background: '#059669',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          <i className="fas fa-plus" style={{ marginRight: '0.25rem' }}></i>
                          Add
                        </button>
                      </div>
                      
                      {detailedDateRecords.medications.length === 0 ? (
                        <p style={{ color: '#9CA3AF', fontStyle: 'italic', margin: 0 }}>No medications recorded</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {detailedDateRecords.medications.map((medication) => (
                            <div key={medication.id} style={{
                              background: '#F0FDF4',
                              border: '1px solid #BBF7D0',
                              borderRadius: '8px',
                              padding: '1rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                                  {medication.name || medication.medicationName}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                                  Type: {medication.type || medication.medicationType} |
                                  {medication.dosage && ` Dosage: ${medication.dosage} |`}
                                  {medication.time && ` Time: ${medication.time}`}
                                  {medication.effectiveness && (
                                    <div style={{ marginTop: '0.25rem' }}>
                                      Effectiveness: {medication.effectiveness}/10
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Link
                                  to={`/record-medication?mode=edit&id=${medication.id}`}
                                  style={{
                                    background: '#3B82F6',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    padding: '6px 8px',
                                    textDecoration: 'none',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  <i className="fas fa-edit"></i>
                                </Link>
                                <button
                                  onClick={() => setDeleteConfirm({ 
                                    type: 'medications', 
                                    id: medication.id, 
                                    name: medication.name || medication.medicationName 
                                  })}
                                  style={{
                                    background: '#DC2626',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    padding: '6px 8px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sleep Section */}
                    <div style={{ marginBottom: '2rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '1rem'
                      }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '1.1rem', 
                          fontWeight: '600',
                          color: '#3B82F6',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <i className="fas fa-bed" style={{ marginRight: '0.5rem' }}></i>
                          Sleep ({detailedDateRecords.sleep.length})
                        </h4>
                        <button
                          onClick={handleQuickSleepEntry}
                          style={{
                            background: '#3B82F6',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          <i className="fas fa-plus" style={{ marginRight: '0.25rem' }}></i>
                          Add
                        </button>
                      </div>
                      
                      {detailedDateRecords.sleep.length === 0 ? (
                        <p style={{ color: '#9CA3AF', fontStyle: 'italic', margin: 0 }}>No sleep data recorded</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {detailedDateRecords.sleep.map((sleep) => (
                            <div key={sleep.id} style={{
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              borderRadius: '8px',
                              padding: '1rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                                  {sleep.hoursSlept || 0}h sleep
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                                  Quality: {sleep.sleepQuality || 0}/10
                                  {sleep.bedTime && ` | Bedtime: ${sleep.bedTime}`}
                                  {sleep.wakeTime && ` | Wake: ${sleep.wakeTime}`}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Link
                                  to={`/record-sleep?mode=edit&id=${sleep.id}`}
                                  style={{
                                    background: '#3B82F6',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    padding: '6px 8px',
                                    textDecoration: 'none',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  <i className="fas fa-edit"></i>
                                </Link>
                                <button
                                  onClick={() => setDeleteConfirm({ 
                                    type: 'sleep', 
                                    id: sleep.id, 
                                    name: `sleep record (${sleep.hoursSlept}h)` 
                                  })}
                                  style={{
                                    background: '#DC2626',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    padding: '6px 8px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stress Section */}
                    <div style={{ marginBottom: '2rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '1rem'
                      }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '1.1rem', 
                          fontWeight: '600',
                          color: '#F59E0B',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <i className="fas fa-brain" style={{ marginRight: '0.5rem' }}></i>
                          Stress ({detailedDateRecords.stress.length})
                        </h4>
                        <button
                          onClick={handleQuickStressEntry}
                          style={{
                            background: '#F59E0B',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          <i className="fas fa-plus" style={{ marginRight: '0.25rem' }}></i>
                          Add
                        </button>
                      </div>
                      
                      {detailedDateRecords.stress.length === 0 ? (
                        <p style={{ color: '#9CA3AF', fontStyle: 'italic', margin: 0 }}>No stress data recorded</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {detailedDateRecords.stress.map((stress) => (
                            <div key={stress.id} style={{
                              background: '#FFFBEB',
                              border: '1px solid #FDE68A',
                              borderRadius: '8px',
                              padding: '1rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                                  Stress Level: {stress.stressLevel || 0}/10
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                                  {stress.stressors && `Stressors: ${stress.stressors}`}
                                  {stress.notes && (
                                    <div style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                                      "{stress.notes}"
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Link
                                  to={`/record-stress?mode=edit&id=${stress.id}`}
                                  style={{
                                    background: '#3B82F6',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    padding: '6px 8px',
                                    textDecoration: 'none',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  <i className="fas fa-edit"></i>
                                </Link>
                                <button
                                  onClick={() => setDeleteConfirm({ 
                                    type: 'stress', 
                                    id: stress.id, 
                                    name: `stress record (${stress.stressLevel}/10)` 
                                  })}
                                  style={{
                                    background: '#DC2626',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    padding: '6px 8px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
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
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
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
              zIndex: 1100
            }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '400px',
                width: '90%'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '3rem', color: '#DC2626', marginBottom: '1rem' }}>
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <h3 style={{ color: '#DC2626', marginBottom: '0.5rem' }}>Delete Record</h3>
                  <p style={{ color: '#6B7280', margin: 0 }}>
                    Are you sure you want to delete this {deleteConfirm.name}? This action cannot be undone.
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: '#4B5563',
                      padding: '10px 20px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={() => handleDeleteRecord(deleteConfirm.type, deleteConfirm.id)}
                    style={{
                      background: '#DC2626',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      padding: '10px 20px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  >
                    <i className="fas fa-trash" style={{ marginRight: '0.5rem' }}></i>
                    Delete
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
