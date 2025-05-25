import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    headacheCount: 0,
    recentHeadaches: []
  });

  // Debug: Log to see if component is mounting
  console.log('Dashboard component mounting, currentUser:', currentUser);

  useEffect(() => {
    if (!currentUser) {
      console.log('No current user, redirecting to login');
      navigate('/login');
      return;
    }

    const fetchBasicData = async () => {
      try {
        console.log('Fetching dashboard data...');
        setLoading(true);
        setError(null);

        // Get recent headaches
        const headacheQuery = query(
          collection(db, 'users', currentUser.uid, 'headaches'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const headacheSnapshot = await getDocs(headacheQuery);
        const headaches = headacheSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));

        console.log('Fetched headaches:', headaches);

        setDashboardData({
          headacheCount: headaches.length,
          recentHeadaches: headaches
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data: ' + err.message);
        setLoading(false);
      }
    };

    fetchBasicData();
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        fontSize: '1.2rem'
      }}>
        <div>Loading dashboard...</div>
        <div style={{ fontSize: '2rem' }}>⏳</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{ 
        padding: '2rem',
        maxWidth: '600px',
        margin: '2rem auto',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#dc3545' }}>Dashboard Error</h2>
        <p style={{ color: '#721c24', background: '#f8d7da', padding: '1rem', borderRadius: '8px' }}>
          {error}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Main dashboard render
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8f9fa', 
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem',
          background: 'white',
          padding: '1rem 2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#2c5aa0' }}>
              Headache Journal Dashboard
            </h1>
            <p style={{ margin: 0, color: '#6c757d' }}>
              Welcome back! Track and manage your headaches.
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Logout
          </button>
        </div>

        {/* Quick Record Button */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '3rem',
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#2c5aa0' }}>
            How are you feeling?
          </h2>
          <Link
            to="/record-headache"
            style={{
              background: '#dc3545',
              color: 'white',
              textDecoration: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              display: 'inline-block'
            }}
          >
            🤕 Record Headache
          </Link>
        </div>

        {/* Recent Headaches */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#2c5aa0' }}>
            Recent Activity
          </h3>
          {dashboardData.recentHeadaches.length > 0 ? (
            <div>
              <p style={{ color: '#28a745', fontWeight: '600', marginBottom: '1rem' }}>
                📊 {dashboardData.headacheCount} recent headache{dashboardData.headacheCount !== 1 ? 's' : ''} recorded
              </p>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {dashboardData.recentHeadaches.map((headache, index) => (
                  <div key={headache.id || index} style={{
                    padding: '0.75rem',
                    background: '#f8f9fa',
                    borderRadius: '4px',
                    borderLeft: '4px solid #dc3545'
                  }}>
                    <strong>{headache.location || 'Headache'}</strong> - 
                    Pain Level: {headache.painLevel || 'N/A'}/10
                    {headache.createdAt && (
                      <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '0.25rem' }}>
                        {headache.createdAt.toDate ? 
                          headache.createdAt.toDate().toLocaleDateString() : 
                          'Recent'
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: '#28a745', fontSize: '1.1rem' }}>
              🎉 No recent headaches recorded - great job!
            </p>
          )}
        </div>

        {/* Quick Links */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#2c5aa0' }}>
            Track Your Health
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem' 
          }}>
            <Link to="/record-sleep" style={{
              background: '#f8f9fa',
              color: '#2c5aa0',
              textDecoration: 'none',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>😴</div>
              <div>Sleep</div>
            </Link>
            
            <Link to="/record-nutrition" style={{
              background: '#f8f9fa',
              color: '#28a745',
              textDecoration: 'none',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🥗</div>
              <div>Nutrition</div>
            </Link>
            
            <Link to="/record-exercise" style={{
              background: '#f8f9fa',
              color: '#fd7e14',
              textDecoration: 'none',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏃</div>
              <div>Exercise</div>
            </Link>
            
            <Link to="/record-stress" style={{
              background: '#f8f9fa',
              color: '#6f42c1',
              textDecoration: 'none',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🧘</div>
              <div>Stress</div>
            </Link>
            
            <Link to="/record-body-pain" style={{
              background: '#f8f9fa',
              color: '#fd7e14',
              textDecoration: 'none',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🦴</div>
              <div>Body Pain</div>
            </Link>
            
            <Link to="/record-medication" style={{
              background: '#f8f9fa',
              color: '#dc3545',
              textDecoration: 'none',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💊</div>
              <div>Medication</div>
            </Link>
          </div>
        </div>

        {/* Debug Info */}
        <div style={{
          background: '#e9ecef',
          padding: '1rem',
          borderRadius: '4px',
          marginTop: '2rem',
          fontSize: '0.8rem',
          color: '#495057'
        }}>
          <strong>Debug Info:</strong><br/>
          User ID: {currentUser?.uid || 'Not logged in'}<br/>
          Email: {currentUser?.email || 'No email'}<br/>
          Loading: {loading.toString()}<br/>
          Error: {error || 'None'}<br/>
          Headache Count: {dashboardData.headacheCount}
        </div>
      </div>
    </div>
  );
}
