// src/pages/AdminStats.js - Fixed version with proper admin verification
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, collectionGroup, getDocs, query, doc, getDoc } from 'firebase/firestore';

export default function AdminStats() {
  const { currentUser } = useAuth();
  const [userCount, setUserCount] = useState(0);
  const [headacheStats, setHeadacheStats] = useState({
    totalCount: 0,
    migraineCount: 0,
    averagePain: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // List of admin emails - you can move this to Firebase config later
  const ADMIN_EMAILS = [
    'your-admin-email@example.com', // Replace with your actual admin email
    'another-admin@example.com'      // Add more admin emails as needed
  ];

  // Check if current user is an admin
  const checkAdminStatus = async () => {
    if (!currentUser) {
      setCheckingAdmin(false);
      return;
    }

    try {
      // Method 1: Check by email (simple approach)
      const isEmailAdmin = ADMIN_EMAILS.includes(currentUser.email.toLowerCase());
      
      if (isEmailAdmin) {
        setIsAdmin(true);
        setCheckingAdmin(false);
        return;
      }

      // Method 2: Check admin collection in Firebase (more robust)
      try {
        const adminDocRef = doc(db, 'admins', currentUser.uid);
        const adminDoc = await getDoc(adminDocRef);
        
        if (adminDoc.exists() && adminDoc.data().isAdmin === true) {
          setIsAdmin(true);
        }
      } catch (adminCheckError) {
        console.log('Admin document check failed, falling back to email check');
        // If admin collection doesn't exist or we can't read it, that's okay
        // We already checked email above
      }

      setCheckingAdmin(false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setCheckingAdmin(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, [currentUser]);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!currentUser || !isAdmin) return;
      
      setLoading(true);
      setError('');

      try {
        console.log('Fetching admin data...');

        // 1. Fetch all users
        try {
          const usersCollectionRef = collection(db, 'users');
          const usersSnapshot = await getDocs(usersCollectionRef);
          setUserCount(usersSnapshot.size);
          console.log(`Found ${usersSnapshot.size} users`);
        } catch (userError) {
          console.error('Error fetching users:', userError);
          setError('Failed to fetch user data. Check Firebase permissions.');
          setLoading(false);
          return;
        }

        // 2. Fetch all headache documents from all subcollections
        try {
          const headachesQuery = query(collectionGroup(db, 'headaches'));
          const headachesSnapshot = await getDocs(headachesQuery);
          console.log(`Found ${headachesSnapshot.size} headaches`);
          
          const allHeadaches = headachesSnapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Headache data sample:', data);
            return data;
          });
          
          if (allHeadaches.length > 0) {
            // Calculate statistics
            const totalCount = allHeadaches.length;
            
            // Count migraines - check multiple possible field names
            const migraineCount = allHeadaches.filter(h => 
              h.isMigrineAttack === true || 
              h.isMigraine === true ||
              h.type === 'migraine' ||
              h.location === 'migraine'
            ).length;
            
            // Calculate average pain
            const headachesWithPain = allHeadaches.filter(h => h.painLevel && h.painLevel > 0);
            const totalPain = headachesWithPain.reduce((sum, h) => sum + (h.painLevel || 0), 0);
            const averagePain = headachesWithPain.length > 0 
              ? (totalPain / headachesWithPain.length).toFixed(1) 
              : 0;

            console.log('Calculated stats:', { totalCount, migraineCount, averagePain });

            setHeadacheStats({
              totalCount,
              migraineCount,
              averagePain
            });
          } else {
            console.log('No headache data found');
            setHeadacheStats({
              totalCount: 0,
              migraineCount: 0,
              averagePain: 0
            });
          }
        } catch (headacheError) {
          console.error('Error fetching headaches:', headacheError);
          setError('Failed to fetch headache data. Check Firebase permissions for collectionGroup queries.');
          setLoading(false);
          return;
        }

      } catch (err) {
        console.error("General Error:", err);
        setError(`Failed to fetch admin data: ${err.message}`);
      }
      
      setLoading(false);
    };

    if (isAdmin && !checkingAdmin) {
      fetchAdminData();
    }
  }, [currentUser, isAdmin, checkingAdmin]);

  // Show loading while checking admin status
  if (checkingAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center', color: '#6B7280' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <div>Checking admin permissions...</div>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
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
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '4rem' }}>
          <div style={{ fontSize: '4rem', color: '#DC2626', marginBottom: '2rem' }}>
            <i className="fas fa-shield-alt"></i>
          </div>
          <h1 style={{ color: '#1E3A8A', marginBottom: '1rem' }}>Access Denied</h1>
          <p style={{ color: '#6B7280', marginBottom: '2rem', fontSize: '1.1rem' }}>
            You do not have permission to view this page. Admin access is required.
          </p>
          <div style={{
            background: '#f8d7da',
            border: '1px solid #dc3545',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem',
            color: '#721c24'
          }}>
            <strong>Current user:</strong> {currentUser?.email}<br/>
            <strong>Status:</strong> Not authorized as admin
          </div>
          <Link
            to="/dashboard"
            style={{
              background: '#4682B4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
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
      </div>
    );
  }

  // Rest of the component remains the same for admin users
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
            <p style={{ margin: '0.5rem 0 0 0', color: '#059669', fontSize: '0.9rem' }}>
              ✓ Admin access verified for: {currentUser?.email}
            </p>
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
            color: '#721c24',
            marginBottom: '2rem'
          }}>
            <strong>Error:</strong> {error}
            <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
              <strong>Troubleshooting:</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                <li>Check that your Firebase security rules allow admin access</li>
                <li>Verify that collectionGroup queries are enabled</li>
                <li>Ensure your email is in the ADMIN_EMAILS list</li>
                <li>Check the browser console for detailed error messages</li>
              </ul>
            </div>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#4682B4' }}></i>
            <div style={{ marginTop: '1rem', color: '#6B7280' }}>Loading admin data...</div>
          </div>
        ) : (
          <div>
            {/* User Metrics */}
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

            {/* Headache Metrics */}
            <h2 style={{color: "#1E40AF", borderBottom: '2px solid #E5E7EB', paddingBottom: '0.5rem', marginBottom: '1.5rem'}}>Headache Analytics</h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem'}}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#DC2626' }}>
                  {headacheStats.totalCount}
                </div>
                <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                  <i className="fas fa-head-side-virus" style={{marginRight: '0.5rem'}}></i>Total Headaches
                </div>
              </div>
              
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#9333EA' }}>
                  {headacheStats.migraineCount}
                </div>
                <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                  <i className="fas fa-brain" style={{marginRight: '0.5rem'}}></i>Migraine Attacks
                </div>
              </div>
              
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
