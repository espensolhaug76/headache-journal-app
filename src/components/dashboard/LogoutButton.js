import React from 'react';

export default function LogoutButton({ onLogout }) {
  return (
    <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
      <button 
        onClick={onLogout}
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
  );
}