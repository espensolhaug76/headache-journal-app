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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function Dashboard() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [dashboardData, setDashboardData] = useState({
    sleepStressData: [],
    headacheData: [],
    todayStats: {
      lastSleep: null,
      todayStress: null,
      weekHeadaches: 0,
      todayWater: 0
    }
  });

  // Fetch last 7 days of data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        
        // Calculate date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Fetch sleep data
        const sleepQuery = query(
          collection(db, 'users', currentUser.uid, 'sleep'),
          where('date', '>=', Timestamp.fromDate(sevenDaysAgo)),
          orderBy('date', 'asc'),
          limit(7)
        );
        const sleepSnapshot = await getDocs(sleepQuery);
        const sleepData = sleepSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate()
        }));

        // Fetch stress data
        const stressQuery = query(
          collection(db, 'users', currentUser.uid, 'stress'),
          where('date', '>=', Timestamp.fromDate(sevenDaysAgo)),
          orderBy('date', 'asc'),
          limit(7)
        );
        const stressSnapshot = await getDocs(stressQuery);
        const stressData = stressSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate()
        }));

        // Fetch headache data
        const headacheQuery = query(
          collection(db, 'users', currentUser.uid, 'headaches'),
          where('time', '>=', Timestamp.fromDate(sevenDaysAgo)),
          orderBy('time', 'asc')
        );
        const headacheSnapshot = await getDocs(headacheQuery);
        const headacheData = headacheSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: doc.data().time.toDate()
        }));

        // Process data for charts
        const chartData = processChartData(sleepData, stressData, headacheData);
        
        setDashboardData(chartData);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  // Process data for visualization
  const processChartData = (sleepData, stressData, headacheData) => {
    // Create array of last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toDateString(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date
      });
    }

    // Combine sleep, stress, and headache data
    const sleepStressData = days.map(day => {
      const dayStr = day.date;
      
      // Find sleep data for this day
      const sleepEntry = sleepData.find(sleep => 
        sleep.date.toDateString() === dayStr
      );
      
      // Find stress data for this day
      const stressEntry = stressData.find(stress => 
        stress.date.toDateString() === dayStr
      );
      
      // Count headaches for this day
      const dayHeadaches = headacheData.filter(headache => 
        headache.time.toDateString() === dayStr
      ).length;

      return {
        day: day.dayName,
        sleepHours: sleepEntry ? sleepEntry.hoursSlept || 0 : 0,
        sleepQuality: sleepEntry ? sleepEntry.sleepQuality || 0 : 0,
        stressLevel: stressEntry ? stressEntry.stressLevel || 0 : 0,
        headaches: dayHeadaches,
        hasData: !!(sleepEntry || stressEntry)
      };
    });

    // Calculate today's stats
    const todayStats = {
      lastSleep: sleepData.length > 0 ? sleepData[sleepData.length - 1] : null,
      todayStress: stressData.length > 0 ? stressData[stressData.length - 1] : null,
      weekHeadaches: headacheData.length,
      todayWater: 0 // This would come from nutrition data
    };

    return {
      sleepStressData,
      headacheData: days.map(day => ({
        day: day.dayName,
        headaches: headacheData.filter(h => 
          h.time.toDateString() === day.date
        ).length
      })),
      todayStats
    };
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'sleepHours' && ' hours'}
              {(entry.dataKey === 'sleepQuality' || entry.dataKey === 'stressLevel') && '/10'}
              {entry.dataKey === 'headaches' && (entry.value === 1 ? ' headache' : ' headaches')}
            </p>
          ))}
          {/* Show correlation insights */}
          {payload.length >= 3 && (
            <div style={{ marginTop: '8px', padding: '4px', background: '#f8f9fa', borderRadius: '4px', fontSize: '0.8rem' }}>
              {getTooltipInsight(payload)}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  async function handleLogout() {
    setError('');
    try {
      await logout();
      navigate('/login');
    } catch {
      setError('Failed to log out');
    }
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <h2>Loading your health insights...</h2>
          <p>Analyzing your sleep, stress, and headache patterns</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Your Health Dashboard</h1>
          <p style={{ color: '#666', margin: '0.5rem 0' }}>
            Welcome back! Here's your 7-day health overview.
          </p>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary">
          Log Out
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Quick Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <h3>💤 Last Night's Sleep</h3>
          {dashboardData.todayStats.lastSleep ? (
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c5aa0' }}>
                {dashboardData.todayStats.lastSleep.hoursSlept}h
              </div>
              <div style={{ color: '#666' }}>
                Quality: {dashboardData.todayStats.lastSleep.sleepQuality || 'Not rated'}/10
              </div>
            </div>
          ) : (
            <p style={{ color: '#666' }}>No recent sleep data</p>
          )}
        </div>

        <div className="stat-card">
          <h3>😰 Current Stress</h3>
          {dashboardData.todayStats.todayStress ? (
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>
                {dashboardData.todayStats.todayStress.stressLevel}/10
              </div>
              <div style={{ color: '#666' }}>Latest reading</div>
            </div>
          ) : (
            <p style={{ color: '#666' }}>No recent stress data</p>
          )}
        </div>

        <div className="stat-card">
          <h3>🤕 This Week's Headaches</h3>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b35' }}>
              {dashboardData.todayStats.weekHeadaches}
            </div>
            <div style={{ color: '#666' }}>Past 7 days</div>
          </div>
        </div>

        <div className="stat-card">
          <h3>⚡ Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/record-headache" className="btn" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
              Log Headache
            </Link>
            <Link to="/record-sleep" className="btn btn-secondary" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
              Log Sleep
            </Link>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="chart-section">
        <div className="stat-card" style={{ marginBottom: '2rem' }}>
          <h3>Sleep, Stress & Headache Correlation (Past 7 Days)</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Track how your sleep quality and stress levels impact headache frequency • Red dots = headaches (larger = more)
          </p>
          {dashboardData.sleepStressData.some(d => d.hasData) ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dashboardData.sleepStressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="hours" orientation="left" domain={[0, 12]} label={{ value: 'Sleep Hours', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="scale" orientation="right" domain={[0, 10]} label={{ value: 'Quality & Stress (0-10)', angle: 90, position: 'insideRight' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {/* Sleep Hours Line */}
                <Line 
                  yAxisId="hours"
                  type="monotone" 
                  dataKey="sleepHours" 
                  stroke="#2c5aa0" 
                  strokeWidth={3}
                  name="Sleep Hours"
                  connectNulls={false}
                  dot={{ fill: '#2c5aa0', strokeWidth: 2, r: 4 }}
                />
                
                {/* Sleep Quality Line */}
                <Line 
                  yAxisId="scale"
                  type="monotone" 
                  dataKey="sleepQuality" 
                  stroke="#28a745" 
                  strokeWidth={2}
                  name="Sleep Quality"
                  connectNulls={false}
                  dot={{ fill: '#28a745', strokeWidth: 2, r: 4 }}
                />
                
                {/* Stress Level Line */}
                <Line 
                  yAxisId="scale"
                  type="monotone" 
                  dataKey="stressLevel" 
                  stroke="#dc3545" 
                  strokeWidth={2}
                  name="Stress Level"
                  connectNulls={false}
                  dot={{ fill: '#dc3545', strokeWidth: 2, r: 4 }}
                />
                
                {/* Headaches as Scatter Points */}
                <Line 
                  yAxisId="scale"
                  type="monotone" 
                  dataKey="headaches" 
                  stroke="transparent"
                  strokeWidth={0}
                  name="Headaches"
                  connectNulls={false}
                  line={false}
                  dot={({ cx, cy, payload }) => {
                    if (payload.headaches > 0) {
                      const size = Math.max(6, Math.min(16, 6 + payload.headaches * 4)); // Size based on headache count
                      return (
                        <g>
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={size} 
                            fill="#ff6b35" 
                            stroke="#fff" 
                            strokeWidth={2}
                            opacity={0.9}
                          />
                          <text 
                            x={cx} 
                            y={cy + 3} 
                            textAnchor="middle" 
                            fill="white" 
                            fontSize="10" 
                            fontWeight="bold"
                          >
                            {payload.headaches}
                          </text>
                        </g>
                      );
                    }
                    return null;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">
              <p>Start tracking your sleep and stress to see patterns here!</p>
              <Link to="/record-sleep" className="btn">Record Sleep Data</Link>
            </div>
          )}
        </div>

        <div className="stat-card">
          <h3>Headache Frequency (Past 7 Days)</h3>
          {dashboardData.headacheData.some(d => d.headaches > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dashboardData.headacheData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="headaches" fill="#ff6b35" name="Headaches" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">
              <p>No headaches recorded this week! 🎉</p>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>
                If you do get a headache, don't forget to log it for pattern analysis.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="quick-links">
        <Link to="/record-headache">Record Headache</Link>
        <Link to="/record-sleep">Record Sleep</Link>
        <Link to="/record-nutrition">Record Nutrition</Link>
        <Link to="/record-exercise">Record Exercise</Link>
        <Link to="/record-stress">Record Stress</Link>
        <Link to="/record-body-pain">Record Body Pain</Link>
      </div>

      {/* Insights Section */}
      {dashboardData.sleepStressData.some(d => d.hasData) && (
        <div className="stat-card" style={{ marginTop: '2rem', background: '#f8f9fa' }}>
          <h3>💡 Your Health Insights</h3>
          <div className="insights">
            {generateInsights(dashboardData.sleepStressData)}
          </div>
        </div>
      )}
    </div>
  );
}

// Generate personalized insights based on data
function generateInsights(data) {
  const insights = [];
  const validData = data.filter(d => d.hasData);
  
  if (validData.length === 0) {
    return <p>Keep tracking for personalized insights!</p>;
  }

  // Sleep analysis
  const avgSleep = validData.reduce((sum, d) => sum + d.sleepHours, 0) / validData.length;
  const avgStress = validData.reduce((sum, d) => sum + d.stressLevel, 0) / validData.length;
  const avgQuality = validData.reduce((sum, d) => sum + d.sleepQuality, 0) / validData.length;

  if (avgSleep < 7) {
    insights.push("💤 You're averaging " + avgSleep.toFixed(1) + " hours of sleep. Consider aiming for 7-9 hours.");
  }

  if (avgStress > 6) {
    insights.push("😰 Your stress levels have been elevated (avg " + avgStress.toFixed(1) + "/10). Try relaxation techniques.");
  }

  if (avgQuality < 6) {
    insights.push("🛌 Your sleep quality could improve (avg " + avgQuality.toFixed(1) + "/10). Consider sleep hygiene practices.");
  }

  // Correlation analysis
  const sleepStressCorrelation = calculateCorrelation(
    validData.map(d => d.sleepHours),
    validData.map(d => d.stressLevel)
  );

  if (sleepStressCorrelation < -0.3) {
    insights.push("📊 Better sleep appears to lower your stress levels. Prioritize sleep for stress management!");
  }

  // Headache correlation analysis
  const headacheStressCorrelation = calculateCorrelation(
    validData.map(d => d.headaches),
    validData.map(d => d.stressLevel)
  );

  const headacheSleepCorrelation = calculateCorrelation(
    validData.map(d => d.headaches),
    validData.map(d => d.sleepQuality)
  );

  if (headacheStressCorrelation > 0.3) {
    insights.push("🤕 Higher stress levels seem to coincide with more headaches. Stress management may help reduce headache frequency.");
  }

  if (headacheSleepCorrelation < -0.3) {
    insights.push("😴 Better sleep quality appears to reduce headache frequency. Focus on improving sleep quality!");
  }

  // Pattern detection
  const highStressLowSleepDays = validData.filter(d => d.stressLevel > 6 && d.sleepQuality < 5);
  if (highStressLowSleepDays.length > 0) {
    const headachesOnTheseDays = highStressLowSleepDays.reduce((sum, d) => sum + d.headaches, 0);
    if (headachesOnTheseDays > 0) {
      insights.push("⚠️ You tend to get more headaches on days with high stress and poor sleep quality. This is a key pattern to address!");
    }
  }

  return insights.length > 0 ? (
    <ul style={{ marginLeft: '1rem' }}>
      {insights.map((insight, idx) => (
        <li key={idx} style={{ marginBottom: '0.5rem' }}>{insight}</li>
      ))}
    </ul>
  ) : (
    <p>You're doing great! Keep up the healthy habits.</p>
  );
}

// Simple correlation calculation
function calculateCorrelation(x, y) {
  const n = x.length;
  const sum1 = x.reduce((a, b) => a + b);
  const sum2 = y.reduce((a, b) => a + b);
  const sum1Sq = x.reduce((a, b) => a + b * b);
  const sum2Sq = y.reduce((a, b) => a + b * b);
  const pSum = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b);
  const num = pSum - (sum1 * sum2 / n);
  const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
  return den === 0 ? 0 : num / den;
}

// Generate tooltip insights
function getTooltipInsight(payload) {
  const sleepQuality = payload.find(p => p.dataKey === 'sleepQuality')?.value || 0;
  const stressLevel = payload.find(p => p.dataKey === 'stressLevel')?.value || 0;
  const headaches = payload.find(p => p.dataKey === 'headaches')?.value || 0;

  if (headaches === 0 && sleepQuality >= 7 && stressLevel <= 4) {
    return "✅ Great day! Good sleep + low stress = no headaches";
  } else if (headaches > 0 && (sleepQuality < 5 || stressLevel > 6)) {
    return "⚠️ Poor sleep or high stress may have triggered headaches";
  } else if (headaches === 0) {
    return "😊 No headaches today";
  } else {
    return "🤕 Headache day - look for patterns";
  }
}
