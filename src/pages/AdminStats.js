// src/pages/AdminStats.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
// Import collectionGroup for cross-collection queries
import { collection, collectionGroup, getDocs, query } from 'firebase/firestore';

export default function AdminStats() {
  const { currentUser } = useAuth();
  const [userCount, setUserCount] = useState(0);
  // State for our new statistics
  const [headacheStats, setHeadacheStats] = useState({
    totalCount: 0,
    migraineCount: 0,
    averagePain: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        // 1. Fetch all users (as before)
        const usersCollectionRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollectionRef);
        setUserCount(usersSnapshot.size);

        // 2. Fetch all headache documents from all subcollections
        const headachesQuery = query(collectionGroup(db, 'headaches'));
        const headachesSnapshot = await getDocs(headachesQuery);
        
        const allHeadaches = headachesSnapshot.docs.map(doc => doc.data());
        
        if (allHeadaches.length > 0) {
          // Calculate statistics
          const totalCount = allHeadaches.length;
          const migraineCount = allHeadaches.filter(h => h.isMigrineAttack === true).length;
          const totalPain = allHeadaches.reduce((sum, h) => sum + (h.painLevel || 0), 0);
          const averagePain = (totalPain / totalCount).toFixed(1);

          setHeadacheStats({
            totalCount,
            migraineCount,
            averagePain
          });
        }

      } catch (err) {
        console.error("Permission Error:", err.message);
        setError("You do not have permission to view this page. Please contact support to be granted admin access.");
      }
      setLoading(false);
    };

    fetchAdminData();
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
          <div><i className="fas fa-spinner fa-spin"></i> Loading admin data...</div>
        ) : (
          <div>
            {/* --- User Metrics --- */}
            <h2 style={{color: "#1E40AF", borderBottom: '2px solid #E5E7EB', paddingBottom: '0.5rem', marginBottom: '1.5rem'}}>User Metrics</h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '3rem'}}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3B82F6' }}>
                    {userCount}
                  </div>
                  <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                    <i className="fas fa-users" style={{marginRight: '0.5rem'}}></i>Total Users
                  </div>
              </div>
            </div>

            {/* --- Headache Metrics --- */}
            <h2 style={{color: "#1E40AF", borderBottom: '2px solid #E5E7EB', paddingBottom: '0.5rem', marginBottom: '1.5rem'}}>Headache Analytics</h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem'}}>
                {/* Total Headaches */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#DC2626' }}>
                      {headacheStats.totalCount}
                    </div>
                    <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                      <i className="fas fa-head-side-virus" style={{marginRight: '0.5rem'}}></i>Total Headaches
                    </div>
                </div>
                {/* Migraine Count */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#9333EA' }}>
                      {headacheStats.migraineCount}
                    </div>
                    <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                      <i className="fas fa-brain" style={{marginRight: '0.5rem'}}></i>Migraine Attacks
                    </div>
                </div>
                {/* Average Pain */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#F59E0B' }}>
                      {headacheStats.averagePain} / 10
                    </div>
                    <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                      <i className="fas fa-tachometer-alt" style={{marginRight: '0.5rem'}}></i>Average Pain
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
