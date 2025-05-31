if (entry.dataKey === 'avgPainLevelPercent') {
              return (
                <div key={index} style={{ margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: entry.color, borderRadius: '50%' }} />
                  <span style={{ color: '#4B5563', fontSize: '0.85rem' }}>Avg Pain: {Math.round(entry.value)}%</span>
                </div>
              );
            }
            return null;
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
                <i className="fas fa-head-side-virus" style={{ marginRight: '0.3rem' }}></i>
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

  // Calculate metrics for current day
  const currentDayMetrics = dashboardData.dailyMetrics[currentMetricDay] || {
    sleepHours: 0,
    sleepQuality: 0,
    stressLevel: 0,
    headacheCount: 0
  };

  const { stats } = dashboardData;
  const avgSleepQualityPercent = currentDayMetrics.sleepQuality * 10;
  const stressLevelPercent = currentDayMetrics.stressLevel * 10;

  return (
    <div style={{
      background: '#F9FAFB',
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
        background: '#F9FAFB'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '2rem', 
            fontWeight: '700',
            color: '#1E3A8A',
            textAlign: 'center'
          }}>
            Ultimate Migraine Tracker
          </h1>
          <p style={{ 
            color: '#4B5563', 
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

          {/* Quick Actions - Swipeable */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              style={{
                background: showQuickActions ? '#4682B4' : '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                color: showQuickActions ? 'white' : '#4682B4',
                padding: '1rem 2rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '0 auto',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fas fa-plus"></i>
              <span>Quick Actions</span>
              <i className={`fas fa-chevron-${showQuickActions ? 'up' : 'down'}`} style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}></i>
            </button>

            {/* Swipeable Quick Actions */}
            {showQuickActions && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  overflowX: 'auto',
                  scrollBehavior: 'smooth',
                  paddingBottom: '0.5rem'
                }}>
                  <div style={{ minWidth: '140px', flex: 'none' }}>
                    <ActionButton icon="fas fa-head-side-virus" label="Log Headache" primary={true} to="/record-headache" />
                  </div>
                  <div style={{ minWidth: '140px', flex: 'none' }}>
                    <ActionButton icon="fas fa-pills" label="Log Medication" to="/record-medication" />
                  </div>
                  <div style={{ minWidth: '140px', flex: 'none' }}>
                    <ActionButton icon="fas fa-bed" label="Log Sleep" to="/record-sleep" />
                  </div>
                  <div style={{ minWidth: '140px', flex: 'none' }}>
                    <ActionButton icon="fas fa-brain" label="Log Stress" to="/record-stress" />
                  </div>
                  <div style={{ minWidth: '140px', flex: 'none' }}>
                    <ActionButton icon="fas fa-running" label="Log Exercise" to="/record-exercise" />
                  </div>
                  <div style={{ minWidth: '140px', flex: 'none' }}>
                    <ActionButton icon="fas fa-apple-alt" label="Log Nutrition" to="/record-nutrition" />
                  </div>
                  <div style={{ minWidth: '140px', flex: 'none' }}>
                    <ActionButton icon="fas fa-user-injured" label="Log Body Pain" to="/record-body-pain" />
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '0.5rem', color: '#9CA3AF', fontSize: '0.8rem' }}>
                  <i className="fas fa-hand-point-left" style={{ marginRight: '0.5rem' }}></i>
                  Swipe to see all options
                  <i className="fas fa-hand-point-right" style={{ marginLeft: '0.5rem' }}></i>
                </div>
              </div>
            )}
          </div>

          {/* Main Chart - Above Metrics with Enhanced Design */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '1rem',
            marginBottom: '3rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden'
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
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '15px', color: '#4B5563', fontSize: '12px' }}
                      iconType="circle"
                    />
                    
                    {/* Sleep Quality Bars */}
                    <Bar 
                      yAxisId="scale"
                      dataKey="sleepQualityPercent" 
                      fill="url(#sleepQualityGradient)"
                      name="Sleep Quality %"
                      radius={[2, 2, 0, 0]}
                      maxBarSize={25}
                    />
                    
                    {/* Stress Level Bars */}
                    <Bar 
                      yAxisId="scale"
                      dataKey="stressPercent" 
                      fill="url(#stressGradient)"
                      name="Stress Level %"
                      radius={[2, 2, 0, 0]}
                      maxBarSize={25}
                    />
                    
                    {/* Headache Count Line */}
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
                    
                    {/* Average Headache Intensity Line (as percentage) */}
                    <Line 
                      yAxisId="scale"
                      type="monotone" 
                      dataKey="avgPainLevelPercent" 
                      stroke="#ff6b35" 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      name="Avg Headache Intensity %"
                      dot={{ fill: '#ff6b35', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#ff6b35', strokeWidth: 2 }}
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
                  Start tracking your sleep, stress, and headaches to see patterns here!
                </p>
              </div>
            )}
          </div>

          {/* Daily Health Metrics with Swipe */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setCurrentMetricDay(Math.max(0, currentMetricDay - 1))}
                disabled={currentMetricDay === 0}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: currentMetricDay === 0 ? '#9CA3AF' : '#4682B4',
                  cursor: currentMetricDay === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '1.5rem'
                }}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.3rem', 
                fontWeight: '600', 
                color: '#4682B4',
                textAlign: 'center',
                minWidth: '150px'
              }}>
                {dashboardData.dailyMetrics[currentMetricDay]?.dayLabel || 'Today'} Metrics
              </h2>
              
              <button
                onClick={() => setCurrentMetricDay(Math.min(2, currentMetricDay + 1))}
                disabled={currentMetricDay === 2}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: currentMetricDay === 2 ? '#9CA3AF' : '#4682B4',
                  cursor: currentMetricDay === 2 ? 'not-allowed' : 'pointer',
                  fontSize: '1.5rem'
                }}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>

            {/* Swipeable Health Metrics */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <StatsDisplay
                title="Sleep"
                icon="fas fa-bed"
                color="#20c997"
                navigateTo="/record-sleep"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      color: '#20c997',
                      marginBottom: '0.5rem'
                    }}>
                      {currentDayMetrics.sleepHours}h
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#4B5563', fontWeight: '500' }}>
                      Hours Slept
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      color: '#28a745',
                      marginBottom: '0.5rem'
                    }}>
                      {Math.round(avgSleepQualityPercent)}%
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#4B5563', fontWeight: '500' }}>
                      Quality
                    </div>
                  </div>
                </div>
              </StatsDisplay>

              <StatsDisplay
                title="Stress Level"
                icon="fas fa-brain"
                color="#dc3545"
                navigateTo="/record-stress"
              >
                <CircularProgress
                  percentage={stressLevelPercent}
                  color="#dc3545"
                  label="Stress Level"
                  value={currentDayMetrics.stressLevel}
                  unit="/10"
                  size={120}
                  strokeWidth={8}
                />
              </StatsDisplay>

              <StatsDisplay
                title="Headaches"
                icon="fas fa-head-side-virus"
                color="#4682B4"
                navigateTo="/record-headache"
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    color: currentDayMetrics.headacheCount > 0 ? '#dc3545' : '#28a745',
                    marginBottom: '0.5rem'
                  }}>
                    {currentDayMetrics.headacheCount}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#4B5563', fontWeight: '500' }}>
                    {currentDayMetrics.headacheCount === 0 ? 'None Today' : 
                     currentDayMetrics.headacheCount === 1 ? 'Headache' : 'Headaches'}
                  </div>
                  {currentDayMetrics.avgPainLevel > 0 && (
                    <div style={{ fontSize: '0.8rem', color: '#dc3545', marginTop: '0.25rem' }}>
                      Avg: {Math.round(currentDayMetrics.avgPainLevel)}/10
                    </div>
                  )}
                </div>
              </StatsDisplay>
            </div>
            
            {/* Swipe Indicator */}
            <div style={{ textAlign: 'center', marginTop: '1rem', color: '#9CA3AF', fontSize: '0.85rem' }}>
              <i className="fas fa-hand-point-left" style={{ marginRight: '0.5rem' }}></i>
              Swipe or use arrows to see previous days
              <i className="fas fa-hand-point-right" style={{ marginLeft: '0.5rem' }}></i>
            </div>
          </div>

          {/* Monthly Calendar */}
          <CalendarView />

          {/* Monthly Recap - Norwegian Style */}
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
              color: '#1E3A8A',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <i className="fas fa-chart-pie"></i>
              Monthly Overview
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem'
            }}>
              {/* Total Headaches */}
              <div style={{
                background: 'linear-gradient(135deg, #F44336 0%, #ff7043 100%)',
                borderRadius: '12px',
                padding: '1.5rem',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {Object.values(dashboardData.calendarData).reduce((sum, day) => sum + day.headaches.length, 0)}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  Total Headaches
                </div>
              </div>

              {/* Headache-free Days */}
              <div style={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #66bb6a 100%)',
                borderRadius: '12px',
                padding: '1.5rem',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {(() => {
                    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
                    const headacheDays = Object.values(dashboardData.calendarData).filter(day => day.headaches.length > 0).length;
                    return totalDays - headacheDays;
                  })()}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  Headache-free Days
                </div>
              </div>

              {/* Average Pain Level */}
              <div style={{
                background: 'linear-gradient(135deg, #FF9800 0%, #ffb74d 100%)',
                borderRadius: '12px',
                padding: '1.5rem',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {(() => {
                    const allHeadaches = Object.values(dashboardData.calendarData).flatMap(day => day.headaches);
                    if (allHeadaches.length === 0) return '0';
                    const avgPain = allHeadaches.reduce((sum, h) => sum + (h.painLevel || 0), 0) / allHeadaches.length;
                    return Math.round(avgPain * 10) / 10;
                  })()}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  Avg Pain Level
                </div>
              </div>

              {/* Medications Taken */}
              <div style={{
                background: 'linear-gradient(135deg, #2196F3 0%, #64b5f6 100%)',
                borderRadius: '12px',
                padding: '1.5rem',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {Object.values(dashboardData.calendarData).reduce((sum, day) => sum + day.medications.length, 0)}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  Medications Taken
                </div>
              </div>
            </div>

            {/* Month Intensity Breakdown */}
            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                color: '#4B5563', 
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                Headache Intensity Breakdown
              </h4>
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                {[
                  { label: 'Mild (1-3)', color: '#FFA726', range: [1, 3] },
                  { label: 'Moderate (4-6)', color: '#FF7043', range: [4, 6] },
                  { label: 'Severe (7-10)', color: '#F44336', range: [7, 10] }
                ].map(intensity => {
                  const count = Object.values(dashboardData.calendarData)
                    .flatMap(day => day.headaches)
                    .filter(h => h.painLevel >= intensity.range[0] && h.painLevel <= intensity.range[1])
                    .length;
                  
                  return (
                    <div key={intensity.label} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      color: '#4B5563'
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: intensity.color,
                        borderRadius: '50%'
                      }} />
                      <span>{intensity.label}: <strong>{count}</strong></span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Insights */}
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
              justifyContent: 'center'
            }}>
              <i className="fas fa-lightbulb"></i> AI Health Insights
            </h3>
            <div style={{ lineHeight: '1.7', fontSize: '1rem', color: '#4B5563' }}>
              {stats.totalHeadaches === 0 ? (
                <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(40, 167, 69, 0.1)', borderRadius: '12px', border: '1px solid rgba(40, 167, 69, 0.2)' }}>
                  <div style={{ fontSize: '1.5rem', color: '#28a745' }}>
                    <i className="fas fa-trophy"></i>
                  </div>
                  <span style={{ color: '#155724' }}>
                    <strong>Excellent week!</strong> No headaches recorded. Keep up the good work with your healthy habits!
                  </span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(70, 130, 180, 0.1)', borderRadius: '12px', border: '1px solid rgba(70, 130, 180, 0.2)' }}>
                    <div style={{ fontSize: '1.5rem', color: '#4682B4' }}>
                      <i className="fas fa-chart-bar"></i>
                    </div>
                    <span style={{ color: '#2c5aa0' }}>
                      You've had <strong>{stats.totalHeadaches} headache{stats.totalHeadaches > 1 ? 's' : ''}</strong> this week. 
                      {stats.avgSleepQuality < 6 && ' Poor sleep quality may be contributing to headaches.'}
                      {stats.avgStressLevel > 7 && ' High stress levels could be triggering headaches.'}
                    </span>
                  </div>
                  {stats.avgSleepHours < 7 && (
                    <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.2)' }}>
                      <div style={{ fontSize: '1.5rem', color: '#ffc107' }}>
                        <i className="fas fa-bed"></i>
                      </div>
                      <span style={{ color: '#856404' }}>
                        <strong>Sleep recommendation:</strong> You're averaging {stats.avgSleepHours} hours. Aim for 7-9 hours for optimal health.
                      </span>
                    </div>
                  )}
                  {stats.avgStressLevel > 6 && (
                    <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(23, 162, 184, 0.1)', borderRadius: '12px', border: '1px solid rgba(23, 162, 184, 0.2)' }}>
                      <div style={{ fontSize: '1.5rem', color: '#17a2b8' }}>
                        <i className="fas fa-brain"></i>
                      </div>
                      <span style={{ color: '#0c5460' }}>
                        <strong>Stress management:</strong> Your stress levels are elevated (avg: {stats.avgStressLevel}/10). Try stress reduction techniques like meditation or exercise.
                      </span>
                    </div>
                  )}
                </>
              )}
              
              <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', padding: '1rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.2)' }}>
                <div style={{ fontSize: '1.5rem', color: '#ffc107' }}>
                  <i className="fas fa-star"></i>
                </div>
                <span style={{ color: '#856404' }}>
                  {stats.avgSleepQuality >= 7 && stats.avgStressLevel <= 5 
                    ? 'Your sleep and stress management are excellent! This creates ideal conditions for headache prevention.'
                    : 'Focus on improving sleep quality and reducing stress for better headache management.'}
                </span>
              </div>
            </div>
          </div>

          {/* Logout Button at Bottom */}
          <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
            <button 
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                color: '#4B5563',
                padding: '1rem 2rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '0 auto'
              }}>
              <i className="fas fa-sign-out-alt"></i>
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
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
      const avgPainLevelPercent = avgPainLevel * 10;

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
        avgPainLevelPercent: avgPainLevelPercent,
        totalPainScore: totalPainScore,
        headachesByIntensity: headachesByIntensity,
        hasData: sleepEntry || stressEntry || headacheCount > 0
      });
    }

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
    
    const personalWorstDay = Math.max(...headacheData.map(h => h.painLevel || 0), 1);

    return {
      totalHeadaches,
      avgSleepHours: Math.round(avgSleepHours * 10) / 10,
      avgSleepQuality: Math.round(avgSleepQuality * 10) / 10,
      avgStressLevel: Math.round(avgStressLevel * 10) / 10,
      personalWorstDay
    };
  };

  // Norwegian-style Calendar component
  const CalendarView = () => {
    const getDaysInMonth = (year, month) => {
      return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
      return new Date(year, month, 1).getDay();
    };

    const getDayColor = (dateStr) => {
      const dayData = dashboardData.calendarData[dateStr];
      if (!dayData || dayData.headaches.length === 0) {
        return '#4CAF50'; // Green - no headache
      }
      
      const avgPainLevel = dayData.headaches.reduce((sum, h) => sum + (h.painLevel || 0), 0) / dayData.headaches.length;
      
      if (avgPainLevel <= 3) return '#FFA726'; // Orange - mild
      if (avgPainLevel <= 6) return '#FF7043'; // Orange-red - moderate  
      return '#F44336'; // Red - severe
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
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const dayColor = getDayColor(dateStr);
      const hasMedication = dayData && dayData.medications.length > 0;
      
      days.push(
        <div
          key={day}
          style={{
            padding: '0.25rem',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: dayData ? 'pointer' : 'default'
          }}
          title={dayData ? 
            `${dayData.headaches.length} headache(s), ${dayData.medications.length} medication(s)` : 
            'No headaches'}
        >
          <div style={{
            width: '36px',
            height: '36px',
            backgroundColor: dayColor,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: isToday ? 'bold' : '500',
            fontSize: '0.9rem',
            border: isToday ? '2px solid #1E3A8A' : 'none',
            position: 'relative'
          }}>
            {day}
            {hasMedication && (
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                backgroundColor: '#2196F3',
                borderRadius: '50%',
                border: '1px solid white'
              }} />
            )}
          </div>
        </div>
      );
    }

    return (
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '3rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
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
            fontSize: '1.3rem', 
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

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          {['M', 'T', 'O', 'T', 'F', 'L', 'S'].map((day, index) => (
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
          gap: '1.5rem',
          marginTop: '1.5rem',
          fontSize: '0.8rem',
          color: '#4B5563',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#4CAF50', borderRadius: '4px' }} />
            No headache
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#FFA726', borderRadius: '4px' }} />
            Mild
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#FF7043', borderRadius: '4px' }} />
            Moderate
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#F44336', borderRadius: '4px' }} />
            Severe
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#2196F3', borderRadius: '50%' }} />
            Medication
          </div>
        </div>
      </div>
    );
  };

  // Touch handlers for metric swiping
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentMetricDay < 2) {
      setCurrentMetricDay(currentMetricDay + 1);
    } else if (isRightSwipe && currentMetricDay > 0) {
      setCurrentMetricDay(currentMetricDay - 1);
    }
  };

  // Circular Progress Component
  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = '#4682B4', label, value, unit = '', showPercentage = false }) => {
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
          <div style={{ fontSize: '1.6rem', fontWeight: '700', lineHeight: '1', color: color }}>
            {showPercentage ? `${Math.round(percentage)}%` : `${value}${unit}`}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#4B5563', marginTop: '4px', fontWeight: '500' }}>{label}</div>
        </div>
      </div>
    );
  };

  // Action Button Component
  const ActionButton = ({ icon, label, primary = false, onClick, to }) => {
    const buttonStyle = {
      background: primary 
        ? 'linear-gradient(135deg, #4682B4 0%, #2c5aa0 100%)' 
        : '#FFFFFF',
      border: primary ? 'none' : '1px solid #E5E7EB',
      borderRadius: '12px',
      color: primary ? 'white' : '#000000',
      padding: '1rem',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: primary ? '600' : '500',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s ease',
      textDecoration: 'none',
      boxShadow: primary ? '0 2px 8px rgba(70, 130, 180, 0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
      minWidth: '100px',
      flex: 1
    };

    const content = (
      <>
        <i className={icon} style={{ fontSize: '1.5rem', color: primary ? 'white' : '#4682B4' }}></i>
        <span style={{ fontSize: '0.85rem', textAlign: 'center' }}>{label}</span>
      </>
    );

    if (to) {
      return (
        <Link to={to} style={buttonStyle}>
          {content}
        </Link>
      );
    }

    return (
      <button onClick={onClick} style={buttonStyle}>
        {content}
      </button>
    );
  };

  // Stats Display Component - Clickable Cards
  const StatsDisplay = ({ title, icon, children, color = '#4682B4', onClick, navigateTo }) => {
    const handleClick = () => {
      if (navigateTo) {
        navigate(navigateTo);
      } else if (onClick) {
        onClick();
      }
    };

    return (
      <div 
        onClick={handleClick}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease',
          minHeight: '200px',
          cursor: navigateTo || onClick ? 'pointer' : 'default',
          transform: 'scale(1)'
        }}
        onMouseEnter={e => {
          if (navigateTo || onClick) {
            e.target.style.transform = 'scale(1.02)';
            e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
          }
        }}
        onMouseLeave={e => {
          if (navigateTo || onClick) {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
          }
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem', 
          marginBottom: '1.5rem'
        }}>
          <i className={icon} style={{ fontSize: '1.2rem', color: color }}></i>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1rem', 
            fontWeight: '600', 
            color: '#4B5563'
          }}>
            {title}
          </h3>
          {(navigateTo || onClick) && (
            <i className="fas fa-arrow-right" style={{ fontSize: '0.8rem', color: '#9CA3AF', marginLeft: '0.5rem' }}></i>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          {children}
        </div>
      </div>
    );
  };

  // Custom Tooltip for Chart
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
            if (entry.dataKey === 'sleepQualityPercent') {
              return (
                <div key={index} style={{ margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: entry.color, borderRadius: '50%' }} />
                  <span style={{ color: '#4B5563', fontSize: '0.85rem' }}>Sleep Quality: {entry.value}%</span>
                </div>
              );
            }
            if (entry.dataKey === 'stressPercent') {
              return (
                <div key={index} style={{ margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: entry.color, borderRadius: '50%' }} />
                  <span style={{ color: '#4B5563', fontSize: '0.85rem' }}>Stress Level: {entry.value}%</span>
                </div>
              );
            }
            if (entry.dataKey === 'headaches') {
              return (
                <div key={index} style={{ margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: entry.color, borderRadius: '50%' }} />
                  <span style={{ color: '#4B5563', fontSize: '0.85rem' }}>Headaches: {entry.value}</span>
                </div>
              );
            }
            if (entry.dataKey === 'avgPainLevelPercent') {
