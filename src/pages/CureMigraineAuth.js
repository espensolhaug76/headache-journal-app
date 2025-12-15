/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePremium } from '../contexts/PremiumContext';

export default function CureMigraineAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activatePremium } = usePremium();
  
  const [status, setStatus] = useState('Verifying your CureMigraine account...');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    async function handleAuth() {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('No authentication token provided');
        return;
      }

      try {
        setStatus('Verifying token with CureMigraine...');
        
        const response = await fetch('https://api.themigraineplan.com/journal/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error('Token verification failed');
        }

        const data = await response.json();
        
        if (!data.valid || !data.user) {
          throw new Error('Invalid token');
        }

        const { email, isPaid } = data.user;
        setUserEmail(email);

        if (isPaid) {
          setStatus('Activating premium features...');
          await activatePremium('curemigraine', email);
        }

        setSuccess(true);
        setStatus('');

      } catch (err) {
        console.error('CureMigraine auth error:', err);
        setError(err.message || 'Authentication failed. Please try again.');
      }
    }

    handleAuth();
  }, [searchParams, activatePremium]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F8FAFC',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '3rem',
        maxWidth: '450px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#1E3A8A', margin: '0 0 1.5rem 0' }}>
          Journal Login
        </h2>

        {error ? (
          <div style={{
            background: '#FEE2E2',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            padding: '1rem',
            color: '#DC2626',
            marginBottom: '1rem'
          }}>
            <p style={{ margin: '0 0 1rem 0' }}>{error}</p>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Go to Login
            </button>
          </div>
        ) : success ? (
          <div>
            <div style={{
              background: '#D1FAE5',
              border: '1px solid #10B981',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{ color: '#065F46', margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 'bold' }}>
                ✓ Premium Activated!
              </p>
              <p style={{ color: '#065F46', margin: 0, fontSize: '0.9rem' }}>
                Your subscription gives you full access to all Headache Journal features.
              </p>
            </div>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
              Log in or create an account with:<br/>
              <strong>{userEmail}</strong>
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Log In
              </button>
              <button
                onClick={() => navigate('/register')}
                style={{
                  background: 'white',
                  color: '#3B82F6',
                  border: '2px solid #3B82F6',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Register
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #E5E7EB',
              borderTop: '4px solid #3B82F6',
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: '#6B7280', margin: 0 }}>{status}</p>
          </div>
        )}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
