import React from 'react';

export default function AIInsightsModule({ stats, monthlyStats, migrainStats, calendarData }) {
  
  // Data Completeness Analysis
  const analyzeDataCompleteness = () => {
    const analysis = {
      hasHeadaches: stats.totalHeadaches > 0,
      hasSleep: stats.avgSleepHours > 0,
      hasStress: stats.avgStressLevel > 0,
      hasMedications: (monthlyStats?.daysWithOTC || 0) + (monthlyStats?.daysWithMigraineMeds || 0) > 0,
      missingDataTypes: []
    };
    
    if (!analysis.hasSleep) analysis.missingDataTypes.push('sleep');
    if (!analysis.hasStress) analysis.missingDataTypes.push('stress');
    if (analysis.hasHeadaches && !analysis.hasMedications) {
      analysis.missingDataTypes.push('medications');
    }
    
    return analysis;
  };
  
  const dataCompleteness = analyzeDataCompleteness();
  
  // MOH Detection Logic
  const detectMOH = () => {
    if (!calendarData || !monthlyStats) return null;
    
    // Calculate consecutive medication days
    const today = new Date();
    let consecutiveDays = 0;
    let maxConsecutive = 0;
    
    // Check last 30 days for medication patterns
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = calendarData[dateStr];
      
      if (dayData && dayData.medications.length > 0) {
        consecutiveDays++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
      } else {
        consecutiveDays = 0;
      }
    }
    
    // MOH Risk Assessment
    const mohRisk = {
      level: 'none',
      consecutiveDays: maxConsecutive,
      monthlyDays: monthlyStats.daysWithOTC + monthlyStats.daysWithMigraineMeds,
      warnings: []
    };
    
    // Critical: 10+ consecutive days
    if (maxConsecutive >= 10) {
      mohRisk.level = 'critical';
      mohRisk.warnings.push({
        type: 'critical',
        message: `You've used migraine medication for ${maxConsecutive} consecutive days. Extended daily use may increase risk of rebound headaches.`,
        action: 'Consider discussing your medication pattern with your healthcare provider to explore alternative treatment strategies.'
      });
    }
    // High risk: 4-9 consecutive days OR >15 days/month
    else if (maxConsecutive >= 4 || mohRisk.monthlyDays > 15) {
      mohRisk.level = 'high';
      if (maxConsecutive >= 4) {
        mohRisk.warnings.push({
          type: 'warning',
          message: `You've used medication for ${maxConsecutive} consecutive days. Frequent use may contribute to rebound headaches.`,
          action: 'Consider spacing out medication use and discussing preventive treatment options with your doctor.'
        });
      }
      if (mohRisk.monthlyDays > 15) {
        mohRisk.warnings.push({
          type: 'warning',
          message: `You've used headache medication ${mohRisk.monthlyDays} days this month. Frequent use may increase rebound headache risk.`,
          action: 'Consider discussing preventive medication options with your healthcare provider.'
        });
      }
    }
    // Moderate risk: 10-15 days/month
    else if (mohRisk.monthlyDays >= 10) {
      mohRisk.level = 'moderate';
      mohRisk.warnings.push({
        type: 'caution',
        message: `Caution: You've used medication ${mohRisk.monthlyDays} days this month. Monitor usage to prevent MOH.`,
        action: 'Track patterns and consider non-medication management strategies.'
      });
    }
    
    return mohRisk;
  };
  
  const mohAssessment = detectMOH();
  
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
        <i className="fas fa-lightbulb"></i> AI Health Insights
      </h3>
      
      <div style={{ lineHeight: '1.7', fontSize: '1rem', color: '#4B5563' }}>
        {/* MOH Warnings - Highest Priority */}
        {mohAssessment && mohAssessment.warnings.map((warning, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            alignItems: 'start', 
            gap: '1rem', 
            marginBottom: '1rem', 
            padding: '1rem', 
            background: warning.type === 'critical' ? 'rgba(220, 38, 38, 0.1)' : 
                       warning.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
                       'rgba(59, 130, 246, 0.1)',
            borderRadius: '12px', 
            border: warning.type === 'critical' ? '2px solid rgba(220, 38, 38, 0.3)' : 
                   warning.type === 'warning' ? '1px solid rgba(245, 158, 11, 0.3)' : 
                   '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div style={{ 
              fontSize: '1.5rem', 
              color: warning.type === 'critical' ? '#DC2626' : 
                     warning.type === 'warning' ? '#F59E0B' : 
                     '#3B82F6'
            }}>
              <i className={warning.type === 'critical' ? 'fas fa-exclamation-triangle' : 
                           warning.type === 'warning' ? 'fas fa-exclamation-circle' : 
                           'fas fa-info-circle'}></i>
            </div>
            <div>
              <div style={{ 
                fontWeight: 'bold', 
                color: warning.type === 'critical' ? '#991B1B' : 
                       warning.type === 'warning' ? '#92400E' : 
                       '#1E40AF',
                marginBottom: '0.5rem'
              }}>
                {warning.type === 'critical' ? 'Medication Usage Pattern Notice' : 
                 warning.type === 'warning' ? 'Medication Usage Reminder' : 
                 'Medication Tracking Update'}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>{warning.message}</div>
              <div style={{ 
                fontSize: '0.9rem', 
                fontStyle: 'italic',
                color: warning.type === 'critical' ? '#7F1D1D' : '#6B7280'
              }}>
                <strong>Recommended Action:</strong> {warning.action}
              </div>
            </div>
          </div>
        ))}
        
        {/* Migraine Pattern Analysis */}
        {migrainStats && migrainStats.totalMigraines > 0 && (
          <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <div style={{ fontSize: '1.5rem', color: '#8B5CF6' }}>
              <i className="fas fa-brain"></i>
            </div>
            <span style={{ color: '#5B21B6' }}>
              <strong>Migraine Analysis:</strong> You've had {migrainStats.totalMigraines} migraine{migrainStats.totalMigraines > 1 ? 's' : ''} and {migrainStats.totalRegularHeadaches} regular headache{migrainStats.totalRegularHeadaches > 1 ? 's' : ''} this month.
              {migrainStats.avgMigrainePainLevel > migrainStats.avgRegularPainLevel + 2 && 
                ' Your migraines are significantly more severe than regular headaches - this supports proper migraine diagnosis.'}
            </span>
          </div>
        )}
        
        {/* Existing Health Insights */}
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
        {/* Data Completeness Recommendations */}
        {dataCompleteness.missingDataTypes.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <div style={{ fontSize: '1.5rem', color: '#6366F1' }}>
              <i className="fas fa-clipboard-list"></i>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#4338CA', marginBottom: '0.5rem' }}>
                Complete Your Health Picture
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                To provide better insights, consider tracking your {dataCompleteness.missingDataTypes.join(', ')} patterns:
              </div>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#4338CA' }}>
                {dataCompleteness.missingDataTypes.includes('sleep') && (
                  <li><strong>Sleep tracking</strong> - Helps identify if poor sleep triggers headaches</li>
                )}
                {dataCompleteness.missingDataTypes.includes('stress') && (
                  <li><strong>Stress levels</strong> - Key trigger for many migraine sufferers</li>
                )}
                {dataCompleteness.missingDataTypes.includes('medications') && (
                  <li><strong>Medication usage</strong> - Important for tracking treatment effectiveness</li>
                )}
              </ul>
            </div>
          </div>
        )}
        
        {/* Modified Sleep and Stress Insights - Only show if data exists */}
        {stats.avgSleepHours > 0 && stats.avgSleepHours < 7 && (
          <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.2)' }}>
            <div style={{ fontSize: '1.5rem', color: '#ffc107' }}>
              <i className="fas fa-bed"></i>
            </div>
            <span style={{ color: '#856404' }}>
              <strong>Sleep recommendation:</strong> You're averaging {stats.avgSleepHours} hours. Aim for 7-9 hours for optimal health.
            </span>
          </div>
        )}
        {stats.avgStressLevel > 0 && stats.avgStressLevel > 6 && (
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
        
        {/* Positive Reinforcement */}
        {(!mohAssessment || mohAssessment.level === 'none') && (
          <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', padding: '1rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.2)' }}>
            <div style={{ fontSize: '1.5rem', color: '#ffc107' }}>
              <i className="fas fa-star"></i>
            </div>
            <span style={{ color: '#856404' }}>
              {stats.avgSleepQuality >= 7 && stats.avgStressLevel <= 5 && stats.avgSleepHours > 0 && stats.avgStressLevel > 0
                ? 'Your sleep and stress management are excellent! This creates ideal conditions for headache prevention.'
                : dataCompleteness.missingDataTypes.length === 0
                ? 'Focus on improving sleep quality and reducing stress for better headache management.'
                : 'Great job tracking your headaches! Adding sleep and stress data will provide even better insights.'}
              {monthlyStats && monthlyStats.daysWithOTC + monthlyStats.daysWithMigraineMeds < 10 && 
                ' Your medication usage patterns look healthy - good job avoiding overuse!'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
