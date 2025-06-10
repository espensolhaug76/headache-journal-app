import React from 'react';
import logo from '../../assets/logo.svg'; // Add logo import
import favicon from '../../assets/tsm_favicon.png'; // Add favicon import

export default function DashboardHeader({ currentUser }) {
  return (
    <div style={{
      padding: '2rem 1rem 1rem 1rem',
      background: '#F9FAFB'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Logo and Favicon Section */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          {/* Favicon */}
          <div style={{ marginBottom: '0.75rem' }}>
            <img 
              src={favicon} 
              alt="TSM Favicon" 
              style={{ 
                width: '48px', 
                height: '48px',
                borderRadius: '8px' // Optional: rounded corners for favicon
              }} 
            />
          </div>
          
          {/* Main Logo */}
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
