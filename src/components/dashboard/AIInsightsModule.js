import React from 'react';

export default function AIInsightsModule({ stats }) {
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
  );
}
