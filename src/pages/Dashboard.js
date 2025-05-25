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
  const [currentMetricDay, setCurrentMetricDay] = useState(0); // 0 = today, 1 = yesterday, 2 = day before
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dashboardData, setDashboardData] = useState({
    sleepStressData: [],
    dailyMetrics: [], // New: last 3 days metrics
    calendarData: {}, // New: monthly calendar data
    headacheData: [], // Store headache data for analysis
    sleepData: [], // Store sleep data for analysis
    stressData: [], // Store stress data for analysis
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

  // Helper function to analyze headache patterns
  const analyzeHeadachePatterns = (headacheData, sleepData, stressData) => {
    if (headacheData.length === 0) return null;

    // Count headache types
    const typeCount = {};
    const locationPatterns = {};
    const triggerPatterns = {};
    const timePatterns = {};
    
    headacheData.forEach(headache => {
      // Track headache types/locations
      if (headache.location) {
        typeCount[headache.location] = (typeCount[headache.location] || 0) + 1;
      }
      
      // Track common triggers
      if (headache.triggers && headache.triggers.length > 0) {
        headache.triggers.forEach(trigger => {
          triggerPatterns[trigger] = (triggerPatterns[trigger] || 0) + 1;
        });
      }
      
      // Track timing patterns
      const hour = headache.startTime?.toDate ? headache.startTime.toDate().getHours() : 
                    new Date(headache.startTime?.seconds * 1000).getHours();
      if (hour !== undefined) {
        const timeOfDay = hour < 6 ? 'Early Morning' :
                         hour < 12 ? 'Morning' :
                         hour < 17 ? 'Afternoon' :
                         hour < 21 ? 'Evening' : 'Night';
        timePatterns[timeOfDay] = (timePatterns[timeOfDay] || 0) + 1;
      }
    });

    // Find most common headache type
    const mostCommonType = Object.keys(typeCount).reduce((a, b) => 
      typeCount[a] > typeCount[b] ? a : b, null);
    
    // Find most common triggers
    const topTriggers = Object.entries(triggerPatterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([trigger]) => trigger);

    // Find most common time
    const mostCommonTime = Object.keys(timePatterns).reduce((a, b) => 
      timePatterns[a] > timePatterns[b] ? a : b, null);

    // Analyze correlation with sleep
    const sleepCorrelation = analyzeSleepHeadacheCorrelation(headacheData, sleepData);
    const stressCorrelation = analyzeStressHeadacheCorrelation(headacheData, stressData);

    return {
      mostCommonType,
      typeCount,
      topTriggers,
      mostCommonTime,
      timePatterns,
      sleepCorrelation,
      stressCorrelation,
      totalHeadaches: headacheData.length
    };
  };

  const analyzeSleepHeadacheCorrelation = (headacheData, sleepData) => {
    if (sleepData.length === 0) return null;
    
    const sleepMap = {};
    sleepData.forEach(sleep => {
      sleepMap[sleep.date] = sleep;
    });

    let headachesAfterPoorSleep = 0;
    let headachesAfterGoodSleep = 0;
    let poorSleepDays = 0;
    let goodSleepDays = 0;

    headacheData.forEach(headache => {
      const headacheDate = headache.date;
      const previousDate = new Date(headacheDate);
      previousDate.setDate(previousDate.getDate() - 1);
      const prevDateStr = previousDate.toISOString().split('T')[0];
      
      const prevSleep = sleepMap[prevDateStr];
      if (prevSleep) {
        if (prevSleep.sleepQuality <= 5 || prevSleep.hoursSlept < 6) {
          headachesAfterPoorSleep++;
        } else {
          headachesAfterGoodSleep++;
        }
      }
    });

    sleepData.forEach(sleep => {
      if (sleep.sleepQuality <= 5 || sleep.hoursSlept < 6) {
        poorSleepDays++;
      } else {
        goodSleepDays++;
      }
    });

    const poorSleepHeadacheRate = poorSleepDays > 0 ? (headachesAfterPoorSleep / poorSleepDays * 100) : 0;
    const goodSleepHeadacheRate = goodSleepDays > 0 ? (headachesAfterGoodSleep / goodSleepDays * 100) : 0;

    return {
      poorSleepHeadacheRate: Math.round(poorSleepHeadacheRate),
      goodSleepHeadacheRate: Math.round(goodSleepHeadacheRate),
      correlation: poorSleepHeadacheRate > goodSleepHeadacheRate ? 'Strong' : 
                   poorSleepHeadacheRate > goodSleepHeadacheRate * 0.7 ? 'Moderate' : 'Weak'
    };
  };

  const analyzeStressHeadacheCorrelation = (headacheData, stressData) => {
    if (stressData.length === 0) return null;
    
    const stressMap = {};
    stressData.forEach(stress => {
      stressMap[stress.date] = stress;
    });

    let headachesAfterHighStress = 0;
    let headachesAfterLowStress = 0;
    let highStressDays = 0;
    let lowStressDays = 0;

    headacheData.forEach(headache => {
      const headacheDate = headache.date;
      const stressEntry = stressMap[headacheDate];
      
      if (stressEntry) {
        if (stressEntry.stressLevel >= 7) {
          headachesAfterHighStress++;
        } else {
          headachesAfterLowStress++;
        }
      }
    });

    stressData.forEach(stress => {
      if (stress.stressLevel >= 7) {
        highStressDays++;
      } else {
        lowStressDays++;
      }
    });

    const highStressHeadacheRate = highStressDays > 0 ? (headachesAfterHighStress / highStressDays * 100) : 0;
    const lowStressHeadacheRate = lowStressDays > 0 ? (headachesAfterLowStress / lowStressDays * 100) : 0;

    return {
      highStressHeadacheRate: Math.round(highStressHeadacheRate),
      lowStressHeadacheRate: Math.round(lowStressHeadacheRate),
      correlation: highStressHeadacheRate > lowStressHeadacheRate ? 'Strong' : 
                   highStressHeadacheRate > lowStressHeadacheRate * 0.7 ? 'Moderate' : 'Weak'
    };
  };

  // Combined Sleep Metrics Component
  const CombinedSleepMetrics = ({ currentDayMetrics }) => {
    const sleepScore = calculateSleepScore(currentDayMetrics);
    
    return (
      <StatsDisplay
        title="Sleep Health"
        icon="fas fa-moon"
        color="#4682B4"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', width: '100%' }}>
          {/* Main Sleep Score Circle */}
          <div style={{ flex: 'none' }}>
            <CircularProgress
              percentage={sleepScore.percentage}
              color={sleepScore.color}
              label="Sleep Score"
              value=""
              showPercentage={true}
              size={120}
              strokeWidth={8}
            />
          </div>
          
          {/* Sleep Details */}
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#4B5563' }}>Duration</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: sleepScore.hoursColor }}>
                  {currentDayMetrics.sleepHours}h
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#4B5563' }}>Quality</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: sleepScore.qualityColor }}>
                  {currentDayMetrics.sleepQuality}/10
                </span>
              </div>
            </div>
            
            <div style={{ 
              padding: '0.75rem', 
              background: sleepScore.recommendation.type === 'good' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(255, 193, 7, 0.1)',
              borderRadius: '8px',
              border: `1px solid ${sleepScore.recommendation.type === 'good' ? 'rgba(40, 167, 69, 0.3)' : 'rgba(255, 193, 7, 0.3)'}`
            }}>
              <div style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: '1.3' }}>
                {sleepScore.recommendation.message}
              </div>
            </div>
          </div>
        </div>
      </StatsDisplay>
    );
  };

  const calculateSleepScore = (metrics) => {
    const hours = metrics.sleepHours || 0;
    const quality = metrics.sleepQuality || 0;
    
    // Score based on hours (optimal 7-9 hours)
    let hoursScore = 0;
    if (hours >= 7 && hours <= 9) {
      hoursScore = 100;
    } else if (hours >= 6 && hours <= 10) {
      hoursScore = 80;
    } else if (hours >= 5 && hours <= 11) {
      hoursScore = 60;
    } else {
      hoursScore = 30;
    }
    
    // Score based on quality (1-10 scale)
    const qualityScore = quality * 10;
    
    // Combined score (60% quality, 40% duration)
    const combinedScore = Math.round((qualityScore * 0.6) + (hoursScore * 0.4));
    
    const getColor = (score) => {
      if (score >= 80) return '#28a745';
      if (score >= 60) return '#20c997';
      if (score >= 40) return '#ffc107';
      return '#dc3545';
    };
    
    const getRecommendation = () => {
      if (combinedScore >= 80) {
        return { 
          type: 'good', 
          message: '🌟 Excellent sleep! This supports headache prevention.' 
        };
      } else if (combinedScore >= 60) {
        return { 
          type: 'okay', 
          message: '👍 Good sleep, but room for improvement to reduce headache risk.' 
        };
      } else if (hours < 6) {
        return { 
          type: 'warning', 
          message: '⚠️ Too little sleep may trigger headaches. Aim for 7-9 hours.' 
        };
      } else if (quality <= 5) {
        return { 
          type: 'warning', 
          message: '⚠️ Poor sleep quality can trigger headaches. Consider sleep hygiene improvements.' 
        };
      } else {
        return { 
          type: 'warning', 
          message: '⚠️ Sleep improvements needed. Poor sleep is a major headache trigger.' 
        };
      }
    };
    
    return {
      percentage: combinedScore,
      color: getColor(combinedScore),
      hoursColor: hours >= 7 && hours <= 9 ? '#28a745' : hours >= 6 && hours <= 10 ? '#ffc107' : '#dc3545',
      qualityColor: quality >= 7 ? '#28a745' : quality >= 5 ? '#ffc107' : '#dc3545',
      recommendation: getRecommendation()
    };
  };

  // Enhanced AI Insights Component
  const EnhancedAIInsights = ({ stats, headacheData, sleepData, stressData }) => {
    const patterns = analyzeHeadachePatterns(headacheData, sleepData, stressData);
    
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
          <i className="fas fa-brain"></i> AI Health Analysis
        </h3>
        
        {patterns && patterns.totalHeadaches > 0 ? (
          <div style={{ lineHeight: '1.7', fontSize: '1rem', color: '#4B5563' }}>
            {/* Headache Pattern Analysis */}
            <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(70, 130, 180, 0.1)', borderRadius: '12px', border: '1px solid rgba(70, 130, 180, 0.2)' }}>
              <div style={{ fontSize: '1.5rem', color: '#4682B4' }}>
                <i className="fas fa-head-side-virus"></i>
              </div>
              <div>
                <strong style={{ color: '#2c5aa0' }}>Your Headache Pattern:</strong>
                <div style={{ marginTop: '0.5rem' }}>
                  Most common type: <strong>{patterns.mostCommonType}</strong> ({patterns.typeCount[patterns.mostCommonType]} of {patterns.totalHeadaches} headaches)
                </div>
                {patterns.mostCommonTime && (
                  <div>Usually occurs: <strong>{patterns.mostCommonTime}</strong></div>
                )}
              </div>
            </div>

            {/* Trigger Analysis */}
            {patterns.topTriggers.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.2)' }}>
                <div style={{ fontSize: '1.5rem', color: '#ffc107' }}>
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <div>
                  <strong style={{ color: '#856404' }}>Your Top Triggers:</strong>
                  <div style={{ marginTop: '0.5rem' }}>
                    {patterns.topTriggers.map((trigger, index) => (
                      <span key={trigger}>
                        <strong>{trigger}</strong>
                        {index < patterns.topTriggers.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    Focus on avoiding these triggers to reduce headache frequency.
                  </div>
                </div>
              </div>
            )}

            {/* Sleep Correlation */}
            {patterns.sleepCorrelation && (
              <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(32, 201, 151, 0.1)', borderRadius: '12px', border: '1px solid rgba(32, 201, 151, 0.2)' }}>
                <div style={{ fontSize: '1.5rem', color: '#20c997' }}>
                  <i className="fas fa-moon"></i>
                </div>
                <div>
                  <strong style={{ color: '#0f5132' }}>Sleep-Headache Connection ({patterns.sleepCorrelation.correlation}):</strong>
                  <div style={{ marginTop: '0.5rem' }}>
                    {patterns.sleepCorrelation.poorSleepHeadacheRate}% headache rate after poor sleep vs {patterns.sleepCorrelation.goodSleepHeadacheRate}% after good sleep
                  </div>
                  {patterns.sleepCorrelation.correlation === 'Strong' && (
                    <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                      Your headaches are strongly linked to sleep quality. Prioritize consistent, quality sleep.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stress Correlation */}
            {patterns.stressCorrelation && (
              <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(220, 53, 69, 0.1)', borderRadius: '12px', border: '1px solid rgba(220, 53, 69, 0.2)' }}>
                <div style={{ fontSize: '1.5rem', color: '#dc3545' }}>
                  <i className="fas fa-brain"></i>
                </div>
                <div>
                  <strong style={{ color: '#721c24' }}>Stress-Headache Connection ({patterns.stressCorrelation.correlation}):</strong>
                  <div style={{ marginTop: '0.5rem' }}>
                    {patterns.stressCorrelation.highStressHeadacheRate}% headache rate on high-stress days vs {patterns.stressCorrelation.lowStressHeadacheRate}% on low-stress days
                  </div>
                  {patterns.stressCorrelation.correlation === 'Strong' && (
                    <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                      Stress management is crucial for your headache prevention.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Medical Recommendations */}
            <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', padding: '1rem', background: 'rgba(23, 162, 184, 0.1)', borderRadius: '12px', border: '1px solid rgba(23, 162, 184, 0.2)' }}>
              <div style={{ fontSize: '1.5rem', color: '#17a2b8' }}>
                <i className="fas fa-user-md"></i>
              </div>
              <div>
                <strong style={{ color: '#0c5460' }}>Personalized Recommendations:</strong>
                <div style={{ marginTop: '0.5rem' }}>
                  {getPersonalizedRecommendations(patterns)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // No headache data
          <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', padding: '1rem', background: 'rgba(40, 167, 69, 0.1)', borderRadius: '12px', border: '1px solid rgba(40, 167, 69, 0.2)' }}>
            <div style={{ fontSize: '1.5rem', color: '#28a745' }}>
              <i className="fas fa-trophy"></i>
            </div>
            <span style={{ color: '#155724' }}>
              <strong>Excellent week!</strong> No headaches recorded. Keep tracking your health factors to maintain this positive trend!
            </span>
          </div>
        )}
      </div>
    );
  };

  const getPersonalizedRecommendations = (patterns) => {
    const recommendations = [];
    
    // Type-specific recommendations
    if (patterns.mostCommonType) {
      switch (patterns.mostCommonType) {
        case 'Tension Headache':
          recommendations.push('Consider stress reduction techniques and neck/shoulder stretches');
          break;
        case 'Migraine Headache':
          recommendations.push('Track food triggers and maintain consistent sleep schedule');
          break;
        case 'Cluster Headache':
          recommendations.push('Avoid alcohol and maintain regular sleep patterns during cluster periods');
          break;
        case 'Hormone Headache':
          recommendations.push('Track menstrual cycle and consider hormonal headache treatments');
          break;
        case 'Caffeine Headache':
          recommendations.push('Maintain consistent daily caffeine intake or gradually reduce consumption');
          break;
        default:
          recommendations.push('Continue tracking to identify specific patterns for your headache type');
      }
    }
    
    // Trigger-specific recommendations
    if (patterns.topTriggers.includes('Stress')) {
      recommendations.push('Implement daily stress management techniques');
    }
    if (patterns.topTriggers.includes('Poor sleep')) {
      recommendations.push('Establish consistent sleep hygiene routine');
    }
    if (patterns.topTriggers.includes('Skipped meal')) {
      recommendations.push('Eat regular, balanced meals to maintain stable blood sugar');
    }
    
    // Time-specific recommendations
    if (patterns.mostCommonTime === 'Morning') {
      recommendations.push('Focus on consistent sleep schedule and morning hydration');
    } else if (patterns.mostCommonTime === 'Afternoon') {
      recommendations.push('Monitor lunch foods and afternoon stress levels');
    } else if (patterns.mostCommonTime === 'Evening') {
      recommendations.push('Review evening activities and screen time before bed');
    }
    
    return recommendations.map((rec, index) => (
      <div key={index} style={{ margin: '0.25rem 0' }}>• {rec}</div>
    ));
  };

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

        // Fetch monthly calendar data (headaches and medications)
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);
        
        const monthlyHeadacheQuery = query(
          collection(db, 'users', currentUser.uid, 'headaches'),
          where('createdAt', '>=', Timestamp.fromDate(monthStart)),
          where('createdAt', '<=', Timestamp.fromDate(monthEnd)),
          orderBy('createdAt', 'desc')
        );
        const monthlyHeadacheSnapshot = await getDocs(monthlyHeadacheQuery);
        const monthlyHeadaches = monthlyHeadacheSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const monthlyMedicationQuery = query(
          collection(db, 'users', currentUser.uid, 'medications'),
          where('createdAt', '>=', Timestamp.fromDate(monthStart)),
          where('createdAt', '<=', Timestamp.fromDate(monthEnd)),
          orderBy('createdAt', 'desc')
        );
        const monthlyMedicationSnapshot = await getDocs(monthlyMedicationQuery);
        const monthlyMedications = monthlyMedicationSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Process and combine data for the last 7 days
        const processedData = processLast7Days(sleepData, stressData, headacheData);
        
        // Process daily metrics for last 3 days
        const dailyMetrics = processDailyMetrics(sleepData, stressData, headacheData);
        
        // Process calendar data
        const calendarData = processCalendarData(monthlyHeadaches, monthlyMedications);
        
        // Calculate stats
        const stats = calculateStats(sleepData, stressData, headacheData);

        setDashboardData({
          sleepStressData: processedData,
          dailyMetrics: dailyMetrics,
          calendarData: calendarData,
          headacheData: headacheData,
          sleepData: sleepData,
          stressData: stressData,
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

  // Process daily metrics for last 3 days
  const processDailyMetrics = (sleepData, stressData, headacheData) => {
    const days = [];
    const dayNames = ['Today', 'Yesterday', '2 Days Ago'];
    
    for (let i = 0; i < 3; i++) {
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
