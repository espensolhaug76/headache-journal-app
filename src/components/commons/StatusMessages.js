// src/components/common/StatusMessages.js - Reusable Status Messages Component
import React from 'react';

export default function StatusMessages({ error, statusMessage, onClear }) {
  if (!error && !statusMessage) return null;

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Error Message */}
      {error && (
        <div style={{
          background: '#f8d7da',
          border: '1px solid #dc3545',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '1rem',
          color: '#721c24',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
            {error}
          </div>
          {onClear && (
            <button
              onClick={onClear}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#721c24',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      )}

      {/* Success Message */}
      {statusMessage && (
        <div style={{
          background: '#d4edda',
          border: '1px solid #28a745',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '1rem',
          color: '#155724',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <i className="fas fa-check-circle" style={{ marginRight: '0.5rem' }}></i>
            {statusMessage}
          </div>
          {onClear && (
            <button
              onClick={onClear}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#155724',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      )}
    </div>
  );
}