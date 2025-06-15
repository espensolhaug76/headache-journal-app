import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, collectionGroup, getDocs, query, doc, getDoc } from 'firebase/firestore';

// It's better to manage admin access via Firebase Security Rules or Custom Claims for production.
// This email list is a simple approach for initial development.
const ADMIN_EMAILS = [
  'your-admin-email@example.com',
  'another-admin@example.com'
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

  const checkAdminStatus = useCallback(async () => {
    if (!currentUser) {
      setIsAdmin(false);
      setCheckingAdmin(false);
      return;
    }

    setCheckingAdmin(true);
    try {
      const isEmailAdmin = ADMIN_EMAILS.includes(currentUser.email.toLowerCase());
      if (isEmailAdmin) {
        setIsAdmin(true);
        setCheckingAdmin(false);
        return;
      }

      const adminDocRef = doc(db, 'admins', currentUser.uid);
      const adminDoc = await getDoc(adminDocRef);
      if (adminDoc.exists() && adminDoc.data().isAdmin === true) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (adminCheckError) {
      console.error('Error checking admin status:', adminCheckError);
      setIsAdmin(false);
    }
    setCheckingAdmin(false);
  }, [currentUser]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!isAdmin) return;
      
      setLoading(true);
      setError('');
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        setUserCount(usersSnapshot.size);

        const headachesQuery = query(collectionGroup(db, 'headaches'));
        const headachesSnapshot = await getDocs(headachesQuery);
        const allHeadaches = headachesSnapshot.docs.map(doc => doc.data());

        if (allHeadaches.length > 0) {
          const totalCount = allHeadaches.length;
          const migraineCount = allHeadaches.filter(h => h.isMigrineAttack === true || h.location === 'migraine').length;
          const headachesWithPain = allHeadaches.filter(h => h.painLevel > 0);
          const totalPain = headachesWithPain.reduce((sum, h) => sum + h.painLevel, 0);
          const averagePain = headachesWithPain.length > 0 ? (totalPain / headachesWithPain.length).toFixed(1) : 0;
          setHeadacheStats({ totalCount, migraineCount, averagePain });
        }
      } catch (err) {
        setError(`Failed to fetch admin data: ${err.message}`);
      }
      setLoading(false);
    };

    if (isAdmin && !checkingAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, checkingAdmin]);

  const StatCard = ({ title, value, icon }) => (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
      <i className={`${icon}`} style={{ fontSize: '2rem', color: '#4682B4', marginBottom: '1rem' }}></i>
      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1E3A8A' }}>{value}</div>
      <div style={{ color: '#6B7280' }}>{title}</div>
    </div>
  );

  if (checkingAdmin) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>Checking permissions...</div>;
  }

  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h1>Access Denied</h1>
        <p>You do not have permission to view this page.</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '20px' }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0, color: '#1E3A8A' }}>Admin Statistics</h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#6B7280' }}>Top-level overview of all user data.</p>
          </div>
          <Link to="/dashboard" style={{ textDecoration: 'none', color: '#4682B4' }}>Back to Dashboard</Link>
        </div>

        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}><i className="fas fa-spinner fa-spin fa-2x"></i></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <StatCard title="Total Users" value={userCount} icon="fas fa-users" />
            <StatCard title="Total Headaches Recorded" value={headacheStats.totalCount} icon="fas fa-head-side-virus" />
            <StatCard title="Total Migraines Recorded" value={headacheStats.migraineCount} icon="fas fa-brain" />
            <StatCard title="Average Pain Level" value={headacheStats.averagePain} icon="fas fa-thermometer-half" />
          </div>
        )}
      </div>
    </div>
  );
}
