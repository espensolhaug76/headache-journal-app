import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const { login, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setMessage('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to log in: ' + error.message);
    }

    setLoading(false);
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      setMessage('');
      setLoading(true);
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to sign in with Google: ' + error.message);
    }
    setLoading(false);
  }

  async function handleForgotPassword(e) {
    e.preventDefault();

    if (!resetEmail) {
      return setError('Email is required');
    }

    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(resetEmail);
      setMessage('Check your inbox for password reset instructions');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error) {
      setError('Failed to reset password: ' + error.message);
    }

    setLoading(false);
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleForgotPassword = () => {
    setShowForgotPassword(!showForgotPassword);
    setError('');
    setMessage('');
    setResetEmail('');
  };

  if (showForgotPassword) {
    return (
      <div className="form-container">
        <h2>Reset Your Password</h2>
        {error && <div className="error">{error}</div>}
        {message && (
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: '1px solid #c3e6cb'
          }}>
            {message}
          </div>
        )}
        <form onSubmit={handleForgotPassword}>
          <div className="form-group">
            <label htmlFor="reset-email">Email</label>
            <input
              type="email"
              id="reset-email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>
          <button disabled={loading} className="btn" type="submit">
            {loading ? 'Sending...' : 'Reset Password'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button 
            onClick={toggleForgotPassword}
            style={{
              background: 'none',
              border: 'none',
              color: '#2c5aa0',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.9rem'
            }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2>Log In to Headache Journal</h2>
      {error && <div className="error">{error}</div>}
      {message && (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #c3e6cb'
        }}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: '45px' }}
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#666',
                fontSize: '1rem',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px'
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>
        <button disabled={loading} className="btn" type="submit">
          {loading ? 'Logging In...' : 'Log In'}
        </button>
      </form>
      
      <div style={{ margin: '1rem 0', textAlign: 'center' }}>
        <button 
          onClick={handleGoogleSignIn} 
          disabled={loading} 
          className="btn btn-secondary"
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          {loading ? 'Signing In...' : 'Sign in with Google'}
        </button>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button 
          onClick={toggleForgotPassword}
          style={{
            background: 'none',
            border: 'none',
            color: '#2c5aa0',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '0.9rem',
            marginBottom: '1rem'
          }}
        >
          Forgot your password?
        </button>
        <br />
        Need an account? <Link to="/register">Sign up</Link>
      </div>
    </div>
  );
}
