import React from 'react';

export default function LogoutButton({ onLogout }) {
  const handleBackToCureMigraine = () => {
    window.location.href = 'https://client.curemigraine.org/dashboard/profile';
  };

  return (
    <div style={{ 
      textAlign: 'center', 
      paddingBottom: '2rem',
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      <button 
        onClick={handleBackToCureMigraine}
        style={{
          background: '#1E3A8A',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          padding: '1rem 1.5rem',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
        <i className="fas fa-arrow-left"></i>
        Back to CureMigraine
      </button>
      <button 
        onClick={onLogout}
        style={{
          background: 'transparent',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          color: '#4B5563',
          padding: '1rem 1.5rem',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
        <i className="fas fa-sign-out-alt"></i>
        Log Out
      </button>
    </div>
  );
}
