// Continue from line 675 where the file was cut off
      
      days.push({
        name: dayNames[i],
        date: dateStr,
        sleepHours: sleepEntry?.hoursSlept || 0,
        sleepQuality: sleepEntry?.sleepQuality || 0,
        stressLevel: stressEntry?.stressLevel || 0,
        headacheCount: dayHeadaches.length,
        hasHeadache: dayHeadaches.length > 0
      });
    }
    
    return days;
  };

  // Process data for chart display
  const processLast7Days = (sleepData, stressData, headacheData) => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
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
      
      days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        sleep: sleepEntry?.sleepQuality || 0,
        stress: stressEntry?.stressLevel || 0,
        headaches: dayHeadaches.length
      });
    }
    
    return days;
  };

  // Calculate overall stats
  const calculateStats = (sleepData, stressData, headacheData) => {
    return {
      totalHeadaches: headacheData.length,
      avgSleepHours: sleepData.length > 0 ? 
        Math.round(sleepData.reduce((sum, entry) => sum + (entry.hoursSlept || 0), 0) / sleepData.length * 10) / 10 : 0,
      avgSleepQuality: sleepData.length > 0 ? 
        Math.round(sleepData.reduce((sum, entry) => sum + (entry.sleepQuality || 0), 0) / sleepData.length * 10) / 10 : 0,
      avgStressLevel: stressData.length > 0 ? 
        Math.round(stressData.reduce((sum, entry) => sum + (entry.stressLevel || 0), 0) / stressData.length * 10) / 10 : 0,
      personalWorstDay: Math.max(...stressData.map(entry => entry.stressLevel || 0), 0)
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

  // Circular Progress Component
  const CircularProgress = ({ percentage, color, label, value, showPercentage, size = 100, strokeWidth = 6 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E5E7EB"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 1s ease-in-out'
              }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: size > 80 ? '1.5rem' : '1rem', fontWeight: 'bold', color }}>
              {showPercentage ? `${percentage}%` : value}
            </div>
          </div>
        </div>
        {label && (
          <div style={{ fontSize: '0.9rem', color: '#4B5563', marginTop: '0.5rem' }}>
            {label}
          </div>
        )}
      </div>
    );
  };

  // Stats Display Component
  const StatsDisplay = ({ title, icon, color, children }) => (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      height: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '1.5rem', color }}>{icon}</div>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#374151' }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );

  if (dashboardData.loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '2rem' }}>⏳</div>
        <div>Loading your dashboard...</div>
      </div>
    );
  }

  const currentDayMetrics = dashboardData.dailyMetrics[currentMetricDay] || {
    name: 'Today',
    sleepHours: 0,
    sleepQuality: 0,
    stressLevel: 0,
    headacheCount: 0,
    hasHeadache: false
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem' 
        }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 'bold', color: '#1E3A8A' }}>
              Health Dashboard
            </h1>
            <p style={{ margin: 0, color: '#6B7280' }}>
              Welcome back! Here's your health summary.
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              color: '#4B5563',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Logout
          </button>
        </div>

        {dashboardData.error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem',
            color: '#b91c1c'
          }}>
            {dashboardData.error}
          </div>
        )}

        {/* Quick Action */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem', color: '#374151' }}>
              How are you feeling right now?
            </h2>
            <Link
              to="/record-headache"
              style={{
                background: 'linear-gradient(135deg, #dc3545, #c82333)',
                color: 'white',
                textDecoration: 'none',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '600',
                display: 'inline-block',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)'
              }}
            >
              🤕 Record Headache
            </Link>
          </div>
        </div>

        {/* AI Insights */}
        <EnhancedAIInsights 
          stats={dashboardData.stats}
          headacheData={dashboardData.headacheData}
          sleepData={dashboardData.sleepData}
          stressData={dashboardData.stressData}
        />

        {/* Today's Metrics */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#374151' }}>
              Daily Health Metrics
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {dashboardData.dailyMetrics.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentMetricDay(index)}
                  style={{
                    background: currentMetricDay === index ? '#4682B4' : 'transparent',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    color: currentMetricDay === index ? 'white' : '#4B5563',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {['Today', 'Yesterday', '2 Days Ago'][index]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1.5rem' 
          }}>
            <CombinedSleepMetrics currentDayMetrics={currentDayMetrics} />
            
            <StatsDisplay
              title="Stress Level"
              icon="🧠"
              color="#F59E0B"
            >
              <div style={{ textAlign: 'center' }}>
                <CircularProgress
                  percentage={(currentDayMetrics.stressLevel / 10) * 100}
                  color={currentDayMetrics.stressLevel <= 3 ? '#10B981' : 
                         currentDayMetrics.stressLevel <= 7 ? '#F59E0B' : '#EF4444'}
                  value={`${currentDayMetrics.stressLevel}/10`}
                  showPercentage={false}
                  size={100}
                />
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6B7280' }}>
                  {currentDayMetrics.stressLevel <= 3 ? 'Low stress' :
                   currentDayMetrics.stressLevel <= 7 ? 'Moderate stress' : 'High stress'}
                </div>
              </div>
            </StatsDisplay>

            <StatsDisplay
              title="Headache Status"
              icon="🤕"
              color="#EF4444"
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '3rem', 
                  marginBottom: '0.5rem',
                  color: currentDayMetrics.hasHeadache ? '#EF4444' : '#10B981'
                }}>
                  {currentDayMetrics.hasHeadache ? '😣' : '😊'}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#374151' }}>
                  {currentDayMetrics.hasHeadache ? 
                    `${currentDayMetrics.headacheCount} headache${currentDayMetrics.headacheCount > 1 ? 's' : ''}` : 
                    'No headaches'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6B7280', marginTop: '0.5rem' }}>
                  {currentDayMetrics.name}
                </div>
              </div>
            </StatsDisplay>
          </div>
        </div>

        {/* Charts */}
        {dashboardData.sleepStressData.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: '600', color: '#374151' }}>
                7-Day Health Trends
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={dashboardData.sleepStressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sleep" 
                    stroke="#4682B4" 
                    strokeWidth={3}
                    name="Sleep Quality"
                    dot={{ fill: '#4682B4', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="stress" 
                    stroke="#F59E0B" 
                    strokeWidth={3}
                    name="Stress Level"
                    dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                  />
                  <Bar 
                    dataKey="headaches" 
                    fill="#EF4444" 
                    name="Headaches"
                    opacity={0.7}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#374151' }}>
            Track Your Health
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem' 
          }}>
            <Link to="/record-sleep" style={{
              background: '#FFFFFF',
              color: '#4682B4',
              textDecoration: 'none',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #E5E7EB',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>😴</div>
              <div style={{ fontWeight: '600' }}>Sleep</div>
            </Link>
            
            <Link to="/record-nutrition" style={{
              background: '#FFFFFF',
              color: '#10B981',
              textDecoration: 'none',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #E5E7EB',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🥗</div>
              <div style={{ fontWeight: '600' }}>Nutrition</div>
            </Link>
            
            <Link to="/record-exercise" style={{
              background: '#FFFFFF',
              color: '#F59E0B',
              textDecoration: 'none',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #E5E7EB',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏃</div>
              <div style={{ fontWeight: '600' }}>Exercise</div>
            </Link>
            
            <Link to="/record-stress" style={{
              background: '#FFFFFF',
              color: '#8B5CF6',
              textDecoration: 'none',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #E5E7EB',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧘</div>
              <div style={{ fontWeight: '600' }}>Stress</div>
            </Link>
            
            <Link to="/record-body-pain" style={{
              background: '#FFFFFF',
              color: '#F59E0B',
              textDecoration: 'none',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #E5E7EB',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🦴</div>
              <div style={{ fontWeight: '600' }}>Body Pain</div>
            </Link>
            
            <Link to="/record-medication" style={{
              background: '#FFFFFF',
              color: '#EF4444',
              textDecoration: 'none',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #E5E7EB',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💊</div>
              <div style={{ fontWeight: '600' }}>Medication</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedDashboard;
