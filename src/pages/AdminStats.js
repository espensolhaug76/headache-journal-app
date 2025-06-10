// src/pages/AdminStats.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminStats() {
  const { currentUser } = useAuth();
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
  const fetchAllUsersData = async () => {
    // NOTE: This function will require updated Firebase rules to work.
    // We will address that in the next step.
    try {
      const usersCollectionRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollectionRef);
      setUserCount(usersSnapshot.size);
    } catch (err) {
      console.error("Permission Error:", err.message);
      setError("You do not have permission to view this page. Please contact support to be granted admin access.");
    }
    setLoading(false);
  };

  // The security rules are updated, so we now call the function.
  fetchAllUsersData();

}, [currentUser]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
       <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: 'bold', color: '#1E3A8A' }}>
              <i className="fas fa-shield-alt" style={{ marginRight: '0.5rem' }}></i>
              Admin Statistics
            </h1>
            <p style={{ margin: 0, color: '#6B7280' }}>A top-level overview of all user data for research.</p>
          </div>
          <Link
            to="/dashboard"
            style={{
              background: 'transparent',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              color: '#4B5563',
              padding: '12px 20px',
              textDecoration: 'none',
              fontSize: '1rem',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }}></i>
            Back to Dashboard
          </Link>
        </div>

        {error ? (
          <div style={{
            background: '#f8d7da',
            border: '1px solid #dc3545',
            borderRadius: '8px',
            padding: '1rem',
            color: '#721c24'
          }}>
            {error}
          </div>
        ) : loading ? (
          <div>Loading admin data...</div>
        ) : (
          <div>
            <h2 style={{color: "#1E3A8A"}}>User Metrics</h2>
            <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '1.5rem',
                textAlign: 'center',
                maxWidth: '200px'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3B82F6' }}>
                  {userCount}
                </div>
                <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                  Total Users
                </div>
              </div>
            {/* All other statistics modules will go here */}
          </div>
        )}
      </div>
    </div>
  );
}
