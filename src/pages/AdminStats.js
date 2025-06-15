import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, collectionGroup, getDocs, query, doc, getDoc } from 'firebase/firestore';

// MOVED: Move constants outside the component so they are not redefined on every render.
const ADMIN_EMAILS = [
  'your-admin-email@example.com', // Replace with your actual admin email
  'another-admin@example.com'     // Add more admin emails as needed
];

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

  // STEP 1: Wrap the admin check logic in useCallback.
  // This creates a stable function that only gets recreated when `currentUser` changes.
  const checkAdminStatus = useCallback(async () => {
    if (!currentUser) {
      setIsAdmin(false);
      setCheckingAdmin(false);
      return;
    }

    setCheckingAdmin(true);
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
        } else {
          setIsAdmin(false); // Explicitly set to false if not in email list or doc
        }
      } catch (adminCheckError) {
        console.log('Admin document check failed, falling back to email check');
        setIsAdmin(false); // Fallback to not being an admin
      }

      setCheckingAdmin(false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setCheckingAdmin(false);
    }
  }, [currentUser]); // Dependency array for useCallback

  // STEP 2: Update the useEffect to depend on the stable `checkAdminStatus` function.
  // This effect will now only run when the user logs in or out.
  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    const fetchAdminData = async () => {
      // This logic remains the same
      if (!currentUser || !isAdmin) return;
      
      setLoading(true);
      setError('');

      try {
        // ... (rest of your data fetching logic is correct)
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
          
          const allHeadaches = headachesSnapshot.docs.map(doc => doc.data());
          
          if (allHeadaches.length > 0) {
            const totalCount = allHeadaches.length;
            
            const migraineCount = allHeadaches.filter(h => 
              h.isMigrineAttack === true || 
              h.isMigraine === true ||
              h.type === 'migraine' ||
              h.location === 'migraine'
            ).length;
            
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

  // ... (the rest of your JSX rendering logic is correct and can remain as is)
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
            <strong>Error:</strong>
          </div>
