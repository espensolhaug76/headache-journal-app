import React from 'react';
import logo from '../../assets/logo.svg'; // Add logo import

export default function DashboardHeader({ currentUser }) {
  return (
    <div style={{
      padding: '2rem 1rem 1rem 1rem',
      background: '#F9FAFB'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <img 
            src={logo} 
            alt="Ultimate Migraine Tracker Logo" 
            style={{ 
              width: '225px', 
              height: 'auto',
              maxWidth: '100%' // Responsive on mobile
            }} 
          />
        </div>
        
        {/* Title */}
        <h1 style={{ 
          margin: 0, 
          fontSize: '2rem', 
          fontWeight: '700',
          color: '#1E3A8A',
          textAlign: 'center'
        }}>
          Ultimate Migraine Tracker
        </h1>
        
        {/* Welcome Message */}
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
