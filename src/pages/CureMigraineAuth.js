// src/pages/CureMigraineAuth.js
// Handles SSO from CureMigraine - verifies token and activates premium

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function CureMigraineAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { activatePremium } = usePremium();
  
  const [status, setStatus] = useState('Verifying your CureMigraine account...');
  const [error, setError] = useState('');

  useEffect(() => {
    async function handleAuth() {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('No authentication token provided');
        return;
      }

      try {
        setStatus('Verifying token with CureMigraine...');
        
        // Verify token with CureMigraine API
        const response = await fetch('https://api.curemigraine.org/api/verify-journal-token', {
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

        const { email, isPaid, name } = data.user;

        setStatus('Setting up your account...');

        // Try to sign in or create account with the email
        // Using a deterministic password based on email (user won't need it - they use CureMigraine to login)
        const tempPassword = `CM_${btoa(email).slice(0, 20)}_HJ`;
        
        try {
          // Try to sign in first
          await signInWithEmailAndPassword(auth, email, tempPassword);
        } catch (signInError) {
          if (signInError.code === 'auth/user-not-found') {
            // Create new account
            await createUserWithEmailAndPassword(auth, email, tempPassword);
          } else if (signInError.code === 'auth/wrong-password') {
            // User exists but with different password - they registered directly
            setError('This email is already registered. Please log in with your Headache Journal password, or use a different email in CureMigraine.');
            return;
          } else {
            throw signInError;
          }
        }

        // Activate premium if user has paid CureMigraine subscription
        if (isPaid) {
          setStatus('Activating premium features...');
          await activatePremium('curemigraine', email);
        }

        setStatus('Success! Redirecting to dashboard...');
        
        // Small delay so user sees success message
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);

      } catch (err) {
        console.error('CureMigraine auth error:', err);
        setError(err.message || 'Authentication failed. Please try again.');
      }
    }

    handleAuth();
  }, [searchParams, navigate, activatePremium]);

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
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <img 
            src="/logo.svg" 
            alt="Headache Journal" 
            style={{ height: '60px', marginBottom: '1rem' }}
            onError={(e) => e.target.style.display = 'none'}
          />
          <h2 style={{ color: '#1E3A8A', margin: 0 }}>
            CureMigraine Login
          </h2>
        </div>

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
