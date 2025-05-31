import React from 'react';
import { Link } from 'react-router-dom';

const ActionButton = ({ icon, label, primary = false, to }) => {
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

  return (
    <Link to={to} style={buttonStyle}>
      <i className={icon} style={{ fontSize: '1.5rem', color: primary ? 'white' : '#4682B4' }}></i>
      <span style={{ fontSize: '0.85rem', textAlign: 'center' }}>{label}</span>
    </Link>
  );
};

export default function QuickActionsModule({ showQuickActions, setShowQuickActions }) {
  return (
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
  );
}