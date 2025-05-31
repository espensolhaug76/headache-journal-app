import React from 'react';

export default function DashboardHeader({ currentUser }) {
  return (
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
  );
}